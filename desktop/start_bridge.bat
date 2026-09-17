@echo off
title JARVIS Local Desktop Bridge
color 0a

echo ======================================================================
echo             J.A.R.V.I.S. LOCAL APP LAUNCH BRIDGE
echo ======================================================================
echo  [+] Status: Starting local companion bridge for web app...
echo  [+] Port:   http://127.0.0.1:41199
echo  [+] Direct PC Launch: Notepad, Calculator, VS Code, Chrome, etc.
echo ======================================================================
echo.

where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Python was not found in your system PATH!
    echo Please install Python 3.9+ from https://www.python.org
    echo.
    pause
    exit /b 1
)

python "%~dp0jarvis_bridge.py"
pause
