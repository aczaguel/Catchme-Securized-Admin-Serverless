const sinon = require('sinon');
const expect = require("chai").expect;
const createClientOrchMock = require('../mocks/client/Rewards-Client-Create-Orch.json');
const createClientOrch = require('../../../controllers/client/Rewards-Client-Create-Orch');
const searchService = require('../../../dao/search');
const clientStructureSchema = require('../mocks/client/Client-Structure-Schema.json');
const zipcodeService = require('../../../functions/retrieveStateByZipcode');
const lambdaService =  require('../../../services/invokeLambda');
const restrictsAge = require('../../../functions/restrictsAge');

describe('Rewards-Client-Create-Orch function',  ()=> {
	let sandbox;
	beforeEach(()=> {
		sandbox = sinon.createSandbox();
	});
	afterEach(() => {
		sandbox.restore();
		sinon.restore();
	});
	describe('Create client Orch service', ()=> {
		process.env.MONGODB_COLLECTION_CLIENT_SCHEMAS = 'process.env.MONGODB_COLLECTION_CLIENT_SCHEMAS';
		process.env.MONGODB_DATABASE_GLOBAL = 'process.env.MONGODB_DATABASE_GLOBAL';

		it('Should run happy path', async ()=> {
			const request = mockRequest();
			await runHappyPath(request);
		})

		it('Should run happy path create SSO false', async ()=> {
			const request = {
				headers: {"Access-Control-Allow-Origin": "*"},
				body: JSON.stringify(createClientOrchMock.mockCreateSSO),
					statusCode: 200
			};
			await runHappyPath(request);
		});

		it('Should run happy path error create client global', async ()=> {
			const lambdaSinon = sinon.stub(lambdaService, 'invokeLambda');
			const request = {
				headers: {"Access-Control-Allow-Origin": "*"},
				body: JSON.stringify(createClientOrchMock.mockCreateSSO),
				statusCode: 200
			};
			sinon.stub(searchService, 'search').resolves([{client_structure: clientStructureSchema.mock}]);
			sinon.stub(zipcodeService, 'retrieveStateByZipcode').withArgs("01001").resolves({
				state: 'usa',
				city: 'california'
			});
			lambdaSinon.onFirstCall().resolves({
				statusCode: 500
			});
			const res = await createClientOrch.client(request);
			expect(res.statusCode).to.equal(400);
		});

		it('Should return error 400 Client schema not found', async ()=> {
			const request = mockRequest();
			sinon.stub(searchService, 'search').resolves([]);
			const res = await createClientOrch.client(request);
			expect(res.statusCode).to.equal(400);
			expect(res.body).to.be.an('string');
		})

		it('Should return error 400 City and/or State not found', async ()=> {
			const request = mockRequest();
			sinon.stub(searchService, 'search').resolves([{client_structure: clientStructureSchema.mock}]);
			sinon.stub(zipcodeService, 'retrieveStateByZipcode').withArgs("01001").resolves(null);
			sinon.stub(restrictsAge, 'restrictsAge').withArgs("1992-09-45",{"ageGateMin": 25, "ageGateMax": 100}).resolves(30);
			const res = await createClientOrch.client(request);
			expect(res.statusCode).to.equal(400);
			expect(res.body).to.be.an('string');
			expect(JSON.parse(res.body).message).to.equal('Age is no permitted');
		})
	});
	describe('Create client Orch service runtimeError', ()=> {
		it('Error in search service', async ()=> {
			const request = mockRequest();
			sinon.stub(searchService, 'search').rejects(
				{body: {error: 'error'}, apiCode: 101, statusCode: 500, status: 'error'});
			const res = await createClientOrch.client(request);
			expect(res.statusCode).to.equal(500);
			expect(res.body).to.be.an('string');
			expect(JSON.parse(res.body).message).to.equal('Internal Server Error');
		})
	});
	const runHappyPath = async (request) => {
		sinon.stub(searchService, 'search').resolves([{client_structure: clientStructureSchema.mock}]);
		sinon.stub(zipcodeService, 'retrieveStateByZipcode').withArgs("01001").resolves({
			state: 'usa',
			city: 'california'
		});
		sinon.stub(lambdaService, 'invokeLambda').resolves({
			statusCode: 201
		});
		const res = await createClientOrch.client(request);
		expect(res.statusCode).to.equal(400);
	}

	const mockRequest = () => {
		return {
			headers: {"Access-Control-Allow-Origin": "*"},
			body: JSON.stringify(createClientOrchMock.mock),
			statusCode: 200
		};
	}
})
