const sinon = require('sinon');
const expect = require("chai").expect;
const clientUpdateOrchMock = require("../mocks/client/Rewards-Client-Update-Global.json");
const searchService = require('../../../dao/search');
const searchClientStructure = require('../mocks/client/Client-Structure-Schema.json');
const updateService = require('../../../dao/update');
const lambdaService =  require('../../../services/invokeLambda');
const clientUpdateOrchGlobal = require('../../../controllers/client/Rewards-Client-Update-Global');

describe('Rewards-Client-Update-Global function',  ()=> {
	let sandbox;
	const requestMock = clientUpdateOrchMock.mock;
	beforeEach(()=> {
		sandbox = sinon.createSandbox();
	})
	afterEach(() => {
		sandbox.restore();
		sinon.restore();
	});
	describe('Rewards Client Update Global', ()=> {
		it('Should run happy path', async ()=> {
			happyPathMocks();
			const res = await clientUpdateOrchGlobal.client(requestMock);
			expect(res.statusCode).to.equal(200);
			expect(JSON.parse(res.body).message).to.equal('Client updated');
		});
		it('Should run happy path without headers', async ()=> {
			happyPathMocks();
			const res = await clientUpdateOrchGlobal.client(clientUpdateOrchMock.mockWithoutHeaders);
			expect(res.statusCode).to.equal(200);
			expect(JSON.parse(res.body).message).to.equal('Client updated');
		});

		it('Should return 400 error Client not found', async ()=> {
			sinon.stub(searchService, 'search').resolves([]);
			const res = await clientUpdateOrchGlobal.client(requestMock);
			expect(res.statusCode).to.equal(400);
			expect(JSON.parse(res.body).message).to.equal('Client not found');
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
		}
		const validateTermsAndConditions = async () => {
			sinon.stub(updateService, 'updateData').resolves();
			sinon.stub(lambdaService, 'invokeLambda').resolves();
			const res = await clientUpdateOrchGlobal.client(clientUpdateOrchMock.mockTAndC);
			expect(res.statusCode).to.equal(200);
			expect(JSON.parse(res.body).message).to.equal('Client updated');
		}
	});
	describe('Rewards Client Update Global runtime error', ()=>{
		it('Should return 500 error searchService', async ()=> {
			sinon.stub(searchService, 'search').rejects({body: {error: "error"}});
			const res = await clientUpdateOrchGlobal.client(requestMock);
			expect(res.statusCode).to.equal(500);
			expect(JSON.parse(res.body).message).to.equal('Internal Server Error');
		});
	});
});
