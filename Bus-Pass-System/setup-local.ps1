# Smart Bus Pass System - Local Setup (No Docker)
# This script sets up the system to run directly on Windows

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Smart Bus Pass System - Local Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check Python
Write-Host "[1/5] Checking Python..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version 2>&1
    Write-Host "  ✓ Python installed: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Python not found!" -ForegroundColor Red
    Write-Host "  Please install Python 3.11+ from: https://www.python.org/downloads/" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Install Python dependencies
Write-Host "[2/5] Installing Python dependencies..." -ForegroundColor Yellow
Write-Host "  This may take 2-3 minutes..." -ForegroundColor Gray

Set-Location backend
if (Test-Path "venv") {
    Write-Host "  Virtual environment exists, activating..." -ForegroundColor Gray
} else {
    Write-Host "  Creating virtual environment..." -ForegroundColor Gray
    python -m venv venv
}

# Activate virtual environment
.\venv\Scripts\Activate.ps1

Write-Host "  Installing packages..." -ForegroundColor Gray
pip install --upgrade pip --quiet
pip install -r requirements.txt --quiet

if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✓ Python dependencies installed" -ForegroundColor Green
} else {
    Write-Host "  ✗ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

Set-Location ..
Write-Host ""

# Check for PostgreSQL
Write-Host "[3/5] Checking PostgreSQL..." -ForegroundColor Yellow
$postgresInstalled = Get-Command psql -ErrorAction SilentlyContinue

if ($postgresInstalled) {
    Write-Host "  ✓ PostgreSQL installed" -ForegroundColor Green
} else {
    Write-Host "  ✗ PostgreSQL not installed" -ForegroundColor Red
    Write-Host ""
    Write-Host "  PostgreSQL is required. Options:" -ForegroundColor Yellow
    Write-Host "  1. Install PostgreSQL: https://www.postgresql.org/download/windows/" -ForegroundColor White
    Write-Host "  2. Use SQLite instead (simpler, for development only)" -ForegroundColor White
    Write-Host ""
    $choice = Read-Host "  Use SQLite instead? (y/n)"
    
    if ($choice -eq "y" -or $choice -eq "Y") {
        Write-Host "  Configuring for SQLite..." -ForegroundColor Gray
        $env:USE_SQLITE = "true"
        Write-Host "  ✓ Will use SQLite" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "  Please install PostgreSQL and run this script again." -ForegroundColor Yellow
        Write-Host "  Download from: https://www.postgresql.org/download/windows/" -ForegroundColor White
        exit 1
    }
}

Write-Host ""

# Check for Redis
Write-Host "[4/5] Checking Redis..." -ForegroundColor Yellow
$redisInstalled = Get-Command redis-server -ErrorAction SilentlyContinue

if ($redisInstalled) {
    Write-Host "  ✓ Redis installed" -ForegroundColor Green
} else {
    Write-Host "  ⚠ Redis not installed (optional)" -ForegroundColor Yellow
    Write-Host "  Redis is optional for development. Caching will be disabled." -ForegroundColor Gray
    Write-Host "  To install Redis: https://github.com/microsoftarchive/redis/releases" -ForegroundColor Gray
}

Write-Host ""

# Create .env file
Write-Host "[5/5] Configuring environment..." -ForegroundColor Yellow

if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "  ✓ Created .env file" -ForegroundColor Green
} else {
    Write-Host "  ✓ .env file exists" -ForegroundColor Green
}

# Update .env for local setup
$envContent = Get-Content ".env"
$envContent = $envContent -replace "DATABASE_URL=.*", "DATABASE_URL=sqlite:///./smart_bus_pass.db"
$envContent | Set-Content ".env"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✓ Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Run: .\start-local.ps1" -ForegroundColor White
Write-Host "  2. Visit: http://localhost:8000/docs" -ForegroundColor White
Write-Host ""
