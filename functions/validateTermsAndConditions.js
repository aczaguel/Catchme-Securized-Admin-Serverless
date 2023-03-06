const searchService = require('../dao/search');

module.exports  = {
    validateTermsAndConditions: async (fields) => {
        try{
            console.log("Function validateTermsAndConditions");
            for(let field of fields)
            {
                let result_terms_and_conditions = await searchService.search(process.env.MONGODB_COLLECTION_TERMS_AND_CONDITIONS, {platform: field.platform, subplatform: field.subplatform},process.env.MONGODB_DATABASE_GLOBAL);
                if(!(result_terms_and_conditions && result_terms_and_conditions.length > 0))
                    throw { error: true, apiCode: 40, message: "Not found terms and conditions for this platform and program"};
            }
            console.log("Function validateTermsAndConditions sucess");
            return true;
        }
        catch(err){
            console.error("Error in validateTermsAndConditions: " + err.message);
            return err;
        }
    }
}
