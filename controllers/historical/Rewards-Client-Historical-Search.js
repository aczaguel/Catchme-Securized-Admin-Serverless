'use strict';
const searchService= require('../../dao/search');
const schemaValidator = require('../../validations/schemaValidator');
var fs = require('fs');
const headers = {
    "Access-Control-Allow-Origin": "*"
};

module.exports.action = async (event) => {
    let result;
    let objResponse;
    let apiCode = 100;
    try {
        console.log('Event:' + JSON.stringify(event));
        const schema = JSON.parse(fs.readFileSync('./resources/schemaHistoricalClient.json')).query;
        await schemaValidator.validateSchema(event.queryStringParameters? event.queryStringParameters : {}, schema);
        event.queryStringParameters.historical = true;
        result = await searchService.search(process.env.MONGODB_COLLECTION_CLIENTS, event.queryStringParameters, process.env.MONGODB_DATABASE_LOCAL);
        console.log("results: " + JSON.stringify(result));
        let message = "Historical Client found";
        if(!(result && result.length > 0)){
            console.warn('Historical Client  not found');
            objResponse = {
                status: "Success",
                statusCode: 200,
                apiCode: 101,
                message: "Query without data",
                historical: false
            };
            return {
                statusCode: 200,
                headers: headers,
                body: JSON.stringify(objResponse)
                
            };
        }   
        if(!(result[0] && result[0].historical)) {
            console.warn('Historical Client  false');
            objResponse = {
                status: "Success",
                statusCode: 200,
                apiCode: 101,
                message: "Query without data",
                historical: false
            };
            return {
                statusCode: 200,
                headers: headers,
                body: JSON.stringify(objResponse)
                
            };
        }   

        objResponse = {
            status: "Success",
            statusCode: 200,
            apiCode: apiCode,
            message: message,
            historical: result[0].historical
        };
        if(result[0].registration_campaign){
            objResponse.registration_campaign = result[0].registration_campaign;
            objResponse.status_registration_campaign = result[0].status_registration_campaign;
        }

        console.log('Response: ' +  JSON.stringify(objResponse));
        return {
            statusCode: 200,
            headers: headers,
            body: JSON.stringify(objResponse)
            
        };

    } catch (e) {
        console.error('Error in search historical client controller: ' +  JSON.stringify(e));
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
