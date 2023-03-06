const fs = require('fs');
const constants = JSON.parse(fs.readFileSync("./resources/constants.json"));
const AWSService =  require('./getSecretManager');

module.exports = async (req, client_id) => {
    console.log('req, client_id: ', JSON.stringify(req), JSON.stringify(client_id));
    try{
        console.log("Function transformCreateCustomerSessionM");
        let body_transform = {}; 
        body_transform.user = {};

        //body_transform.user.external_id = req.external_id,
        body_transform.user.opted_in = true;
        //body_transform.user.external_id_type = req.origin_platform_type;
        body_transform.user.email = req.email;
        body_transform.user.first_name = req.firstName;
        body_transform.user.last_name = req.lastName;
        if(req.secondLastName)
            body_transform.user.second_last_name = req.secondLastName;
        body_transform.user.gender = req.gender;
        body_transform.user.dob = req.birthdate;
        //body_transform.user.address = req.adderss;
        body_transform.user.city = req.city;
        body_transform.user.locale = req.locale;
        body_transform.user.state = req.state;
        // If has zipcode
        if(req.zipcode) {
            body_transform.user.zip = req.zipcode.toString().length === 5? req.zipcode : "0" + req.zipcode;
        }
        body_transform.user.country = req.country;
        // If has phoneNumber
        if(req.phoneNumber) {
            body_transform.user.phone_numbers =[
            {
                phone_number: req.phoneNumber.replace("+",""),
                phone_type: "mobile",
                preference_flags: ["primary"]
            }];
        }
        body_transform.user.identifiers =[{
            external_id: client_id,
            external_id_type: req.platform
        },{
            external_id: req.email.replace('@','_'),
            external_id_type: "SSO Global"
        },
        {
            external_id: req.email,
            external_id_type: "SalesForce"
        }];
        
        if(req.external_id)
        {
            body_transform.user.identifiers.push(
                {
                    external_id: req.external_id,
                    external_id_type: process.env.SESSION_M_USER_EXTERNAL_PLATFORM
                }
            );
            
        }
        console.log("Function transformCreateCustomerSessionM sucess");
        return await genericRequest(body_transform);
    }
    catch(err){
        console.error("Error in transformCreateCustomerSessionM: " + err.message);
        return null;
    }
};

async function genericRequest (body) {
    const credentials = await AWSService.getSecretManager(process.env.SESSION_M_CONNECT_SECRETS);
    return request = {
        url: process.env.SESSION_M_BASE_URL + process.env.REWARDS_ENGINE_RELATIVE_URL_CREATE.replace('{apikeySessionM}', credentials.connect_api_key),
        method: "POST",
        data: body,
        auth: {
            username: credentials.connect_api_key,
            password: credentials.connect_api_secret
        }
    }
}
