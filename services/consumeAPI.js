const axios = require('axios');

axios.interceptors.response.use(function (response) {
    let respuesta = {};
    respuesta.statusCode = response.status;
    respuesta.body = response.data;
    return respuesta
}, function (error) {
    let respuestaError = {};
    if (error.response) {
        respuestaError.statusCode = error.response.status;
        respuestaError.body = error.response.data;
    } else {
        respuestaError.statusCode = 500;
        respuestaError.body = { error: error.message };
    }
    return respuestaError
});

module.exports = {
    consumeAPI: async (request) => {
        return new Promise(async (resolve, reject) => {
            try {
                console.log('Executing API request...');
                console.log('Request: ' + JSON.stringify(request));
                await axios(request).then(res => {
                    console.log('Response: ' + JSON.stringify(res));
                    resolve(res)
                }).catch(err => {
                    console.error('Response Error: ' + JSON.stringify(err));
                    reject(err)
                });
            } catch (err) {
                console.error('Error in API request: ' + JSON.stringify(err));
                reject();
            }
        });
    }
}
