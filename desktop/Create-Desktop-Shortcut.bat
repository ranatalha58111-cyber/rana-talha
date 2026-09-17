@echo off
title Create JARVIS Desktop Shortcut
set SCRIPT_DIR=%~dp0
set TARGET_FILE=%SCRIPT_DIR%JARVIS.bat
set SHORTCUT_PATH=%USERPROFILE%\Desktop\JARVIS.lnk

powershell -NoProfile -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%SHORTCUT_PATH%'); $s.TargetPath = '%TARGET_FILE%'; $s.WorkingDirectory = '%SCRIPT_DIR%'; $s.Description = 'JARVIS AI Assistant App'; $s.Save()"

echo =========================================================
echo  [OK] JARVIS Desktop Shortcut created successfully!
echo  You can now open JARVIS directly from your Windows Desktop.
echo =========================================================
timeout /t 3 >nul
exit /b 0
