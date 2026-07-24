@echo off
cd /d "%~dp0.."
if not exist ".run" mkdir ".run"
call npm.cmd run start >> ".run\website-service.log" 2>&1
