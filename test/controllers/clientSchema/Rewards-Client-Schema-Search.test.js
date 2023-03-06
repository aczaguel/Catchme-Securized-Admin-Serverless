const sinon = require('sinon');
const expect = require("chai").expect;
const searchService = require('../../../dao/search');
const clientSchemaSearchMock = require('../mocks/clientSchema/Rewards-Client-Schema-Search.json');
const clientSchemaSearch = require('../../../controllers/clientSchema/Rewards-Client-Schema-Search');

describe('Rewards-Client-Schema-Search function',  ()=> {
	let sandbox;
	beforeEach(()=> {
		sandbox = sinon.createSandbox();
	})
	afterEach(() => {
		sandbox.restore();
		sinon.restore();
	});
	describe('Rewards Client Schema Search', ()=> {
		it('Should run happy path', async ()=> {
			sinon.stub(searchService, 'search').resolves(clientSchemaSearchMock.resultMock);
			const res = await clientSchemaSearch.data(clientSchemaSearchMock.mock);
			expect(res.statusCode).to.equal(200);
			expect(JSON.parse(res.body).status).to.equal('Success');
		});
		it('Should return apiCode 101 Query without data', async ()=> {
			sinon.stub(searchService, 'search').resolves([]);
			const res = await clientSchemaSearch.data(clientSchemaSearchMock.mock);
			expect(res.statusCode).to.equal(200);
			expect(JSON.parse(res.body).status).to.equal('Success');
			expect(JSON.parse(res.body).apiCode).to.equal(101);
		});
	});
	describe('runtime error client schema', ()=>{
		it('Should return 500 error', async()=> {
			sinon.stub(searchService, 'search').rejects({body: {error: 'error'}});
			const res = await clientSchemaSearch.data(clientSchemaSearchMock.mock);
			expect(res.statusCode).to.equal(500);
			expect(JSON.parse(res.body).error).to.equal('error');
		});

		it('Should return 500 error in response', async ()=> {
			sinon.stub(searchService, 'search').rejects();
			const res = await clientSchemaSearch.data(clientSchemaSearchMock.mock);
			expect(res.statusCode).to.equal(500);
			expect(JSON.parse(res.body)).to.not.have.any.keys('error');
		});
	});
});
