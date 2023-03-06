const sinon = require('sinon');
const expect = require("chai").expect;
const secretManager = require('../../functions/getSecretManager');
const AWSMock = require('aws-sdk-mock');

describe('getSecretManager service',  ()=> {
	let sandbox;
	beforeEach(()=> {
		sandbox = sinon.createSandbox();
	})
	afterEach(() => {
		sandbox.restore();
		sinon.restore();
		AWSMock.restore('SecretsManager');
	});
	describe('getSecretManager', ()=> {
		it('Should run happy path', async ()=> {
			const SecretString = {
				user: 'leidy',
				password: '1234',
				cluster: 'awscluster',
				database: 'mongoclients'
			}
			AWSMock.mock('SecretsManager', 'getSecretValue', {
				ARN: 'secretIdName',
				Name: 'secretIdName',
				VersionId: '262740a1-3455-40b4-bedb-13213',
				SecretString: JSON.stringify(SecretString),
				VersionStages: ['AWSCURRENT'],
				CreatedDate: '2021-01-21T07:56:31.646Z',
			});
			const res = await secretManager.getSecretManager('secret_id');
			console.log('res: ', res);
			expect(res.user).to.equal('leidy');
		});
	});
	describe('runtime error',  ()=>{
		it('Should ', async ()=> {
			AWSMock.mock('SecretsManager', 'getSecretValue', 1234);
			const res = await secretManager.getSecretManager('secret_id');
			console.log('res: ', res);
			expect(res).to.be.a('null');
		});
	});
});
