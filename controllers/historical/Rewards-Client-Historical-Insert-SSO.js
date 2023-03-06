'use strict';
const searchService = require('../../dao/search');
const updateService= require('../../dao/update');
const schemaService = require('../../validations/schemaValidator');
var fs = require('fs');
const headers = {
    "Access-Control-Allow-Origin": "*"
};
const transformUpdateSessionM = require('../../functions/dataTransformUpdatePhoneNumberCustomerSessionM');
const SSOMapper = require('../../functions/dataTransformSignUpClientSSO');
const APIService = require('../../services/consumeAPI');
const userValidator = require('../../functions/validateUser');
const termsAndConditionsService = require ('../../functions/mapTermsAndConditions');

module.exports.action = async (event) => {
    let req;
    let objResponse;
    let apiCode = 100;
    try {
        console.log('Event:' + JSON.stringify(event));
        let validation_result = await userValidator.validateUser(event);
        console.log('validation_result ', validation_result);
        if(!validation_result) {
            console.warn('Response: ', JSON.stringify({
                statusCode: 401,
                headers: headers,
                body: JSON.stringify({ message:"Unauthorized"})
            }));
            return {
                statusCode: 401,
                headers: headers,
                body: JSON.stringify({ message:"Unauthorized"})
            };
        }
        if (event.headers === undefined) {
            req = event;
        } else {
            req = JSON.parse(event.body);
        }
        console.log('Body: ' + JSON.stringify(req));
        const constants = JSON.parse(fs.readFileSync('./resources/constants.json'));
        const schema = JSON.parse(fs.readFileSync('./resources/schemaHistoricalClient.json')).insert;
        await schemaService.validateSchema(req, schema);

        
        let params_client = {
            email: req.user,
            platform: req.platform,
            program: req.program,
            historical: true
        }
        let result = await searchService.search(process.env.MONGODB_COLLECTION_CLIENTS, params_client, process.env.MONGODB_DATABASE_LOCAL);
        console.log("results: " + JSON.stringify(result));
        if(!(result && result.length > 0)){
            console.warn('Client  not found');
            objResponse = {
                status: "Error",
                statusCode: 400,
                apiCode: 41,
                message: "Historical Client not found",
                messageCode: 40001
            };
            return {
                statusCode: 400,
                headers: headers,
                body: JSON.stringify(objResponse)
            };
        }   
        let client = result[0];
        client.password = req.password;
        client.phoneNumber = req.phoneNumber;

        //create array of terms and conditions
        if(req.termsAndConditions)
            req.termsAndConditions = await termsAndConditionsService
              .mapAndValidateTermAndConditionsInBD(req.termsAndConditions);

        client.termsAndConditions = req.termsAndConditions;

        let req_sso = await SSOMapper.transformSSO(client);
        let response_sso = await APIService.consumeAPI(req_sso);
        if(response_sso.statusCode !== 200) {
            objResponse = {
                status: "Error",
                apicode: 52,
                statusCode: 500,
                message: "Error to create client in SSO Global",
                messageCode: 40001,
                error: response_sso.body.message?response_sso.body.message : response_sso.body.error
            };
            console.error('Result: ' + JSON.stringify(objResponse));
            return {
                statusCode: 500,
                headers: headers,
                body: JSON.stringify(objResponse)
            };
        }
        let req_sessionM = await transformUpdateSessionM(client, client.user_id_sessionm);
        let response_sessionM = await APIService.consumeAPI(req_sessionM);
        if(response_sessionM.statusCode !== 200){
            console.warn("Error in cosume  SessionM");
            objResponse = {
                status: "Error",
                statusCode: 500,
                apiCode: 52,
                message: "Error in update phonenumber in SessionM",
                messageCode: 40001,
                error: response_sessionM.body.errors
            };
            console.error("Response: " + JSON.stringify(objResponse));
            return {
                headers: headers,
                statusCode: 500,
                body: JSON.stringify(objResponse)
            }; 
        }

        //Update internal DBs
        let params_client_update = { 
            email: req.user, 
            platform: req.platform,
            program: req.program
        };

        let body_update_client={
            phoneNumber: req.phoneNumber, 
            historical_status: "validated", 
            termsAndConditions: req.termsAndConditions,
            advertisement: req.advertisement ? req.advertisement : false,
            privacy_policy: req.privacy_policy ? req.privacy_policy : false,
            historical: false
        }

        await updateService.updateData(process.env.MONGODB_COLLECTION_CLIENTS, params_client_update, body_update_client, process.env.MONGODB_DATABASE_LOCAL);

        await updateService.updateData(process.env.MONGODB_COLLECTION_CLIENTS, params_client_update, body_update_client, process.env.MONGODB_DATABASE_GLOBAL);

        objResponse = {
            status: "Created",
            statusCode: 201,
            message: "Successful operation"
        };
        console.log('Result: ' + JSON.stringify(objResponse));
        return {
            statusCode: 201,
            headers: headers,
            body: JSON.stringify(objResponse)
        };
    } catch (e) {
        console.log('Error in insert historical client controller: ' +  JSON.stringify(e));
        apiCode =  e.apiCode? e.apiCode : 51;
        let message =  e.message? e.message : "Internal Server Error";
        let statusCode = e.statusCode? e.statusCode : 500;
        let status = e.status? e.status : "Error";
        objResponse = {
            statusCode: statusCode,
            status: status,
            message: message,
            messageCode: 40001,
            apicode : apiCode
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
