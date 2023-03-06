'use strict';
const updateService = require('../../dao/update');
const searchService = require('../../dao/search');
const schemaService = require('../../validations/schemaValidator');
var fs = require('fs');
const headers = {
    "Access-Control-Allow-Origin": "*"
};
const fieldsValidator = require('../../functions/validateFieldsPosition');
const termsAndConditionsValidator = require('../../functions/validateTermsAndConditions');

module.exports.data = async (event) => {
    let req;
    let result;
    let objResponse;
    let apiCode = 102;
    try {
        console.log('Event:' + JSON.stringify(event));
        if (event.headers) {
            req = JSON.parse(event.body);
        } else {
            req = event;
        }

        console.log('Body:' + JSON.stringify(req));

        const constants = JSON.parse(fs.readFileSync('./resources/constants.json'));
        const schema = JSON.parse(fs.readFileSync('./resources/schemaClientSchema.json')).update;
        await schemaService.validateSchema(req, schema);

        let result_get_model = await searchService.search(process.env.MONGODB_COLLECTION_CLIENT_SCHEMAS, { platform: req.platform, program: req.program }, process.env.MONGODB_DATABASE_GLOBAL);
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
        //if exist data of client_structure in request, retrieve data and update array
        if(req.client_structure && req.client_structure.length > 0){
            for(let field of req.client_structure){
                if(result_get_model.client_structure && result_get_model.client_structure.length > 0){
                    let exist_field = result_get_model.client_structure.find(item => item.field_name === field.field_name);
                    if(!exist_field)
                        result_get_model.client_structure.push(field);
                    else{
                        let index = result_get_model.client_structure.findIndex((item, index) => {
                            if (item.field_name === field.field_name) {
                              return true;
                            }
                          });
                        if(index >= 0)
                            result_get_model.client_structure[index] = field;
                    }
                }
                else{
                    result_get_model.client_structure = [];
                    result_get_model.client_structure.push(field);     
                }           
                req.client_structure = result_get_model.client_structure;
            }
        }
        console.log(req.client_structure);
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

        //validate exists terms and conditions
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

        console.log("Update in " + process.env.MONGODB_COLLECTION_CLIENT_SCHEMAS + " with filter: " + JSON.stringify({ platform: req.platform, program: req.program }) + " and data: " + JSON.stringify(req));
        result = await updateService.updateData(process.env.MONGODB_COLLECTION_CLIENT_SCHEMAS, { platform: req.platform, program: req.program }, req, process.env.MONGODB_DATABASE_GLOBAL);
        console.log("result update " ,JSON.stringify(result));
        objResponse = {
            status: "Success",
            statusCode: 200,
            apiCode: apiCode,
            message: "Client schema updated",
            data: result
        };
        return {
            statusCode: 200,
            headers: headers,
            body: JSON.stringify(objResponse)
            
        };
    } catch (e) {
        console.log('Error in update client schema controller: ' +  JSON.stringify(e));
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
