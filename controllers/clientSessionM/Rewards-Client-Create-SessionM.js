var AWS = require('aws-sdk');
AWS.config.update({ region: process.env.DEPLOY_AWS_REGION});
const transformCustomer = require('../../functions/dataTransformCreateCustomerSessionM');
const transformFetchAccounts = require('../../functions/dataTransformFetchAccountsSessionM');
const transformFetchTiers = require('../../functions/dataTransformFetchTiersSessionM');
const transformCustomProfile = require('../../functions/dataTransformCreateCustomProfileAttributesSessionM');
const transformUserCustomProfile = require('../../functions/dataTransformSearchCustomerProfileSessionM');
const saveAccounts = require("../../functions/saveAccounts");
const saveTiers = require("../../functions/saveTiers");
const APIService = require('../../services/consumeAPI');
const insertService = require('../../dao/insert');
const updateService = require('../../dao/update');
const searchService = require('../../dao/search');
var ObjectId = require('mongodb').ObjectID;
const fs = require('fs');

exports.client = async function (event) {
    let req;
    let objResponse;
    try {
        console.log('Event: ' + JSON.stringify(event));
        if (event.headers === undefined) {
            req = event;
        } else {
            req = JSON.parse(event.body);
        }
        console.log('Req: ' + JSON.stringify(req));
        const constants = JSON.parse(fs.readFileSync('./resources/constants.json'));
        let search_client = await searchService.search(process.env.MONGODB_COLLECTION_CLIENTS, { email: req.email, platform: req.platform, program: req.program }, process.env.MONGODB_DATABASE_LOCAL);
        let client_id = search_client[0]._id.toString();
        
        let request_customer = await transformCustomer(req, client_id);
        let api_response = await APIService.consumeAPI(request_customer);
        if(api_response.statusCode !== 200) {
            console.error('Error in create client in rewards engine');
            let now_timestamp = new Date(Date().toLocaleString({ timeZone: "America/Mexico_City" }));
            now_timestamp = now_timestamp.getTime()/1000;
            let params_error={
                body: req,
                status: "retrying",
                function: process.env.LAMBDA_FUNCTION_CREATE_CLIENT_ENGINE,
                error: api_response.body.errors,
                retry: req.retry ? (req.retry + 1) : 1,
                timestamp: now_timestamp
            };
            if(req.id_error){
                let objectId = {
                    "_id" : ObjectId(req.id_error)
                };
                console.log("Update in " + process.env.MONGODB_COLLECTION_ERROR + " with filter: " + JSON.stringify(objectId) + " and data: " + JSON.stringify(params_error));
                await updateService.updateData(process.env.MONGODB_COLLECTION_ERROR, objectId, {retry: params_error.retry, timestamp: params_error.timestamp}, process.env.MONGODB_DATABASE_GLOBAL);
            }
            else{
                console.log("Insert in " + process.env.MONGODB_COLLECTION_ERROR + " with data: " + JSON.stringify(params_error));
                await insertService.insert(process.env.MONGODB_COLLECTION_ERROR, params_error, process.env.MONGODB_DATABASE_GLOBAL);
            }
        }

        let request_custom_profile = await transformCustomProfile(req, api_response.body.user.id, "POST");
        await APIService.consumeAPI(request_custom_profile);

        let request_custom_user_profile = await transformUserCustomProfile(api_response);
        let user_profile = await APIService.consumeAPI(request_custom_user_profile);
        
        let request_fetch_accounts = await transformFetchAccounts(user_profile.body.user.tier_details.point_account_balances);
        let api_response_accounts = await APIService.consumeAPI(request_fetch_accounts);
        await  saveAccounts(api_response_accounts.body.payload.results, api_response.body.user);

        if(user_profile.body.user.tier_details.tier_levels && user_profile.body.user.tier_details.tier_levels.length > 0){
            let request_fetch_tiers = await transformFetchTiers(user_profile.body.user.tier_details.tier_levels[0].tier_overview);
            let api_response_tiers = await APIService.consumeAPI(request_fetch_tiers);
            await  saveTiers(api_response_tiers.body.payload.tier_system.tier_levels, api_response.body.user);
        }

        console.log("Update in " + process.env.MONGODB_COLLECTION_CLIENTS + " with filter: " + JSON.stringify({ email: req.email, platform: req.platform, program: req.program }) + " and data: " + JSON.stringify({ user_id_sessionm: api_response.body.user.id, referrer_code: api_response.body.user.referrer_code }) + ", DataBase: " + process.env.MONGODB_DATABASE_LOCAL);
        await updateService.updateData(process.env.MONGODB_COLLECTION_CLIENTS, { email: req.email, platform: req.platform, program: req.program }, { user_id_sessionm: api_response.body.user.id, referrer_code: api_response.body.user.referrer_code }, process.env.MONGODB_DATABASE_LOCAL);

        console.log("Update in " + process.env.MONGODB_COLLECTION_CLIENTS + " with filter: " + JSON.stringify({ email: req.email, platform: req.platform, program: req.program }) + " and data: " + JSON.stringify({ user_id_sessionm: api_response.body.user.id, referrer_code: api_response.body.user.referrer_code }) + ", DataBase: " + process.env.MONGODB_DATABASE_GLOBAL);
        await updateService.updateData(process.env.MONGODB_COLLECTION_CLIENTS, { email: req.email, platform: req.platform, program: req.program }, { user_id_sessionm: api_response.body.user.id, referrer_code: api_response.body.user.referrer_code }, process.env.MONGODB_DATABASE_GLOBAL);

        objResponse = {
            status: "Created",
            statusCode: 201,
            message: "Successful operation"
        };
        console.log('Result: ' + JSON.stringify({
            statusCode: 201,
            body: objResponse
        }));
        return {
            statusCode: 201,
            body: JSON.stringify(objResponse)
        };

    } catch (e) {
        console.error("Error in create customer in rewards engine: " + e.message);
        let objResponse = {
            statusCode: 500,
            message: "Error in create customer in rewards engine",
            error: e.message,
            messageCode: 40001
        };
        let error = e.body || objResponse;
        return {
            statusCode: e.statusCode || 500,
            body: JSON.stringify(error)
        };
    }
};
