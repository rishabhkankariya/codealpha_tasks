# Troubleshooting Guide

This guide helps you resolve common issues with the Smart Bus Pass System.

---

## 🚀 Quick Fixes

### Backend Won't Start

**Error**: `ImportError: cannot import name 'Pass' from 'app.models.pass_model'`

**Solution**: Fixed! The model is named `BusPass`, not `Pass`. Restart the backend.

```powershell
cd backend
.\venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --reload
```

---

### AI Chatbot Returns "Sorry, I couldn't process your request"

**Cause**: Ollama is not running or not installed

**Solution 1**: Use fallback mode (works without Ollama)
- The chatbot now automatically uses vector search fallback
- You'll still get route suggestions based on semantic similarity
- Just restart the backend and try again

**Solution 2**: Install and start Ollama for full AI features

```powershell
# 1. Download Ollama from https://ollama.ai/download
# 2. Install it
# 3. Pull the model
ollama pull llama3

# 4. Start Ollama server
ollama serve

# 5. Restart backend
cd backend
.\venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --reload
```

---

### Database Not Found

**Error**: `sqlite3.OperationalError: no such table: routes`

**Solution**: Make sure you're running commands from the correct directory

```powershell
# Check if database exists
Test-Path backend\smart_bus_pass.db

# If not, import data
.\import-pmpml-data.ps1
```

---

### Virtual Environment Not Found

**Error**: `venv\Scripts\Activate.ps1 not found`

**Solution**: Create the virtual environment

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
pip install -r requirements-ai.txt
```

---

## 🤖 AI Chatbot Issues

### Chatbot Modes

The chatbot has 3 modes:

1. **Full AI Mode** (Ollama running)
   - Natural language understanding
   - Conversational responses
   - Context-aware suggestions

2. **Vector Search Mode** (Ollama not running, embeddings available)
   - Semantic similarity search
   - Accurate route matching
   - Fast responses

3. **Keyword Mode** (Fallback)
   - Simple keyword matching
   - Basic route search
   - Always works

### How to Check Current Mode

Look at backend startup logs:

```
✓ Ollama LLM initialized          → Full AI Mode
⚠ Ollama not available            → Vector Search Mode
AI initialization error           → Keyword Mode
```

### Improving Chatbot Responses

**For Full AI Mode**:
```powershell
# Make sure Ollama is running
ollama serve

# Check if model is downloaded
ollama list

# If llama3 not listed, pull it
ollama pull llama3
```

**For Vector Search Mode**:
```powershell
# Refresh embeddings
.\refresh-embeddings.ps1
```

**For Keyword Mode**:
- Use specific queries like "routes from X to Y"
- Include location names in your query
- Try different phrasings

---

## 📊 Database Issues

### Check Database Status

```powershell
python backend/scripts/check_tables.py
```

Expected output:
```
Tables in database:
  - users (Rows: 1)
  - routes (Rows: 1030)
  - buses (Rows: 0)
  ...
```

### Re-import PMPML Data

```powershell
.\import-pmpml-data.ps1
```

### Reset Database

```powershell
# Backup first!
Copy-Item backend\smart_bus_pass.db backend\smart_bus_pass.db.backup

# Delete and recreate
Remove-Item backend\smart_bus_pass.db

