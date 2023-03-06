const sinon = require('sinon');
const expect = require("chai").expect;
const timeService = require('../../functions/getDayLastLogin');

describe('getDayLastLogin util',  ()=> {
	let sandbox;
	beforeEach(()=> {
		sandbox = sinon.createSandbox();
	})
	afterEach(() => {
		sandbox.restore();
		sinon.restore();
	});
	describe('getDayLastLogin', ()=> {
		it('Should run happy path', async ()=> {
			const res = await timeService.getDayLastLogin([ { client: { name: 'leidy' }, user_id_sessionm: 1234 } ],
				'America/Mexico_City');
			console.log('res: ', res);
		});
	});
	describe('runtime error', ()=>{
		it('Should return 0 error', async ()=> {
			const res = await timeService.getDayLastLogin(undefined,
				'America/Mexico_City');
			console.log('res: ', res);
			expect(res).to.be.a('number');
		});
	});
});
