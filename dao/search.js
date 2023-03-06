const AWS = require('aws-sdk');
AWS.config.update({ region: process.env.DEPLOY_AWS_REGION});
const conn = require("../configurations/connection");
const MongoClient = require('mongodb').MongoClient;

module.exports = {
    search: async (collection, filter, database, projection) => {
        console.log("Searching document with filers: " + JSON.stringify(filter));
        console.log("Searching in colection: " +  collection);
        console.log("Searching with projection: " +  JSON.stringify(projection));
        let connection = await conn(database);
        console.log("Searching in database: " +  connection.database);
        if(connection === null){
            console.error("Database credentials not found");
            throw { apiCode: 51, message: "Database credentials not found"};
        }
        connection.collection = collection;
        console.log("Getting data from " + collection);
        projection = projection? projection : {};
        return new Promise((resolve, reject) => {
            return MongoClient.connect(connection.uri, connection.params,
              async function (err, client) {
                  if (err) {
                      client.close();
                      console.error("Error in database connection");
                      return reject({ apiCode: 50, message: "Error in database connection"});
                  }
                  const cursor = await client.db(connection.database).collection(collection)
                    .find(filter, projection).sort({ name: -1 });
                  const results = await cursor.toArray();
                  console.log(results);
                  client.close();
                  return resolve(results);
              });
        });
    }
}
