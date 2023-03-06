const sinon = require('sinon');
const expect = require("chai").expect;
const clientSchema = require('../controllers/mocks/client/Client-Structure-Schema.json');
const fieldNameValidator = require('../../functions/validateRepeatedFields');

describe('validateRepeatedFields util',  ()=> {
	let sandbox;
	beforeEach(()=> {
		sandbox = sinon.createSandbox();
	})
	afterEach(() => {
		sandbox.restore();
		sinon.restore();
	});
	describe('validateRepeatedFields', ()=> {
		it('Should validate same position', async ()=> {
			const res = await fieldNameValidator.validateRepeatedFields(clientSchema.mock);
			expect(res.message).to.equal('One or more elements have the same field_name');
		});
		it('Should return true', async ()=> {
			const res = await fieldNameValidator.validateRepeatedFields(clientSchema.mockWithDiffPos);
			expect(res).to.equal(true);
		});
	});
});
