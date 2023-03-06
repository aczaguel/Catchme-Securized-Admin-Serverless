const insertService = require('../dao/insert');

module.exports = async (accounts, user) => {
    try{
        console.log("Function saveAccounts");
        let item = 0;
        let array_accounts = [];
        let document_account = {};
        document_account.user_id = user.id; 
        document_account.external_id = user.external_id;
        document_account.referrer_code = user.referrer_code;
        for(let account of accounts){
            item ++;
            let obj_account = {};
            if(account.point_sources && account.point_sources.length > 0){
                obj_account.retailer_id = account.retailer_id;
                obj_account.name = account.name;
                obj_account.user_id = user.id; 
                obj_account.point_source_id = account.point_sources[0].id;
                obj_account.point_account_id = account.expiration_policy.point_account_id;
                obj_account.default = false;
                if(item === 1)
                    obj_account.default = true;
                
                array_accounts.push(obj_account);
            }
            
        }
        document_account.accounts = array_accounts;

        console.log("Insert in: " + process.env.MONGODB_COLLECTION_CLIENT_ACCOUNTS + " with data: " + JSON.stringify(document_account));
        await insertService.insert(process.env.MONGODB_COLLECTION_CLIENT_ACCOUNTS, document_account, process.env.MONGODB_DATABASE_LOCAL);
       
        console.log("Function saveAccounts sucess");
    }
    catch(err){
        console.error("Error in saveAccounts: " + err.message);
    }
};
