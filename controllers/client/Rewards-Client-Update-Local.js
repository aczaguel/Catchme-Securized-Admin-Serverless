var AWS = require('aws-sdk');
AWS.config.update({ region: process.env.DEPLOY_AWS_REGION});
const fs = require('fs');
const headers = {
    "Access-Control-Allow-Origin": "*"
};
const searchService = require('../../dao/search');
const termsAndConditionsService = require ('../../functions/mapTermsAndConditions');

exports.client = async function (event) {
    console.log('Event: ', event);
    let req;
    let objResponse;
    try {
        const constants = JSON.parse(fs.readFileSync('./resources/constants.json'));
        if (event.headers === undefined) {
            req = event;
        } else {
            req = JSON.parse(event.body);
        }

        console.log('Body: ' + JSON.stringify(req));
        
        
        let result_get_client = await searchService.search(process.env.MONGODB_COLLECTION_CLIENTS, {email: req.user}, process.env.MONGODB_DATABASE_LOCAL);
        if(!(result_get_client && result_get_client.length > 0)){
            objResponse = {
                status: "Bad request",
                statusCode: 400,
                message: "This client does not exist",
                messageCode: 40001
            };
            console.warn('Result: ' + JSON.stringify(objResponse));
            return {
                statusCode: 400,
                headers: headers,
                body: JSON.stringify(objResponse)
            };
        }
        result_get_client = result_get_client[0];
        if(req.termsAndConditions){
            //Retrieve data client from internal database transactional  
            req.termsAndConditions = await termsAndConditionsService
              .mapAndValidateTermAndConditionsInBD(req.termsAndConditions);
            if(req.termsAndConditions && req.termsAndConditions.length > 0){
                for(let terms of req.termsAndConditions){
                let item_terms = {
                        platform: terms.platform,
                        subplatform: terms.subplatform,
                        url: terms.url,
                        status: true,
                        date: new Date().toLocaleString("es-ES", { timeZone: "America/Mexico_City" })
                    };
                    //validate terms and conditions in data client
                    if(result_get_client.termsAndConditions && result_get_client.termsAndConditions.length > 0){
                        let exist_terms = result_get_client.termsAndConditions.find(item => item.platform === terms.platform & item.subplatform === terms.subplatform);
                        if(!exist_terms)
                            result_get_client.termsAndConditions.push(item_terms);
                    }
                    else{
                        result_get_client.termsAndConditions = [];
                        result_get_client.termsAndConditions.push(item_terms);     
                    }
                }
                req.termsAndConditions = result_get_client.termsAndConditions;
            }
        }

        
        //Create Message in SQS
        let now_timestamp = new Date(Date().toLocaleString({ timeZone: "America/Mexico_City" }));
            now_timestamp = now_timestamp.getTime();
        let body_sqs= {
            user: req.user, 
            origin: req.origin, 
            platform: req.platform, 
            program: req.program,
            timestamp: now_timestamp, 
            event_name: "user_update", 
            new_data_user: req,
            data: req,
            agent: req.agent,
            context:{
                origin: req.origin, 
                platform: req.platform, 
                program: req.program,
                timestamp: now_timestamp
            }
        };
        let params_sqs = {
            MessageBody: JSON.stringify(body_sqs),
            QueueUrl: process.env.SQS_EVENTS_REWARDS_ENGINE,
            MessageGroupId: body_sqs.event_name
        };

        console.log("Send message to SQS: " + JSON.stringify(params_sqs));
        await new AWS.SQS({ 
            region: process.env.DEPLOY_AWS_REGION
        }).sendMessage(params_sqs).promise();

        //Update Client in EPSILON

        //Update Client in SFMC

        //Update Client in ArrowHead

        //Update Client in CDP

        objResponse = {
            status: "Success",
            statusCode: 200,
            message: "Successful operation"
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
        console.error('An error occurred in update: ' + e);
        let objResponse = {
            statusCode: 500,
            status: "Error",
            message: "Error in update client",
            messageCode: 40001,
            error: e.message
        };
        let error = e.body || objResponse;
        return {
            statusCode: e.statusCode || 500,
            headers: headers,
            body: JSON.stringify(error)
        };
    }
};
