const fs = require('fs'),
    path = require('path'),
    async = require('async-waterfall'),
    parseString = require('xml2js').parseString;

// To import relative paths from the src tags in wsf file, 
// we need to know the base director of the wsf file
let _baseDir = '';
let debug = false;

String.prototype.htmlEscape = function htmlEscape(str) {
    //Ampersand	&	&amp;
    //Single Quote	'	&apos;
    //Double Quote	"	&quot;
    //Greater Than	>	&gt;
    //Less Than	<	&lt;
    const CHAR_AMP = '&amp;'
    const CHAR_SINGLE = '&apos;';
    // const CHAR_DOUBLE = '&quot;';
    // const CHAR_GT = '&gt;';
    // const CHAR_LT = '&lt;';

    // if the string is not provided, and if it's called directly on the string, we can access the text via 'this'
    if (!str) { str = this; }
    return str.replace(/\&/g, CHAR_AMP)
        .replace(/\'/g, CHAR_SINGLE)
        // .replace(/\"/g, CHAR_DOUBLE)
        // .replace(/\>/g, CHAR_GT)
        // .replace(/\</g, CHAR_LT);
};

const beingTaskFileVerification = (_path) => function(done) {
    if (!fs.existsSync(_path)) 
        return done(`File [${_path}] not found.`)
    let wsf = fs.readFileSync(_path).toString();
    if (!wsf) 
        return done(`File [${_path}] is empty.`)
    done(null, wsf)
};

const beginTaskWSFStrVerification = (wsf) => function(done) {
    if (!wsf) 
        return done(`empty wsf string.`)
    done(null, wsf)
}

const taskPrintWSFtoConsole = function(wsf, done) {
    if (debug) console.log(wsf)
    return done(null, wsf);
}

const taskParseWsfToXML = function(wsf, done) {
    wsf = wsf.htmlEscape();
    parseString(wsf, {normalize: false} ,function (err, json) {
        if (err)
            return done(err)
        if (!json)
            return done(`Parsed json is empty`)
        done(null, json);
    })
};

const taskPrintJSONtoConsole = function(json, done) {
    if (debug) console.log(JSON.stringify(json, null, 2))
    return done(null, json);
}

const taskVerifyRootTags = function(json, done) {
    let jobs = [];
    let { job, package } = json;
    if (!package && !job) {
        //No package or job found; possibly incorrect wsf
        return done(`No package or job root tag found.`)
    } else if (!package && job) {
        //Only job tag present
        jobs.push(extractJobTag(job))
    } else if (package) {
        //package is present
        //TODO: Need to find out how this async map gets returned
        let {job} = package;
        if (job) {
            job.map((j)=>{
                jobs.push(extractJobTag(j))
            })
        }
    }
    done(null, jobs)
} 

const taskReturn = (resolve) => function(jobs, done) {
    resolve(jobs)
}

const callback = (reject) => function(error) {
    if (debug) console.log("An error occurred while parsing the wsf file")
    console.error(error);
    reject(error);
}

const extractJobTag = function(job) {
    let { $: {id}, runtime, script } = job;

    let jobId = '';
    if (id) {
        jobId = id;
    }
    if(debug) console.log(`jobId: ${jobId}`);

    let jobRuntime = [];
    if (runtime) {
        let { named } = runtime[0];
        if (named) {
            jobRuntime = named.reduce((arr, item)=>{
                let { $: { name, helpstring } } = item;
                let obj  = {}
                if (name) obj['name'] = name;
                if (helpstring) obj['helpstring'] = helpstring;
                if (obj) arr.push(obj)
                return arr;
            }, []);
        }
    }
    if(debug) console.log(`jobRuntime`, jobRuntime);

    let jobScript = [];
    if (script) {
        jobScript = script.reduce((arr, item)=>{
            let inline = [];
            let {_, $: { src, language }} = item;
            let obj = { language }
            if (src) {
                //src file present
                obj['type'] = 'src';
                obj['src'] = src;
                // normalize path sepeartors on posix
                src = src.replace('\\', path.sep)
                let _path = path.join(_baseDir, src);
                if (debug) console.log("Checking src file exists at path: " + _path);
                if (fs.existsSync(_path)) {
                    if (debug) console.log("File found");
                    obj['exists'] = true;
                    obj['value'] = fs.readFileSync(_path).toString();
                } else {
                    if (debug) console.log("File NOT found");
                    obj['exists'] = false;
                }
                arr.push(obj);
            }
            if (_) {
                //inline script present
                inline = _.split("\r\n").reduce((arr, line)=>{
                    arr.push(line)
                    return arr;
                }, []);
                obj['type'] = 'inline';
                obj['value'] = inline.join('\r\n');
                arr.push(obj);
            }
            return arr;
        }, [])
    }
    
    return {
        id: jobId,
        runtime: jobRuntime,
        script: jobScript
    }
}

async function parseWSF(_path = '', _debug=false) {
    debug = _debug;
    return new Promise((resolve, reject)=>{
        if (debug) console.log('parsing WSF from file at path:' + _path);
        _baseDir = path.parse(_path).dir;
        if (debug) console.log("parseWSF()-> base directory: " + _baseDir);
        let tasks = [];
        tasks.push(beingTaskFileVerification(_path));
        tasks.push(taskPrintWSFtoConsole);
        tasks.push(taskParseWsfToXML);
        tasks.push(taskPrintJSONtoConsole);
        tasks.push(taskVerifyRootTags);
        tasks.push(taskReturn(resolve));
        async(tasks, callback(reject));
    })
}

async function parseWSFStr(wsf = '', baseDir = '', _debug=false) {
    debug = _debug;
    return new Promise((resolve, reject)=>{
        if (debug) console.log('parsing WSF from string...')
        _baseDir = baseDir ? baseDir : __dirname;
        if (debug ) console.log("parseWSFStr()-> base directory: " + _baseDir)
        let tasks = [];
        tasks.push(beginTaskWSFStrVerification(wsf));
        tasks.push(taskPrintWSFtoConsole);
        tasks.push(taskParseWsfToXML);
        tasks.push(taskPrintJSONtoConsole);
        tasks.push(taskVerifyRootTags);
        tasks.push(taskReturn(resolve));
        async(tasks, callback(reject));
    })
}

module.exports = { parseWSF, parseWSFStr }
