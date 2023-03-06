const searchService = require('../dao/search');

module.exports = {
    mapAndValidateTermAndConditionsInBD: async (terms) => {
        console.log('terms: ', JSON.stringify(terms));
        try{
            console.log("Function mapTermsAndConditions");
            let result_terms = [];
            if (!Array.isArray(terms)){
                let params_terms = {
                    platform: terms.platform,
                    subplatform: terms.subplatform? terms.subplatform : terms.platform
                };
                let result_search = await searchService.search(process.env.MONGODB_COLLECTION_TERMS_AND_CONDITIONS, params_terms, process.env.MONGODB_DATABASE_GLOBAL);
                console.log('result_search: ', result_search);

                if(result_search && result_search.length > 0){
                    result_search = result_search[0];
                    let obj_term = {
                        platform: result_search.platform,
                        subplatform: result_search.subplatform,
                        url: result_search.url,
                        status: true,
                        date: new Date().toLocaleString("es-ES", { timeZone: "America/Mexico_City" })
                    }
                    result_terms.push(obj_term);
                }
                else{
                    throw { status:"Error", statusCode:400, apiCode: 40, message: "Terms and Conditions not found"};
                }
            }
            else if(terms.length > 0){
                let termsArray = [];
                for(let item of terms){
                    let params_terms = {
                        platform: item.platform,
                        subplatform: item.subplatform? item.subplatform : item.platform
                    };
                    let result_search = await searchService.search(process.env.MONGODB_COLLECTION_TERMS_AND_CONDITIONS, params_terms, process.env.MONGODB_DATABASE_GLOBAL);
                    if(result_search && result_search.length > 0){
                        result_search = result_search[0];
                        item.subplatform = result_search.subplatform;
                        item.url = result_search.url;
                        item.status = true;
                        item.date = new Date().toLocaleString("es-ES", { timeZone: "America/Mexico_City" });
                        termsArray.push(item);
                    }
                }
                result_terms = termsArray;
            }
            console.log("Function mapTermsAndConditions sucess");
            return result_terms;
        }
        catch(err){
            console.error("Error in mapTermsAndConditions: " + err.message);
            if(!err.apiCode)
                throw { apiCode: 51, message: "Error in getDateByTimeZone function"};
            else
                throw err;
        }
    }
}
