const sinon = require('sinon');
const expect = require("chai").expect;
const AWSService =  require('../../functions/getSecretManager');
const transformCustomer = require('../../functions/dataTransformCreateCustomerSessionM');
const transformCustomerMock = require('./mocks/dataTransformCreateCustomerSessionM.json');

describe('dataTransformCreateCustomerSessionM util',  ()=> {
	let sandbox;
	beforeEach(()=> {
		sandbox = sinon.createSandbox();
	})
	afterEach(() => {
		sandbox.restore();
		sinon.restore();
	});
	describe('dataTransformCreateCustomerSessionM', ()=> {
		it('Should run happy path', async ()=> {
			mockHappyPathAWS();
			const res = await transformCustomer(transformCustomerMock.mock, "61fa86fa5eafb900097b6dc5");
			console.log('res: ', res);
			expect(res.data).to.be.an('object');
		});
	})
	describe('runtime error', ()=>{
		it('Should return null aws error', async ()=> {
			await transformCustomer(transformCustomerMock.mock, "61fa86fa5eafb900097b6dc5").then(() => {
			}, error => {
				console.log('res: ', error);
				expect(error.data).to.be.a('null');
			});
		});
	});
	const mockHappyPathAWS = () => {
		process.env.REWARDS_ENGINE_RELATIVE_URL_CREATE = 'process.{apikeySessionM}';
		sinon.stub(AWSService, 'getSecretManager')
			.resolves({connect_api_key: '1324', connect_api_secret: 'aef34513ef'});
	}
});
