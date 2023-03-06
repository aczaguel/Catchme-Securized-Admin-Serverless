const sinon = require('sinon');
const expect = require("chai").expect;
const AWSService =  require('../../functions/getSecretManager');
const transformCustomProfile = require('../../functions/dataTransformCreateCustomProfileAttributesSessionM');
const transformCustomProfileMock = require('./mocks/dataTransformCreateCustomProfileAttributesSessionM.json');

describe('dataTransformCreateCustomProfileAttributesSessionM util',  ()=> {
	let sandbox;
	beforeEach(()=> {
		sandbox = sinon.createSandbox();
	})
	afterEach(() => {
		sandbox.restore();
		sinon.restore();
	});
	describe('dataTransformCreateCustomProfileAttributesSessionM', ()=> {
		it('Should run happy path', async ()=> {
			mockHappyPathAWS();
			const res = await transformCustomProfile(transformCustomProfileMock.mock, "01b87b04-842c-11ec-979b-13619444e795", "POST")
			expect(res.data).to.be.an('object');
		});
	});
	describe('runtime error', ()=>{
		it('Should return aws error', async ()=> {
			const res = await transformCustomProfile(transformCustomProfileMock.mock, "01b87b04-842c-11ec-979b-13619444e795", "POST")
			expect(res).to.be.a('null');
		});
	});
	const mockHappyPathAWS = () => {
		process.env.REWARDS_ENGINE_RELATIVE_URL_CUSTOM_PROFILE_ATTRIBUTES = 'process.{user_id}.{apikeySessionM}';
		sinon.stub(AWSService, 'getSecretManager')
			.resolves({connect_api_key: '1324', connect_api_secret: 'aef34513ef'});
	}
});
