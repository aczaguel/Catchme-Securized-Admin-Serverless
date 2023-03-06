var AWS = require('aws-sdk');
AWS.config.update({ region: process.env.DEPLOY_AWS_REGION});
const transformCustomer = require('../../functions/dataTransformSearchCustomerSessionM');
const APIService = require('../../services/consumeAPI');

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
            console.error('Error in search client in rewards engine');
            objResponse = {
                status: "Error",
                statusCode: api_response.statusCode,
                errors: api_response.body.errors
            };
            console.warn('Result: ' + JSON.stringify({
                statusCode: api_response.statusCode,
                body: objResponse
            }));
            return {
                statusCode: api_response.statusCode,
                body: JSON.stringify(objResponse)
            };
        }

        objResponse = {
            statusCode: 200,
            data: api_response.body.user
        };
        console.log('Result: ' + JSON.stringify({
            statusCode: 200,
            body: objResponse
        }));
        return {
            statusCode: 200,
            body: JSON.stringify(objResponse)
        };

    } catch (e) {
        console.error("Error in search customer in engine: " + e);
        let objResponse = {
            statusCode: 500,
            message: "Error in search customer in engine",
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
