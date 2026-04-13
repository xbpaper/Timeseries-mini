@echo off

REM Start backend service
start "Backend Service" cmd /k "cd backend && python -m uvicorn app.main:app --reload --port 8000"

REM Wait 2 seconds to ensure backend service starts
ping 127.0.0.1 -n 3 > nul

REM Start frontend service
start "Frontend Service" cmd /k "cd frontend && npm run dev"

echo Both services have been started!
echo Backend service URL: http://localhost:8000
echo Frontend service URL: http://localhost:3002
echo Press any key to exit...
pause > nul