const fs = require('fs');
const constants = JSON.parse(fs.readFileSync('./resources/constants.json'));
const searchService = require('../dao/search');

module.exports = {
    validateMissingData: async (client, structures, platform) => {
        console.log('client, structures, platform: ', JSON.stringify(client), JSON.stringify(structures), JSON.stringify(platform));
        try{
            console.log("Function ValidateMissingData");
            let clientkeys = Object.keys(client);
            let missing_keys = [];

            for (let field of structures) {
                console.log("field.field_name: " + field.field_name);
                console.log("field.field_type: " + field.field_type);
                let result_client = clientkeys.find( key => key === field.field_name );
                if(!result_client){
                    if(field.field_type_name === constants.field_terms_and_conditions || field.field_type === constants.field_terms_and_conditions){
                        let result_terms_and_conditions = await searchService.search(process.env.MONGODB_COLLECTION_TERMS_AND_CONDITIONS, {platform: field.platform, subplatform: field.subplatform},process.env.MONGODB_DATABASE_GLOBAL);
                        let resul_find = result_terms_and_conditions.find(item => item.platform === field.platform && item.subplatform === field.subplatform);
                        field.url = resul_find? resul_find.url : "";
                        if(client.termsAndConditions && client.termsAndConditions.length > 0){
                            let result_terms = client.termsAndConditions.find(key => key.platform === field.platform && key.subplatform === field.subplatform && key.status === true );
                            if(!result_terms)
                                missing_keys.push(field);
                        }
                        else
                            missing_keys.push(field);
                    }
                    else if(field.field_type === constants.field_type_bool){
                        if(client[field.field_name] === false){
                            missing_keys.push(field);
                        }
                    }
                    else if(!constants.fields_ignored.includes(field.field_name))
                        missing_keys.push(field);
                }
            }
            console.log("Function ValidateMissingData sucess");
            return missing_keys.length > 0 ? missing_keys :  null;
        }
        catch(err){
            console.error("An error occurred in ValidateMissingData: " + err.message);
            return { apiCode: 51, message: "Error in ValidateMissingData function"};
        }
    }
}
