const {parseWSF, parseWSFStr, extractVBS} = require('../index');
var fs = require('fs');
var chai = require('chai');
var path = require('path');
var assert = chai.assert;
let wsfPath = path.join(__dirname, 'test.wsf');
let wsfJson1;
let wsfJson2;
let debug = process.env.DEBUG_LOG;
describe('Parse Tests', function() {

    it('Parse WSF File', function() {
        let outPath = path.join(__dirname, 'test_out.json');
        
        parseWSF(wsfPath, debug).then((jobs)=>{
            wsfJson1 = JSON.stringify(jobs, null, 2);
            if (debug) console.log("Json from file:", wsfJson1)
            else fs.writeFileSync(outPath, wsfJson1)
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
        let outPath = path.join(__dirname, 'test_out_str.json');
        parseWSFStr(xml, __dirname, debug).then((jobs)=>{
            wsfJson2 = JSON.stringify(jobs, null, 2);
            if (debug) console.log("Json from Str:", wsfJson2)
            else fs.writeFileSync(outPath, wsfJson2)
            assert.isArray(jobs);
            assert.equal(jobs[0].id, "job1")
            assert.equal(jobs[1].id, "job2")
        }).catch((error)=>{
            console.error(error)
        })
    })

});