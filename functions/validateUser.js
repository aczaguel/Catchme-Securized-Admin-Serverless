module.exports = {
  validateUser: async function (event) {
    console.log("Function validateUser: ", JSON.stringify(event));
    //Validates that the user inside the request (body) is the same that the user that performs the request (path or header param)
    let result = true;
    let body_user;
    let req_body;
    if (event.headers) {
      req_body = JSON.parse(event.body);
    } else {
      req_body = event;
    }
    if (req_body.user) {
      body_user = req_body.user;
      console.log('body_user: ', body_user);
    }
    let header_user;

    //Search user field in in header
    if (event.headers && event.headers['user']) {
      header_user = event.headers['user'];
      console.log('param_header_user: ', header_user);

      //If users don't match should return 401 Unauthorized
      if (body_user !== header_user) {
        console.warn(`body_user ${body_user} is different than header_user ${header_user}`);
        result = false;
      }
      else{
        result = true;
        console.log('user authorization ok');
      }
    }
    else{
      result = true;
      console.log('server authorization');
    }

    console.log("Function validateUser success");
    return result;
  }
}
