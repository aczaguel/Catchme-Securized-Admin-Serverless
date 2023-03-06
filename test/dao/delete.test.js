const sinon = require('sinon');
require('sinon-mongo');
const expect = require("chai").expect;
const deleteService = require('../../dao/delete');
const getSecretManager =  require('../../functions/getSecretManager');

describe('delete DAO',  ()=> {
	let sandbox;
	beforeEach(()=> {
		sandbox = sinon.createSandbox();
	});
	afterEach(() => {
		sandbox.restore();
		sinon.restore();
	});
	describe('delete',  ()=> {
		it('Should run happy path', async()=> {
			process.env.MONGODB_URI = 'mongodb://${1}:${2}@${3}/${4}?retryWrites=true&w=majority';
			const filter = {"_id":"6198007bc985d50009db1324"};
			const mockMongoClient = sinon.mongo.mongoClient({
				reporting: sinon.mongo.db('mongoclients')
			});
			mockMongoClient.db.withArgs('mongoclients').returns({the: 'mock database'});

			mockMongoClient.connect().then(mongoClient =>
				mongoClient.db('mongoclients').collection({
					deleteOne: sinon.stub().withArgs(filter).resolves({value: {a: 'mock object'}})
				}));
			const connection = {
				user: 'leidy',
				password: '1234',
				cluster: 'awscluster',
				database: 'mongoclients'
			}
			sinon.stub(getSecretManager, 'getSecretManager').resolves(connection);
			//const res = await deleteService.deleteClient('client_schemas', filter, 'rewards_global');
			//console.log('res: ', res);
		});
	});
});
