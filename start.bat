@echo off
REM Starts the full docker-dev-stack (app, postgres, meta, studio, cloudflared, tailscale).
REM Double-click this file, or run it from any directory - it cd's to its own folder first.

cd /d "%~dp0"

echo Starting docker-dev-stack...
docker compose up -d
if errorlevel 1 (
    echo.
    echo Failed to start the stack. Is Docker Desktop running?
    pause
    exit /b 1
)

echo.
docker compose ps
echo.
echo Stack is up. Studio (Tailscale): https://agrotec-dev.tail88f58c.ts.net
echo App (Cloudflare Tunnel): check your configured public hostname.
pause
