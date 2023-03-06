const sinon = require('sinon');
const expect = require("chai").expect;
const replaceParameters =  require('../../functions/replaceParameters');

describe('replaceParameters util',  ()=> {
	let sandbox;
	beforeEach(()=> {
		sandbox = sinon.createSandbox();
	})
	afterEach(() => {
		sandbox.restore();
		sinon.restore();
	});
	describe('replaceParameters', ()=> {
		it('Should run happy path', ()=> {
			const parameters = ['leidy', 'password', 'cluster', 'database'];
			const text = 'mongodb+srv://${1}:${2}@${3}/${4}?retryWrites=true&w=majority';
			const res = replaceParameters(text, parameters);
			expect(res).to.equal('mongodb+srv://leidy:password@cluster/database?retryWrites=true&w=majority');
		});
	});
	describe('runtime error', ()=>{
		it('Should ', async ()=> {
			const parameters = ['leidy', 'password', 'cluster', 'database'];
			const res = replaceParameters(undefined, parameters);
			expect(res).to.be.a('null');
		});
	});
});
