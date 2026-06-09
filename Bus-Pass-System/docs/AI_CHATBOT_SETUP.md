# AI Chatbot Setup Guide

This guide will help you set up the AI-powered chatbot feature for the Smart Bus Pass System.

## Overview

The chatbot uses **RAG (Retrieval-Augmented Generation)** to provide intelligent responses about bus routes, stops, and schedules. It combines:
- **Vector Database** (ChromaDB) for semantic search
- **LLM** (Llama 3 via Ollama) for natural language responses
- **Embeddings** (HuggingFace) for text understanding

---

## Prerequisites

- Python 3.11+
- Ollama installed (for local LLM)
- Existing Smart Bus Pass System running

---

## Step 1: Install Ollama

### Windows
1. Download Ollama from: https://ollama.ai/download
2. Run the installer
3. Open PowerShell and verify:
   ```powershell
   ollama --version
   ```

### Pull Llama 3 Model
```powershell
ollama pull llama3
```

Or use Mistral (smaller, faster):
```powershell
ollama pull mistral
```

---

## Step 2: Install AI Dependencies

```powershell
cd backend
.\venv\Scripts\Activate.ps1
pip install -r requirements-ai.txt
```

This installs:
- LangChain (AI framework)
- ChromaDB (vector database)
- Sentence Transformers (embeddings)
- Ollama Python client

---

## Step 3: Import PMPML CSV Data

### Prepare Your CSV Files

**routes.csv** format:
```csv
route_number,origin,destination,distance_km,estimated_duration_minutes
R101,Katraj,Hinjewadi,35,90
R102,Pune Station,Wakad,25,60
R103,Swargate,Baner,20,50
```

**buses.csv** format (optional):
```csv
bus_number,capacity,bus_type
MH12AB1234,40,AC
MH12CD5678,45,Non-AC
```

**schedules.csv** format (optional):
```csv
route_number,bus_number,departure_time,arrival_time,available_seats
R101,MH12AB1234,08:00,09:30,40
R101,MH12AB1234,10:00,11:30,40
```

### Import Data

```powershell
cd backend
.\venv\Scripts\Activate.ps1
python app/utils/csv_importer.py path/to/routes.csv path/to/buses.csv path/to/schedules.csv
```

Or import only routes:
```powershell
python app/utils/csv_importer.py path/to/routes.csv
```

---

## Step 4: Initialize Vector Database

The vector database is automatically created when you import data. To manually refresh:

```python
from app.services.ai_chatbot_service import AIRouteAssistant
from app.core.database import SessionLocal

db = SessionLocal()
assistant = AIRouteAssistant(db)
assistant.refresh_embeddings()
db.close()
```

---

## Step 5: Start the System

### Start Ollama (if not running)
```powershell
ollama serve
```

