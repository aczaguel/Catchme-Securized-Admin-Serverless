const sinon = require('sinon');
const expect = require("chai").expect;
const deleteClientOrchMock = require('../mocks/client/Rewards-Client-Delete-Orch.json');
const deleteClientOrch = require('../../../controllers/client/Rewards-Client-Delete-Orch');
const schemaService = require('../../../validations/schemaValidator');
const searchService = require('../../../dao/search');
const deleteService = require('../../../dao/deleteMany');

describe('Rewards-Client-Delete-Orch function',  ()=> {
	let sandbox;
	beforeEach(()=> {
		sandbox = sinon.createSandbox();
	})
	afterEach(() => {
		sandbox.restore();
		sinon.restore();
	});
	describe('Rewards Client Delete Orch', ()=> {
		it('Should run happy path', async ()=> {
			const request = mockRequest();
			sinon.stub(schemaService, 'validateSchema').resolves();
			sinon.stub(searchService, 'search').resolves([{name: "leidy", phoneNumber: '+5732275261987'}]);
			sinon.stub(deleteService, 'deleteManyClient').resolves();
			const res = await deleteClientOrch.client(request);
			expect(res.statusCode).to.equal(200);
		});

		it('Should return error 400 This client does not exist', async ()=> {
			const request = mockRequest();
			sinon.stub(schemaService, 'validateSchema').resolves();
			sinon.stub(searchService, 'search').resolves([]);
			const res = await deleteClientOrch.client(request);
			console.log('res: ', res);
			expect(res.statusCode).to.equal(400);
		});
	});

	describe('Rewards Client Delete Orch runtime error', () =>{
		it('Should return 500 error validateSchema', async () =>{
			const request = mockRequest();
			sinon.stub(schemaService, 'validateSchema').rejects();
			const res = await deleteClientOrch.client(request);
			expect(res.statusCode).to.equal(500);
			expect(res.body).to.be.an('string');
			expect(JSON.parse(res.body).message).to.equal('Error in delete client');
		});
	});
	const mockRequest = () => {
		return deleteClientOrchMock.mockDelete;
	}
})
