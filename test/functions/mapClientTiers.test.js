const sinon = require('sinon');
const expect = require("chai").expect;
const sessionMRes = require('../controllers/mocks/client/sessionMResponse.json');
const mapClient = require('../../functions/mapClientTiers');

describe('mapClientTiers util',  ()=> {
	let sandbox;
	beforeEach(()=> {
		sandbox = sinon.createSandbox();
	})
	afterEach(() => {
		sandbox.restore();
		sinon.restore();
	});
	describe('mapClientTiers', ()=> {
		it('Should run happy path', async ()=> {
			const req = JSON.parse(sessionMRes.mock.body);
			const res = await mapClient.mapClientTiers(req.data);
			expect(res).to.be.an('object');
		});
		it('Should run happy path', async ()=> {
			const req = JSON.parse(sessionMRes.mock.body);
			req.data.tier_details.tier_levels[0].next_tier_overview = {
				name: 'leidy'
			};
			const res = await mapClient.mapClientTiers(req.data);
			expect(res).to.be.an('object');
		});
	});
	describe('runtime error', ()=>{
		it('Should return null error', async ()=> {
			const res = await mapClient.mapClientTiers(undefined);
			expect(res).to.be.a('null');
		});
	});
});