### Start Backend
```powershell
cd backend
.\venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Start Frontend
```powershell
cd frontend
npm run dev
```

---

## Step 6: Test the Chatbot

### Via Frontend
1. Go to http://localhost:3000
2. Login to your account
3. Click "AI Assistant" in the navigation
4. Start chatting!

### Via API (Swagger)
1. Go to http://localhost:8000/docs
2. Find the "AI Chatbot" section
3. Try the `/chatbot/message` endpoint

### Example Queries
- "Which bus goes from Katraj to Hinjewadi?"
- "Show me routes from Pune Station to Wakad"
- "What buses stop at Swargate?"
- "Fastest route from Hadapsar to Baner"
- "How long does Route R101 take?"

---

## API Endpoints

### Send Message
```bash
POST /api/v1/chatbot/message
{
  "message": "Which bus goes from Katraj to Hinjewadi?",
  "session_id": null,
  "language": "en"
}
```

### Get Chat History
```bash
GET /api/v1/chatbot/history/{session_id}
```

### Get User Sessions
```bash
GET /api/v1/chatbot/sessions
```

### Create New Session
```bash
POST /api/v1/chatbot/session
{
  "language": "en"
}
```

### Refresh Embeddings (Admin Only)
```bash
POST /api/v1/chatbot/refresh-embeddings
```

---

## Configuration

### Change LLM Model

Edit `backend/app/services/ai_chatbot_service.py`:

```python
self.llm = Ollama(
    model="mistral",  # Change to "llama3", "mistral", etc.
    temperature=0.7
)
```

### Change Embedding Model

```python
self.embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2",  # Change model
    model_kwargs={'device': 'cpu'}  # or 'cuda' for GPU
)
```

### Adjust Response Quality

```python
# In _create_qa_chain method
self.qa_chain = RetrievalQA.from_chain_type(
    llm=self.llm,
    chain_type="stuff",
    retriever=self.vectorstore.as_retriever(
        search_kwargs={"k": 5}  # Number of routes to retrieve
    )
)
```

---

## Troubleshooting

### Issue: "Ollama not found"
**Solution**: Make sure Ollama is installed and running
```powershell
ollama serve
```

### Issue: "Model not found"
**Solution**: Pull the model first
```powershell
ollama pull llama3
```

### Issue: "No module named 'langchain'"
**Solution**: Install AI dependencies
```powershell
pip install -r requirements-ai.txt
```

### Issue: "Vector store not found"
**Solution**: Import CSV data to create vector store
```powershell
python app/utils/csv_importer.py routes.csv
```

### Issue: Slow responses
**Solution**: 
- Use smaller model (mistral instead of llama3)
- Reduce retrieval count (k=3 instead of k=5)
- Use GPU if available

### Issue: Inaccurate responses
**Solution**:
- Refresh embeddings after adding new routes
- Increase retrieval count (k=7 or k=10)
- Improve CSV data quality

---

## Advanced Features

### Multi-language Support

The chatbot supports English, Hindi, and Marathi. To use:

```python
response = await ChatbotService.send_message(
    db=db,
    user_id=user_id,
    message="कटराज से हिंजेवाडी कौन सी बस जाती है?",
    language="hi"  # "en", "hi", or "mr"
)
```

### Custom Prompts

Edit the prompt template in `ai_chatbot_service.py`:

```python
template = """You are a helpful PMPML bus route assistant for Pune city.
[Your custom instructions here]

Context: {context}
Question: {question}
Answer:"""
```

### Voice Input (Future)

The frontend is ready for voice input. To enable:
1. Add speech recognition library
2. Convert speech to text
3. Send to chatbot API

---

## Performance Optimization

### Use GPU for Embeddings
```python
self.embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2",
    model_kwargs={'device': 'cuda'}  # Use GPU
)
```

### Cache Responses
Add Redis caching for common queries (future enhancement)

### Batch Processing
Process multiple queries in parallel for better throughput

---

## Data Management

### Update Routes
1. Import new CSV data
2. Refresh embeddings:
   ```bash
   POST /api/v1/chatbot/refresh-embeddings
   ```

### Backup Vector Database
```powershell
# Backup ChromaDB
cp -r backend/data/chroma_db backend/data/chroma_db_backup
```

### Clear Chat History
```sql
-- Clear old chat messages
DELETE FROM chat_messages WHERE created_at < NOW() - INTERVAL '30 days';
```

---

## Production Deployment

### Use Production LLM
Consider using OpenAI GPT-4 for production:

```python
from langchain.llms import OpenAI

self.llm = OpenAI(
    model="gpt-4",
    temperature=0.7,
    openai_api_key="your-api-key"
)
```

### Scale Vector Database
For large datasets, consider:
- Pinecone (cloud vector DB)
- Weaviate (self-hosted)
- Qdrant (high performance)

### Monitor Performance
- Track response times
- Monitor LLM costs (if using paid API)
- Log user queries for improvement

---

## Cost Considerations

### Free Options (Recommended for Development)
- ✅ Ollama (local LLM) - FREE
- ✅ ChromaDB (local vector DB) - FREE
- ✅ HuggingFace embeddings - FREE

### Paid Options (For Production)
- OpenAI GPT-4: ~$0.03 per 1K tokens
- Pinecone: $70/month for 1M vectors
- Anthropic Claude: ~$0.015 per 1K tokens

---

## Next Steps

1. ✅ Import your PMPML CSV data
2. ✅ Test the chatbot with sample queries
3. ✅ Customize prompts for your use case
4. ✅ Add more routes and stops
5. ✅ Enable multi-language support
6. ✅ Monitor and improve responses

---

## Support

For issues or questions:
- Check Ollama docs: https://ollama.ai/docs
- LangChain docs: https://python.langchain.com/docs
- ChromaDB docs: https://docs.trychroma.com/

---

**Congratulations!** Your AI chatbot is ready to assist users with bus route queries. 🎉
