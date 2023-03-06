module.exports = {
  getDayLastLogin: async (logins, time_zone) => {
    console.log('logins, time_zone: ', logins, time_zone);
    try{
      console.log("Function getDayLastLogin");
      let last_date = logins.reduce(function(prev, current) {
        return (prev.finish_login_timestamp > current.finish_login_timestamp) ? prev : current
      });
      console.log("last_date: " + JSON.stringify(last_date));

      let now_timestamp = new Date(Date().toLocaleString({ timeZone: time_zone }));
      now_timestamp = now_timestamp.getTime()/1000;

      let difference= Math.abs(now_timestamp-last_date.finish_login_timestamp);
      days = difference/(3600 * 24)

      console.log("days: " + Math.round(days));
      console.log("Function getDayLastLogin sucess");
      return Math.round(days);
    }
    catch(err){
      console.error("Error in getDayLastLogin: " + err.message);
      return 0;
    }
  }
}
