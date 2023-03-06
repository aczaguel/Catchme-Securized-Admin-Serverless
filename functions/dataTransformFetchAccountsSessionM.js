const fs = require('fs');
const constants = JSON.parse(fs.readFileSync("./resources/constants.json"));
const AWSService =  require('./getSecretManager');

module.exports = async (req) => {
    console.log('req: ', req);
    try{
        console.log("Function dataTransformFetchAccountsSessionM");
        let body_transform = constants.SessionM.fetch_accounts; 
        body_transform.retailer_id = req.retailer_id;

        console.log("Function dataTransformFetchAccountsSessionM sucess");
        return await genericRequest(body_transform);
    }
    catch(err){
        console.error("Error in dataTransformFetchAccountsSessionM: " + err.message);
        return null;
    }
};

async function genericRequest (body) {
    const credentials = await AWSService.getSecretManager(process.env.SESSION_M_CONNECT_SECRETS);
    return request = {
        url: process.env.SESSION_M_BASE_DOMAIN_URL + process.env.REWARDS_ENGINE_RELATIVE_URL_FETCH_ACCOUNTS,
        method: "POST",
        data: body,
        headers: {
            Authorization: "Basic " + Buffer.from(credentials.connect_api_username + ":" + credentials.connect_api_password).toString('base64')
        }
    }
}
