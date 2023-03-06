const sinon = require('sinon');
const expect = require("chai").expect;
const searchService = require('../../../dao/search');
const updateService = require('../../../dao/update');
const fieldsValidator = require('../../../functions/validateFieldsPosition');
const termsAndConditionsValidator = require('../../../functions/validateTermsAndConditions');
const clientSchemaUpdateMock = require('../mocks/clientSchema/Rewards-Client-Schema-Update.json');
const clientSchemaUpdate = require('../../../controllers/clientSchema/Rewards-Client-Schema-Update');

describe('Rewards-Client-Schema-Update function',  ()=> {
	let sandbox;
	beforeEach(()=> {
		sandbox = sinon.createSandbox();
	})
	afterEach(() => {
		sandbox.restore();
		sinon.restore();
	});
	describe('Rewards Client Schema Update', ()=> {
		it('Should run happy path', async ()=> {
			await mockHappyPath(clientSchemaUpdateMock.resultMock);
			await runHappyPath(clientSchemaUpdateMock.mock);
		});

		it('Should run happy path validate client structure', async ()=> {
			await mockHappyPath(clientSchemaUpdateMock.resultWithoutClientStructureMock);
			await runHappyPath(clientSchemaUpdateMock.mock);
		});

		it('Should run happy path validate client structure', async ()=> {
			await mockHappyPath(clientSchemaUpdateMock.resultWithoutClientStructureMock);
			const res = await clientSchemaUpdate.data(clientSchemaUpdateMock.mockWithoutHeaders);
			expect(res.statusCode).to.equal(400);
			expect(JSON.parse(res.body).message).to.equal('Invalid schema');
		});

		it('Should return 400 error client schema not found', async()=> {
			sinon.stub(searchService, 'search').resolves([]);
			const res = await clientSchemaUpdate.data(clientSchemaUpdateMock.mock);
			console.log('res: ', res);
			expect(res.statusCode).to.equal(400);
			expect(JSON.parse(res.body).message).to.equal('Client schema not found');
		});

		it('Should return 400 error fields validator', async()=> {
			sinon.stub(searchService, 'search').resolves(clientSchemaUpdateMock.resultMock);
			sinon.stub(fieldsValidator, 'validateFieldsPosition').resolves(
				{error:'error', apiCode: 101, message: 'error message'});
			await returnValidateError();
		});

		it('Should return 400 error result_validate_terms validator', async()=> {
			sinon.stub(searchService, 'search').resolves(clientSchemaUpdateMock.resultMock);
			sinon.stub(termsAndConditionsValidator, 'validateTermsAndConditions').resolves(
				{error:'error', apiCode: 101, message: 'error message'});
			await returnValidateError();
		});
		const returnValidateError = async () => {
			const res = await clientSchemaUpdate.data(clientSchemaUpdateMock.mock);
			expect(res.statusCode).to.equal(400);
			expect(JSON.parse(res.body).message).to.equal('error message');
			expect(JSON.parse(res.body)).to.have.all.keys('status', 'statusCode', 'apiCode', 'message', 'messageCode');
		}
	});
	describe('runtime error clientSchemaUpdate', ()=>{
		it('Should return 500 error', async()=> {
			sinon.stub(searchService, 'search').rejects({body: {error: 'mock error'}});
			const res = await clientSchemaUpdate.data(clientSchemaUpdateMock.mock);
			expect(res.statusCode).to.equal(500);
			expect(JSON.parse(res.body).error).to.equal('mock error');
		});

		it('Should return 500 without error in response', async ()=> {
			sinon.stub(searchService, 'search').rejects();
			const res = await clientSchemaUpdate.data(clientSchemaUpdateMock.mock);
			expect(res.statusCode).to.equal(500);
		});
	});
	const mockHappyPath = async (mock) => {
		sinon.stub(searchService, 'search').resolves(mock);
		sinon.stub(updateService, 'updateData').resolves();
	}
	const runHappyPath = async(mock) => {
		const res = await clientSchemaUpdate.data(mock);
		expect(res.statusCode).to.equal(200);
		expect(JSON.parse(res.body).message).to.equal('Client schema updated');
	}
});
