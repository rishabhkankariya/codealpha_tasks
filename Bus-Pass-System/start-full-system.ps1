# Smart Bus Pass System - Start Full System (Backend + Frontend)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Smart Bus Pass System - Full Stack" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "This will start both Backend and Frontend servers" -ForegroundColor Yellow
Write-Host ""

# Check Python
Write-Host "[1/2] Checking Python..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version 2>&1
    Write-Host "  ✓ $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Python not found!" -ForegroundColor Red
    exit 1
}

# Check Node.js
Write-Host "[2/2] Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version 2>&1
    Write-Host "  ✓ Node.js $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Node.js not found!" -ForegroundColor Red
    Write-Host "  Please install Node.js 18+ from: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Green
Write-Host "✓ Prerequisites Check Complete" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "Starting servers..." -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Backend will start on:  http://localhost:8000" -ForegroundColor White
Write-Host "2. Frontend will start on: http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "Opening two PowerShell windows..." -ForegroundColor Yellow
Write-Host ""

# Start Backend in new window
Write-Host "Starting Backend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; .\start-system.ps1"

# Wait a bit for backend to start
Write-Host "Waiting 5 seconds for backend to initialize..." -ForegroundColor Gray
Start-Sleep -Seconds 5

# Start Frontend in new window
Write-Host "Starting Frontend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; .\start-frontend.ps1"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✓ System Started!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Two PowerShell windows have been opened:" -ForegroundColor Cyan
Write-Host "  1. Backend Server (port 8000)" -ForegroundColor White
Write-Host "  2. Frontend Server (port 3000)" -ForegroundColor White
Write-Host ""
Write-Host "Access the application:" -ForegroundColor Cyan
Write-Host "  • Frontend:      http://localhost:3000" -ForegroundColor White
Write-Host "  • Backend API:   http://localhost:8000/docs" -ForegroundColor White
Write-Host ""
Write-Host "To stop: Close both PowerShell windows or press Ctrl+C in each" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press any key to close this window..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
