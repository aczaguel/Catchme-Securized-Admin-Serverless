var AWS = require('aws-sdk');
AWS.config.update({ region: process.env.DEPLOY_AWS_REGION});
const searchService= require('../../dao/search');
const time_factor = 60;
const lambdaService =  require('../../services/invokeLambda');

exports.client = async function (event) {
    console.log('Event:', event);
    let req;
    let objResponse;
    try {
        
        let data_configuration = await searchService.search(process.env.MONGODB_COLLECTION_RETRIES_CONFIGURATION, { process: process.env.LAMBDA_FUNCTION_CREATE_CLIENT_ENGINE }, process.env.MONGODB_DATABASE_GLOBAL);
        if(!(data_configuration && data_configuration.length > 0)){
            objResponse = {
                status: "Not Found",
                statusCode: 404,
                message: "Process configuration not found",
                messageCode: 40001
            };
            console.log('Result: ' + JSON.stringify({
                statusCode: 404,
                body: objResponse
            }));
            return {
                statusCode: 404,
                body: JSON.stringify(objResponse)
            };
        }
        data_configuration = data_configuration[0];
        let now_timestamp = new Date(Date().toLocaleString({ timeZone: "America/Mexico_City" }));
        now_timestamp = now_timestamp.getTime()/1000;
        let range_timestamp = now_timestamp - (data_configuration.interval * time_factor);
        let params = {
            retry: { $lte: data_configuration.retries},
            function: process.env.LAMBDA_FUNCTION_CREATE_CLIENT_ENGINE,
            timestamp:  { $lte: range_timestamp}
        };
        let data_errors = await searchService.search(process.env.MONGODB_COLLECTION_ERROR, params, process.env.MONGODB_DATABASE_GLOBAL);
        if(!(data_errors && data_errors.length > 0)){
            objResponse = {
                status: "Not Found",
                statusCode: 404,
                message: "Error register not found",
                messageCode: 40001
            };
            console.log('Result: ' + JSON.stringify({
                statusCode: 404,
                body: objResponse
            }));
            return {
                statusCode: 404,
                body: JSON.stringify(objResponse)
            };
        }
        for(let data of data_errors){
            data.body.retry = data.retry;
            data.body.id_error = data._id;
            await lambdaService.invokeLambda(process.env.LAMBDA_FUNCTION_CREATE_CLIENT_ENGINE, data.body, 'Event')
        }

       
        objResponse = {
            status: "Created",
            statusCode: 201,
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
            messageCode: 40001,
            error: e.message
        };
        let error = e.body || objResponse;
        return {
            statusCode: e.statusCode || 500,
            body: JSON.stringify(error)
        };
    }
};
