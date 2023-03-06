const fs = require('fs');
const AWSService =  require('./getSecretManager');
const constants = JSON.parse(fs.readFileSync("./resources/constants.json"));

module.exports = async (req) => {
    try{
        console.log("Function transformCreateCustomerSessionM");
        let body_transform = {}; 
        body_transform.user = {};
        if(req.address)
            body_transform.user.address = req.address;
        if(req.city)
            body_transform.user.city = req.city;
        if(req.zipcode)
            body_transform.user.zip = req.zipcode.toString().length <= 4? req.zipcode : "0" + req.zipcode;
        if(req.state)
            body_transform.user.state = req.state;
        //
        if(req.firstName)
            body_transform.user.first_name = req.firstName;
        if(req.lastName)    
            body_transform.user.last_name = req.lastName;
        if(req.secondLastName)    
            body_transform.user.second_last_name = req.secondLastName;
        if(req.birthdate)
            body_transform.user.dob = req.birthdate;
        if(req.gender)
            body_transform.user.gender = req.gender;

        if(req.treasure_data_id)
        {
            body_transform.user.identifiers = [];
            body_transform.user.identifiers.push(
                {
                    external_id: req.treasure_data_id,
                    external_id_type: "treasure_data_id"
                }
            );
        }
        
        //
        console.log("Function transformUpdateCustomerSessionM sucess");
        return await genericRequest(body_transform, req.user_id_sessionm);
    }
    catch(err){
        console.error("Error in transformUpdateCustomerSessionM: " + err.message);
        return null;
    }
};

async function genericRequest (body, user_id) {
    const credentials = await AWSService.getSecretManager(process.env.SESSION_M_CONNECT_SECRETS);
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
