const sinon = require('sinon');
const expect = require("chai").expect;
const assert = require("chai").assert;
const searchService = require('../../../dao/search');
const clientSchemaValidationMock = require('../mocks/clientSchema/Rewards-Client-Schema-Validation.json');
const clientSchemaValidation = require('../../../controllers/clientSchema/Rewards-Client-Schema-Validation');
const lambdaService = require("../../../services/invokeLambda");

describe('Rewards-Client-Schema-Validation function',  ()=> {
	let sandbox;
	const user = { user : "lpadillagalicia@gmail.com"}
	beforeEach(()=> {
		sandbox = sinon.createSandbox();
	})
	afterEach(() => {
		sandbox.restore();
		sinon.restore();
	});
	describe('Rewards Client Schema Validation', ()=> {
		it('Should run happy path', async()=> {

			sinon.stub(searchService, 'search').resolves(clientSchemaValidationMock.resultMock);
			const res = await clientSchemaValidation.validate(clientSchemaValidationMock.mock);
			expect(res.statusCode).to.equal(200);
			expect(JSON.parse(res.body).message).to.equal('Client schema validation success');
			expect(JSON.parse(res.body).status).to.equal('Success');
		})

		it('Should run happy path with headers', async()=> {
			sinon.stub(lambdaService, 'invokeLambda').resolves(user);
			sinon.stub(searchService, 'search').resolves(clientSchemaValidationMock.resultMock);
			const res = await clientSchemaValidation.validate(clientSchemaValidationMock.mockWithHeaders);
			expect(res.statusCode).to.equal(200);
			expect(JSON.parse(res.body).message).to.equal('Client schema validation success');
			expect(JSON.parse(res.body).status).to.equal('Success');
		})

		it('Should run happy path with retrieveData true', async()=> {
			const searchServiceStub = sinon.stub(searchService, 'search');

			process.env.MONGODB_COLLECTION_CLIENT_SCHEMAS = 'clientSchema';
			process.env.MONGODB_DATABASE_GLOBAL = 'globalDB';
			const reqSearch = { platform: 'Rewards_USA', program: 'MyCooler' };
			searchServiceStub.withArgs('clientSchema', reqSearch, 'globalDB')
				.resolves(clientSchemaValidationMock.resultMock);

			process.env.MONGODB_COLLECTION_CLIENTS = 'clients';
			process.env.MONGODB_DATABASE_LOCAL = 'localDB';
			const reqSearchService = {email: 'lpadillagalicia@gmail.com', platform: 'Rewards_USA'}
			searchServiceStub.withArgs('clients', reqSearchService, 'localDB')
				.resolves([]);

			const res = await clientSchemaValidation.validate(clientSchemaValidationMock.mock);
			const body = JSON.parse(res.body);
			expect(res.statusCode).to.equal(200);
			expect(body.message).to.equal('Client schema validation success');
			expect(body.status).to.equal('Success');
			assert.equal(body.data.retrieveData, true);
		})
		it('Should return 400 error client schema not found', async()=> {
			sinon.stub(searchService, 'search').resolves([]);
			const res = await clientSchemaValidation.validate(clientSchemaValidationMock.mock);
			console.log('res: ', res);
			expect(res.statusCode).to.equal(400);
			expect(res.message).to.equal('Client schema not found');
			expect(res.apiCode).to.equal(41);
		});
	});
	describe('runtime error', ()=>{
		it('Should return 400 error string params', async ()=> {
			const res = await clientSchemaValidation.validate(clientSchemaValidationMock.mockWithoutStringParams);
			expect(res.statusCode).to.equal(400);
			expect(JSON.parse(res.body).message).to.equal('Invalid schema');
			expect(JSON.parse(res.body).status).to.equal('Bad request');
		});
		it('Should return 500 error', async()=> {
			sinon.stub(searchService, 'search').rejects({body: {error: 'error mock'}});
			const res = await clientSchemaValidation.validate(clientSchemaValidationMock.mock);
			expect(res.statusCode).to.equal(500);
			expect(JSON.parse(res.body).error).to.equal('error mock');
		});
	});
});
