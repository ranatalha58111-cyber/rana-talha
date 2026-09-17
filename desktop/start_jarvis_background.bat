@echo off
title JARVIS Background Voice Daemon - Always Listening
color 0b

echo ======================================================================
echo             J.A.R.V.I.S. BACKGROUND VOICE DAEMON
echo ======================================================================
echo  [+] Status: INITIALIZING ALWAYS-LISTENING SERVICE
echo  [+] Wake Phrase: "Jarvis yeh kaam karo [command]" or "Hey Jarvis"
echo  [+] Desktop Integration: Active
echo ======================================================================
echo.

:: Check for Python
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Python was not found in your system PATH!
    echo Please install Python 3.9+ from https://www.python.org and check "Add to PATH".
    echo.
    pause
    exit /b 1
)

echo [*] Checking Python dependencies...
python -c "import speech_recognition, requests" >nul 2>nul
if %errorlevel% neq 0 (
    echo [*] Installing required speech packages (one-time setup)...
    python -m pip install speechrecognition requests pyaudio pyttsx3 --quiet
)

echo [*] Starting JARVIS Background Listener...
python "%~dp0jarvis_listener.py"

pause
