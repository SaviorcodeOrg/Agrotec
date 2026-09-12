@echo off
REM Follows the Node.js app container's live console output (Ctrl+C to stop).
REM Double-click this file, or run it from any directory - it cd's to its own folder first.

cd /d "%~dp0"

docker compose logs -f --tail 100 app
