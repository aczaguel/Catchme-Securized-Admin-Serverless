const fs = require('fs');
const AWSSecrets =  require('./getSecretManager');

module.exports = async (req, user_id_sessionm) => {
    try{
        console.log("Function transformCreateCustomerSessionM");
        let body_transform = {}; 
        body_transform.user = {};
        body_transform.user.phone_numbers =[
        {
            phone_number: req.phoneNumber.replace("+",""),
            phone_type: "mobile",
            preference_flags: ["primary"]
        }];
        console.log("Function transformUpdateCustomerSessionM success");
        return await genericRequest(body_transform, user_id_sessionm);
    }
    catch(err){
        console.error("Error in transformUpdateCustomerSessionM: " + err.message);
        return null;
    }
};


async function genericRequest (body, user_id) {
    const credentials = await AWSSecrets.getSecretManager(process.env.SESSION_M_CONNECT_SECRETS);
    return request = {
        url: process.env.SESSION_M_BASE_URL + process.env.REWARDS_ENGINE_RELATIVE_URL_UPDATE.replace('{apikeySessionM}', credentials.connect_api_key).replace('{user_id}', user_id),
        method: "PUT",
        data: body,
        auth: {
            username: credentials.connect_api_key,
            password: credentials.connect_api_secret
        }
    }
}
