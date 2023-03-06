const fs = require('fs');
const AWSService =  require('./getSecretManager');

module.exports = async (req) => {
    try{
        console.log("Function transformCreateCustomerSessionM");
        console.log("Function transformCreateCustomerSessionM sucess");
        return await genericRequest(req);
    }
    catch(err){
        console.error("Error in transformCreateCustomerSessionM: " + err.message);
        return null;
    }
};

async function genericRequest (req) {
    const credentials = await AWSService.getSecretManager(process.env.SESSION_M_CONNECT_SECRETS);
    return request = {
        url: process.env.SESSION_M_BASE_URL + process.env.REWARDS_ENGINE_RELATIVE_URL_SEARCH.replace('{apikeySessionM}', credentials.connect_api_key).replace('{user_id}', req.user_id_sessionm),
        method: "GET",
        auth: {
            username: credentials.connect_api_key,
            password: credentials.connect_api_secret
        }
    }
}
