var AWS = require('aws-sdk');

module.exports = {
  invokeLambda: async (funcion, payload, inv_type) => {
    const lambda = new AWS.Lambda();
    let error = false;
    var params = {
      FunctionName: funcion, // the lambda function we are going to invoke
      InvocationType: inv_type,
      LogType: "Tail",//Tail or Event
      Payload: JSON.stringify(payload)
    };
    console.log('Invoke Lambda ' + funcion + ' with parameters: ' + JSON.stringify(params));
    let result = await lambda.invoke(params).promise().then((data) => {
      let response;
      if(data.StatusCode !== 202)
        response = JSON.parse(data.Payload);
      else
        response = data;
      console.log('Response Lambda: '  + JSON.stringify(response));
      return response;
    }).catch(function (reason) {
      console.log("Error in invoke lambda: ", reason);
      error = true;
      return reason;
    });

    if (error) {
      return Promise.reject(result);
    } else {
      return Promise.resolve(result);
    }
  }
}
