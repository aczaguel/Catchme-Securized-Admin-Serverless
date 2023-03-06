const sinon = require('sinon');
const expect = require("chai").expect;
const clientCreateGlobal = require('../../../controllers/client/Rewards-Client-Create-Global');
const createClientGlobalNewMock = require('../mocks/client/Rewards-Client-Create-Global-New.json');
const searchClient = require('../../../dao/search');
const termsAndConditionsService = require ('../../../functions/mapTermsAndConditions');
const SSOService = require('../../../functions/dataTransformSignUpClientSSO');
const APIService = require('../../../services/consumeAPI');
const insertService = require('../../../dao/insert');
const lambdaService =  require('../../../services/invokeLambda');

describe('CreateClientGlobal function service',  ()=> {
	let sandbox;
	beforeEach(()=> {
		sandbox = sinon.createSandbox();
	})
	afterEach(() => {
		sandbox.restore();
		sinon.restore();
	});

	describe('Create client global service success',  ()=> {
		it('Should run happy path', async ()=> {
			const mock = createClientGlobalNewMock.mock;
			mock.external_id = 1234;
			await runHappyPath(mock);
		});

		it('Should run happy path without TC', async ()=> {
			const mock = createClientGlobalNewMock.mockWithoutTC;
			await runHappyPath(mock);
		});

		it('Should return error 400, client already created', async()=> {
			const requestC = {
				body: JSON.stringify(createClientGlobalNewMock.mock),
				statusCode: 200
			};
			sinon.stub(searchClient, 'search').resolves([{client: 'testName'}]);
			const res = await clientCreateGlobal.client(requestC);
			expect(res.statusCode).to.equal(400);
		});
		it('Should return error 500, Error to create client in SSO Global', async ()=> {
			const requestC = {
				headers: {"Access-Control-Allow-Origin": "*"},
				body: JSON.stringify(createClientGlobalNewMock.mock),
				statusCode: 200
			};
			mockHappyPath();
			sinon.stub(APIService, 'consumeAPI').resolves({
				statusCode: 500,
				body: {
					message: 'error to consume api',
					error: 'error api'
				}
			});
			const res = await clientCreateGlobal.client(requestC);
			expect(res.statusCode).to.equal(500);
		});
		it('Should return error 500, Error to create client in SSO Global body error', async ()=> {
			const requestC = {
				headers: {"Access-Control-Allow-Origin": "*"},
				body: JSON.stringify(createClientGlobalNewMock.mock),
				statusCode: 200
			};
			mockHappyPath();
			sinon.stub(APIService, 'consumeAPI').resolves({
				statusCode: 500,
				body: {
					error: 'error api'
				}
			});
			const res = await clientCreateGlobal.client(requestC);
			expect(res.statusCode).to.equal(500);
		});
	});
	describe('Create client global service runtimeError',  ()=> {
		it('should catch consume API error', async () => {
			const requestC = {
				headers: {"Access-Control-Allow-Origin": "*"},
				body: JSON.stringify(createClientGlobalNewMock.mock),
				statusCode: 200
			};
			mockHappyPath();
			sinon.stub(APIService, 'consumeAPI').throws(new Error('Error to consume API'));
			const res = await clientCreateGlobal.client(requestC);
			expect(res.statusCode).to.equal(500);
			expect(JSON.parse(res.body).message).to.equal('Error to consume API');
		});
		it('should catch to search client in DB error', async () => {
			const requestC = {
				headers: {"Access-Control-Allow-Origin": "*"},
				body: JSON.stringify(createClientGlobalNewMock.mock),
				statusCode: 200
			};
			sinon.stub(searchClient, 'search').throws({apiCode: 101, statusCode: 500, status: 'error',body: {
				error: 'Error to search client in DB'
				}});
			const res = await clientCreateGlobal.client(requestC);
			expect(res.statusCode).to.equal(500);
			expect(JSON.parse(res.body).message).to.equal('Internal Server Error');
		});
	});
	const mockHappyPath = () => {
		sinon.stub(searchClient, 'search').resolves({});
		sinon.stub(termsAndConditionsService, 'mapAndValidateTermAndConditionsInBD').resolves([]);
		sinon.stub(SSOService, 'transformSSO').resolves([]);
	};
	const runHappyPath = async (mock) => {
		const requestC = {
			headers: {"Access-Control-Allow-Origin": "*"},
			body: JSON.stringify(mock),
			statusCode: 200
		};
		mockHappyPath();
		sinon.stub(APIService, 'consumeAPI').resolves({
			statusCode: 200
		});
		sinon.stub(insertService, 'insert').resolves({});
		sinon.stub(lambdaService, 'invokeLambda').resolves();

		const res = await clientCreateGlobal.client(requestC);
		expect(res.statusCode).to.equal(201);
		expect(JSON.parse(res.body).message).to.equal('Client created');
	}
});
