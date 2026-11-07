@echo off
title Faith Engineers - Daily Supplier Attendance Portal
cd /d "%~dp0"
echo ==================================================================
echo       FAITH ENGINEERS - DAILY SUPPLIER ATTENDANCE PORTAL
echo ==================================================================
echo Starting local web server...
powershell -ExecutionPolicy Bypass -File "%~dp0server.ps1"
pause

