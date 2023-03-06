const headers = {
	"Access-Control-Allow-Origin": "*",
};
function generic(statusCode, apiCode, status, message, data, error, messageCode) {
	const objResponse = {
		statusCode,
		apiCode,
		messageCode,
		status,
		message,
		data,
		error,
	};
	return {
		statusCode: statusCode,
		headers: headers,
		body: JSON.stringify(objResponse),
	};
}

function success(message, data) {
	const apiCode = data ? 100 : 101;
	return generic(200, apiCode, "success", message, data);
}

function error(statusCode, apiCode, message, error, messageCode) {
	return generic(statusCode || 500, apiCode || 50, "error", message || "Internal Server Error", undefined, error, messageCode);
}

function unauthorized() {
	return generic(401, undefined, undefined, "Unauthorized", undefined, undefined);
}

module.exports = {
	generic,
	success,
    error,
	unauthorized
};
