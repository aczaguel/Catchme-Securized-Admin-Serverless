const sinon = require('sinon');
const expect = require("chai").expect;
const AWSMock = require('aws-sdk-mock');
const insertService = require('../../../dao/insert');
const clientLoginFrequencyInsertMock = require('../mocks/clientLoginFrequency/Rewards-Client-Login-Frequency-Insert.json');
const clientLoginFrequencyInsert = require('../../../controllers/clientLoginFrequency/Rewards-Client-Login-Frequency-Insert');
const insertMock = require('../mocks/clientLoginFrequency/insert.json');
const searchMock = require('../mocks/clientLoginFrequency/search.json')
const searchService = require('../../../dao/search');
const schemaService = require('../../../validations/schemaValidator');
const userValidator = require('../../../functions/validateUser');

describe('Rewards-Client-Login-Frequency-Insert function',  ()=> {
	let sandbox;
	process.env.SQS_EVENTS_REWARDS_ENGINE = 'https://sqs.us-east-1.amazonaws.com/123456789012/client_events.fifo';
	beforeEach(()=> {
		sandbox = sinon.createSandbox();
	})
	afterEach(() => {
		sandbox.restore();
		sinon.restore();
	});
	describe('Rewards Client Login Frequency Insert', ()=> {
		it('Should run happy path', async ()=> {
			mockHappyPath();
			const res = await clientLoginFrequencyInsert.client(clientLoginFrequencyInsertMock.mock);
			expect(res.statusCode).to.equal(201);
		});
		
	});
	describe('Rewards Client Login Frequency Insert', ()=> {
		it('User does not exist', async ()=> {
			const res = await clientLoginFrequencyInsert.client(clientLoginFrequencyInsertMock.mock);
			expect(res.statusCode).to.equal(400);
		});
		
	});
	describe('runtime error', ()=>{
		it('Should return 500 error', async()=> {
			sinon.stub(schemaService, 'validateSchema').rejects({body: {error: 'error mock'}});
			const res = await clientLoginFrequencyInsert.client(clientLoginFrequencyInsertMock.mock);
			expect(res.statusCode).to.equal(500);
			expect(JSON.parse(res.body).message).to.equal('Internal Server Error');
			expect(JSON.parse(res.body).error).to.equal('error mock');

		});
		it('Should return 500 without error in response', async ()=> {
			sinon.stub(schemaService, 'validateSchema').rejects();
			const res = await clientLoginFrequencyInsert.client(clientLoginFrequencyInsertMock.mock);
			expect (res.statusCode).to.equal(500);
			expect(JSON.parse(res.body).message).to.equal('Error');
			expect(JSON.parse(res.body)).to.not.have.any.keys('error');
		});
	});
	const mockHappyPath = () => {
		sinon.stub(insertService, 'insert').resolves(insertMock.mock);
		sinon.stub(schemaService, 'validateSchema').resolves();
		sinon.stub(searchService, 'search').resolves(searchMock.mock)
		AWSMock.mock('SQS', 'sendMessage', ()=> Promise.resolve({}));
	};
})
