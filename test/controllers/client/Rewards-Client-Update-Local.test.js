const sinon = require('sinon');
const expect = require("chai").expect;
const clientUpdateOrchMock = require("../mocks/client/Rewards-Client-Update-Local.json");
const searchService = require('../../../dao/search');
const searchClientStructure = require('../mocks/client/Client-Structure-Schema.json');
const updateService = require('../../../dao/update');
const lambdaService =  require('../../../services/invokeLambda');
const clientUpdateOrchLocal = require('../../../controllers/client/Rewards-Client-Update-Local');
const AWSMock = require('aws-sdk-mock');

describe('Rewards-Client-Update-Local function',  ()=> {
	let sandbox;
	const requestMock = clientUpdateOrchMock.mock;
	beforeEach(()=> {
		sandbox = sinon.createSandbox();
	})
	afterEach(() => {
		sandbox.restore();
		sinon.restore();
	});
	describe('Rewards Client Update Local', ()=> {
		process.env.SQS_EVENTS_REWARDS_ENGINE = 'https://sqs.us-east-1.amazonaws.com/123456789012/client_events.fifo';
		it('Should run happy path', async ()=> {
			happyPathMocks();
			const res = await clientUpdateOrchLocal.client(requestMock);
			expect(res.statusCode).to.equal(200);
			expect(JSON.parse(res.body).message).to.equal('Successful operation');
		});
		it('Should run happy path without headers', async ()=> {
			happyPathMocks();
			const res = await clientUpdateOrchLocal.client(clientUpdateOrchMock.mockWithoutHeaders);
			expect(res.statusCode).to.equal(200);
			expect(JSON.parse(res.body).message).to.equal('Successful operation');
		});

		it('Should return 400 error Client not found', async ()=> {
			sinon.stub(searchService, 'search').resolves([]);
			const res = await clientUpdateOrchLocal.client(requestMock);
			expect(res.statusCode).to.equal(400);
			expect(JSON.parse(res.body).message).to.equal('This client does not exist');
		});

		it('Should validate terms and conditions', async ()=>{
			sinon.stub(searchService, 'search').resolves(searchClientStructure.mockTAndC);
			await validateTermsAndConditions();
		});
		it('Should validate if there are terms and conditions', async ()=>{
			sinon.stub(searchService, 'search').resolves(searchClientStructure.mock);
			await validateTermsAndConditions();
		});
		const happyPathMocks = () => {
			sinon.stub(searchService, 'search').resolves(searchClientStructure.mock);
			sinon.stub(updateService, 'updateData').resolves();
			sinon.stub(lambdaService, 'invokeLambda').resolves();
			AWSMock.mock('SQS', 'sendMessage', ()=> Promise.resolve({}));
		}
		const validateTermsAndConditions = async () => {
			AWSMock.mock('SQS', 'sendMessage', ()=> Promise.resolve({}));
			sinon.stub(updateService, 'updateData').resolves();
			sinon.stub(lambdaService, 'invokeLambda').resolves();
			const res = await clientUpdateOrchLocal.client(clientUpdateOrchMock.mockTAndC);
			expect(res.statusCode).to.equal(200);
			expect(JSON.parse(res.body).message).to.equal('Successful operation');
		}
	});
	describe('Rewards Client Update Local runtime error', ()=>{
		it('Should return 500 error searchService', async ()=> {
			sinon.stub(searchService, 'search').rejects({body: {error: "error"}});
			const res = await clientUpdateOrchLocal.client(requestMock);
			expect(res.statusCode).to.equal(500);
			expect(JSON.parse(res.body).error).to.equal('error');
		});
	});
});
