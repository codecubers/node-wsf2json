# Windows Script File (WSF) to JSON converter

With this tiny utility you can parse Windows Script File (WSF) into a json file. Scripts reference inline will be included. Further more, it will also attempts to resolve all the "src" referenced files and includes their script in "value" strings. 

Assuming a simple wsf with below content:
```xml
<?xml version="1.0" ?>
<?job error="true" debug="true" ?>
<package>
    <job id="job1">
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
        <script language="VBScript" src="scripts\FS.vbs" />
    </job>

    <job id="job2">
        <script language="VBScript" >
            Wscript.Echo "We are in Job2"
        </script>
    </job>
</package>
```

The generated JSON would be:

the responding output jscript file is like ：
```json
[
  {
    "id": "job1",
    "runtime": [
      {
        "name": "script",
        "helpstring": "Enter the Script to exeucte"
      }
    ],
    "script": [
      {
        "language": "VBScript",
        "type": "inline",
        "value": "\r\nDim script\r\n'Read and assess the parameter supplied\r\nif WScript.Arguments.named.exists(\"script\") Then\r\nWScript.Echo \"Argument received: \" + WScript.Arguments.named(\"script\")\r\nscript = WScript.Arguments.named(\"script\")\r\nElse\r\nWScript.Arguments.ShowUsage\r\nWScript.Quit\r\nEnd If\r\n"
      },
      {
        "language": "VBScript",
        "type": "src",
        "src": "scripts\\FS.vbs",
        "exists": false
      }
    ]
  },
  {
    "id": "job2",
    "runtime": [],
    "script": [
      {
        "language": "VBScript",
        "type": "inline",
        "value": "\r\nWscript.Echo \"We are in Job2\"\r\n"
      }
    ]
  }
]
```

### Usage

## parse a wsf file by path

```js
const {parseWSF} = require('wsf2json');

let wsfPath = __dirname + '/test.wsf';
parseWSF(wsfPath).then((jobs)=>{
    console.log(JSON.stringify(jobs, null, 2));
}).catch((error)=>{
    console.error(error)
})
```

(Or) if the content is available in string, simply pass it to String parser

```js
const {parseWSFStr} = require('wsf2json');
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
```


### Alternatives

## Convert wsf to formatted vbs file
Instead of generating a json file, if the use case is to convert wsf file to a well formatted vbs file, then please use npm package [wsf2vbs](https://www.npmjs.com/package/wsf2vbs?activeTab=readme). Note current project is a dependency of the said wsf2vbs package.
