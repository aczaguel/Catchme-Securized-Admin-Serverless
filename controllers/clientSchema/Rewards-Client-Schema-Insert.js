'use strict';
const insertService = require('../../dao/insert');
const searchService= require('../../dao/search');
const schemaService = require('../../validations/schemaValidator');
var fs = require('fs');
const headers = {
    "Access-Control-Allow-Origin": "*"
};
const fieldsValidator = require('../../functions/validateFieldsPosition');
const termsAndConditionsValidator = require('../../functions/validateTermsAndConditions');
const fieldNameValidator = require('../../functions/validateRepeatedFields');

module.exports.data = async (event) => {
    let req;
    let result;
    let apiCode = 105;
    let objResponse;
    try {
        console.log('Event:' + JSON.stringify(event));
        if (event.headers) {
            req = JSON.parse(event.body);
        } else {
            req = event;
        }
        console.log('Body:' + JSON.stringify(req));

        const constants = JSON.parse(fs.readFileSync('./resources/constants.json'));
        const schema = JSON.parse(fs.readFileSync('./resources/schemaClientSchema.json')).insert;
        await schemaService.validateSchema(req, schema);

        let result_get_model = await searchService.search(process.env.MONGODB_COLLECTION_CLIENT_SCHEMAS, { platform: req.platform, program: req.program }, process.env.MONGODB_DATABASE_GLOBAL);
        if(result_get_model && result_get_model.length > 0){
            objResponse = {
                status: "Error",
                statusCode: 400,
                apiCode: 40,
                message: "There is already this client schema",
                messageCode: 40001
            };
            console.warn("Return: ", JSON.stringify(objResponse));
            return {
                statusCode: 400,
                headers: headers,
                body: JSON.stringify(objResponse)
                
            };
        }

        let result_validate = await fieldsValidator.validateFieldsPosition(req.client_structure.filter(item => item.status === constants.field_status_active && item.basic === constants.field_basic_true));
        console.log(result_validate);
        if(result_validate.error){
            objResponse = {
                status: "Error",
                statusCode: 400,
                apiCode: result_validate.apiCode,
                message: result_validate.message,
                messageCode: 40001
            };
            return {
                statusCode: 400,
                headers: headers,
                body: JSON.stringify(objResponse)
                
            };
        }

        //validate repeated field_name
        let result_validate_name = await fieldNameValidator.validateRepeatedFields(req.client_structure);
        if(result_validate_name.error){
            objResponse = {
                status: "Error",
                statusCode: 400,
                apiCode: result_validate_name.apiCode,
                message: result_validate_name.message,
                messageCode: 40001
            };
            return {
                statusCode: 400,
                headers: headers,
                body: JSON.stringify(objResponse)
                
            };
        }
            

        let result_validate_terms = await termsAndConditionsValidator.validateTermsAndConditions(req.client_structure.filter(item => item.field_type === constants.field_terms_and_conditions));
        console.log(result_validate_terms);
        if(result_validate_terms.error){
            objResponse = {
                status: "Error",
                statusCode: 400,
                apiCode: result_validate_terms.apiCode,
                message: result_validate_terms.message,
                messageCode: 40001
            };
            return {
                statusCode: 400,
                headers: headers,
                body: JSON.stringify(objResponse)
                
            };
        }


        result = await insertService.insert(process.env.MONGODB_COLLECTION_CLIENT_SCHEMAS, req, process.env.MONGODB_DATABASE_GLOBAL);
        console.log("Result: ", JSON.stringify(result));
        objResponse = {
            status: "Success",
            statusCode: 201,
            apiCode: apiCode,
            message: "Client schema created",
            data: result
        };
        return {
            statusCode: 201,
            headers: headers,
            body: JSON.stringify(objResponse)
            
        };
    } catch (e) {
        console.log('Error in insert client schema controller: ' +  JSON.stringify(e));
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
