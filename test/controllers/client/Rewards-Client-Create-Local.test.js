const sinon = require('sinon');
const AWSMock = require('aws-sdk-mock');
const termsAndConditionsService = require ('../../../functions/mapTermsAndConditions');
const clientCreateClient = require('../../../controllers/client/Rewards-Client-Create-Local');
const createClientLocalMock = require('../mocks/client/Rewards-Client-Create-Local.json');
const expect = require("chai").expect;

describe('Rewards-Client-Create-Local function',  ()=> {
	let sandbox;
	beforeEach(()=> {
		sandbox = sinon.createSandbox();
	})
	afterEach(() => {
		sandbox.restore();
		sinon.restore();
	});
	describe('Create client local service', ()=> {
		process.env.SQS_EVENTS_REWARDS_ENGINE = 'https://sqs.us-east-1.amazonaws.com/123456789012/client_events.fifo';
		it('Should run happy path', async ()=> {
			const request = mockRequest();
			await expectHappyPath(request);
		});
		it('Should run happy path without headers', async ()=> {
			const request = {
				body: JSON.stringify(createClientLocalMock.mock),
				statusCode: 200
			};
			await expectHappyPath(request);
		});
		it('Should return SQS error', async ()=> {
			const request = mockRequest();
			AWSMock.mock('SQS', 'sendMessage', ()=> Promise.reject({}));
			sinon.stub(termsAndConditionsService, 'mapAndValidateTermAndConditionsInBD').rejects([]);
			const res = await clientCreateClient.client(request);
			expect(res.statusCode).to.equal(500);
			expect(res).to.have.all.keys('statusCode', 'headers', 'body');
		});
	});

	const mockRequest = () => {
		return {
			headers: {"Access-Control-Allow-Origin": "*"},
			body: JSON.stringify(createClientLocalMock.mock),
			statusCode: 200
		};
	}
	const expectHappyPath = async (request) => {
		AWSMock.mock('SQS', 'sendMessage', ()=> Promise.resolve({}));
		sinon.stub(termsAndConditionsService, 'mapAndValidateTermAndConditionsInBD').resolves([]);
		const res = await clientCreateClient.client(request);
		expect(res.statusCode).to.equal(201);
		expect(res).to.have.a.property('headers');
	}
});
