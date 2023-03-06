var AWS = require('aws-sdk');
AWS.config.update({ region: process.env.DEPLOY_AWS_REGION});
const fs = require('fs');
const headers = {
    "Access-Control-Allow-Origin": "*"
};
const termsAndConditionsService = require ('../../functions/mapTermsAndConditions');

exports.client = async function (event) {
    console.log('Event:', event);
    let req;
    let objResponse;
    try {
        if (event.headers === undefined) {
            req = event;
        } else {
            req = JSON.parse(event.body);
        }
        const constants = JSON.parse(fs.readFileSync('./resources/constants.json'));
        console.log('Body: ' + JSON.stringify(req));
 
        //create array of terms and conditions
        if(req.termsAndConditions)
            req.termsAndConditions = await termsAndConditionsService
              .mapAndValidateTermAndConditionsInBD(req.termsAndConditions);

        

        //Create Message in SQS
        let now_timestamp = new Date(Date().toLocaleString({ timeZone: "America/Mexico_City" }));
            now_timestamp = now_timestamp.getTime();
        let body_sqs= {
            agent: req.origin, 
            user: req.email, 
            origin: req.origin, 
            platform: req.platform, 
            program: req.program,
            timestamp: now_timestamp, 
            event_name: "sign_up_" + req.origin, 
            data: req,
            agent: req.agent,
            context:{
                origin: req.origin, 
                platform: req.platform, 
                program: req.program,
                timestamp: now_timestamp, 
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

        //Create Client in EPSILON

        //Create Client in SFMC

        //Create Client in ArrowHead

        //Create Client in CDP
     
        objResponse = {
            status: "Created",
            statusCode: 201,
            message: "Successful operation"
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
        console.error("An error occurred in create: " + e);
        let objResponse = {
            statusCode: 500,
            message: "Error in create client",
            messageCode: 40001,
            error: e.message
        };
        let error = e.body || objResponse;
        return {
            statusCode: e.statusCode || 500,
            headers: headers,
            body: JSON.stringify(error)
        };
    }
};
