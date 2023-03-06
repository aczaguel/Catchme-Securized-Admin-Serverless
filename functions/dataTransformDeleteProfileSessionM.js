const fs = require('fs');
const constants = JSON.parse(fs.readFileSync("./resources/constants.json"));
const getSecretManager =  require('./getSecretManager');

module.exports = async (req) => {
    try{
        console.log("Function dataTransformDeleteProfileSessionM");
        console.log("Function dataTransformDeleteProfileSessionM sucess");
        return await genericRequest(req);
    }
    catch(err){
        console.error("Error in dataTransformDeleteProfileSessionM: " + err.message);
        return null;
    }
};

async function genericRequest (req) {
    const credentials = await getSecretManager.getSecretManager(process.env.SESSION_M_CONNECT_SECRETS);  
    return request = {
        url: process.env.SESSION_M_BASE_URL + process.env.REWARDS_ENGINE_RELATIVE_URL_DELETE_PROFILE.replace('{apikeySessionM}', credentials.connect_api_key).replace('{user_id}', req.user_id_sessionm),
        method: "DELETE",
        auth: {
            username: credentials.connect_api_key,
            password: credentials.connect_api_secret
        }
    }
}
