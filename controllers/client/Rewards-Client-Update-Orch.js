var AWS = require('aws-sdk');
AWS.config.update({ region: process.env.DEPLOY_AWS_REGION});
const fs = require('fs');
const schemaValidator = require('../../validations/schemaValidator');
const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*"
};
const lambdaService =  require('../../services/invokeLambda');
const zipcodeService = require('../../functions/retrieveStateByZipcode');
const schemaService =  require('../../functions/createSchema');
const searchService = require('../../dao/search');
const {restrictsAge} = require('../../functions/restrictsAge');

exports.client = async function (event) {
    
    let req;
    let objResponse;
    try {
        console.log('Event: ', event);
        const constants = JSON.parse(fs.readFileSync('./resources/constants.json'));
        if (event.headers === undefined) {
            req = event;
        } else {
            req = JSON.parse(event.body);
        }

        console.log('Body: ' + JSON.stringify(req));
        
        //Schema Validator filters
        const schema = JSON.parse(fs.readFileSync('./resources/schemaClient.json')).update;
        await schemaValidator.validateSchema(req, schema);

        if (event.headers && !event.headers.key) {
            const {user} = await lambdaService.invokeLambda(process.env.LAMBDA_FUNCTION_SECURITY_VALIDATE_USER, {headers: event.headers}, 'RequestResponse');
            console.log(`get email user with lambda function invoke: ${user}`);
            req.user = user;
        }

        let result_schema = await searchService.search(process.env.MONGODB_COLLECTION_CLIENT_SCHEMAS, {platform: req.platform, program: req.program}, process.env.MONGODB_DATABASE_GLOBAL);
        console.warn("Client Schema Not found with platform: " + req.platform)
        if(!(result_schema && result_schema.length > 0)){
            result_schema = await searchService.search(process.env.MONGODB_COLLECTION_CLIENT_SCHEMAS, { platform: constants.default_platform }, process.env.MONGODB_DATABASE_GLOBAL);
            if(!(result_schema && result_schema.length > 0)){
                console.warn("Client Schema Not found with platform: " + constants.default_platform);
                objResponse = {
                    status: "Error",
                    statusCode: 400,
                    apiCode: 41,
                    message: "Client Schema not found",
                    messageCode: 40001
                };
                return {
                    statusCode: 400,
                    headers: headers,
                    body: JSON.stringify(objResponse)
                };
            }
        }

        let result = await schemaService.createSchema(result_schema[0].client_structure, "body","put", false);

        //Schema Validator
        await schemaValidator.validateSchema(req, result);

        //restricts For Birthdate
        let result_age = await searchService.search(process.env.MONGODB_COLLECTION_CONFIGURATION, {
            configuration: "age_gate",
            platform: req.platform,
            program: req.program
        }, process.env.MONGODB_DATABASE_GLOBAL);
        if(!(result_age && result_age.length> 0)){
            console.warn("Age configuration does not exist");
                objResponse = {
                    status: "Error",
                    statusCode: 400,
                    apiCode: 40,
                    message: "Age configuration does not exist",
                    messageCode: 40001
                };
                return {
                    statusCode: 400,
                    headers: headers,
                    body: JSON.stringify(objResponse)
                };
        }

        console.log(result_age);
        let ageIsSuccess;
        if (req.birthdate) {
            ageIsSuccess = await restrictsAge(req.birthdate, result_age[0].value);
            if (ageIsSuccess === null) {
                console.warn("Age is no permitted");
                objResponse = {
                    status: "Error",
                    statusCode: 400,
                    apiCode: 40,
                    message: "Age is no permitted",
                    messageCode: 40001
                };
                return {
                    statusCode: 400,
                    headers: headers,
                    body: JSON.stringify(objResponse)
                };
            }
        }

        //retrieve state
        if(req.zipcode){
            let ubication = await zipcodeService.retrieveStateByZipcode(req.zipcode);
            if(ubication === null){
                console.warn("City and/or State Not found");
                objResponse = {
                    status: "Error",
                    statusCode: 400,
                    apiCode: 41,
                    message: "City and/or State Not found",
                    messageCode: 40001
                };
                console.warn("Response: " + JSON.stringify(objResponse));
                return {
                    statusCode: 400,
                    headers: headers,
                    body: JSON.stringify(objResponse)
                };
            }
            req.state = ubication.state;
            req.city = ubication.city;
        }

        
        //Create Global Client
        let response_global = await lambdaService.invokeLambda(process.env.LAMBDA_FUNCTION_UPDATE_CLIENT_GLOBAL, req, 'RequestResponse');

        //Create Local Client
        await lambdaService.invokeLambda(process.env.LAMBDA_FUNCTION_UPDATE_CLIENT_LOCAL, req, 'Event');
       
        console.log('Result: ' + JSON.stringify(response_global));
        return response_global;

    } catch (e) {
        console.log('Error in update client orch controller: ' +  JSON.stringify(e));
        let apiCode =  e.apiCode? e.apiCode : 51;
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
