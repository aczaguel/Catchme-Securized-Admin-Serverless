const sinon = require('sinon');
const expect = require("chai").expect;
const searchService = require('../../../dao/search');
const searchHistoricalClient = require('../../../controllers/historical/Rewards-Client-Historical-Search');
const searchHistoricalClientMock = require('../mocks/historical/Rewards-Client-Historical-Search.json');

describe('Rewards-Client-Historical-Search function',  ()=> {
	let sandbox;
	beforeEach(()=> {
		sandbox = sinon.createSandbox();
	})
	afterEach(() => {
		sandbox.restore();
		sinon.restore();
	});
	describe('Rewards Client Historical Search', ()=> {
		it('Should run happy path', async  ()=> {
			sinon.stub(searchService, 'search').resolves([{historical: {}}])
			const res = await searchHistoricalClient.action(searchHistoricalClientMock.mock);
			expect(res.statusCode).to.equal(200);
		})
		it('Should return query without data', async ()=> {
			sinon.stub(searchService, 'search').resolves([])
			const res = await searchHistoricalClient.action(searchHistoricalClientMock.mock);
			const body = JSON.parse(res.body);
			expect(res.statusCode).to.equal(200);
			expect(body.message).to.equal('Query without data');
			console.log('res: ', res);
		});
		it('Should return historical Client  false', async ()=> {
			sinon.stub(searchService, 'search').resolves([{}])
			const res = await searchHistoricalClient.action(searchHistoricalClientMock.mock);
			const body = JSON.parse(res.body);
			expect(res.statusCode).to.equal(200);
			expect(body.apiCode).to.equal(101);
			console.log('res: ', res);
		});
	})
	describe('runtime error', ()=>{
		it('Should return 500 error', async ()=> {
			sinon.stub(searchService, 'search').rejects(
				{apiCode: 101, message: 'error message', statusCode: 501, status: 'error', body: {error: 'message error'}});
			const res = await searchHistoricalClient.action(searchHistoricalClientMock.mock);
			const body = JSON.parse(res.body);
			expect(res.statusCode).to.equal(501);
			expect(body.apicode).to.equal(101);
		});
		it('Should return 500 error without errors', async ()=> {
			sinon.stub(searchService, 'search').rejects({});
			const res = await searchHistoricalClient.action(searchHistoricalClientMock.mock);
			const body = JSON.parse(res.body);
			expect(res.statusCode).to.equal(500);
			expect(body.apicode).to.equal(51);
		});
	});
});
