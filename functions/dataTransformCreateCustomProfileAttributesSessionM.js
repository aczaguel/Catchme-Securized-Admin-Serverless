const fs = require('fs');
const constants = JSON.parse(fs.readFileSync("./resources/constants.json"));
const AWSService =  require('./getSecretManager');

module.exports = async (req, user, method) => {
    try{
        console.log("Function dataTransformCreateCustomProfileAttributesSessionM");
        let body_transform = {}; 
        body_transform.user_profile = {};
        if(req.origin_product_OwnerId !== null && req.origin_product_OwnerId !== undefined)
            body_transform.user_profile.origin_product_OwnerId = req.origin_product_OwnerId;

        if(req.origin_platform_type !== null && req.origin_platform_type !== undefined)
            body_transform.user_profile.origin_platform_type = req.origin_platform_type;

        if(req.origin_url !== null && req.origin_url !== undefined)
            body_transform.user_profile.origin_url = req.origin_url;

        if(req.agent !== null && req.agent !== undefined)
            body_transform.user_profile.agent = req.agent;

        if(req.platform !== null && req.platform !== undefined)
            body_transform.user_profile.rewards_platform_id = req.platform;

        if(req.terms_conditions !== null && req.terms_conditions !== undefined)
            body_transform.user_profile.terms_conditions = req.terms_conditions;

        if(req.sms_opt_in !== null && req.sms_opt_in !== undefined)
            body_transform.user_profile.sms_opt_in = req.sms_opt_in;

        if(req.push_opt_in !== null && req.push_opt_in !== undefined)
            body_transform.user_profile.push_opt_in = req.push_opt_in;

        if(req.email_opt_in !== null && req.email_opt_in !== undefined){
            body_transform.user_profile.email_opt_in = req.email_opt_in;
            //body_transform.user_profile.opted_out = true;
        }

        if(req.termsAndConditions !== null && req.termsAndConditions !== undefined && req.termsAndConditions.length > 0)
            body_transform.user_profile.terms_conditions = true;

        if(req.migration_tier !== null && req.migration_tier !== undefined)
            body_transform.user_profile.migration_tier = req.migration_tier;
        
        if(req.migration_points !== null && req.migration_points !== undefined)
            body_transform.user_profile.migration_points = req.migration_points;
        
        if(req.rewards_platform_id !== null && req.rewards_platform_id !== undefined)
            body_transform.user_profile.rewards_platform_id = req.rewards_platform_id;

        if(req.rewards_program_id !== null && req.rewards_program_id !== undefined)
            body_transform.user_profile.rewards_program_id = req.rewards_program_id;

        if(req.registration_device_id !== null && req.registration_device_id !== undefined)
            body_transform.user_profile.rewards_program_id = req.registration_device_id;
    
        if(req.registration_device_model !== null && req.registration_device_model !== undefined)
            body_transform.user_profile.registration_device_model = req.registration_device_model;

        if(req.registration_device_platform !== null && req.registration_device_platform !== undefined)
            body_transform.user_profile.registration_device_platform = req.registration_device_platform;

        if(req.registration_device_os !== null && req.registration_device_os !== undefined)
            body_transform.user_profile.registration_device_os = req.registration_device_os;

        if(req.is_active !== null && req.is_active !== undefined)
            body_transform.user_profile.is_active = req.is_active;    

        if(req.do_not_sell !== null && req.do_not_sell !== undefined)
            body_transform.user_profile.do_not_sell = req.do_not_sell;
        
        if(req.test_account !== null && req.test_account !== undefined)
            body_transform.user_profile.test_account = req.test_account;

        if(req.secondLastName)
            body_transform.user_profile.second_last_name = req.secondLastName;

        console.log("Function dataTransformCreateCustomProfileAttributesSessionM sucess");
        return await genericRequest(body_transform, user, method);
    }
    catch(err){
        console.error("Error in dataTransformCreateCustomProfileAttributesSessionM: " + err.message);
        return null;
    }
};

async function genericRequest (body, user, method) {
    const credentials = await AWSService.getSecretManager(process.env.SESSION_M_CONNECT_SECRETS);
    return request = {
        url: process.env.SESSION_M_BASE_URL + process.env.REWARDS_ENGINE_RELATIVE_URL_CUSTOM_PROFILE_ATTRIBUTES.replace('{apikeySessionM}', credentials.connect_api_key).replace('{user_id}', user),
        method: method,
        data: body,
        auth: {
            username: credentials.connect_api_key,
            password: credentials.connect_api_secret
        }
    }
}
