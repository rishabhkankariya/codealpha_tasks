# PMPML Dataset Import Script
# Imports routes from dataset.csv into the database

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PMPML Dataset Importer" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if dataset.csv exists
if (-not (Test-Path "backend/data/dataset.csv")) {
    Write-Host "Error: dataset.csv not found in backend/data/" -ForegroundColor Red
    Write-Host "Please make sure dataset.csv is in the backend/data/ folder" -ForegroundColor Yellow
    exit 1
}

Write-Host "[1/3] Checking Python environment..." -ForegroundColor Yellow

# Navigate to backend
Set-Location backend

# Check if virtual environment exists
if (-not (Test-Path "venv")) {
    Write-Host "Error: Virtual environment not found" -ForegroundColor Red
    Write-Host "Please run setup-local.ps1 first" -ForegroundColor Yellow
    Set-Location ..
    exit 1
}

Write-Host "  Virtual environment found" -ForegroundColor Green

Write-Host ""
Write-Host "[2/3] Activating virtual environment..." -ForegroundColor Yellow

# Activate virtual environment
& ".\venv\Scripts\Activate.ps1"

Write-Host "  Activated" -ForegroundColor Green

Write-Host ""
Write-Host "[3/3] Importing PMPML data..." -ForegroundColor Yellow
Write-Host ""

# Run the importer
python app/utils/pmpml_importer.py data/dataset.csv

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Import Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Start the system: .\start-full-system.ps1" -ForegroundColor White
Write-Host "2. Open AI Assistant: http://localhost:3000/ai-assistant" -ForegroundColor White
Write-Host "3. Ask: 'Which bus goes from Hinjawadi to Katraj?'" -ForegroundColor White
Write-Host ""

# Go back to root
Set-Location ..
