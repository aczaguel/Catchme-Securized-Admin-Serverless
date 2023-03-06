module.exports = {
    mapClientTiers: async (tiers) => {
        console.log('tiers: ', tiers);
        try{
            console.log("Function mapClientTiers");
            let obj_tiers = {};
            obj_tiers.tiers = {};
            obj_tiers.tiers.actual_tier = tiers.tier_details.tier_levels[0].tier_overview.name;
            obj_tiers.tiers.actual_points_tier = tiers.tier_points;
            obj_tiers.tiers.next_tier = tiers.tier_details.tier_levels[0].next_tier_overview? tiers.tier_details.tier_levels[0].next_tier_overview.name: "";
            obj_tiers.tiers.next_points_tier = tiers.next_tier_points;//tiers.tier_progress[0].rules[0].query_result;
            obj_tiers.actual_points = tiers.available_points;
            console.log("Function mapClientTiers success");
            return obj_tiers;
        }
        catch(err){
            console.error("Error in mapClientTiers: " + err.message);
            return null;
        }
    }
}
