const fs = require('fs'),
    async = require('async-waterfall'),
    parseString = require('xml2js').parseString;

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

async function parseWSF(path = '', debug=false) {
    return new Promise((resolve, reject)=>{
        
        let tasks = [];

        const taskFileVerification = function(done) {
            if (!fs.existsSync(path)) 
                return done(`File [${path}] not found.`)
            let wsf = fs.readFileSync('vbspm.wsf').toString();
            if (!wsf) 
                return done(`File [${path}] is empty.`)
            done(null, wsf)
        };
        tasks.push(taskFileVerification);
        
        const taskPrintWSFtoConsole = function(wsf, done) {
            console.log(wsf)
            return done(null, wsf);
        }
        if (debug)
            tasks.push(taskPrintWSFtoConsole);

        const taskParseWsfToXML = function(wsf, done) {
            parseString(wsf, function (err, json) {
                if (err)
                    return done(err)
                if (!json)
                    return done(`Parsed json is empty`)
                done(null, json);
            })
        };
        tasks.push(taskParseWsfToXML);

        const taskPrintJSONtoConsole = function(json, done) {
            console.log(JSON.stringify(json, null, 2))
            return done(null, json);
        }
        if (debug)
            tasks.push(taskPrintJSONtoConsole);

        const taskVerifyRootTags = function(json, done) {
            let jobs = [];
            let { job, package } = json;
            if (!package && !job) {
                //No package or job found; possibly incorrect wsf
                return done(`No package or job root tag found.`)
            } else if (!package && job) {
                //Only job tag present
                console.log(`Root tag is: job`)
                jobs.push(extractJobTag(job))
            } else if (package) {
                //package is present
                console.log(`Root tag is: package`)
                //TODO: Need to find out how this async map gets returned
                package.map((pkg)=>{
                    let {job} = pkg;
                    if (job) {
                        job.map((j)=>{
                            jobs.push(extractJobTag(j))
                        })
                    }
                })
            }
            done(null, jobs)
        } 
        tasks.push(taskVerifyRootTags);

        const taskReturn = function(jobs, done) {
            resolve(jobs)
        }
        tasks.push(taskReturn);
        
        const callback = function(error) {
            console.log("An error occurred while parsing the wsf file")
            console.error(error);
            reject(error);
        }

        async(tasks, callback);
    })
}

module.exports = parseWSF