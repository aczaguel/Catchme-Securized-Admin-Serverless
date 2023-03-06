const searchService = require('../dao/search');

module.exports = {
    retrieveStateByZipcode: async (zipcode) => {
        try{
            console.log("Function retrieveStateByZipcode");
            let ubication ={} ;
            let result_zipcodes = await searchService.search(process.env.MONGODB_COLLECTION_ZIPCODES, { zipcode: zipcode } , process.env.MONGODB_DATABASE_LOCAL);
            if(result_zipcodes && result_zipcodes.length > 0){
                result_zipcodes = result_zipcodes[0];
                ubication.city = result_zipcodes.city;
                ubication.state = result_zipcodes.state;
                console.log("Function retrieveStateByZipcode sucess");
                return ubication;
            }
            else{
                console.log("Function retrieveStateByZipcode notfound");
                return null;
            }
        }
        catch(err){
            console.error("An error occurred in retrieveStateByZipcode: " + err.message);
            return null;
        }
    }
}
