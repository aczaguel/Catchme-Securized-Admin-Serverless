const AWS = require('aws-sdk');
AWS.config.update({ region: process.env.DEPLOY_AWS_REGION});
const conn = require("../configurations/connection");
const MongoClient = require('mongodb').MongoClient;

module.exports = {
  deleteClient: async (collection, filter, database) => {
    console.log("Deleting document with filters: " + JSON.stringify(filter));
    console.log("Deleting in colection: " +  collection);

    let connection = await conn(database);
    console.log("Deleting in database: " +  connection.database);
    if(connection === null){
      console.error("Database credentials not found");
      throw { apiCode: 51, message: "Database credentials not found"};
    }

    connection.collection = collection;
    console.log("Deleting data in " + collection);
    console.log('connection: ', connection);

    return new Promise((resolve, reject) => {
      return MongoClient.connect(connection.uri, connection.params,
        async function (err, client) {
          if (err) {
            console.error("Error in database connection: ", err);
            return reject({ apiCode: 50, message: "Error in database connection"});

          }
          return client.db(connection.database).collection(collection)
            .deleteOne(filter).then(result=>{
              client.close();
              return resolve(result);
            }).catch(derr=>{
              console.error("Error in delete data: " + JSON.stringify(result));
              client.close();
              return reject({ apiCode: 50, message: "Error in delete data"});
            });
        });
    });
  }
}
