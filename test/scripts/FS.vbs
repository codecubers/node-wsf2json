Class FS
    Private objFSO
    
    Private Sub Class_Initialize
        Set objFSO = CreateObject("Scripting.FileSystemObject")
    End Sub

    Public Function GetFSO
        set GetFSO = objFSO
    End Function

    Public Function GetFileDir(ByVal file)
        Wscript.Echo "GetFileDir(" + file + ")"
        Set objFile = objFSO.GetFile(file)
        GetFileDir = objFSO.GetParentFolderName(objFile) 
    End Function
End Class

' set oFs = new FS
' Wscript.Echo oFs.GetFileDir(WScript.ScriptFullName)