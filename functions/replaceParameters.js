module.exports = (text, parameters) => {
    try{
        console.log("Function replaceParameters");
        let i = 1;
        for(let param of parameters){
            text = text.replace('${'+ i +'}', param);
            i++;
        }
        console.log("Function replaceParameters sucess");
        return text;
    }catch(err){
        console.error("Error in replaceParameters: " + err.message);
        return null;
    }

}