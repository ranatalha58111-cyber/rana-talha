@echo off
title JARVIS AI Assistant - Desktop App
color 0b
cls
echo ======================================================================
echo              J.A.R.V.I.S. AI ASSISTANT - DESKTOP APP
echo ======================================================================
echo  [*] Status: Starting JARVIS Desktop Application...
echo  [*] Wake Word: "Jarvis yeh kaam karo [command]" or "Hey Jarvis"
echo ======================================================================
echo.

set APP_URL=__APP_URL__
set LAUNCHED=0

:: Check for Microsoft Edge Native App Mode
if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" --app="%APP_URL%" --window-size=1280,820
    set LAUNCHED=1
)
if %LAUNCHED% equ 0 if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" --app="%APP_URL%" --window-size=1280,820
    set LAUNCHED=1
)

:: Check for Google Chrome Native App Mode
if %LAUNCHED% equ 0 if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" --app="%APP_URL%" --window-size=1280,820
    set LAUNCHED=1
)
if %LAUNCHED% equ 0 if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" --app="%APP_URL%" --window-size=1280,820
    set LAUNCHED=1
)
if %LAUNCHED% equ 0 if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" (
    start "" "%LocalAppData%\Google\Chrome\Application\chrome.exe" --app="%APP_URL%" --window-size=1280,820
    set LAUNCHED=1
)

:: Fallback to default browser
if %LAUNCHED% equ 0 (
    start "" "%APP_URL%"
)

echo [OK] JARVIS Desktop Application is running!
echo.
echo Tip: To also run the 24/7 Background Voice Listener that listens
echo for "Jarvis yeh kaam karo" even when minimized, double-click:
echo    run_silent_background.vbs   (Runs silently in background)
echo or start_jarvis_background.bat (Shows voice status window)
echo.
timeout /t 4 >nul
exit /b 0
