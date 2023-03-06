const sinon = require('sinon');
const expect = require("chai").expect;
const assert = require('chai').assert;
const historicalInsertClientMock = require('../controllers/mocks/historical/Rewards-Client-Historical-Insert-SSO.json');
const userValidator = require('../../functions/validateUser');

describe('validateUser util',  ()=> {
	let sandbox;
	beforeEach(()=> {
		sandbox = sinon.createSandbox();
	})
	afterEach(() => {
		sandbox.restore();
		sinon.restore();
	});
	describe('validateUser', ()=> {
		it('Should run happy path', async ()=> {
			const res = await userValidator.validateUser(historicalInsertClientMock.mock);
			assert.equal(res, true);
		})
		it('Should ', async ()=> {
			const res = await userValidator.validateUser(historicalInsertClientMock.mockWithoutHeadersUser);
			assert.equal(res, false);
		});
		it('Should ', async ()=> {
			const res = await userValidator.validateUser(historicalInsertClientMock.mockWithUserSame);
			assert.equal(res, true);
		});
	});
});
