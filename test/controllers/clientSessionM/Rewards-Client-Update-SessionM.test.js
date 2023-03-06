const sinon = require('sinon');
const expect = require("chai").expect;
const AWSService =  require('../../../functions/getSecretManager');
const APIService = require('../../../services/consumeAPI');
const insertService = require('../../../dao/insert');
const updateClientSessionMock = require('../mocks/clientSessionM/Rewards-Client-Update-SessionM.json');
const updateClientSession = require('../../../controllers/clientSessionM/Rewards-Client-Update-SessionM');

describe('Rewards-Client-Update-SessionM function',  ()=> {
	let sandbox;
	beforeEach(()=> {
		sandbox = sinon.createSandbox();
	})
	afterEach(() => {
		sandbox.restore();
		sinon.restore();
	});
	describe('Rewards Client Update SessionM', ()=> {
		it('Should run happy path', async ()=> {
			mockHappyPathAWS();
			sinon.stub(APIService, 'consumeAPI').resolves({statusCode: 200});
			const res = await updateClientSession.client(updateClientSessionMock.mock);
			const body = JSON.parse(res.body);
			expect(res.statusCode).to.equal(201);
			expect(body.status).to.equal('Updated');
			const resHeaders = await updateClientSession.client(updateClientSessionMock.mockWithHeaders);
			const bodyHeaders = JSON.parse(res.body);
			expect(resHeaders.statusCode).to.equal(201);
			expect(bodyHeaders.status).to.equal('Updated');
		})
		it('Should return error in create client in rewards engine', async ()=> {
			mockHappyPathAWS();
			sinon.stub(APIService, 'consumeAPI').resolves({statusCode: 500, body: {errors: ''}});
			sinon.stub(insertService, 'insert').resolves();
			const res = await updateClientSession.client(updateClientSessionMock.mock);
			const body = JSON.parse(res.body);
			expect(res.statusCode).to.equal(201);
			expect(body.status).to.equal('Updated');
		});
	})
	describe('runtime error', ()=>{
		it('Should return 500 error with body', async ()=> {
			mockHappyPathAWS();
			sinon.stub(APIService, 'consumeAPI').rejects({body: {error: 'error message'}});
			const res = await updateClientSession.client(updateClientSessionMock.mock);
			const body = JSON.parse(res.body);
			expect(res.statusCode).to.equal(500);
			expect(body.error).to.equal('error message');
		});
	});

	const mockHappyPathAWS = () => {
		process.env.REWARDS_ENGINE_RELATIVE_URL_UPDATE = 'process.{apikeySessionM}.{user_id}';
		process.env.REWARDS_ENGINE_RELATIVE_URL_CUSTOM_PROFILE_ATTRIBUTES = 'asdfasdf{apikeySessionM}asdf{user_id}';
		sinon.stub(AWSService, 'getSecretManager')
			.resolves({connect_api_key: '1324', connect_api_secret: 'aef34513ef'});
	}
});
