'use strict';
const updateService = require('../../dao/update');
const deleteService = require('../../dao/delete');
const searchService = require('../../dao/search');
const schemaService = require('../../validations/schemaValidator');
var fs = require('fs');
const headers = {
    "Access-Control-Allow-Origin": "*"
};
var ObjectId = require('mongodb').ObjectID;

module.exports.data = async (event) => {
    let req;
    let result;
    let apiCode = 103;
    let objResponse;
    try {
        console.log("Event: ", JSON.stringify(event));
        
        const schemaPath = JSON.parse(fs.readFileSync('./resources/schemaClientSchema.json')).path;
        await schemaService.validateSchema(event.pathParameters? event.pathParameters : {}, schemaPath);
        let objectId = {
            "_id" : ObjectId(event.pathParameters.id)
        };

        let result_get_model = await searchService.search(process.env.MONGODB_COLLECTION_CLIENT_SCHEMAS, objectId, process.env.MONGODB_DATABASE_GLOBAL);
        if(!(result_get_model && result_get_model.length > 0)){
            objResponse = {
                status: "Error",
                statusCode: 400,
                apiCode: 41,
                message: "Client schema not found",
                messageCode: 40001
            };
            console.warn("Return: ", JSON.stringify(objResponse));
            return {
                statusCode: 400,
                headers: headers,
                body: JSON.stringify(objResponse)
                
            };
        }
        result_get_model = result_get_model[0];
        console.log("result_get_model.client_structure: " + JSON.stringify(result_get_model.client_structure));
        if(event.body){
            let body = event.body;//JSON.parse(event.body);
            for(let field of body){                     
                if(result_get_model.client_structure && result_get_model.client_structure.length > 0){
                    let exist_field = result_get_model.client_structure.find(item => item.field_name === field.field_name);
                    if(exist_field){
                        let index = result_get_model.client_structure.findIndex((item, index) => {
                            if (item.field_name === field.field_name) {
                              return true;
                            }
                          });
                        if(index >= 0)
                            result_get_model.client_structure.splice(index, 1);
                    }
                } 
            }
            console.log("result_get_model.client_structure: " + JSON.stringify(result_get_model.client_structure));
            result = await updateService.updateData(process.env.MONGODB_COLLECTION_CLIENT_SCHEMAS, objectId, {client_structure: result_get_model.client_structure}, process.env.MONGODB_DATABASE_GLOBAL);
            console.log("result update " ,JSON.stringify(result));
            objResponse = {
                status: "Success",
                statusCode: 200,
                apiCode: apiCode,
                message: "Fields of client schema deleted"
            };
            return {
                statusCode: 200,
                headers: headers,
                body: JSON.stringify(objResponse)
                
            };

        }
        else{
            console.log("Delete in " + process.env.MONGODB_COLLECTION_CLIENT_SCHEMAS + " with filter: " + JSON.stringify(event.pathParameters));
            result = await deleteService.deleteClient(process.env.MONGODB_COLLECTION_CLIENT_SCHEMAS, objectId, process.env.MONGODB_DATABASE_GLOBAL);
            console.log("results: " + JSON.stringify(result));
            objResponse = {
                status: "Success",
                statusCode: 200,
                apiCode: apiCode,
                message: "Client schema deleted"
            };
            return {
                statusCode: 200,
                headers: headers,
                body: JSON.stringify(objResponse)
                
            };
        }
       
    } catch (e) {
        console.log('Error in delete client schema controller: ' +  JSON.stringify(e));
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
