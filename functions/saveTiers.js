const insertService = require('../dao/insert');

module.exports = async (tiers, user) => {
    try{
        console.log("Function saveTiers");
        let array_tiers = [];
        let document_tier = {};
        document_tier.user_id = user.id; 
        document_tier.external_id = user.external_id;
        for(let tier of tiers){
            let obj_tier = {};
            obj_tier.retailer_id = tier.retailer_id
            obj_tier.tier_system_id = tier.tier_system_id;
            obj_tier.tier_level_id = tier.id;
            obj_tier.name = tier.name;
            obj_tier.rank = tier.rank;
            obj_tier.status = tier.status;
            array_tiers.push(obj_tier);
        }
        document_tier.tiers = array_tiers;

        console.log("Insert in: " + process.env.MONGODB_COLLECTION_CLIENT_TIERS + " with data: " + JSON.stringify(document_tier));
        await insertService.insert(process.env.MONGODB_COLLECTION_CLIENT_TIERS, document_tier, process.env.MONGODB_DATABASE_LOCAL);
       
        console.log("Function saveTiers sucess");
    }
    catch(err){
        console.error("Error in saveTiers: " + err.message);
    }
};
