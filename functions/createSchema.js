const fs = require('fs');

module.exports = {
    createSchema: async (fields, block, method, create_sso) => {
        try{
            console.log("Function createSchema");
            const constants = JSON.parse(fs.readFileSync('./resources/constants.json'));
            let schema = {};
            schema.properties = {};
            schema.id = block;
            schema.type = "object";
            schema.required = [];
            schema.additionalProperties = false;
            if(block === "body" && method === "put")
            {
                for(let field_required of constants.fields_required){
                    schema.required.push(field_required);
                }

            }
            for(let field of fields){
                if(field.status === constants.field_status_active){
                    if(!constants.fields_ignored_in_schema.includes(field.field_name)){
                        if(block === "body" && method === "post"){
                            if(field.field_required){
                                if(field.field_type_name === constants.field_terms_and_conditions)
                                    schema.required.push(field.field_type_name);
                                else if(field.field_name === constants.field_password){
                                    if(create_sso === true)
                                        schema.required.push(field.field_name);
                                }
                                else
                                    schema.required.push(field.field_name);
                            }
                        }
                        switch(field.field_type){

                            case constants.field_types.select:
                                schema.properties[field.field_name] = {
                                    type: [
                                        {
                                            "type": "integer"
                                        },
                                        {
                                            "type": "string"
                                        },
                                        {
                                            "type": "array"
                                        },
                                        {
                                            "type": "boolean"
                                        },
                                        {
                                            "type": "object"
                                        }
                                    ]
                                };
                                break;
                            case constants.field_types.checkbox:
                                if(field.field_type_name === constants.field_terms_and_conditions){
                                    schema.properties[field.field_type_name] = [
                                        {
                                            type: "object",
                                            required: [
                                                "platform"
                                            ],
                                            properties: {
                                                "platform":{
                                                    "type": "string"
                                                }
                                            }
                                        },
                                        {
                                            type: "array",
                                            required: [
                                                "platform"
                                            ],
                                            items: {
                                                type: "object",
                                                required: [
                                                    "platform"
                                                ],
                                                properties: {
                                                    "platform":{
                                                        "type": "string"
                                                    }
                                                }

                                            }
                                        }
                                    ]
                                }
                                else{
                                    schema.properties[field.field_name] = {
                                        type: "boolean"
                                    };
                                }
                                break;
                            case constants.field_types.date:
                                schema.properties[field.field_name] = {
                                    type: "string",
                                    format: "date"
                                };
                                break;
                            case constants.field_types.number:
                                schema.properties[field.field_name] = {
                                    type: "number"
                                };
                                break;
                            case constants.field_types.password:
                                schema.properties[field.field_name] = {
                                    type: "string"
                                };
                                break;
                            case constants.field_types.termsAndConditions:
                                schema.properties[field.field_name] = [
                                    {
                                        type: "object",
                                        required: [
                                            "platform"
                                        ],
                                        properties: {
                                            "platform":{
                                                "type": "string"
                                            }
                                        }
                                    },
                                    {
                                        type: "array",
                                        required: [
                                            "platform"
                                        ],
                                        items: {
                                            type: "object",
                                            required: [
                                                "platform"
                                            ],
                                            properties: {
                                                "platform":{
                                                    "type": "string"
                                                }
                                            }

                                        }
                                    }
                                ]
                                break;
                            default:
                                schema.properties[field.field_name] = {
                                    type: "string"
                                };
                                if(field.field_name === constants.field_name_email)
                                    schema.properties[field.field_name].format = constants.field_name_email;
                                if(constants.fields_no_empty.includes(field.field_name))
                                    schema.properties[field.field_name].pattern = "^(?![nN][uU][lL]{2}$)\\s*\\S.*";

                                //Validate if the fields has minLength and maxLength schema validation
                                if(field.hasOwnProperty('field_min_length')) {
                                    schema.properties[field.field_name].minLength = field.field_min_length
                                }
                                if(field.hasOwnProperty('field_max_length')) {
                                    schema.properties[field.field_name].maxLength = field.field_max_length
                                }
                                break;
                        }
                    }
                }
            }
            if(constants.fields_additional_client && constants.fields_additional_client.length > 0){
                console.log("add additional fields");
                for(let additional_field of constants.fields_additional_client){
                    schema.properties[additional_field.field_name] = additional_field.property;
                }
            }

            console.log("Function createSchema successful");
            return schema;
        }
        catch(err){
            console.log("Error in createSchema: " + err.message);
            return null;
        }
    }
}
