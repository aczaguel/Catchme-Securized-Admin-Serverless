const sinon = require('sinon');
const expect = require("chai").expect;
const clientSearchOrchMock = require('../mocks/client/Rewards-Client-Search-Orch.json');
const clientSearchOrch = require('../../../controllers/client/Rewards-Client-Search-Orch');
const searchService = require('../../../dao/search');
const lambdaService =  require('../../../services/invokeLambda');
const sessionMRes = require('../mocks/client/sessionMResponse.json');

describe('Rewards-Client-Search-Orch function',  ()=> {
	let sandbox;
	const requestMock = clientSearchOrchMock.mock;
	beforeEach(()=> {
		sandbox = sinon.createSandbox();
	})
	afterEach(() => {
		sandbox.restore();
		sinon.restore();
	});
	describe('Rewards Client Search Orch', ()=> {
		it('Should run happy path', async ()=> {
			sinon.stub(searchService, 'search').resolves([{client: {name: "leidy"}, user_id_sessionm: 1234}]);
			sinon.stub(lambdaService, 'invokeLambda').resolves(sessionMRes.mock);
			const res = await clientSearchOrch.client(requestMock);
			console.log('res: ', res);
			expect(res.statusCode).to.equal(200);
		});

		it('Should run happy path without tier_details', async ()=> {
			sinon.stub(searchService, 'search').resolves([{client: {name: "leidy"}, user_id_sessionm: 1234}]);
			sinon.stub(lambdaService, 'invokeLambda').resolves(sessionMRes.mockWithoutTierDetails);
			const res = await clientSearchOrch.client(requestMock);
			console.log('res: ', res);
			expect(res.statusCode).to.equal(200);
		});

		it('Should run happy path second call search service []', async ()=> {
			const searchSinon = sinon.stub(searchService, 'search');
			searchSinon.onFirstCall().resolves([{client: {name: "leidy"}, user_id_sessionm: 1234}]);
			searchSinon.onSecondCall().resolves([]);
			sinon.stub(lambdaService, 'invokeLambda').resolves(sessionMRes.mock);
			const res = await clientSearchOrch.client(requestMock);
			console.log('res: ', res);
			expect(res.statusCode).to.equal(200);
		});

		it('Should run happy path without user_id_sessionm', async ()=> {
			sinon.stub(searchService, 'search').resolves([{client: {name: "leidy"}}]);
			sinon.stub(lambdaService, 'invokeLambda').resolves(sessionMRes.mock);
			const res = await clientSearchOrch.client(requestMock);
			console.log('res: ', res);
			expect(res.statusCode).to.equal(200);
		});

		it('Should run happy path without query params', async ()=> {
			sinon.stub(searchService, 'search').resolves([{client: {name: "leidy"}, user_id_sessionm: 1234}]);
			sinon.stub(lambdaService, 'invokeLambda').resolves(sessionMRes.mock);
			let secondReq = {...clientSearchOrchMock.mock};
			delete secondReq.queryStringParameters;
			console.log('secondReq: ', secondReq);
			const secondRes = await clientSearchOrch.client(secondReq);
			console.log('res: ', secondRes);
			expect(secondRes.statusCode).to.equal(400);
		});

		it('Should run happy path time zone', async ()=> {
			sinon.stub(searchService, 'search').resolves([{client: {name: "leidy"}, user_id_sessionm: 1234}]);
			sinon.stub(lambdaService, 'invokeLambda').resolves(sessionMRes.mock);
			let secondReq = {...clientSearchOrchMock.mock};
			delete secondReq.queryStringParameters.time_zone;
			console.log('secondReq: ', secondReq);
			const secondRes = await clientSearchOrch.client(secondReq);
			console.log('res: ', secondRes);
			expect(secondRes.statusCode).to.equal(200);
		});


		it('Should return 200 query without data', async ()=> {
			sinon.stub(searchService, 'search').resolves([]);
			const res = await clientSearchOrch.client(requestMock);
			expect(res.statusCode).to.equal(200);
			expect(JSON.parse(res.body).message).to.equal('Query without data');
		});
		it('Should return error to search client in SessionM', async ()=> {
			sinon.stub(searchService, 'search').resolves([{client: {name: "leidy"}, user_id_sessionm: 1234}]);
			sinon.stub(lambdaService, 'invokeLambda').resolves(sessionMRes.mockError);
			const res = await clientSearchOrch.client(requestMock);
			expect(res.statusCode).to.equal(500);
		});
	});
	describe('Rewards Client Search Orch runtime error', ()=> {
		it('Should return ', async ()=>{
			sinon.stub(searchService, 'search').rejects({body: {error: "error to search client"}});
			const res = await clientSearchOrch.client(requestMock);
			expect(res.statusCode).to.equal(500);
		});
	});
});
