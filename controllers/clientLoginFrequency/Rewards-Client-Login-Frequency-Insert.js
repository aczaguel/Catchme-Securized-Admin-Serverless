var AWS = require('aws-sdk');
AWS.config.update({ region: process.env.DEPLOY_AWS_REGION});
const fs = require('fs');
const schemaService = require('../../validations/schemaValidator');
const headers = {
    "Access-Control-Allow-Origin": "*"
};
const insertService = require('../../dao/insert');
const getDateByTimeZone = require('../../functions/getDateByTimeZone');
const lambdaService = require("../../services/invokeLambda");

exports.client = async function (event) {
    
    let req;
    let objResponse;
    let apicode = 105;
    try {
        console.log('Event: ', event);
        if (event.headers === undefined) {
            req = event;
        } else {
            req = JSON.parse(event.body);
        }
        const constants = JSON.parse(fs.readFileSync('./resources/constants.json'));
        console.log('Body: ' + JSON.stringify(req));
        //Schema Validator
        const schema = JSON.parse(fs.readFileSync('./resources/schemaClientLoginFrequency.json')).insert;
        await schemaService.validateSchema(req, schema);

        if (event.headers && !event.headers.key) {
            const {user} = await lambdaService.invokeLambda(process.env.LAMBDA_FUNCTION_SECURITY_VALIDATE_USER, {headers: event.headers}, 'RequestResponse');
            console.log(`get email user with lambda function invoke: ${user}`);
            req.user = user;
        }

        let object_insert_login = {};
        let date_start = await getDateByTimeZone(req.time_zone, req.time);
        let date_finish = await getDateByTimeZone(req.time_zone, 0);
        object_insert_login.time_login = req.time;
        object_insert_login.start_login_timestamp = date_start.timestamp;
        object_insert_login.finish_login_timestamp = date_finish.timestamp;
        object_insert_login.start_login = date_start.date;
        object_insert_login.finish_login = date_finish.date;
        object_insert_login.platform = req.platform;
        object_insert_login.user = req.user;
        object_insert_login.origin = req.origin;
        object_insert_login.agent = req.agent;
        object_insert_login.program = req.program;

        //insert login 
        console.log("Insert in " + process.env.MONGODB_COLLECTION_LOGIN_FREQUENCY + " with data: " + JSON.stringify(object_insert_login));
        let data = await insertService.insert(process.env.MONGODB_COLLECTION_LOGIN_FREQUENCY, object_insert_login, process.env.MONGODB_DATABASE_GLOBAL, constants.projection_login_frequency);
        
        let now_timestamp = new Date(Date().toLocaleString({ timeZone: "America/Mexico_City" }));
            now_timestamp = now_timestamp.getTime();
        let body_sqs= {
            agent: req.agent,
            user: req.user, 
            origin: req.origin, 
            agent: req.agent, 
            data: req, 
            platform: req.platform, 
            program: req.program,
            timestamp: now_timestamp, 
            event_name: "sign_in_" + req.origin,
            context:{
                origin: req.origin, 
                platform: req.platform, 
                program: req.program,
                timestamp: now_timestamp, 
                time_zone: req.time_zone
            }
        };
        let params_sqs = {
            MessageBody: JSON.stringify(body_sqs),
            QueueUrl: process.env.SQS_EVENTS_REWARDS_ENGINE,
            MessageGroupId: body_sqs.event_name
        };

        console.log("Send message to SQS: " + JSON.stringify(params_sqs));
        await new AWS.SQS({ 
            region: process.env.DEPLOY_AWS_REGION
        }).sendMessage(params_sqs).promise();

        objResponse = {
            status: "Success",
            statusCode: 201,
            apicode: apicode,
            message: "Login frequency created",
            data: data
        };
        console.log('Result: ' + JSON.stringify({
            statusCode: 201,
            headers: headers,
            body: objResponse
        }));
        return {
            statusCode: 201,
            headers: headers,
            body: JSON.stringify(objResponse)
        };

    } catch (e) {
        console.log('Error in insert login frequency controller: ' +  JSON.stringify(e));
        apiCode =  e.apiCode? e.apiCode : 51;
        let message =  e.message? e.message : "Internal Server Error";
        let statusCode = e.statusCode? e.statusCode : 500;
        let status = e.status? e.status : "Error";
        objResponse = {
            statusCode: statusCode,
            status: status,
            message: message,
            apicode : apiCode
        };
        if(e.body && e.body.error)
            objResponse.error = e.body.error;
        return {
            statusCode: e.statusCode || 500,
            headers: headers,
            body: JSON.stringify(objResponse)
        };
    }
};
