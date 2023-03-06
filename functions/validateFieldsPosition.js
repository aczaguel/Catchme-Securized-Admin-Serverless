
module.exports  = {
    validateFieldsPosition: async (schema) => {
        console.log('schema: ', schema);
        try{
            console.log("Function validateFieldsPosition");
            let fields = schema.map(function(item) {
                let obj_position = {
                    positionV: item.position_V,
                    positionH: item.position_H
                }
                return obj_position;
            });
            //sort by positionV and positionH
            let fields_sorted = fields.sort(
              function(a, b) {
                  if (a.positionV === b.positionV) {
                      return a.positionH - b.positionH;
                  }
                  return a.positionV > b.positionV ? 1 : -1;
              });

            //validate repeated position
            let result_repeated = fields_sorted.filter((item,index) => {
                return index !== fields_sorted.findIndex(obj => {
                    return JSON.stringify(obj) === JSON.stringify(item);
                });
            });

            if(result_repeated.length > 0)
                throw { error: true, apiCode: 40, message: "One or more elements have the same position"};
            console.log("Function validateFieldsPosition sucess");
            return true;
        }
        catch(err){
            console.error("Error in validateFieldsPosition: " + err.message);
            return err;
        }
    }
}
