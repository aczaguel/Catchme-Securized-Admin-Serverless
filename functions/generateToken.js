
var jwt = require('jsonwebtoken');
const fs = require('fs');

module.exports = {
  action :async (obj_to_encrypt) => {
    try{
      const constants = JSON.parse(fs.readFileSync('./resources/constants.json'));
      console.log("generateToken: ", JSON.stringify(obj_to_encrypt));
      
      let obj_encrypt = jwt.sign(obj_to_encrypt, constants.text_promo, {
        expiresIn: "30d"
    })
      console.log("generateToken ok");

      return obj_encrypt;
    }
    catch(err){
        console.log("Error in generateToken: " + err.message);
        return null;
    }
  }
}