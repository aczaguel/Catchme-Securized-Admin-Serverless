var AWS = require('aws-sdk');
AWS.config.update({ region: process.env.DEPLOY_AWS_REGION});
const fs = require('fs');
const schemaValidator = require('../../validations/schemaValidator');
const headers = {
    "Access-Control-Allow-Origin": "*"
};
const lambdaService =  require('../../services/invokeLambda');
const zipcodeService = require('../../functions/retrieveStateByZipcode');
const searchService = require('../../dao/search');
const schemaService =  require('../../functions/createSchema');
const {restrictsAge} = require('../../functions/restrictsAge');

exports.client = async function (event) {
    let objResponse;
    try {
        console.log('Event:', event);
        let req;
        if (event.headers === undefined) {
            req = event;
        } else {
            req = JSON.parse(event.body);
        }
        
        const constants = JSON.parse(fs.readFileSync('./resources/constants.json'));
        console.log('Body: ' + JSON.stringify(req));
        //search and create schema
        let result_schema = await searchService.search(process.env.MONGODB_COLLECTION_CLIENT_SCHEMAS, {platform: req.platform}, process.env.MONGODB_DATABASE_GLOBAL);
         if(!(result_schema && result_schema.length > 0)){
            result_schema = await searchService.search(process.env.MONGODB_COLLECTION_CLIENT_SCHEMAS, { platform: constants.default_platform }, process.env.MONGODB_DATABASE_GLOBAL);
            if(!(result_schema && result_schema.length > 0)){
                console.warn("Client Schema Not found with platform: " + constants.default_platform);
                objResponse = {
                    status: "Error",
                    statusCode: 400,
                    apiCode: 40,
                    message: "Client schema not found",
                    messageCode: 40001
                };
                return {
                    statusCode: 400,
                    headers: headers,
                    body: JSON.stringify(objResponse)
                };
            }
        }
        let sso = false;
        if(req.hasOwnProperty("create_sso") && req.create_sso === false)
            sso = true;
        console.log("result_schema[0].client_structure: " + JSON.stringify(result_schema[0].client_structure));
        let result = await schemaService.createSchema(result_schema[0].client_structure, "body", "post", sso);
        console.log("schema: " + JSON.stringify(result));
        //validate type_signup_campaign
        if(req.type_signup_campaign){
            //split fullname
            if(req.fullName && req.fullName !== ""){
                let fullName = req.fullName.split(" ");
                req.firstName = fullName[0];
                req.lastName = "";
                for(let i = 1; i < fullName.length; i++){
                  req.lastName = req.lastName +  fullName[i] + " ";
                }
                req.lastName = req.lastName.trim();
            }
            req.phoneNumber = constants.phonenumber_default;
        }

        console.log(process.env.MONGODB_COLLECTION_CONFIGURATION);
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
        
        //Schema Validator
        await schemaValidator.validateSchema(req, result);

        req.email = req.email.toLowerCase();

        // If has zipcode retrieve state
        let ubication; 
        if(req.zipcode) {
            ubication = await zipcodeService.retrieveStateByZipcode(req.zipcode);
            if(ubication === null){
                console.warn("City and/or State Not found");
                objResponse = {
                    status: "Error",
                    statusCode: 400,
                    apiCode: 40,
                    message: "City and/or State not found",
                    messageCode: 40001
                };
                return {
                    statusCode: 400,
                    headers: headers,
                    body: JSON.stringify(objResponse)
                };
            }
            req.state = ubication.state;
            req.city = ubication.city;
        }
        req.user_id_sessionm = "";
        req.referrer_code = "";
        req.referred_code = false;
        req.verified = sso;
        req.onboarding = false;
        req.user = req.email;
        
        //Create Global Client
        let response_global = await lambdaService.invokeLambda(process.env.LAMBDA_FUNCTION_CREATE_CLIENT_GLOBAL, req, 'RequestResponse');

        //Create Local Client
        if(response_global.statusCode === 201)
            await lambdaService.invokeLambda(process.env.LAMBDA_FUNCTION_CREATE_CLIENT_LOCAL, req, 'Event');

        console.log('Result: ' + JSON.stringify(response_global));
        return response_global;

    } catch (e) {
        console.log('Error in insert client orch controller: ' +  JSON.stringify(e));
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
