'use strict';
const searchService= require('../../dao/search');
const insertService= require('../../dao/insert');
const updateService= require('../../dao/update');
const schemaValidator = require('../../validations/schemaValidator');
var fs = require('fs');
const headers = {
    "Access-Control-Allow-Origin": "*"
};
const generateToken = require('../../functions/generateToken');
const generateResponse = require("../../functions/generateResponse");
const registerOtp =  require('../../functions/registerOtp');
const encryptData =  require('../../functions/generateToken');

module.exports.action = async (event) => {
    let result;
    let objResponse;
    let apiCode = 100;
    let req;
    try {
        console.log('Event:' + JSON.stringify(event));
        if (event.headers === undefined) {
            req = event;
        } else {
            req = JSON.parse(event.body);
        }

        const constants = JSON.parse(fs.readFileSync('./resources/constants.json'));
        const schema = JSON.parse(fs.readFileSync('./resources/schemaExternalCampaignClient.json')).body;
        await schemaValidator.validateSchema(req, schema);
        result = await searchService.search(process.env.MONGODB_COLLECTION_CLIENTS, {user: req.user, platform: req.platform, program: req.program}, process.env.MONGODB_DATABASE_LOCAL);
        console.log("results: " + JSON.stringify(result));
        let message = "Client confirmed";
        if(!(result && result.length > 0)){
            console.warn('Client  not found');
            //Response
            objResponse = generateResponse.generic(404, 44, "Not Found", "Query without data",{registered_client: false, token: null}, undefined, 40001 );
            console.log("Response: " + JSON.stringify(objResponse));
            return objResponse;
        }   
        let token = await generateToken.action({ user: req.user });
        if(!token){
            //Response
            console.error('Error to generate token');
            objResponse = generateResponse.error(500, 51, "Success", "Error to generate token", 40001);
            console.error("Response: " + JSON.stringify(objResponse));
            return objResponse;
        };

        //insert user tokens
        await insertService.insert(process.env.MONGODB_COLLECTION_USER_TOKENS, {token: token, status: "active"}, process.env.MONGODB_DATABASE_GLOBAL);

        //generate token
        let otp = Math.round(Math.random() * (10 ** (process.env.LENGTH_CODE)));
        let code = otp.toString().length == 6 ? otp : otp * 10;
        let timestamp_sec = Math.floor(Date.now() / 1000);
        let params_otp = {
            to: result[0].email,
            otp: code.toString(),
            platform: req.platform,
            program: req.program,
            origin: req.origin,
            channel: "EMAIL",
            timestamp_sec: timestamp_sec
        };
        
        await registerOtp.register(params_otp);
        
       let token_enrollment = await encryptData.action({code: code.toString(), user: req.user});
            

        if(result[0].status_registration_campaign === constants.campaign_status_confirmed) {
            console.warn("Client  has been confirmed  " + req.campaign);
            //Response
            objResponse = generateResponse.generic(200, 101, "Success", "Client  has been confirmed with the campaign " + req.campaign,  {registered_client: true, registered_this_campaign: false, token_one_time: token, token: token_enrollment }, undefined );
            console.log("Response: " + JSON.stringify(objResponse));
            return objResponse;
        }   

        if(!(result[0].registration_campaign)) {
            console.warn('Client  not registered with a campaign');
            //Response
            objResponse = generateResponse.generic(200, 101, "Success", "Client  not registered from a campaign",{registered_client: true, registered_this_campaign: false, token_one_time: token, token: token_enrollment}, undefined );
            console.log("Response: " + JSON.stringify(objResponse));
            return objResponse;
        }   

        if(result[0].signup_campaign !== req.campaign) {
            console.warn("Client  not registered with the campaign " + req.campaign);
            //Response
            objResponse = generateResponse.generic(200, 101, "Success", "Client  not registered from the campaign " + req.campaign,  {registered_client: true, registered_this_campaign: false, token_one_time: token, token: token_enrollment}, undefined );
            console.log("Response: " + JSON.stringify(objResponse));
            return objResponse;
        }   

        //update client
        await updateService.updateData(process.env.MONGODB_COLLECTION_CLIENTS, {user: req.user, platform: req.platform, program: req.program}, {status_registration_campaign: constants.campaign_status_confirmed}, process.env.MONGODB_DATABASE_LOCAL);
        await updateService.updateData(process.env.MONGODB_COLLECTION_CLIENTS, {user: req.user, platform: req.platform, program: req.program}, {status_registration_campaign: constants.campaign_status_confirmed}, process.env.MONGODB_DATABASE_GLOBAL);

        //Response
        objResponse = generateResponse.generic(200, undefined, "Success", message,{registered_client: true, registered_this_campaign: true, token_one_time: token, token: token_enrollment}, undefined );
        console.log("Response: " + JSON.stringify(objResponse));
        return objResponse;
      
    } catch (e) {
        console.error('Error in confirm external campaign client controller: ' +  JSON.stringify(e));
        apiCode =  e.apiCode? e.apiCode : 51;
        let message =  e.message? e.message : "Internal Server Error";
        let statusCode = e.statusCode? e.statusCode : 500;
        let error = null;
        if(e.body && e.body.error)
            error = e.body.error;

        //Response
        console.error('Error to generate token');
        objResponse = generateResponse.error(statusCode, apiCode, message, error, 40001);
        console.error("Response: " + JSON.stringify(objResponse));
        return objResponse;
    }
};
