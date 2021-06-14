const {parseWSF, parseWSFStr, extractVBS} = require('../index');
var fs = require('fs');
var chai = require('chai');
var assert = chai.assert;
let wsfPath = __dirname + '/test.wsf';
let wsfJson;
describe('Parse Tests', function() {

    it('Parse WSF File', function() {
        parseWSF(wsfPath).then((jobs)=>{
            console.log('\r\nparsed WSF file:')
            console.log(jobs);
            wsfJson = jobs;
            assert.isArray(jobs);
            assert.equal(jobs[0].id, "job1")
            assert.equal(jobs[1].id, "job2")
        }).catch((error)=>{
            console.error(error)
        })
    })

    it('Parse WSF File Content', async function() {
        let xml = await fs.readFileSync(wsfPath).toString();
        assert.equal(xml.substr(0, 5), '<?xml')
        parseWSFStr(xml).then((jobs)=>{
            console.log('\r\nparsing wsf content:')
            console.log(jobs)
            assert.isArray(jobs);
            assert.equal(jobs[0].id, "job1")
            assert.equal(jobs[1].id, "job2")
        }).catch((error)=>{
            console.error(error)
        })
    })

    it('Vb extract', function() {
        let vbs = extractVBS(wsfJson);
        console.log('\r\nextracted vbs from wsf')
        console.log(vbs);
        assert.include(vbs, 'WScript.Echo')
    })
});