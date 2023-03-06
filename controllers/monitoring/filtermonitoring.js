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
    const enterpriseId = body.enterpriseId
    const catchmetoken = body.catchmetoken;
    const mindate = body.mindate;
    const maxdate = body.maxdate;
	  let response = {};
    getPointCatchmetoken(enterpriseId, catchmetoken, mindate, maxdate).then(filtermonitoring => {
        response = {
          "statusCode": 200,
          headers: headers,
          "body": JSON.stringify({ "status": "success", "data": filtermonitoring })
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
 
const getPointCatchmetoken = (enterpriseId, catchmetoken, mindate, maxdate) => {
  try{
    return database.raw(`select c.catchmetoken, cm.created_at as createdAt, cm.id, 
      cm.latitude, cm.longitude
      from catchmeusers c 
      inner join catchmeuser_monitoring cm on cm.catchmetoken = c.catchmetoken 
      inner join rel_enterprise_catchmeuser rec on rec.catchmetoken = c.catchmetoken 
      where rec.enterprise_id = ?
      and c.catchmetoken = ?
      and cm.created_at between ? and ?
      order by cm.created_at asc`, [enterpriseId, catchmetoken, mindate, maxdate])
    .then((data) => data.rows).catch((err) => {
      console.log("err >>> ", err);})
  }catch(err){
    console.log("err > ", err);
  }
}