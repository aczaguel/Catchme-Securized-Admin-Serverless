var AWS = require('aws-sdk');
AWS.config.update({ region: process.env.DEPLOY_AWS_REGION});
const fs = require('fs');
const valSchema = require('../../validations/schemaValidator');
const headers = {
    "Access-Control-Allow-Origin": "*"
};
const searchService = require('../../dao/search');
const insertService = require('../../dao/insert');
const termsAndConditionsService = require('../../functions/mapTermsAndConditions');
const lambdaService = require('../../services/invokeLambda');
const SSOService = require('../../functions/dataTransformSignUpClientSSO');
const APIService = require('../../services/consumeAPI');

exports.client = async function (event) {
    console.log('Event:', event);
    let req;
    let objResponse;
    try {
        if (event.headers === undefined) {
            req = event;
        } else {
            req = JSON.parse(event.body);
        }
        const constants = JSON.parse(fs.readFileSync('./resources/constants.json'));
        console.log('Body: ' + JSON.stringify(req));

        //validate if exist a client with this email
        console.log('Validating client by email', req.email)
        let search_client = await searchService.search(process.env.MONGODB_COLLECTION_CLIENTS, { email: req.email, platform: req.platform, program: req.program }, process.env.MONGODB_DATABASE_LOCAL, constants.projection_client);
        if (search_client && search_client.length > 0) {
            objResponse = {
                status: "Error",
                statusCode: 400,
                apiCode: 40,
                message: "There is already a client with this platform and program",
                messageCode: 40001
            };
            console.warn('Result: ' + JSON.stringify(objResponse));
            return {
                statusCode: 400,
                headers: headers,
                body: JSON.stringify(objResponse)
            };
        }

        // validation for external unique identifier
        // Refactor needed
        if (process.env.USER_IDENTIFIER !== 'email') {
            console.log('Validating client by', process.env.USER_IDENTIFIER, req[process.env.USER_IDENTIFIER])
            let search_client_by_id = await searchService.search(process.env.MONGODB_COLLECTION_CLIENTS, { [process.env.USER_IDENTIFIER]: req[process.env.USER_IDENTIFIER], platform: req.platform, program: req.program }, process.env.MONGODB_DATABASE_LOCAL, constants.projection_client);
            if (search_client_by_id && search_client_by_id.length > 0) {
                objResponse = {
                    status: "Error",
                    statusCode: 400,
                    apiCode: 40,
                    message: "There is already a client with this platform and program"
                };
                console.warn('Result: ' + JSON.stringify(objResponse));
                return {
                    statusCode: 400,
                    headers: headers,
                    body: JSON.stringify(objResponse)
                };
            }
        }

        //create array of terms and conditions
        if (req.termsAndConditions)
            req.termsAndConditions = await termsAndConditionsService
                .mapAndValidateTermAndConditionsInBD(req.termsAndConditions);

        //signup in SSO
        if (req.create_sso) {
            delete req.create_sso;
            let request_sso = await SSOService.transformSSO(req);
            let api_response = await APIService.consumeAPI(request_sso);
            if (api_response.statusCode !== 200) {
                objResponse = {
                    status: "Error",
                    apicode: 52,
                    statusCode: 500,
                    message: "Error to create client in SSO Global",
                    messageCode: 40001,
                    error: api_response.body.message ? api_response.body.message : api_response.body.error
                };
                console.warn('Result: ' + JSON.stringify(objResponse));
                return {
                    statusCode: 500,
                    headers: headers,
                    body: JSON.stringify(objResponse)
                };
            }
        }

        if (req.external_id || (req.type_signup_campaign === constants.type_signup_campaign_external && req.signup_campaign !== constants.signup_campaign_na)) {
            req.historical = true;
            req.historical_status = constants.historical_status_registered;
            if(req.type_signup_campaign === constants.type_signup_campaign_external && req.signup_campaign !== constants.signup_campaign_na){
                req.registration_campaign = true;
                req.status_registration_campaign = constants.campaign_status_registered;
            }
        }
        //delete fields ignored
        for (let field of constants.fields_ignored) {
            delete req[field];
        }
        if (req.sms_opt_in === null || req.sms_opt_in === undefined)
            req.sms_opt_in = false;

        if (req.push_opt_in === null || req.push_opt_in === undefined)
            req.push_opt_in = false;

        if (req.email_opt_in === null || req.email_opt_in === undefined)
            req.email_opt_in = false;

        //insert client global
        console.log("Insert in " + process.env.MONGODB_COLLECTION_CLIENTS + " of Database: " + process.env.MONGODB_DATABASE_GLOBAL + " with data: " + JSON.stringify(req));
        await insertService.insert(process.env.MONGODB_COLLECTION_CLIENTS, req, process.env.MONGODB_DATABASE_GLOBAL);

        //insert client local
        console.log("Insert in " + process.env.MONGODB_COLLECTION_CLIENTS + " of Database: " + process.env.MONGODB_DATABASE_LOCAL + " with data: " + JSON.stringify(req));
        await insertService.insert(process.env.MONGODB_COLLECTION_CLIENTS, req, process.env.MONGODB_DATABASE_LOCAL);

        //insert client in rewards engine (SessionM)
        await lambdaService.invokeLambda(process.env.LAMBDA_FUNCTION_CREATE_CLIENT_ENGINE, req, 'RequestResponse');

        objResponse = {
            status: "Success",
            statusCode: 201,
            apicode: 105,
            message: "Client created"
        };
        console.log('Result: ' + JSON.stringify({
            statusCode: 201,
            headers: headers,
            body: objResponse
        }));
        return {
            statusCode: 201,
            headers: headers,
            body: JSON.stringify(objResponse)
        };

    } catch (e) {
        console.log('Error in insert client global controller: ' + JSON.stringify(e));
        apiCode = e.apiCode ? e.apiCode : 51;
        let message = e.message ? e.message : "Internal Server Error";
        let statusCode = e.statusCode ? e.statusCode : 500;
        let status = e.status ? e.status : "Error";
        objResponse = {
            statusCode: statusCode,
            status: status,
            message: message,
            messageCode: 40001,
            apicode: apiCode
        };
        if (e.body && e.body.error)
            objResponse.error = e.body.error;
        return {
            statusCode: e.statusCode || 500,
            headers: headers,
            body: JSON.stringify(objResponse)
        };
    }
};
