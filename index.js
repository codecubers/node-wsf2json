const fs = require('fs'),
    async = require('async-waterfall'),
    parseString = require('xml2js').parseString;


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

const beingTaskFileVerification = (path) => function(done) {
    if (!fs.existsSync(path)) 
        return done(`File [${path}] not found.`)
    let wsf = fs.readFileSync(path).toString();
    if (!wsf) 
        return done(`File [${path}] is empty.`)
    done(null, wsf)
};

const beginTaskWSFStrVerification = (wsf) => function(done) {
    if (!wsf) 
        return done(`File [${path}] is empty.`)
    done(null, wsf)
}

const taskPrintWSFtoConsole = function(wsf, done) {
    console.log(wsf)
    return done(null, wsf);
}

const taskParseWsfToXML = function(wsf, done) {
    wsf = wsf.htmlEscape();
    // console.log('wsf', wsf);
    parseString(wsf, function (err, json) {
        if (err)
            return done(err)
        if (!json)
            return done(`Parsed json is empty`)
        done(null, json);
    })
};

const taskPrintJSONtoConsole = function(json, done) {
    console.log(JSON.stringify(json, null, 2))
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
    console.log("An error occurred while parsing the wsf file")
    console.error(error);
    reject(error);
}

const extractJobTag = function(job, debug=false) {
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
                if (fs.existsSync(src)) {
                    obj['exists'] = true;
                    obj['value'] = fs.readFileSync(src).toString();
                } else {
                    obj['exists'] = false;
                }
                arr.push(obj);
            }
            if (_) {
                //inline script present
                inline = _.split("\r\n").reduce((arr, line)=>{
                    arr.push(line.trim())
                    return arr;
                }, []);
                obj['type'] = 'inline';
                obj['value'] = inline.join('\r\n');
                arr.push(obj);
            }
            return arr;
        }, [])
    }
    if(debug) console.log(`jobScript`, JSON.stringify(jobScript, null, 2));
    
    return {
        id: jobId,
        runtime: jobRuntime,
        script: jobScript
    }
}

const extractVBS = (jobs) => jobs.reduce((vbs, job)=>{
    let { id, script, runtime } = job;
    if (id) {
        vbs += `\r\n\r\n\r\n' ================================== Job: ${id} ================================== \r\n`
    }
    if (script) {
        vbs += script.reduce((s, scr)=>{
            let {type, src, exists, language, value} = scr;
            if (type) {
                s += `\r\n' ================= ${type}`
                if (type === 'src') {
                    s += ` : ${src}`
                }
                s += ` ================= \r\n`
            }
            if (language.toLowerCase() === "vbscript" && value) {
                s += value;
            }
            return s;
        }, '');
    }
    //Inject arguments usage
    if (runtime) {
        let usage = runtime.reduce((str, param)=>{
            let {name, helpstring} = param;
            str += `Wscript.Echo "/${name}:  ${helpstring}"\r\n`;
            return str;
        },'');
        vbs = vbs.replace('WScript.Arguments.ShowUsage', usage);
    }
    return vbs;
},'');

async function parseWSF(path = '', debug=false) {
    return new Promise((resolve, reject)=>{
        let tasks = [];
        tasks.push(beingTaskFileVerification(path));
        if (debug) tasks.push(taskPrintWSFtoConsole);
        tasks.push(taskParseWsfToXML);
        if (debug) tasks.push(taskPrintJSONtoConsole);
        tasks.push(taskVerifyRootTags);
        tasks.push(taskReturn(resolve));
        async(tasks, callback(reject));
    })
}

async function parseWSFStr(wsf = '', debug=false) {
    return new Promise((resolve, reject)=>{
        let tasks = [];
        tasks.push(beginTaskWSFStrVerification(wsf));
        if (debug) tasks.push(taskPrintWSFtoConsole);
        tasks.push(taskParseWsfToXML);
        if (debug) tasks.push(taskPrintJSONtoConsole);
        tasks.push(taskVerifyRootTags);
        tasks.push(taskReturn(resolve));
        async(tasks, callback(reject));
    })
}

module.exports = { parseWSF, parseWSFStr, extractVBS }
