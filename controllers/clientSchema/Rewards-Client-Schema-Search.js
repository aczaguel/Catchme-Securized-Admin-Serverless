'use strict';
const searchService= require('../../dao/search');
const schemaService = require('../../validations/schemaValidator');
var fs = require('fs');
const headers = {
    "Access-Control-Allow-Origin": "*"
};

module.exports.data = async (event) => {
    let result;
    let objResponse;
    let apiCode = 100;
    try {
        const constants = JSON.parse(fs.readFileSync('./resources/constants.json'));
        console.log('Event:' + JSON.stringify(event));
        const schema = JSON.parse(fs.readFileSync('./resources/schemaClientSchema.json')).query;
        await schemaService.validateSchema(event.queryStringParameters? event.queryStringParameters : {}, schema);
        result = await searchService.search(process.env.MONGODB_COLLECTION_CLIENT_SCHEMAS, event.queryStringParameters, process.env.MONGODB_DATABASE_GLOBAL);
        let message = "Schema client found";
        if(!(result && result.length > 0)){
            console.warn('Client Schemas not found');
            apiCode = 101;
            message = "Query without data";
        } else {
            result = result[0];
            result.client_structure = result.client_structure.filter(item => !constants.fields_required.includes(item.field_name));
            console.log("results: " + result.client_structure);
        }
        objResponse = {
            status: "Success",
            statusCode: 200,
            apiCode: apiCode,
            message: message,
            data: [result]
        };
        return {
            statusCode: 200,
            headers: headers,
            body: JSON.stringify(objResponse)
            
        };

    } catch (e) {
        console.log('Error in search client schema controller: ' +  JSON.stringify(e));
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