# Run migrations (if you have them)
# Or import data again
.\import-pmpml-data.ps1
```

---

## 🔧 Dependency Issues

### AI Dependencies Not Installed

**Error**: `ModuleNotFoundError: No module named 'langchain'`

**Solution**:
```powershell
cd backend
.\venv\Scripts\Activate.ps1
pip install -r requirements-ai.txt
```

### Conflicting Dependencies

**Solution**: Reinstall all dependencies
```powershell
cd backend
.\venv\Scripts\Activate.ps1
pip uninstall -y -r requirements.txt
pip install -r requirements.txt
pip install -r requirements-ai.txt
```

---

## 🌐 Frontend Issues

### Frontend Won't Start

**Error**: `npm: command not found`

**Solution**: Install Node.js from https://nodejs.org/

**Error**: `Module not found`

**Solution**:
```powershell
cd frontend
npm install
npm run dev
```

### API Connection Failed

**Check**:
1. Backend is running on http://localhost:8000
2. Frontend .env has correct API URL
3. CORS is configured properly

```env
# frontend/.env
VITE_API_URL=http://localhost:8000
```

---

## 🔐 Authentication Issues

### Can't Login

**Check**:
1. User exists in database
2. Password is correct
3. Backend is running

**Create test user**:
```powershell
cd backend
.\venv\Scripts\Activate.ps1
python -c "from app.core.database import SessionLocal; from app.models.user import User; from app.core.security import get_password_hash; db = SessionLocal(); user = User(email='test@example.com', password_hash=get_password_hash('Test123!@#'), first_name='Test', last_name='User', role='passenger'); db.add(user); db.commit(); print('User created')"
```

---

## 📝 Common Error Messages

### "Failed to send telemetry event"

**Cause**: ChromaDB telemetry issue (harmless)

**Solution**: Ignore this warning, it doesn't affect functionality

### "LangChainDeprecationWarning"

**Cause**: Using older LangChain version

**Solution**: These are warnings, not errors. System works fine.

### "Ollama connection refused"

**Cause**: Ollama not running

**Solution**: Start Ollama with `ollama serve` or use fallback mode

---

## 🎯 Testing Checklist

### Backend Health Check

```powershell
# 1. Start backend
cd backend
.\venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --reload

# 2. Open browser
# Visit: http://localhost:8000/docs

# 3. Test health endpoint
# Visit: http://localhost:8000/health
```

### AI Chatbot Test

```powershell
# 1. Check embeddings exist
Test-Path backend\data\chroma_db

# 2. Start backend
cd backend
python -m uvicorn app.main:app --reload

# 3. Test via API docs
# Visit: http://localhost:8000/docs
# Try: POST /api/v1/chatbot/message
```

### Frontend Test

```powershell
# 1. Start frontend
cd frontend
npm run dev

# 2. Open browser
# Visit: http://localhost:3000

# 3. Try chatbot
# Visit: http://localhost:3000/ai-assistant
```

---

## 🆘 Still Having Issues?

### Collect Debug Information

```powershell
# 1. Check Python version
python --version

# 2. Check Node version
node --version

# 3. Check installed packages
cd backend
.\venv\Scripts\Activate.ps1
pip list > installed_packages.txt

# 4. Check database
python backend/scripts/check_tables.py > database_status.txt

# 5. Check backend logs
# Copy error messages from terminal
```

### Reset Everything

```powershell
# 1. Backup database
Copy-Item backend\smart_bus_pass.db backend\smart_bus_pass.db.backup

# 2. Delete virtual environment
Remove-Item -Recurse -Force backend\venv

# 3. Recreate environment
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
pip install -r requirements-ai.txt

# 4. Re-import data
cd ..
.\import-pmpml-data.ps1

# 5. Refresh embeddings
.\refresh-embeddings.ps1

# 6. Start backend
cd backend
python -m uvicorn app.main:app --reload
```

---

## 📞 Quick Reference

### Start Everything

```powershell
# Terminal 1: Ollama (optional, for full AI)
ollama serve

# Terminal 2: Backend
cd backend
.\venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --reload

# Terminal 3: Frontend
cd frontend
npm run dev
```

### URLs

- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Frontend**: http://localhost:3000
- **AI Chatbot**: http://localhost:3000/ai-assistant

### Key Files

- **Database**: `backend/smart_bus_pass.db`
- **Embeddings**: `backend/data/chroma_db/`
- **Backend Config**: `backend/.env`
- **Frontend Config**: `frontend/.env`

---

## ✅ System Requirements

### Minimum
- Python 3.11+
- Node.js 18+
- 4 GB RAM
- 5 GB disk space

### Recommended
- Python 3.11+
- Node.js 18+
- 8 GB RAM
- 10 GB disk space
- Ollama installed

---

**Last Updated**: May 26, 2026

