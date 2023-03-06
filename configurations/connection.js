const getSecretManager =  require('../functions/getSecretManager');
const replaceParameters =  require('../functions/replaceParameters');
 

module.exports =  async (database) =>{
    try{
        console.log("connection");
        const connection_data = await getSecretManager.getSecretManager(database);
        
        let params = [];
        
        params.push(connection_data.user);
        params.push(connection_data.password);
        params.push(connection_data.cluster);
        params.push(connection_data.database);
        const uri = await replaceParameters(process.env.MONGODB_URI, params);

        let connection = {
            uri: uri,
            database: connection_data.database,
            params: {
                useUnifiedTopology: true,
                useNewUrlParser: true
            }
        };
        console.log("connection ok");
        return connection;
    }
    catch(err){
        console.log("Error in connection: " + err.message);
        return null;
    }
};

