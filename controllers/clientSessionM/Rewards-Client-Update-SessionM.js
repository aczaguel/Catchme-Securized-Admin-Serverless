var AWS = require('aws-sdk');
AWS.config.update({ region: process.env.DEPLOY_AWS_REGION});
const transformCustomer = require('../../functions/dataTransformUpdateCustomerSessionM');
const transformCustomProfile = require('../../functions/dataTransformCreateCustomProfileAttributesSessionM');
const APIService = require('../../services/consumeAPI');

const insertService = require('../../dao/insert');

exports.client = async function (event) {
    let req;
    let objResponse;
    try {
        console.log('Event: ' + JSON.stringify(event));
        if (event.headers === undefined) {
            req = event;
        } else {
            req = JSON.parse(event.body);
        }
        console.log('Req: ' + JSON.stringify(req));
        
        let request_customer = await transformCustomer(req);
        let api_response = await APIService.consumeAPI(request_customer);
        if(api_response.statusCode !== 200) {
            console.error('Error in create client in rewards engine');
            let params_error={
                body: req,
                status: "retrying",
                function: "Rewards-Client-Create-Engine",
                error: api_response.body.errors,
                retyr:0
            };
            console.log("Insert in " + process.env.MONGODB_COLLECTION_ERROR + " with data: " + JSON.stringify(params_error));
            await insertService.insert(process.env.MONGODB_COLLECTION_ERROR, params_error, process.env.MONGODB_DATABASE_GLOBAL);
        }

        let request_custom_profile = await transformCustomProfile(req, req.user_id_sessionm, "PUT");
        await APIService.consumeAPI(request_custom_profile);

        objResponse = {
            status: "Updated",
            statusCode: 200,
            message: "Successful operation"
        };
        console.log('Result: ' + JSON.stringify({
            statusCode: 201,
            body: objResponse
        }));
        return {
            statusCode: 201,
            body: JSON.stringify(objResponse)
        };

    } catch (e) {
        console.error("Error in create customer in engine: " + e);
        let objResponse = {
            statusCode: 500,
            message: "Error in create customer in engine",
            error: e.message,
            messageCode: 40001
        };
        let error = e.body || objResponse;
        return {
            statusCode: e.statusCode || 500,
            body: JSON.stringify(error)
        };
    }
};
