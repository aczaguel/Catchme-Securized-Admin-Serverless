const sinon = require('sinon');
const expect = require("chai").expect;
const zipcodeService = require('../../functions/retrieveStateByZipcode');
const searchService = require('../../dao/search');

describe('retrieveStateByZipcode util',  ()=> {
	let sandbox;
	beforeEach(()=> {
		sandbox = sinon.createSandbox();
	})
	afterEach(() => {
		sandbox.restore();
		sinon.restore();
	});
	describe('retrieveStateByZipcode', ()=> {
		it('Should run happy path',  async ()=> {
			sinon.stub(searchService, 'search').resolves([{city: 'New York', state: 'usa'}]);
			const res = await zipcodeService.retrieveStateByZipcode('010010');
			console.log('res: ', res);
			expect(res.city).to.equal('New York');
		});
		it('Should ',  async ()=> {
			sinon.stub(searchService, 'search').resolves([]);
			const res = await zipcodeService.retrieveStateByZipcode('010010');
			console.log('res: ', res);
			expect(res).to.be.a('null');
		});
	});
	describe('runtime error', ()=>{
		it('Should run happy path',  async ()=> {
			sinon.stub(searchService, 'search').rejects({});
			const res = await zipcodeService.retrieveStateByZipcode('010010');
			console.log('res: ', res);
			expect(res).to.be.a('null');
		});
	});
});
