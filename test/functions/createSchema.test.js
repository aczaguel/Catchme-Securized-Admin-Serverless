const sinon = require('sinon');
const expect = require("chai").expect;
const schemaService = require('../../functions/createSchema');
const schemaServiceMock = require('./mocks/createSchema.json');
const fs = require('fs');

describe('createSchema util',  ()=> {
	let sandbox;
	beforeEach(()=> {
		sandbox = sinon.createSandbox();
	})
	afterEach(() => {
		sandbox.restore();
		sinon.restore();
	});
	describe('createSchema', ()=> {
		it('Should run happy path', async ()=> {
			const res = await schemaService
				.createSchema(schemaServiceMock.mock, "body", "post", true);
			console.log('res: ', res);
			expect(res.properties.firstName.type).to.equal('string');

		})
		it('Should happy path with method put', async ()=> {
			const res = await schemaService
				.createSchema(schemaServiceMock.mock, "body", "put", true);
			console.log('res: ', res);
			expect(res.properties.firstName.type).to.equal('string');
		});
	})
	describe('runtime error', ()=>{
		it('Should return readFile error', async ()=> {
			sinon.stub(fs, 'readFileSync').throws(new Error('error'));
			const res = await schemaService
				.createSchema(schemaServiceMock.mock, "body", "put", true);
			console.log('res: ', res);
			expect(res).to.be.a('null');
		});
	});
});
