' ====================================================================
' J.A.R.V.I.S. SILENT BACKGROUND RUNNER
' Runs start_jarvis_background.bat completely hidden in background (0 windows).
' Always listens for "Jarvis yeh kaam karo" in the background!
' ====================================================================
Set WshShell = CreateObject("WScript.Shell")
strPath = WshShell.CurrentDirectory
WshShell.Run chr(34) & strPath & "\start_jarvis_background.bat" & Chr(34), 0
Set WshShell = Nothing
