const AWS = require('aws-sdk');
AWS.config.update({ region: process.env.DEPLOY_AWS_REGION});

module.exports = {
  getSecretManager: async (secret_id) => {
    const secretsService = new AWS.SecretsManager();
    try{
      console.log("Function getSecretManager: ", secret_id);
      let secret = await secretsService.getSecretValue({ SecretId: secret_id }).promise();
      let secretString = JSON.parse(secret.SecretString);
      console.log("Function getSecretManager sucess");

      return secretString;
    }
    catch(err){
      console.error("Error in getSecretManager: " + err.message);
      return null;
    }
  }
}
