const sinon = require('sinon');
const expect = require("chai").expect;
const AWSService =  require('../../functions/getSecretManager');
const transformFetchAccounts = require('../../functions/dataTransformFetchAccountsSessionM');
const transformCustomerMock = require('./mocks/dataTransformFetchAccountsSessionM.json');

describe('dataTransformFetchAccountsSessionM util',  ()=> {
	let sandbox;
	beforeEach(()=> {
		sandbox = sinon.createSandbox();
	})
	afterEach(() => {
		sandbox.restore();
		sinon.restore();
	});
	describe('', ()=> {
		it('Should run happy path', async ()=> {
			mockHappyPathAWS();
			const res = await transformFetchAccounts(transformCustomerMock.mock);
			console.log('res: ', res);
			expect(res.data).to.be.an('object');
		});
	});
	describe('runtime error', ()=>{
		it('Should return aws error', async ()=> {
			const res = await transformFetchAccounts(transformCustomerMock.mock);
			expect(res).to.be.a('null');
		});
	});
	const mockHappyPathAWS = () => {
		process.env.REWARDS_ENGINE_RELATIVE_URL_FETCH_ACCOUNTS = 'process.{user_id}.{apikeySessionM}';
		sinon.stub(AWSService, 'getSecretManager')
			.resolves({connect_api_key: '1324', connect_api_secret: 'aef34513ef'});
	}
});
