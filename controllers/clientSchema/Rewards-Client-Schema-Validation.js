var AWS = require('aws-sdk');
AWS.config.update({ region: process.env.DEPLOY_AWS_REGION});
const fs = require('fs');
const schemaService = require('../../validations/schemaValidator.js');
const headers = {
    "Access-Control-Allow-Origin": "*"
};
const dataValidator = require('../../functions/validateMissingData');
const searchService = require('../../dao/search');
const lambdaService = require("../../services/invokeLambda");

exports.validate = async function (event) {
    console.log('Event: ', event);
    let req;
    let objResponse;
    let apiCode = 100;

    try {
        const constants = JSON.parse(fs.readFileSync('./resources/constants.json'));
        req = event.queryStringParameters;
        console.log('Body: ' + JSON.stringify(req));
        //validate schema
        const schema = JSON.parse(fs.readFileSync('./resources/schemaClientSchemaValidation.json')).query;
        
        req = req? req : {};
        await schemaService.validateSchema(req, schema);

        if (event.headers && !event.headers.key) {
            // get email user with lambda function invoke
            const {user} = await lambdaService.invokeLambda(process.env.LAMBDA_FUNCTION_SECURITY_VALIDATE_USER, {headers: event.headers}, 'RequestResponse');
            console.log(`get email user with lambda function invoke: ${user}`);
            if(user)
                req.email = user;
        }

        let result = {};
        
        //Search data client model from internal database transactional
        let result_ClientStructures = await searchService.search(process.env.MONGODB_COLLECTION_CLIENT_SCHEMAS, { platform: req.platform, program: req.program }, process.env.MONGODB_DATABASE_GLOBAL);
        if(result_ClientStructures && result_ClientStructures.length === 0){
            //if not exist data from the platform request, retrieve  default client model 
            result_ClientStructures = await searchService.search(process.env.MONGODB_COLLECTION_CLIENT_SCHEMAS, { platform: constants.default_platform }, process.env.MONGODB_DATABASE_GLOBAL);
        }    

        if(!(result_ClientStructures && result_ClientStructures.length > 0)) {
            objResponse = {
                status: "Error",
                apiCode: 41,
                statusCode: 400,
                message: "Client schema not found",
                messageCode: 40001
            };
            console.warn('Result: ' + JSON.stringify(objResponse));
            return objResponse;
        }         
        
        result.missingData = result_ClientStructures[0].client_structure.filter(item => item.status === constants.field_status_active && item.basic === constants.field_basic_true);
        
        //search terms and conditions
        let resul_find = result.missingData.filter(item => item.field_type_name === constants.field_terms_and_conditions);
        if(resul_find && resul_find.length === 0)
            resul_find = result.missingData.filter(item => item.field_name === constants.field_terms_and_conditions);
        if(resul_find && resul_find.length > 0){
            for(let field of resul_find){
                let terms =  await searchService.search(process.env.MONGODB_COLLECTION_TERMS_AND_CONDITIONS, {platform: field.platform, subplatform: field.subplatform},process.env.MONGODB_DATABASE_GLOBAL);
                if(terms && terms.length > 0){
                    terms = terms[0];
                    field.url = terms? terms.url : "";
                }
            }
        }
        
        //if exist email in the request, retrieve data client
        if(req.email){
            let result_Clients = await searchService.search(process.env.MONGODB_COLLECTION_CLIENTS, {email: req.email, platform: req.platform}, process.env.MONGODB_DATABASE_LOCAL);
            //if exist data client, validate client model
            if(result_Clients && result_Clients.length > 0) {
                let active_structures = result_ClientStructures[0].client_structure.filter(item => item.status === constants.field_status_active && item.basic === constants.field_basic_true);
                result.missingData = await dataValidator.validateMissingData(result_Clients[0], active_structures, req.platform);
                result.verified = result_Clients[0].verified ? result_Clients[0].verified : false;
                result.referred_code = result_Clients[0].referred_code ? result_Clients[0].referred_code : false;
            }
            else
                result.retrieveData = true;
        }     

        objResponse = {
            status: "Success",
            statusCode: 200,
            apiCode: apiCode,
            message: "Client schema validation success",
            data: result
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
        console.log('Error in validate client schema controller: ' +  JSON.stringify(e));
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
