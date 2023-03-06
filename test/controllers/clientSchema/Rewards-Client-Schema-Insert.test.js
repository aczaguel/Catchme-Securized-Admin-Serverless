const sinon = require('sinon');
const expect = require("chai").expect;
const searchService = require('../../../dao/search');
const insertService = require('../../../dao/insert');
const fieldsValidator = require('../../../functions/validateFieldsPosition');
const schemaService = require('../../../validations/schemaValidator');
const termsAndConditionsValidator = require('../../../functions/validateTermsAndConditions');
const fieldNameValidator = require('../../../functions/validateRepeatedFields');
const clientSchemaInsertMock = require('../mocks/clientSchema/Rewards-Client-Schema-Insert.json');
const clientSchemaInsert = require('../../../controllers/clientSchema/Rewards-Client-Schema-Insert');

describe('Rewards-Client-Schema-Insert function',  ()=> {
	let sandbox;
	beforeEach(()=> {
		sandbox = sinon.createSandbox();
	})
	afterEach(() => {
		sandbox.restore();
		sinon.restore();
	});
	describe('Rewards Client Schema Insert', ()=> {
		it('Should run happy path', async()=> {
			await runHappyPath();
			const res = await clientSchemaInsert.data(clientSchemaInsertMock.mock);
			expect(res.statusCode).to.equal(201);
			expect(JSON.parse(res.body).message).to.equal('Client schema created');
		});

		it('Should return 400 error without headers', async()=> {
			await runHappyPath();
			const res = await clientSchemaInsert.data(clientSchemaInsertMock.mockWithoutHeaders);
			expect(res.statusCode).to.equal(400);
			expect(JSON.parse(res.body).message).to.equal('Invalid schema');
		});

		it('Should return 400 error there is already this client schema', async ()=> {
			sinon.stub(searchService, 'search').resolves([{something: 'something'}]);
			const res = await clientSchemaInsert.data(clientSchemaInsertMock.mock);
			expect(res.statusCode).to.equal(400);
			expect(JSON.parse(res.body).message).to.equal('There is already this client schema');
		});

		it('Should return 400 error fields validator', async ()=> {
			sinon.stub(searchService, 'search').resolves([]);
			sinon.stub(fieldsValidator, 'validateFieldsPosition').resolves({error: {message: 'error validating fields'}});
			const res = await clientSchemaInsert.data(clientSchemaInsertMock.mock);
			expect(res.statusCode).to.equal(400);
			expect(JSON.parse(res.body).status).to.equal('Error');
		});
		it('Should return 400 error fields validator repeated', async ()=> {
			sinon.stub(searchService, 'search').resolves([]);
			sinon.stub(fieldNameValidator, 'validateRepeatedFields').resolves({error: 'error'});
			const res = await clientSchemaInsert.data(clientSchemaInsertMock.mock);
			expect(res.statusCode).to.equal(400);
			expect(JSON.parse(res.body).status).to.equal('Error');
		});

		it('Should return 400 error terms and conditions validator', async ()=> {
			sinon.stub(searchService, 'search').resolves([]);
			sinon.stub(fieldNameValidator, 'validateRepeatedFields').resolves({});
			sinon.stub(termsAndConditionsValidator, 'validateTermsAndConditions').resolves({error: 'error'})
			const res = await clientSchemaInsert.data(clientSchemaInsertMock.mock);
			expect(res.statusCode).to.equal(400);
			expect(JSON.parse(res.body).status).to.equal('Error');
		});
	});
	describe('runtime error search service', ()=>{
		it('Should return 500 error', async()=> {
			sinon.stub(searchService, 'search').rejects({body: {error: 'error mock sd'}});
			const res = await clientSchemaInsert.data(clientSchemaInsertMock.mock);
			expect(res.statusCode).to.equal(500);
			expect(JSON.parse(res.body).error).to.equal('error mock sd');
		});

		it('Should return 500 without error', async ()=> {
			sinon.stub(searchService, 'search').rejects();
			const res = await clientSchemaInsert.data(clientSchemaInsertMock.mock);
			expect(res.statusCode).to.equal(500);
			expect(JSON.parse(res.body)).to.not.have.any.keys('error');
		});
	});
	const runHappyPath = async () => {
		sinon.stub(searchService, 'search').resolves([]);
		sinon.stub(insertService, 'insert').resolves({});
	}
});
