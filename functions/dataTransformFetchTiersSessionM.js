const fs = require('fs');
const constants = JSON.parse(fs.readFileSync("./resources/constants.json"));
const AWSService =  require('./getSecretManager');

module.exports = async (req) => {
    try{
        console.log("Function dataTransformFetchTiersSessionM");
        let body_transform = constants.SessionM.fetch_accounts; 
        body_transform.retailer_id = req.retailer_id;
        body_transform.tier_system_id = req.tier_system_id;
       
        console.log("Function dataTransformFetchTiersSessionM sucess");
        return await genericRequest(body_transform);
    }
    catch(err){
        console.error("Error in dataTransformFetchTiersSessionM: " + err.message);
        return null;
    }
};

async function genericRequest (body) {
    const credentials = await AWSService.getSecretManager(process.env.SESSION_M_CONNECT_SECRETS);
    return request = {
        url: process.env.SESSION_M_BASE_DOMAIN_URL + process.env.REWARDS_ENGINE_RELATIVE_URL_FETCH_TIERS,
        method: "POST",
        data: body,
        headers: {
            Authorization: "Basic " + Buffer.from(credentials.connect_api_username + ":" + credentials.connect_api_password).toString('base64')
        }
    }
}
