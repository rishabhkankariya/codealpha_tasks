# Smart Bus Pass System - Quick Start (No Docker)
# Works with existing virtual environment

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Smart Bus Pass System - Quick Start" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if .env exists
Write-Host "[1/4] Checking configuration..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    Write-Host "  Creating .env file from template..." -ForegroundColor Gray
    Copy-Item ".env.example" ".env"
    Write-Host "  ✓ Created .env file" -ForegroundColor Green
} else {
    Write-Host "  ✓ .env file exists" -ForegroundColor Green
}
Write-Host ""

# Step 2: Check Python
Write-Host "[2/4] Checking Python..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version 2>&1
    Write-Host "  ✓ $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Python not found!" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 3: Install dependencies if needed
Write-Host "[3/4] Checking dependencies..." -ForegroundColor Yellow
Set-Location backend

# Check if venv exists
if (Test-Path "venv\Scripts\python.exe") {
    Write-Host "  ✓ Virtual environment found" -ForegroundColor Green
    
    # Try to install minimal requirements
    Write-Host "  Installing/updating packages..." -ForegroundColor Gray
    .\venv\Scripts\python.exe -m pip install --upgrade pip --quiet 2>$null
    .\venv\Scripts\python.exe -m pip install -r requirements-minimal.txt --quiet 2>$null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ Dependencies ready" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ Some packages may need updating (continuing anyway)" -ForegroundColor Yellow
    }
} else {
    Write-Host "  Creating virtual environment..." -ForegroundColor Gray
    python -m venv venv
    .\venv\Scripts\python.exe -m pip install --upgrade pip --quiet
    .\venv\Scripts\python.exe -m pip install -r requirements-minimal.txt --quiet
    Write-Host "  ✓ Virtual environment created" -ForegroundColor Green
}
Write-Host ""

# Step 4: Initialize database
Write-Host "[4/4] Initializing database..." -ForegroundColor Yellow
if (Test-Path "smart_bus_pass.db") {
    Write-Host "  ✓ Database exists" -ForegroundColor Green
} else {
    Write-Host "  Creating SQLite database..." -ForegroundColor Gray
    .\venv\Scripts\python.exe -c "from app.core.database import Base, engine; Base.metadata.create_all(bind=engine)"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ Database created" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ Database creation had issues (will retry on startup)" -ForegroundColor Yellow
    }
}
Write-Host ""

# Start the server
Write-Host "========================================" -ForegroundColor Green
Write-Host "✓ Starting Server!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Access Points:" -ForegroundColor Cyan
Write-Host "  • API Documentation: http://localhost:8000/docs" -ForegroundColor White
Write-Host "  • Health Check:      http://localhost:8000/health" -ForegroundColor White
Write-Host "  • Root Endpoint:     http://localhost:8000" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host ""

# Start uvicorn using the venv's python
.\venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
