const sinon = require('sinon');
const expect = require("chai").expect;
const searchService = require('../../../dao/search');
const APIService = require('../../../services/consumeAPI');
const updateService = require('../../../dao/update');
const AWSService =  require('../../../functions/getSecretManager');
const historicalInsertClient = require('../../../controllers/historical/Rewards-Client-Historical-Insert-SSO');
const historicalInsertClientMock = require('../mocks/historical/Rewards-Client-Historical-Insert-SSO.json');
const userValidator = require('../../../functions/validateUser');

describe('Rewards-Client-Historical-Insert-SSO function',  ()=> {
	let sandbox;
	beforeEach(()=> {
		sandbox = sinon.createSandbox();
	})
	afterEach(() => {
		sandbox.restore();
		sinon.restore();
	});
	describe('Rewards Client Historical Insert SSO', ()=> {
		it('Should run happy path', async()=> {
			await runHappyPath(historicalInsertClientMock.mock);
		});
		it('Should run happy path without headers', async()=> {
			await runHappyPath(historicalInsertClientMock.mockWithoutHeaders);
		});
		it('Should return 401 error', async ()=> {
			sinon.stub(userValidator, 'validateUser').resolves(false);
			const res = await historicalInsertClient.action(historicalInsertClientMock.mock);
			console.log('res: ', res)
			const body = JSON.parse(res.body);
			expect(res.statusCode).to.equal(401);
			expect(body.message).to.equal('Unauthorized');
		});
		it('Should return client not found', async ()=> {
			sinon.stub(searchService, 'search').resolves([]);
			const res = await historicalInsertClient.action(historicalInsertClientMock.mock);
			const body = JSON.parse(res.body);
			expect(res.statusCode).to.equal(400);
			expect(body.message).to.equal('Historical Client not found');
		});
		it('Should return 500 error to create client in SSO Global ', async ()=> {
			sinon.stub(searchService, 'search').resolves(historicalInsertClientMock.results);
			const APIStub = sinon.stub(APIService, 'consumeAPI');
			mockHappyPathAWS();
			APIStub.resolves({statusCode: 500, body:{message: 'error'}});
			await mockInternalServer();
		});
		it('Should return 500 error in cosume  SessionM ', async ()=> {
			sinon.stub(searchService, 'search').resolves(historicalInsertClientMock.results);
			const APIStub = sinon.stub(APIService, 'consumeAPI');
			mockHappyPathAWS();
			APIStub
				.resolves(historicalInsertClientMock.APIFirstResponse);
			APIStub.withArgs({"url":"undefinedprocess.1324.3ce76418-82df-11ec-8838-ed9a9444e795","method":"PUT","data":{"user":{"phone_numbers":[{"phone_number":"573004666255","phone_type":"mobile","preference_flags":["primary"]}]}},"auth":{"username":"1324","password":"aef34513ef"}})
				.resolves({statusCode: 500, body:{message: 'error'}});
			await mockInternalServer();
		});
		const mockInternalServer = async () => {
			const res = await historicalInsertClient.action(historicalInsertClientMock.mock);
			const body = JSON.parse(res.body);
			expect(res.statusCode).to.equal(500);
			expect(body.statusCode).to.equal(500);
		}
	})
	describe('runtime error', ()=>{
		it('Should return 500 error search service', async ()=> {
			mockHappyPathAWS();
			sinon.stub(searchService, 'search').rejects(
				{apiCode: 101, message: 'error message', statusCode: 501, status: 'error', body: {error: 'message error'}});
			const res = await historicalInsertClient.action(historicalInsertClientMock.mock);
			const body = JSON.parse(res.body);
			expect(res.statusCode).to.equal(501);
			expect(body.statusCode).to.equal(501);
		});
		it('Should return 500 error without errors', async ()=> {
			mockHappyPathAWS();
			sinon.stub(searchService, 'search').rejects({});
			const res = await historicalInsertClient.action(historicalInsertClientMock.mock);
			const body = JSON.parse(res.body);
			expect(res.statusCode).to.equal(500);
			expect(body.statusCode).to.equal(500);
		});
	});
	const runHappyPath = async  (mock) => {
		mockHappyPathAWS();
		sinon.stub(searchService, 'search').resolves(historicalInsertClientMock.results);
		sinon.stub(APIService, 'consumeAPI').resolves({statusCode: 200});
		sinon.stub(updateService, 'updateData').resolves();
		const res = await historicalInsertClient.action(mock);
		const body = JSON.parse(res.body);
		expect(res.statusCode).to.equal(201);
		expect(body.statusCode).to.equal(201);
	}
	const mockHappyPathAWS = () => {
		process.env.REWARDS_ENGINE_RELATIVE_URL_UPDATE = 'process.{apikeySessionM}.{user_id}';
		process.env.SSO_RELATIVE_URL_SINGUP = 'process.env.SSO_RELATIVE_URL_SINGUP';
		sinon.stub(AWSService, 'getSecretManager')
			.resolves({connect_api_key: '1324', connect_api_secret: 'aef34513ef'});
	}
});
