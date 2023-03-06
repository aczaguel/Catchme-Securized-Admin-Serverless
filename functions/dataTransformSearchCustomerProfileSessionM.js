const fs = require('fs');
const constants = JSON.parse(fs.readFileSync("./resources/constants.json"));
const AWSService =  require('./getSecretManager');

module.exports = async (req) => {
    try{
        console.log("Function dataTransformSearchCustomerProfileSessionM");
        console.log("Function dataTransformSearchCustomerProfileSessionM sucess");
        return await genericRequest(req);
    }
    catch(err){
        console.error("Error in dataTransformSearchCustomerProfileSessionM: " + err.message);
        return null;
    }
};

async function genericRequest (req) {
    const credentials = await AWSService.getSecretManager(process.env.SESSION_M_CONNECT_SECRETS);
    return request = {
        url: process.env.SESSION_M_BASE_URL + process.env.REWARDS_ENGINE_RELATIVE_URL_SEARCH_USER.replace('{apikeySessionM}', credentials.connect_api_key).replace('{user_id}', req.body.user.id),
        method: "GET",
        auth: {
            username: credentials.connect_api_key,
            password: credentials.connect_api_secret
        }
    }
}
