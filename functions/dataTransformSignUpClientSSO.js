const fs = require('fs');
const constants = JSON.parse(fs.readFileSync("./resources/constants.json"));
const AWSService =  require('./getSecretManager');

module.exports = {
    transformSSO: async (req) => {
        try{
            console.log("Function transformSingUpClientSSO");
	        let obj_signup = {};
	        obj_signup.email = req.email;
	        obj_signup.password = req.password;
	        obj_signup.firstName = req.firstName;
	        obj_signup.lastName = req.lastName;
	        obj_signup.phoneNumber = req.phoneNumber;
	        obj_signup.birthdate = req.birthdate;
	        obj_signup.termsAndConditions = []
	        if(req.termsAndConditions && req.termsAndConditions.length > 0 )
	            obj_signup.termsAndConditions = await mapTermsAndCondifitons(req.termsAndConditions);
	        obj_signup.advertisement = req.advertisement;
	        obj_signup.origin = "GlobalSSO";
	        obj_signup.country = req.country;

            console.log("Function transformSingUpClientSSO sucess");
            return await genericRequest(obj_signup);
        }
        catch(err){
            console.error("Error in transformSingUpClientSSO: " + err.message);
            return null;
        }
    }
}

async function genericRequest (body) {
    const credentials = await AWSService.getSecretManager(process.env.SSO_CREDENTIALS);
    let headers = {};
    headers["x-sso-region"] = process.env.SSO_REGION;
    headers["x-sso-lang"] = process.env.SSO_LANG;
    headers["x-sso-comname"] = credentials["x-sso-comname"];
    headers.authorization = credentials.authorization;
    return request = {
        url: process.env.SSO_BASE_URL + process.env.SSO_RELATIVE_URL_SINGUP,
        method: "POST",
        data: body,
        headers: headers
    }
}

async function mapTermsAndCondifitons(terms){
    try{
        let terms_sso = [];
        terms_sso = terms.map(function(item) {
            let term = {};
            term[item.subplatform] = true;
            return term;
        });
        return terms_sso;
    }
    catch(e){
        console.error("Error in mapTermsAndCondifitons: " + err);
        return [];
    }
}
