const insertData = require('../dao/insert');
const searchData = require('../dao/search');
const updateData = require('../dao/update');

module.exports = {
    register: async (req) => {
        try {
            console.log("Function registerOtp");
            let params_otp = {
                to: req.to,
                program: req.program,
                platform: req.platform
            }
            let mongo_otp = await searchData.search(process.env.MONGODB_COLLECTION_OTP, params_otp, process.env.MONGODB_DATABASE_GLOBAL);
            if (!(mongo_otp && mongo_otp.length > 0)) {
                await insertData.insert(process.env.MONGODB_COLLECTION_OTP, req, process.env.MONGODB_DATABASE_GLOBAL);
            }
            else {
                let params_filter_otp = {
                    to: req.to,
                    program: req.program,
                    platform: req.platform
                }
                await updateData.updateData(process.env.MONGODB_COLLECTION_OTP, params_filter_otp, req, process.env.MONGODB_DATABASE_GLOBAL);
            }
            console.log("Function registerOtp success");
            return true;
        }
        catch (err) {
            console.error("Error in registerOtp: " + err.message);
            return { status: "Error", apicode: 51, message: "Error in registerOtp: " + err.message };
        }
    }
}

