const sinon = require('sinon');
const expect = require("chai").expect;
const APIService = require('../../../services/consumeAPI');
const AWSService =  require('../../../functions/getSecretManager');
const searchClientSessionM = require('../../../controllers/clientSessionM/Rewards-Client-Search-SessionM');
const searchClientSessionMMock = require('../mocks/clientSessionM/Rewards-Client-Search-SessionM.json');

describe('Rewards-Client-Search-SessionM function',  ()=> {
	let sandbox;
	beforeEach(()=> {
		sandbox = sinon.createSandbox();
	})
	afterEach(() => {
		sandbox.restore();
		sinon.restore();
	});
	describe('Rewards Client Search SessionM', ()=> {
		it('Should run happy path', async ()=> {
			mockHappyPathAWS();
			sinon.stub(APIService, 'consumeAPI').resolves(searchClientSessionMMock.APIResponse);
			await runHappyPath(searchClientSessionMMock.mock);
		});
		it('Should return api error', async ()=> {
			mockHappyPathAWS();
			sinon.stub(APIService, 'consumeAPI').resolves(searchClientSessionMMock.APIErrorMock);
			const res = await searchClientSessionM.client(searchClientSessionMMock.mock);
			const body = JSON.parse(res.body);
			expect(res.statusCode).to.equal(500);
			expect(body.statusCode).to.equal(500);
			expect(body.status).to.equal('Error');
		});
		it('Should run happy path with headers', async () => {
			mockHappyPathAWS();
			sinon.stub(APIService, 'consumeAPI').resolves(searchClientSessionMMock.APIResponse);
			await runHappyPath(searchClientSessionMMock.mockWithoutHeaders);
		});
	});
	describe('runtime error', ()=>{
		it('Should return 500 error', async ()=> {
			sinon.stub(APIService, 'consumeAPI').rejects(searchClientSessionMMock.APIErrorMock);
			const res = await searchClientSessionM.client(searchClientSessionMMock.mock);
			const body = JSON.parse(res.body);
			expect(res.statusCode).to.equal(500);
			expect(body.status).to.equal('error');
			expect(body).to.has.any.keys('errors');
		});
		it('Should eturn 500 error with body', async ()=> {
			sinon.stub(APIService, 'consumeAPI').rejects({message: 'error message'});
			const res = await searchClientSessionM.client(searchClientSessionMMock.mock);
			const body = JSON.parse(res.body);
			expect(res.statusCode).to.equal(500);
			expect(body.message).to.equal('Error in search customer in engine');
		});
	});
	const mockHappyPathAWS = () => {
		process.env.REWARDS_ENGINE_RELATIVE_URL_SEARCH = 'process.{user_id}.{apikeySessionM}';
		sinon.stub(AWSService, 'getSecretManager')
			.resolves({connect_api_key: '1324', connect_api_secret: 'aef34513ef'});
	}
	const runHappyPath = async (mock) => {
		const res = await searchClientSessionM.client(mock);
		const body = JSON.parse(res.body);
		expect(res.statusCode).to.equal(200);
		expect(body.statusCode).to.equal(200);
		expect(body).to.has.any.keys('data');
	}
});
