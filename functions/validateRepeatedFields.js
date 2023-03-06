
module.exports  = {
    validateRepeatedFields: async (fields) => {
        console.log('fields: ', JSON.stringify(fields));
        try{
            console.log("Function validateRepeatedFields");
            
            let result_repeated = fields.filter((item,index) => {
                return index !== fields.findIndex(obj => {
                    return JSON.stringify(obj.field_name) === JSON.stringify(item.field_name);
                });
            });
          
            if(result_repeated.length > 0)
                throw { error: true, apiCode: 40, message: "One or more elements have the same field_name"};
                
            console.log("Function validateRepeatedFields sucess");
            return true;
        }
        catch(err){
            console.error("Error in validateRepeatedFields: " + err.message);
            return err;
        }
    }
}

