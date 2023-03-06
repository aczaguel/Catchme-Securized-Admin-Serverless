const sinon = require('sinon');
const expect = require("chai").expect;
const clientUpdateOrch = require('../../../controllers/client/Rewards-Client-Update-Orch');
const clientUpdateOrchMock = require('../mocks/client/Rewards-Client-Update-Orch.json');
const searchService = require('../../../dao/search');
const searchClientStructure = require('../mocks/client/Client-Structure-Schema.json');
const schemaValidator = require('../../../validations/schemaValidator');
const lambdaService =  require('../../../services/invokeLambda');
const schemaService =  require('../../../functions/createSchema');
const userValidator = require('../../../functions/validateUser');
const zipcodeService = require('../../../functions/retrieveStateByZipcode');

describe('Rewards-Client-Update-Orch function',  ()=> {
	let sandbox;
	beforeEach(()=> {
		sandbox = sinon.createSandbox();
	})
	afterEach(() => {
		sandbox.restore();
		sinon.restore();
	});
	describe('Rewards Client Update Orch', ()=> {
		it('Should run happy path', async ()=> {
			mockHappyPath();
			const res = await clientUpdateOrch.client(clientUpdateOrchMock.mock);
			console.log('res: ', res);
			expect(res.statusCode).to.equal(200);
		});
		it('Should validate request', async ()=> {
			mockHappyPath();
			const res = await clientUpdateOrch.client(clientUpdateOrchMock.mockWithoutHeaders);
			console.log('res: ', res);
			expect(res.statusCode).to.equal(200);
		});

		it('Should return Client Schema not found 400', async ()=> {
			sinon.stub(searchService, 'search').resolves([]);
			sinon.stub(schemaValidator, 'validateSchema').resolves();
			sinon.stub(lambdaService, 'invokeLambda').resolves({
				"statusCode": 200,
				"headers": {
					"Access-Control-Allow-Origin": "*"
				},
				"body": "{\"status\":\"Success\",\"statusCode\":200,\"apicode\":102,\"message\":\"Client updated\"}"
			});
			sinon.stub(schemaService, 'createSchema').resolves({result: 'result'});
			const res = await clientUpdateOrch.client(clientUpdateOrchMock.mockWithoutHeaders);
			console.log('res: ', res);
			expect(res.statusCode).to.equal(400);
			expect(JSON.parse(res.body).message).to.equal('Client Schema not found');
		});

		it('Should return 400 error City and/or State Not found', async ()=> {
			mockHappyPath();
			sinon.stub(zipcodeService, 'retrieveStateByZipcode').resolves(null);
			const res = await clientUpdateOrch.client(clientUpdateOrchMock.mockZipCode);
			console.log('res: ', res);
			expect(res.statusCode).to.equal(400);
			expect(JSON.parse(res.body).message).to.equal('City and/or State Not found');
		});

		it('Should validate zipcode and set state and city', async ()=> {
			mockHappyPath();
			const res = await clientUpdateOrch.client(clientUpdateOrchMock.mockZipCode);
			console.log('res: ', res);
			expect(res.statusCode).to.equal(200);
		});
	})
	describe('Rewards Client Update Orch runtime error', ()=>{
		it('Should 500 error', async ()=> {
			sinon.stub(searchService, 'search').rejects({body:{error: 'error'}});
			const res = await clientUpdateOrch.client(clientUpdateOrchMock.mockZipCode);
			console.log('res: ', res);
			expect(res.statusCode).to.equal(500);
		});
	});

	const mockHappyPath = () => {
		sinon.stub(searchService, 'search').resolves(searchClientStructure.mock);
		sinon.stub(schemaValidator, 'validateSchema').resolves();
		sinon.stub(lambdaService, 'invokeLambda').resolves({
			"statusCode": 200,
			"headers": {
				"Access-Control-Allow-Origin": "*"
			},
			"body": "{\"status\":\"Success\",\"statusCode\":200,\"apicode\":102,\"message\":\"Client updated\"}"
		});
		sinon.stub(schemaService, 'createSchema').resolves({result: 'result'});
	}
});
