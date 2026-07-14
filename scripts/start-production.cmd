@echo off
cd /d "%~dp0.."
if not exist ".run" mkdir ".run"
"C:\Program Files\nodejs\node.exe" "node_modules\next\dist\bin\next" start --hostname 0.0.0.0 --port 3000 >> ".run\website-service.log" 2>&1
