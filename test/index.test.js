var parseWSF = require('../index')

let wsfPath = __dirname + '/test.wsf';
parseWSF(wsfPath).then((jobs)=>{
    console.log(JSON.stringify(jobs, null, 2));
}).catch((error)=>{
    console.error(error)
})