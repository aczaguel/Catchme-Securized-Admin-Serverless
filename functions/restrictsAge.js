module.exports = {
    restrictsAge: async (birthdate,Age) => {
        try{
            console.log("Function restricts Age");
            const age = calculateAge(birthdate);
            if((age >= parseInt(Age.ageGateMin)) && (age <= parseInt(Age.ageGateMax))){
                console.log("Age success");
                return age;
            }
            else{
                console.log("Age not success");
                return null;
            }
            function calculateAge(date){
                var today = new Date();
                var birthday = new Date(date);
                var age = today.getFullYear() - birthday.getFullYear();
                var m = today.getMonth() - birthday.getMonth();

                if (m < 0 || (m === 0 && today.getDate() < birthday.getDate())) {
                    age--;
                }

                return age;
            }
        }
        catch(err){
            console.error("An error occurred in restrictsAge: " + err.message);
            return null;
        }
    }

}