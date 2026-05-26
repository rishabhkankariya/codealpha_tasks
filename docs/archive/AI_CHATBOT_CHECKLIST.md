# AI Chatbot Setup Checklist

Use this checklist to set up the AI chatbot feature step by step.

---

## ☑️ Prerequisites

- [ ] Python 3.11+ installed
- [ ] Node.js 18+ installed
- [ ] Existing Smart Bus Pass System running
- [ ] Internet connection (for downloading models)

---

## ☑️ Step 1: Install Ollama

- [ ] Download Ollama from https://ollama.ai/download
- [ ] Install Ollama
- [ ] Verify installation: `ollama --version`
- [ ] Pull Llama 3 model: `ollama pull llama3`
- [ ] Test Ollama: `ollama run llama3 "Hello"`

---

## ☑️ Step 2: Install AI Dependencies

- [ ] Navigate to backend: `cd backend`
- [ ] Activate virtual environment: `.\venv\Scripts\Activate.ps1`
- [ ] Install AI packages: `pip install -r requirements-ai.txt`
- [ ] Verify installation: `python -c "import langchain; print('OK')"`

---

## ☑️ Step 3: Prepare CSV Data

- [ ] Create or obtain PMPML routes CSV file
- [ ] Verify CSV format (route_number, origin, destination, distance_km, duration)
- [ ] Place CSV in accessible location
- [ ] Optional: Create buses.csv and schedules.csv

---

## ☑️ Step 4: Import Data

- [ ] Run CSV importer: `python app/utils/csv_importer.py path/to/routes.csv`
- [ ] Check import summary for errors
- [ ] Verify routes in database
- [ ] Confirm vector database created in `backend/data/chroma_db`

---

## ☑️ Step 5: Start Services

- [ ] Start Ollama: `ollama serve` (in separate terminal)
- [ ] Start backend: `.\start-system.ps1` or `uvicorn app.main:app --reload`
- [ ] Start frontend: `cd frontend && npm run dev`
- [ ] Verify backend running: http://localhost:8000/docs
- [ ] Verify frontend running: http://localhost:3000

---

## ☑️ Step 6: Test Chatbot

### Via Frontend
- [ ] Open http://localhost:3000
- [ ] Login to your account
- [ ] Click "AI Assistant" in navigation
- [ ] See welcome message
- [ ] Send test query: "Which bus goes from Katraj to Hinjewadi?"
- [ ] Verify response received
- [ ] Check route cards displayed
- [ ] Try suggestion buttons

### Via API
- [ ] Open http://localhost:8000/docs
- [ ] Find "AI Chatbot" section
- [ ] Try POST /api/v1/chatbot/message
- [ ] Verify JSON response
- [ ] Check routes array populated

---

## ☑️ Step 7: Verify Features

- [ ] Natural language queries work
- [ ] Route information displayed correctly
- [ ] Suggestions appear
- [ ] Chat history preserved
- [ ] Multiple messages in conversation
- [ ] Loading indicator shows
- [ ] Error handling works

---

## ☑️ Troubleshooting (if needed)

### Ollama Issues
- [ ] Check Ollama is running: `ollama list`
- [ ] Verify model downloaded: `ollama list` should show llama3
- [ ] Restart Ollama: `ollama serve`

### Import Issues
- [ ] Check CSV file format
- [ ] Verify file path is correct
- [ ] Check for encoding issues (use UTF-8)
- [ ] Review error messages in console

### API Issues
- [ ] Check backend logs for errors
- [ ] Verify database connection
- [ ] Check ChromaDB directory exists
- [ ] Restart backend server

### Frontend Issues
- [ ] Check browser console for errors
- [ ] Verify API endpoint URL
- [ ] Check authentication token
- [ ] Clear browser cache

---

## ☑️ Optional Enhancements

- [ ] Add more routes to CSV
- [ ] Import bus and schedule data
- [ ] Customize chatbot prompts
- [ ] Enable multi-language support
- [ ] Add voice input (future)
- [ ] Integrate with booking system

---

## ☑️ Production Readiness

- [ ] Test with real PMPML data
- [ ] Verify response accuracy
- [ ] Check response times
- [ ] Test with multiple users
- [ ] Monitor resource usage
- [ ] Set up error logging
- [ ] Configure rate limiting
- [ ] Add response caching

---

## ☑️ Documentation Review

- [ ] Read AI_CHATBOT_SETUP.md
- [ ] Review AI_CHATBOT_SUMMARY.md
- [ ] Check API documentation
- [ ] Understand CSV format
- [ ] Know how to refresh embeddings

---

## ✅ Completion Checklist

- [ ] Ollama installed and running
- [ ] AI dependencies installed
- [ ] CSV data imported
- [ ] Vector database created
- [ ] Backend running with chatbot endpoint
- [ ] Frontend showing AI Assistant page
- [ ] Test queries working
- [ ] Routes displayed correctly
- [ ] Chat history working
- [ ] Ready for user testing

---

## 📝 Notes

**Common Issues:**
1. Ollama not running → Start with `ollama serve`
2. Model not found → Pull with `ollama pull llama3`
3. Slow responses → Use smaller model (mistral)
4. No routes found → Import CSV data first

**Performance Tips:**
- Use mistral for faster responses
- Reduce retrieval count (k=3)
- Cache common queries
- Use GPU if available

**Next Steps:**
1. Import your actual PMPML data
2. Customize prompts for your needs
3. Test with real users
4. Monitor and improve

---

**Status**: ☐ Not Started | ⏳ In Progress | ✅ Complete

**Overall Progress**: ___/50 items complete

---

*Last Updated: May 25, 2026*
