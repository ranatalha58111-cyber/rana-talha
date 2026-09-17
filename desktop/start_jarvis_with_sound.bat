@echo off
title JARVIS AI Assistant - Startup Routine with Sound
color 0b
cls
echo ======================================================================
echo              J.A.R.V.I.S. SYSTEM INITIALIZATION & SOUND
echo ======================================================================
echo  [+] Playing Jarvis Startup Sound (.wav)...
powershell -c "(New-Object Media.SoundPlayer '%~dp0jarvis-startup.wav').PlaySync();" 2>nul
echo  [+] Arc Reactor Core: ONLINE (100% capacity)
echo  [+] Neural Processing Grid: ONLINE
echo  [+] Status: "Online and ready, Sir. All systems operational."
echo ======================================================================
echo.
timeout /t 2 >nul
start "" "http://localhost:3000"
exit /b 0
