const sinon = require('sinon');
const expect = require("chai").expect;
const APIService = require('../../services/consumeAPI');
const request = require('../controllers/mocks/clientSessionM/Rewards-Client-Create-SessionM.json');
const axios = require('axios');
const searchService = require('../../dao/search');

describe('consumeAPI service',  ()=> {
	let sandbox;
	beforeEach(()=> {
		sandbox = sinon.createSandbox();
	})
	afterEach(() => {
		sandbox.restore();
		sinon.restore();
	});
	describe('consumeAPI util', ()=> {
		it('Should run happy path', async ()=> {
			//sinon.stub(searchService, 'search').resolves([{test: 'test'}]);
			//sinon.stub(axios, "post").resolves(request.APISecondRequest);
			const res = await APIService.consumeAPI(request.APISecondRequest);
			console.log('res: ', res);
		});
	});
});
