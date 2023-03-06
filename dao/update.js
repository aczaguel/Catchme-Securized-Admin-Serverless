const AWS = require('aws-sdk');
AWS.config.update({ region: process.env.DEPLOY_AWS_REGION});
const conn = require("../configurations/connection");
const MongoClient = require('mongodb').MongoClient;

module.exports = {
  updateData: async (collection, filter, elements, database) => {
    console.log("Updating data: " + JSON.stringify(elements));
    console.log("Updating with filters: " + JSON.stringify(filter));
    console.log("Updating in colection: " +  collection);

    let connection = await conn(database);
    console.log("Updating in database: " +  connection.database);
    if(connection === null){
      console.error("Database credentials not found");
      throw { apiCode: 51, message: "Database credentials not found"};
    }
    connection.collection = collection;
    console.log("Updating data into " + collection);

    return new Promise((resolve, reject) => {
      return MongoClient.connect(connection.uri, connection.params,
        async function (err, client) {
          if (err) {
            console.error("Error in database connection");
            return reject({ apiCode: 50, message: "Error in database connection"});

          }
          elements.last_update_date = new Date().toLocaleString("es-ES", { timeZone: "America/Mexico_City" });
          return client.db(connection.database).collection(collection)
            .findOneAndUpdate(filter,{$set:elements}, { returnNewDocument: true, upsert:false}).then(result=>{
              if(result.value != null && result.value != undefined){
                console.log("Update Success");
                let resvalue = result.value;
                client.close();
                resolve(resvalue);
              }else{
                console.error("Error in update data: " + JSON.stringify(result));
                client.close();
                reject({ apiCode: 50, message: "Error in update data"});
              }
            })


        });
    });
  }
}
