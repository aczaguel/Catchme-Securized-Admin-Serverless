const sinon = require('sinon');
const expect = require("chai").expect;
const AWSService =  require('../../../functions/getSecretManager');
const APIService = require('../../../services/consumeAPI');
const searchService = require('../../../dao/search');
const updateService = require('../../../dao/update');
const insertService = require('../../../dao/insert');
const createClientSessionMMock = require('../mocks/clientSessionM/Rewards-Client-Create-SessionM.json');
const createClientSessionM = require('../../../controllers/clientSessionM/Rewards-Client-Create-SessionM');

describe('Rewards-Client-Create-SessionM function',  ()=> {
	let sandbox;
	beforeEach(()=> {
		sandbox = sinon.createSandbox();
	})
	afterEach(() => {
		sandbox.restore();
		sinon.restore();
	});
	describe('Rewards Client Create SessionM', ()=> {
		it('Should run happy path', async () => {
			await runHappyPath(createClientSessionMMock.mock);
		});
		it('Should run happy path with headers', async () => {
			await runHappyPath(createClientSessionMMock.mockWithHeaders);
		});
		it('Should return error in create client in rewards engine', async ()=> {
			const searchStub = sinon.stub(APIService, 'consumeAPI');
			mockHappyPathAWS();
			sinon.stub(searchService, 'search').resolves(createClientSessionMMock.results);
			sinon.stub(updateService, 'updateData').resolves();
			sinon.stub(insertService, 'insert').resolves();
			searchStub
				.withArgs().resolves({statusCode: 500, body: {errors: 'error creating client', user: {id: '123234'}}});
			searchStub
				.withArgs(createClientSessionMMock.APISecondRequest).resolves(createClientSessionMMock.APISecondResponse);
			searchStub
				.withArgs({"url":"undefinedprocess.123234.1324","method":"GET","auth":{"username":"1324","password":"aef34513ef"}}).resolves(createClientSessionMMock.APIThirdResponse);
			searchStub
				.withArgs(createClientSessionMMock.APIFourthRequest).resolves(createClientSessionMMock.APIFourthResponse);
			searchStub
				.withArgs(createClientSessionMMock.APIFifthRequest).resolves(createClientSessionMMock.APIFifthResponse);

			const res =  await createClientSessionM.client(createClientSessionMMock.mockIdError);
			const body = JSON.parse(res.body);
			console.log('res: ', res);
			expect(res.statusCode).to.equal(201);
			expect(body.statusCode).to.equal(201);
			const resId =  await createClientSessionM.client(createClientSessionMMock.mock);
			const bodyId = JSON.parse(res.body);
			expect(resId.statusCode).to.equal(201);
			expect(bodyId.statusCode).to.equal(201);
		});
	})
	describe('runtime error', ()=>{
		it('Should return 500 error', async ()=> {
			sinon.stub(searchService, 'search').rejects({message: 'error', body: {statusCode: 501}, statusCode: 500});
			const res =  await createClientSessionM.client(createClientSessionMMock.mock);
			const body = JSON.parse(res.body);
			expect(res.statusCode).to.equal(500);
			expect(body.statusCode).to.equal(501);
		});
		it('Should ', async ()=> {
			sinon.stub(searchService, 'search').rejects();
			const res =  await createClientSessionM.client(createClientSessionMMock.mock);
			expect(res.statusCode).to.equal(500);
		});
	});
	const runHappyPath = async (mock) => {
		mockHappyPath();
		const res =  await createClientSessionM.client(mock);
		const body = JSON.parse(res.body);
		expect(res.statusCode).to.equal(201);
		expect(body.statusCode).to.equal(201);
	}
	const mockHappyPath = () => {
		const searchStub = sinon.stub(APIService, 'consumeAPI');
		sinon.stub(searchService, 'search').resolves(createClientSessionMMock.results);
		sinon.stub(updateService, 'updateData').resolves();
		searchStub
			.withArgs().resolves(createClientSessionMMock.APIFirstResponse);
		searchStub
			.withArgs(createClientSessionMMock.APISecondRequest).resolves(createClientSessionMMock.APISecondResponse);
		searchStub
			.withArgs(createClientSessionMMock.APIThirdRequest).resolves(createClientSessionMMock.APIThirdResponse);
		searchStub
			.withArgs(createClientSessionMMock.APIFourthRequest).resolves(createClientSessionMMock.APIFourthResponse);
		searchStub
			.withArgs(createClientSessionMMock.APIFifthRequest).resolves(createClientSessionMMock.APIFifthResponse);
		mockHappyPathAWS();
	}

	const mockHappyPathAWS = () => {
		process.env.REWARDS_ENGINE_RELATIVE_URL_CUSTOM_PROFILE_ATTRIBUTES = 'process.{user_id}.{apikeySessionM}';
		process.env.REWARDS_ENGINE_RELATIVE_URL_SEARCH_USER = 'process.{user_id}.{apikeySessionM}';
		process.env.REWARDS_ENGINE_RELATIVE_URL_CREATE = 'process.{apikeySessionM}';
		process.env.REWARDS_ENGINE_RELATIVE_URL_FETCH_ACCOUNTS = 'process.env.REWARDS_ENGINE_RELATIVE_URL_FETCH_ACCOUNTS';
		process.env.REWARDS_ENGINE_RELATIVE_URL_FETCH_TIERS = 'process.env.REWARDS_ENGINE_RELATIVE_URL_FETCH_TIERS';
		sinon.stub(AWSService, 'getSecretManager')
			.resolves({connect_api_key: '1324', connect_api_secret: 'aef34513ef'});
	}
});
