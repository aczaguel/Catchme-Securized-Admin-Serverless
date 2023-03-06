const sinon = require('sinon');
const expect = require("chai").expect;
const fieldsValidator = require('../../functions/validateFieldsPosition');
const clientSchema = require('../controllers/mocks/client/Client-Structure-Schema.json');

describe('validateFieldsPosition util',  ()=> {
	let sandbox;
	beforeEach(()=> {
		sandbox = sinon.createSandbox();
	})
	afterEach(() => {
		sandbox.restore();
		sinon.restore();
	});
	describe('validateFieldsPosition', ()=> {
		it('Should validate same position', async ()=> {
			const res = await fieldsValidator.validateFieldsPosition(clientSchema.mock);
			console.log('res: ', res);
			expect(res.message).to.equal('One or more elements have the same position');
		});
		it('Should return true', async ()=> {
			const res = await fieldsValidator.validateFieldsPosition(clientSchema.mockWithDiffPos);
			console.log('res: ', res);
			expect(res).to.equal(true);
		});
	});
});
