const sinon = require('sinon');
const expect = require("chai").expect;
const schemaValidator = require('../../validations/schemaValidator');
const clientSchemaUpdateMock = require('../controllers/mocks/clientSchema/Rewards-Client-Schema-Update.json');

describe('schemaValidator util',  ()=> {
	let sandbox;
	beforeEach(()=> {
		sandbox = sinon.createSandbox();
	})
	afterEach(() => {
		sandbox.restore();
		sinon.restore();
	});
	describe('schemaValidator', ()=> {
		it('Should run happy path', async()=> {
			const data = { platform: 'Rewards_USA', program: 'MyCooler' }
			const esquema = {
				id: 'queryString',
					type: 'object',
					required: [ 'platform', 'program' ],
					properties: {
					platform: { type: 'string', pattern: '^(?![nN][uU][lL]{2}$)\\s*\\S.*' },
					program: { type: 'string', pattern: '^(?![nN][uU][lL]{2}$)\\s*\\S.*' },
					status: { type: 'string', enum: [Array] }
				}
			}
			const res = await schemaValidator.validateSchema(data, esquema);
			console.log('res: ', res);
			expect(res.statusCode).to.equal(200);
		});
		it('Should validate schema bad request', async ()=> {
			const data =  clientSchemaUpdateMock.mock;
			const esquema = {
				id: 'body',
					type: 'object',
					required: [ 'client_structure', 'update_user', 'platform', 'program' ],
					properties: {
					client_structure: { type: 'array', items: [Object] },
					update_user: { type: 'string', pattern: '^(?![nN][uU][lL]{2}$)\\s*\\S.*' },
					platform: { type: 'string', pattern: '^(?![nN][uU][lL]{2}$)\\s*\\S.*' },
					program: { type: 'string', pattern: '^(?![nN][uU][lL]{2}$)\\s*\\S.*' }
				},
				additionalProperties: false
			}
			try {
				await schemaValidator.validateSchema(data, esquema);
			}catch (e){
				console.log('res: ', e);
				expect(e.statusCode).to.equal(400);
			}
		});
	})
	describe('runtime error', ()=>{
		it('Should return 500 internal error', async ()=> {
			try {
				await schemaValidator.validateSchema(undefined, undefined);
			}catch (e) {
				expect(e.statusCode).to.equal(500);
			}
		});
	});
});
