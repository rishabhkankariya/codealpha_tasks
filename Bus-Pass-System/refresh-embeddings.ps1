# Refresh AI Embeddings Script
# This script refreshes the AI embeddings after importing PMPML data

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Refreshing AI Embeddings" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if virtual environment exists
if (-not (Test-Path "backend\venv\Scripts\Activate.ps1")) {
    Write-Host "❌ Virtual environment not found!" -ForegroundColor Red
    Write-Host "Please run setup-local.ps1 first" -ForegroundColor Yellow
    exit 1
}

# Check if database exists
if (-not (Test-Path "backend\smart_bus_pass.db")) {
    Write-Host "❌ Database not found!" -ForegroundColor Red
    Write-Host "Please import PMPML data first" -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ Virtual environment found" -ForegroundColor Green
Write-Host "✓ Database found" -ForegroundColor Green
Write-Host ""

# Activate virtual environment and refresh embeddings
Write-Host "Refreshing AI embeddings..." -ForegroundColor Yellow
Write-Host ""

& backend\venv\Scripts\python.exe -c @"
import sys
import os

# Change to backend directory so database path is correct
os.chdir('backend')
sys.path.insert(0, '.')

from app.core.database import SessionLocal
from app.services.ai_chatbot_service import AIRouteAssistant

print('Initializing AI service...')
db = SessionLocal()

try:
    assistant = AIRouteAssistant(db)
    print('Refreshing embeddings for all routes...')
    assistant.refresh_embeddings()
    print('✓ Embeddings refreshed successfully!')
except Exception as e:
    print(f'❌ Error: {e}')
    import traceback
    traceback.print_exc()
    sys.exit(1)
finally:
    db.close()
"@

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  ✓ AI Embeddings Refreshed!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your AI chatbot is now ready with 1030 PMPML routes!" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Start Ollama: ollama serve" -ForegroundColor White
    Write-Host "2. Pull model: ollama pull llama3" -ForegroundColor White
    Write-Host "3. Start system: .\start-full-system.ps1" -ForegroundColor White
    Write-Host "4. Test chatbot: http://localhost:3000/ai-assistant" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "❌ Failed to refresh embeddings" -ForegroundColor Red
    Write-Host "Check the error message above" -ForegroundColor Yellow
}
