var AWS = require('aws-sdk');
AWS.config.update({ region: process.env.DEPLOY_AWS_REGION});
const fs = require('fs');
const headers = {
    "Access-Control-Allow-Origin": "*"
};
const searchService = require('../../dao/search');
const updateService = require('../../dao/update');
const termsAndConditionsService = require ('../../functions/mapTermsAndConditions');
const lambdaService =  require('../../services/invokeLambda');

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
        
        let result_get_client = await searchService.search(process.env.MONGODB_COLLECTION_CLIENTS, {email: req.user, platform: req.platform, program: req.program}, process.env.MONGODB_DATABASE_LOCAL);
        if(!(result_get_client && result_get_client.length > 0)){
            objResponse = {
                status: "Error",
                statusCode: 400,
                apiCode: 41,
                message: "Client not found",
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
        //delete fields ignored
        for(let field of constants.fields_ignored){
            delete req[field];
        }
        //update client
        console.log("Update in " + process.env.MONGODB_COLLECTION_CLIENTS + " of Database: " + process.env.MONGODB_DATABASE_GLOBAL + " with filter: " + JSON.stringify({ email: req.user }) + " and data: " + JSON.stringify(req));
        await updateService.updateData(process.env.MONGODB_COLLECTION_CLIENTS, { email: req.user }, req, process.env.MONGODB_DATABASE_GLOBAL);

        //update client
        console.log("Update in " + process.env.MONGODB_COLLECTION_CLIENTS + " of Database: " + process.env.MONGODB_DATABASE_LOCAL + " with filter: " + JSON.stringify({ email: req.user }) + " and data: " + JSON.stringify(req));
        await updateService.updateData(process.env.MONGODB_COLLECTION_CLIENTS, { email: req.user }, req, process.env.MONGODB_DATABASE_LOCAL);
       
        //update client in rewards engine(SessionM)
        let update_sessionm = false;
        let req_rewards_engine = {};
        for(let field of constants.SessionM.update_fields){
            if(req[field] !== null && req[field] !== undefined){
                req_rewards_engine[field] = req[field];
                update_sessionm = true;
            }
        }
        
        if(update_sessionm){
            req_rewards_engine.user_id_sessionm = result_get_client.user_id_sessionm;
            await lambdaService.invokeLambda(process.env.LAMBDA_FUNCTION_UPDATE_CLIENT_ENGINE, req_rewards_engine, 'RequestResponse');
        }
            

        objResponse = {
            status: "Success",
            statusCode: 200,
            apicode: 102,
            message: "Client updated"
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
        console.log('Error in update client global controller: ' +  JSON.stringify(e));
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
