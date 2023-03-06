const sinon = require('sinon');
const expect = require("chai").expect;
const termsAndConditionsService = require ('../../functions/mapTermsAndConditions');
const searchClientStructure = require('../controllers/mocks/client/Client-Structure-Schema.json');
const searchService = require('../../dao/search');

describe('mapTermsAndConditions util',  ()=> {
	let sandbox;
	beforeEach(()=> {
		sandbox = sinon.createSandbox();
	})
	afterEach(() => {
		sandbox.restore();
		sinon.restore();
	});
	describe('mapTermsAndConditions', ()=> {
		it('Should run happy path', async ()=> {
			sinon.stub(searchService, 'search').resolves(searchClientStructure.mock);
			const req = [{"platform":"sdfasdf","subplatform":"asdfag","url":"asdfs.com"}];
			const res = await termsAndConditionsService.mapAndValidateTermAndConditionsInBD(req);
			console.log('res: ', res);
			expect(res).to.be.an('array');
		});
		it('Should validate terms is an array', async ()=> {
			sinon.stub(searchService, 'search').resolves(searchClientStructure.mock);
			const req = {"platform":"Rewards_USA","subplatform":"MyCooler"};
			const res = await termsAndConditionsService.mapAndValidateTermAndConditionsInBD(req);
			console.log('res: ', res);
			expect(res).to.be.an('array');
		});
		it('Should validate terms is not an array', async ()=> {
			sinon.stub(searchService, 'search').resolves([]);
			const req = {"platform":"Rewards_USA","subplatform":"MyCooler"};
			try {
				await termsAndConditionsService.mapAndValidateTermAndConditionsInBD(req);
			} catch (e) {
				expect(e).to.be.an('object');
			}
		});
	})
	describe('runtime error', ()=>{
		it('Should throw error', async ()=> {
			sinon.stub(searchService, 'search').rejects({message: 'error message'});
			const req = {"platform":"Rewards_USA","subplatform":"MyCooler"};
			try {
				await termsAndConditionsService.mapAndValidateTermAndConditionsInBD(req);
			} catch (e) {
				expect(e).to.be.an('object');
			}
		});
		it('Should throw error with api code', async ()=> {
			sinon.stub(searchService, 'search').rejects({message: 'error message', apiCode: 101});
			const req = {"platform":"Rewards_USA","subplatform":"MyCooler"};
			try {
				await termsAndConditionsService.mapAndValidateTermAndConditionsInBD(req);
			} catch (e) {
				expect(e).to.be.an('object');
			}
		});
	});
});
