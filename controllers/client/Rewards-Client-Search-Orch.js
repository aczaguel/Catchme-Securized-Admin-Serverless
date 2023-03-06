var AWS = require('aws-sdk');
AWS.config.update({ region: process.env.DEPLOY_AWS_REGION});
const fs = require('fs');
const schemaService = require('../../validations/schemaValidator');
const headers = {
    "Access-Control-Allow-Origin": "*"
};
const searchService = require('../../dao/search');
const timeService = require('../../functions/getDayLastLogin');
const lambdaService =  require('../../services/invokeLambda');
const mapClient = require('../../functions/mapClientTiers');


exports.client = async function (event) {
    let apiCode = 100;
    let objResponse;
    try {
        const constants = JSON.parse(fs.readFileSync('./resources/constants.json'));
        console.log('Event: ' + JSON.stringify(event));

        //Schema Validator
        const schemaPath = JSON.parse(fs.readFileSync('./resources/schemaClient.json')).query;
        await schemaService.validateSchema(event.queryStringParameters? event.queryStringParameters : {}, schemaPath);

        if (event.headers && !event.headers.key) {
            // get email user with lambda function invoke
            const {user} = await lambdaService.invokeLambda(process.env.LAMBDA_FUNCTION_SECURITY_VALIDATE_USER, {headers: event.headers}, 'RequestResponse');
            console.log(`get email user with lambda function invoke: ${user}`);
            event.queryStringParameters.user = user;
        }

        //Search data client from internal database transactional
        let time_zone;
        if(event.queryStringParameters.time_zone){
                time_zone = event.queryStringParameters.time_zone;
        }
        
        let result_get_client = await searchService.search(process.env.MONGODB_COLLECTION_CLIENTS, { email: event.queryStringParameters.user, platform: event.queryStringParameters.platform, program: event.queryStringParameters.program }, process.env.MONGODB_DATABASE_LOCAL, constants.projection_client_search);
        if(!(result_get_client && result_get_client.length > 0)){
            objResponse = {
                status: "Success",
                statusCode: 200,
                apiCode: 101,
                message: "Query without data",
                data:[]
            };
            console.warn('Result: ' + JSON.stringify(objResponse));
            return {
                statusCode: 200,
                headers: headers,
                body: JSON.stringify(objResponse)
            };
        }
        result_get_client = result_get_client[0];

        if(time_zone){
            let result_login_frequency = await searchService.search(process.env.MONGODB_COLLECTION_LOGIN_FREQUENCY, { user: result_get_client.email, platform: result_get_client.platform, program: result_get_client.program }, process.env.MONGODB_DATABASE_GLOBAL, constants.projection_login_frequency);
            if(result_login_frequency && result_login_frequency.length > 0){
                let object_sesions = {};
                object_sesions.times_logged = result_login_frequency.length;
                object_sesions.day_last_login = await timeService.getDayLastLogin(result_login_frequency, time_zone);
                result_get_client.sesions = object_sesions;
            }
        }

        if(result_get_client.user_id_sessionm){
            //search client in Rewards Engine (SessionM)
            let response_sessionM = await lambdaService.invokeLambda(process.env.LAMBDA_FUNCTION_SEARCH_CLIENT_ENGINE, result_get_client , 'RequestResponse');
            response_sessionM = JSON.parse(response_sessionM.body);
            if(response_sessionM.statusCode === 200){
                response_sessionM = response_sessionM.data;
                if(response_sessionM.tier_details){
                    if(response_sessionM.tier_details.tier_levels && response_sessionM.tier_details.tier_levels.length > 0){
                        //response_sessionM.tier_details.tier_levels[0].available_points = response_sessionM.tier_details.point_account_balances.summary.total_points;
                        //let obj_tiers = await mapClientTiers(response_sessionM.tier_details.tier_levels[0]);
                        let obj_tiers = await mapClient.mapClientTiers(response_sessionM);
                        if(obj_tiers !== null){
                            result_get_client.tiers = obj_tiers.tiers;
                            result_get_client.actual_points = obj_tiers.actual_points;
                        }
                    }    
                }
            }
            else{
                objResponse = {
                    status: "Error",
                    statusCode: 500,
                    apiCode: 52,
                    message: "Error to search client in SessionM",
                    messageCode: 40001
                };
                console.log('Result: ' + JSON.stringify(objResponse));
                return {
                    statusCode: 500,
                    headers: headers,
                    body: JSON.stringify(objResponse)
                };
            }
        }

                
        objResponse = {
            status: "Success",
            statusCode: 200,
            apiCode: apiCode,
            data: result_get_client
        };
        console.log('Result: ' + JSON.stringify({
            statusCode: 200,
            headers: headers,
            body: objResponse
        }));
        return {
            statusCode: 200,
            headers: headers,
            body: JSON.stringify(objResponse)
        };

    } catch (e) {
        console.log('Error in search client orch controller: ' +  JSON.stringify(e));
        apiCode =  e.apiCode? e.apiCode : 51;
        let message =  e.message? e.message : "Internal Server Error";
        let statusCode = e.statusCode? e.statusCode : 500;
        let status = e.status? e.status : "Error";
        objResponse = {
            statusCode: statusCode,
            status: status,
            message: message,
            apicode : apiCode,
            messageCode: 40001
        };
        if(e.body && e.body.error)
            objResponse.error = e.body.error;
        return {
            statusCode: e.statusCode || 500,
            headers: headers,
            body: JSON.stringify(objResponse)
        };
    }
};
