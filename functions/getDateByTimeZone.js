module.exports = async (time_zone, time) => {
    try{
      console.log("Function getDateByTimeZone");
      let datetime = {};  
      datetime.timestamp = new Date(Date().toLocaleString({ timeZone: time_zone }));
      console.log("datetime new: " + JSON.stringify(datetime));
      datetime.timestamp = (datetime.timestamp.getTime()/1000) - time;
      console.log("datetime - time: " + JSON.stringify(datetime));
      datetime.date = new Date (datetime.timestamp * 1000).toLocaleString("es-ES", { timeZone: time_zone });
      console.log("datetime es-ES: " + JSON.stringify(datetime));
      console.log("Function getDateByTimeZone sucess");
      return datetime;
    }
    catch(err){
        console.error("Error in getDateByTimeZone: " + err.message);
        throw { apiCode: 51, message: "Error in getDateByTimeZone function"};
    }
};
