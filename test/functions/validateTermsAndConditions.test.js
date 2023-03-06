const sinon = require('sinon');
const expect = require("chai").expect;
const termsAndConditionsValidator = require('../../functions/validateTermsAndConditions');
const searchService = require('../../dao/search');

describe('validateTermsAndConditions util',  ()=> {
	let sandbox;
	beforeEach(()=> {
		sandbox = sinon.createSandbox();
	})
	afterEach(() => {
		sandbox.restore();
		sinon.restore();
	});
	describe('validateTermsAndConditions', ()=> {
		it('Should run happy path', async ()=> {
			sinon.stub(searchService, 'search').resolves([{test: 'test'}]);
			const req = [{
				platform: 'test1',
				subplatform: 'test2'
			}];
			const res = await termsAndConditionsValidator.validateTermsAndConditions(req);
			console.log('res: ', res);
			expect(res).to.equal(true);
		})
		it('Should return Not found terms and conditions', async ()=> {
			sinon.stub(searchService, 'search').resolves([]);
			const req = [{
				platform: 'test1',
				subplatform: 'test2'
			}];
			try {
				await termsAndConditionsValidator.validateTermsAndConditions(req);
			} catch (e) {
				console.log('res: ', res);
				expect(e.apiCode).to.equal(40);
			}
		});
	});
});
