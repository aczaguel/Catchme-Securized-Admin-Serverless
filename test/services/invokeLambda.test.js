const sinon = require('sinon');
const expect = require("chai").expect;
const lambdaService =  require('../../services/invokeLambda');
const AWSMock = require('aws-sdk-mock');

describe('invokeLambda service',  ()=> {
	let sandbox;
	beforeEach(()=> {
		sandbox = sinon.createSandbox();
	})
	afterEach(() => {
		sandbox.restore();
		sinon.restore();
		AWSMock.restore();
	});
	describe('invokeLambda', ()=> {
		it('Should return error ', async ()=> {
			AWSMock.mock('Lambda', 'invoke', ()=> Promise.resolve({
				StatusCode: 202,
				Payload: "{\"status\":\"Success\",\"statusCode\":200,\"apicode\":102,\"message\":\"Client updated\"}"
			}));
			const res = await lambdaService.invokeLambda('functionName', 'payload', 'inv_type');
			expect(res.StatusCode).to.equal(202);
		});
		it('Should run happy path', async ()=> {
			AWSMock.mock('Lambda', 'invoke', ()=> Promise.resolve({
				StatusCode: 401,
				Payload: "{\"status\":\"Success\",\"statusCode\":200,\"apicode\":102,\"message\":\"Client updated\"}"
			}));
			const res = await lambdaService.invokeLambda('functionName', 'payload', 'inv_type');
			expect(res.statusCode).to.equal(200);
		});
		it('Should return error to invoke lambda', async ()=> {
			AWSMock.mock('Lambda', 'invoke', ()=> Promise.reject({
				reason: 'reason'}));
			try {
				await lambdaService.invokeLambda('functionName', 'payload', 'inv_type');
			} catch (e) {
				console.log('res: ', e);
				expect(e.reason).to.equal('reason');
			}
		})
	});
});
