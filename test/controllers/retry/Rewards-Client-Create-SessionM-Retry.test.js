const sinon = require('sinon');
const expect = require("chai").expect;
const searchService = require('../../../dao/search');
const lambdaService =  require('../../../services/invokeLambda');
const createClientSessionMRetry = require('../../../controllers/retry/Rewards-Client-Create-SessionM-Retry');
const createClientSessionMRetryMock = require('../mocks/retry/Rewards-Client-Create-SessionM-Retry.json');

describe('Rewards-Client-Create-SessionM-Retry function',  ()=> {
	let sandbox;
	beforeEach(()=> {
		sandbox = sinon.createSandbox();
	})
	afterEach(() => {
		sandbox.restore();
		sinon.restore();
	});
	describe('Rewards Client Create SessionM Retry', ()=> {
		it('Should run happy path', async()=> {
			const searchStub = sinon.stub(searchService, 'search');
			searchStub.onFirstCall().resolves([{retries: 2, interval: 1 }])
				.onSecondCall().resolves([{body:{}, retry: 1, _id: 1234}]);
			sinon.stub(lambdaService, 'invokeLambda').resolves({});

			const res = await createClientSessionMRetry.client(createClientSessionMRetryMock.mock);
			const body = JSON.parse(res.body);
			expect(res.statusCode).to.equal(201);
			expect(body.status).to.equal('Created');
			expect(body.message).to.equal('Successful operation');
		});
		it('Should return 404 process configuration not found', async()=> {
			sinon.stub(searchService, 'search').resolves([]);
			const res = await createClientSessionMRetry.client(createClientSessionMRetryMock.mock);
			const body = JSON.parse(res.body);
			expect(res.statusCode).to.equal(404);
			expect(body.status).to.equal('Not Found');
			expect(body.message).to.equal('Process configuration not found');
		});
		it('Should return 404 error register not found', async()=> {
			const searchStub = sinon.stub(searchService, 'search');
			searchStub.onFirstCall().resolves([{retries: 2, interval: 1 }])
				.onSecondCall().resolves([]);
			sinon.stub(lambdaService, 'invokeLambda').resolves({});
			const res = await createClientSessionMRetry.client(createClientSessionMRetryMock.mock);
			const body = JSON.parse(res.body);
			expect(res.statusCode).to.equal(404);
			expect(body.status).to.equal('Not Found');
			expect(body.message).to.equal('Error register not found');
		});
	})
	describe('runtime error', ()=>{
		it('Should ', async()=> {
			sinon.stub(searchService, 'search').rejects({message: 'message', body: {error: 'error'}});
			const res = await createClientSessionMRetry.client(createClientSessionMRetryMock.mock);
			console.log('res: ', res);
			expect(res.statusCode).to.equal(500);
		});
		it('Should ', async()=> {
			sinon.stub(searchService, 'search').rejects( {message: 'message'});
			const res = await createClientSessionMRetry.client(createClientSessionMRetryMock.mock);
			console.log('res: ', res);
			const body = JSON.parse(res.body);
			expect(res.statusCode).to.equal(500);
			expect(body.message).to.equal('Error in create customer in engine');
		});
	});
});
