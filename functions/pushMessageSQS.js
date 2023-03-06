const AWS = require("aws-sdk");
AWS.config.update({ region: process.env.DEPLOY_AWS_REGION});

module.exports = {
    push: async (messageBody, queueUrl, eventName) => {
        const params_sqs = {
            MessageBody: JSON.stringify(messageBody),
            QueueUrl: queueUrl,
            MessageGroupId: eventName,
        };

        console.log("Send message to SQS: " + JSON.stringify(params_sqs));
        const response = await new AWS.SQS({ region: process.env.DEPLOY_AWS_REGION}).sendMessage(params_sqs).promise();
        console.log("Response from SQS: ", response);
    },
};
