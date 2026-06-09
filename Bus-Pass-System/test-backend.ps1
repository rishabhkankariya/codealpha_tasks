# Test Backend Startup Script

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Testing Backend Startup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if virtual environment exists
if (-not (Test-Path "backend\venv\Scripts\Activate.ps1")) {
    Write-Host "❌ Virtual environment not found!" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Virtual environment found" -ForegroundColor Green

# Check if database exists
if (-not (Test-Path "backend\smart_bus_pass.db")) {
    Write-Host "❌ Database not found!" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Database found" -ForegroundColor Green
Write-Host ""

# Try to start backend
Write-Host "Starting backend server..." -ForegroundColor Yellow
Write-Host "Press CTRL+C to stop" -ForegroundColor Yellow
Write-Host ""

Set-Location backend
& .\venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
