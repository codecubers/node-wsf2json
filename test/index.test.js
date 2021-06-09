const {parseWSF, parseWSFStr} = require('../index');

let wsfPath = __dirname + '/test.wsf';
parseWSF(wsfPath).then((jobs)=>{
    console.log('parsing wsf file:')
    console.log(JSON.stringify(jobs, null, 2));

    let xml =`<?xml version="1.0" ?>
        <?job error="true" debug="true" ?>
        <package>
            <job id="job3">
                <runtime>
                    <named helpstring="Enter the Script to exeucte" name="script" />
                </runtime>
                <script language="VBScript" name="script" >
                    Dim script
                    'Read and assess the parameter supplied
                    if WScript.Arguments.named.exists("script") Then
                        WScript.Echo "Argument received: " + WScript.Arguments.named("script")
                        script = WScript.Arguments.named("script")
                    Else
                        WScript.Arguments.ShowUsage
                        WScript.Quit
                    End If
                </script>
                <script language="VBScript" src="scripts\\FS.vbs" />
            </job>
            <job id="job4">
                <script language="VBScript" >
                    Wscript.Echo "We are in Job2"
                </script>
            </job>
        </package>`
    parseWSFStr(xml).then((jobs2)=>{
        console.log('parsing wsf content:')
        console.log(JSON.stringify(jobs2, null, 2));
    }).catch((error)=>{
        console.error(error)
    })
}).catch((error)=>{
    console.error(error)
})