var AWS = require('aws-sdk');
AWS.config.update({ region: process.env.DEPLOY_AWS_REGION});
const fs = require('fs');
const schemaService = require('../../validations/schemaValidator');
const headers = {
    "Access-Control-Allow-Origin": "*"
};
const searchService = require('../../dao/search');
const deleteService = require('../../dao/deleteMany');
const transformDeleteProfile = require('../../functions/dataTransformDeleteProfileSessionM');
const consumeAPIService = require('../../services/consumeAPI');


exports.client = async function (event) {
    console.log('Event:', event);
    let req;
    let objResponse;
    try {
        const constants = JSON.parse(fs.readFileSync('./resources/constants.json'));
        if (event.headers === undefined) {
            req = event;
        } else {
            req = JSON.parse(event.body);
        }

        //Schema Validator
        const schemaPath = JSON.parse(fs.readFileSync('./resources/schemaClient.json')).delete;
        await schemaService.validateSchema(req, schemaPath);
        
        //validate if exist a client with this email  
        let search_client = await searchService.search(process.env.MONGODB_COLLECTION_CLIENTS, req, process.env.MONGODB_DATABASE_LOCAL);
        if(!(search_client && search_client.length > 0)){
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
        let client = search_client[0];

        //delete client local
        await deleteService.deleteManyClient(process.env.MONGODB_COLLECTION_CLIENTS, req, process.env.MONGODB_DATABASE_LOCAL);

        //delete client global
        await deleteService.deleteManyClient(process.env.MONGODB_COLLECTION_CLIENTS, req, process.env.MONGODB_DATABASE_GLOBAL);

        //delete otp
        if(client.phoneNumber)
            await deleteService.deleteManyClient(process.env.MONGODB_COLLECTION_OTP, { to: client.phoneNumber.replace("+","") }, process.env.MONGODB_DATABASE_GLOBAL);

        //delete earn_events
        await deleteService.deleteManyClient(process.env.MONGODB_COLLECTION_EARN_EVENTS, req, process.env.MONGODB_DATABASE_GLOBAL);

        //delete redemtion_events
        await deleteService.deleteManyClient(process.env.MONGODB_COLLECTION_REDEMPTION_EVENTS, req, process.env.MONGODB_DATABASE_GLOBAL);

        //delete login_frequency
        await deleteService.deleteManyClient(process.env.MONGODB_COLLECTION_LOGIN_FREQUENCY, req, process.env.MONGODB_DATABASE_GLOBAL);
    
        //delete client_accounts
        await deleteService.deleteManyClient(process.env.MONGODB_COLLECTION_CLIENT_ACCOUNTS, {user_id: client.user_id_sessionm}, process.env.MONGODB_DATABASE_LOCAL);

        //delete client_tiers
        await deleteService.deleteManyClient(process.env.MONGODB_COLLECTION_CLIENT_TIERS, {user_id: client.user_id_sessionm}, process.env.MONGODB_DATABASE_LOCAL);

        //delete client_tiers
        await deleteService.deleteManyClient(process.env.MONGODB_COLLECTION_CLIENT_TIERS, {user_id: client.user_id_sessionm}, process.env.MONGODB_DATABASE_LOCAL);

        //delete user_trivia
        await deleteService.deleteManyClient(process.env.MONGODB_COLLECTION_USER_TRIVIA, req, process.env.MONGODB_DATABASE_GLOBAL);

        //delete user_trivia_answers
        await deleteService.deleteManyClient(process.env.MONGODB_COLLECTION_USER_TRIVIA_ANSWERS, {user: req.user}, process.env.MONGODB_DATABASE_GLOBAL);


        //delete sessionM
        let request_custom_profile = await transformDeleteProfile(client);
        await consumeAPIService.consumeAPI(request_custom_profile);

        objResponse = {
            status: "Deleted",
            statusCode: 200,
            apiCode: 103,
            message: "Successful operation"
        };
        console.log('Result: ' + JSON.stringify(objResponse));
        return {
            statusCode: 200,
            headers: headers,
            body: JSON.stringify(objResponse)
        };

    } catch (e) {
        console.log("An error occurred in delete: " + e);
        let objResponse = {
            statusCode: 500,
            message: "Error in delete client",
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
