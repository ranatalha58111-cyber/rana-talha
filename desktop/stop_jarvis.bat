@echo off
title Stop JARVIS Background Listener
color 0c
echo ======================================================================
echo             STOPPING J.A.R.V.I.S. BACKGROUND SERVICE
echo ======================================================================
echo.
taskkill /F /FI "WINDOWTITLE eq JARVIS Background Voice Daemon*" /T >nul 2>&1
taskkill /F /IM python.exe /FI "MEMUSAGE gt 10000" >nul 2>&1
echo [OK] JARVIS Background service has been stopped.
echo.
pause
