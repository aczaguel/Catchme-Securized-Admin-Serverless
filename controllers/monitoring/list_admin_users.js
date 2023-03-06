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
    getAdminusersEnterpriseId(enterpriseId).then(catchmeusers => {
        console.log("catchmeusers > ", catchmeusers);
        response = {
          "statusCode": 200,
          headers: headers,
          "body": JSON.stringify({ "status": "success", "data": catchmeusers })
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
 
const getAdminusersEnterpriseId = (enterpriseId) => {
    try{
        console.log("enterpriseId > ", enterpriseId);
      return database.raw('select * from adminusers a ' +
      'where a.enterprise_id = ?', [enterpriseId])
      .then((data) => data.rows).catch((err) => {
        console.log("err >>> ", err);})
    }catch(err){
      console.log("err > ", err);
    }
  }