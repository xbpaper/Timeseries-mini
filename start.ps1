# Start backend service in a new window
Start-Process powershell -ArgumentList "-NoExit", "cd backend; python -m uvicorn app.main:app --reload --port 8000"

# Wait 2 seconds to ensure backend service starts
Start-Sleep -Seconds 2

# Start frontend service in a new window
Start-Process powershell -ArgumentList "-NoExit", "cd frontend; npm run dev"

# Display service information
Write-Host "Both services have been started!" -ForegroundColor Green
Write-Host "Backend service URL: http://localhost:8000" -ForegroundColor Cyan
Write-Host "Frontend service URL: http://localhost:3002" -ForegroundColor Cyan
Write-Host "Press any key to exit..." -ForegroundColor Yellow

# Wait for user input
$host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown') | Out-Null