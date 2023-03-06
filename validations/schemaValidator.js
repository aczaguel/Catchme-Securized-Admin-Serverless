let validador = require('jsonschema').Validator;
let v = new validador();
var fs = require('fs');

module.exports = {
    validateSchema: async(data, esquema) => {
        console.log('data: ', data);
        console.log('esquema: ', esquema);
        let detalles = [];
        let response = { "statusCode": 200 };
        try {
            let esquema_validacion = await v.validate(data, esquema);
            if (esquema_validacion.valid) {
                console.log("Eval schema " + esquema.id + " ok");
                return Promise.resolve(response);
            } else {
                console.warn("Invalid schema ");
                response.statusCode = 400;
                response.apiCode = 40;
                response.message = "Invalid schema";
                response.status = "Bad request";
                for (let item of esquema_validacion.errors) {
                    console.warn(JSON.stringify(item));
                    detalles.push(item.stack);
                }
                response.body = {
                    error: detalles,
                    status: "Bad request",
                    message:'Invalid schema',
                    statusCode : response.statusCode
                }
                return Promise.reject(response);
            }

        } catch (error) {

            console.error("Error Squema Validate - SyntaxError: ", error);
            response.statusCode = 500;
            response.body = {
                statusCode: 500,
                status: "Error",
                apiCode: 51,
                message: "Schema template does not exist."
            };
            return Promise.reject(response);
        }
    }
}
