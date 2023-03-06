const sinon = require('sinon');
const expect = require("chai").expect;
const searchService = require('../../../dao/search');
const deleteService = require('../../../dao/delete');
const updateService = require('../../../dao/update');
const clientSchemaDeleteMock = require('../mocks/clientSchema/Rewards-Client-Schema-Delete.json');
const clientSchemaDelete = require('../../../controllers/clientSchema/Rewards-Client-Schema-Delete');

describe('Rewards-Client-Schema-Delete function',  ()=> {
	let sandbox;
	beforeEach(()=> {
		sandbox = sinon.createSandbox();
	})
	afterEach(() => {
		sandbox.restore();
		sinon.restore();
	});
	describe('Rewards Client Schema Delete', ()=> {
		it('Should run happy path', async ()=> {
			sinon.stub(searchService, 'search').resolves(clientSchemaDeleteMock.schemaResults);
			sinon.stub(deleteService, 'deleteClient').resolves(clientSchemaDeleteMock.deleteResultMock);
			const res = await clientSchemaDelete.data(clientSchemaDeleteMock.mock);
			expect(res.statusCode).to.equal(200);
			expect(JSON.parse(res.body).message).to.equal('Client schema deleted');
			expect(JSON.parse(res.body).status).to.equal('Success');
		});

		it('Should run happy path with body', async ()=> {
			sinon.stub(searchService, 'search').resolves(clientSchemaDeleteMock.schemaResults);
			sinon.stub(deleteService, 'deleteClient').resolves(clientSchemaDeleteMock.deleteResultMock);
			sinon.stub(updateService, 'updateData').resolves({});
			const res = await clientSchemaDelete.data(clientSchemaDeleteMock.mockWithBody);
			expect(res.statusCode).to.equal(200);
			expect(JSON.parse(res.body).message).to.equal('Fields of client schema deleted');
			expect(JSON.parse(res.body).status).to.equal('Success');
		});

		it('Should return error 400 client schema not found', async ()=> {
			sinon.stub(searchService, 'search').resolves([]);
			const res = await clientSchemaDelete.data(clientSchemaDeleteMock.mock);
			expect(res.statusCode).to.equal(400);
			expect(JSON.parse(res.body).message).to.equal('Client schema not found');
			expect(JSON.parse(res.body).status).to.equal('Error');
		});
	});
	describe('runtime error', ()=>{
		it('Should return 500 error', async()=> {
			sinon.stub(searchService, 'search').rejects({body: {error: 'error mock'}});
			const res = await clientSchemaDelete.data(clientSchemaDeleteMock.mock);
			expect(res.statusCode).to.equal(500);
			expect(JSON.parse(res.body).error).to.equal('error mock');
		});

		it('Should return 500 without error in response', async ()=> {
			sinon.stub(searchService, 'search').rejects();
			const res = await clientSchemaDelete.data(clientSchemaDeleteMock.mock);
			expect(res.statusCode).to.equal(500);
			expect(JSON.parse(res.body)).to.not.have.any.keys('error');
		});
	});
});
