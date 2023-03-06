const AWS = require('aws-sdk');
AWS.config.update({ region: process.env.DEPLOY_AWS_REGION});
const conn = require("../configurations/connection");
const MongoClient = require('mongodb').MongoClient;

module.exports = {
    insert: async (collection, elements, database) => {
        console.log("Inserting document: " + JSON.stringify(elements));
        console.log("Inserting in colection: " +  collection);
        let connection = await conn(database);
        console.log("Inserting in database: " +  connection.database);
        if(connection === null){
            console.error("Database credentials not found");
            throw { apiCode: 51, message: "Database credentials not found"};
        }
        connection.collection = collection;
        console.log("Inserting data in tableName " + collection);

        return new Promise((resolve, reject) => {
            return MongoClient.connect(connection.uri, connection.params,
              async function (err, client) {
                  if (err) {
                      console.error("Error in database connetion");
                      reject({ apiCode: 50, message: "Error in database connetion"});
                  }
                  elements.create_date = new Date().toLocaleString("es-ES", { timeZone: "America/Mexico_City" });
                  return client.db(connection.database).collection(collection).insertOne(elements, function (ierr, result) {
                      client.close();
                      if (ierr) {
                          console.error("Error in insert data: ");
                          console.error(ierr);
                          reject({ apiCode: 50, message: "Error in insert data"});
                      }
                      console.log("result mongo: " + JSON.stringify(result));
                      if (result.insertedCount === 1) {
                          console.log("Insert Success");

                          resolve(result.ops[0]);
                      } else {
                          reject({ apiCode: 50, message: "Error in insert data"});
                      }
                  });

              });
        });
    }
}
