'use strict';
const AWS = require('aws-sdk');

const environment     = process.env.NODE_ENV || 'development';    // set environment
const configuration   = require('../knexfile')[environment];   // pull in correct db with env configs 
const database        = require('knex')(configuration);           // define database based on above
const headers = {
    "Access-Control-Allow-Origin": "*"
  }

module.exports.index = (event, context, callback) => {
	context.callbackWaitsForEmptyEventLoop = false;
    let body;
    if(!event.body.enterpriseId){
      body = JSON.parse(event.body);
    }else{
      body = event.body;
    } 
    console.log("body > ", body);
    let enterpriseId = body.enterpriseId;
	let response = {};
    getServicesEnterpriseId(enterpriseId).then(services => {
        response = {
          "statusCode": 200,
          headers: headers,
          "body": JSON.stringify({ "status": "success", "data": services })
        };
        callback(null, response);
    }).catch((err) => {
        console.log("err >>> ", err);
        response = {
          "statusCode": 400,
          headers: headers,
          "body": JSON.stringify({"status": "error", "data": err })
        };
        callback(null, response);
    });
};
 
const getServicesEnterpriseId = (enterpriseId) => {
    try{
      return database.raw(`select s.id service_id,s.created_at, s.srv_status_id, 
      s.srv_type_id, s.catchmeuser, sd.*, 
      c.catchmetoken, c.display_name, c.email, c.photourl,
      st."type" , st.description type_description, ss.status, 
      ss.description status_description, ss.color, ss.colorhex 
      from services s 
      inner join service_detail sd on s.srv_details_id = sd.id
      inner join catchmeusers c on c.catchmetoken = s.catchmeuser 
      inner join service_type st on s.srv_type_id = st.id 
      inner join service_status ss on s.srv_status_id = ss.id
      where s.enterprise_id = ?`, [enterpriseId])
      .then((data) => data.rows).catch((err) => {
        console.log("err >>> ", err);})
    }catch(err){
      console.log("err > ", err);
    }
  }