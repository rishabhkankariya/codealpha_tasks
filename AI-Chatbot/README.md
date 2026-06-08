# AI Chatbot

An intelligent, AI-powered transit route assistant built using RAG (Retrieval-Augmented Generation). The chatbot is designed to provide context-aware answers to user queries about bus routes, schedules, stops, and travel estimations by performing semantic vector search on historical routes datasets.

## Features
- **AI-Powered Responses**: Understands natural language queries (e.g., *"Which bus goes from Katraj to Hinjewadi?"*).
- **RAG Architecture**: Uses semantic embeddings to retrieve local routes data from a vector database and feed it to the LLM for factually correct answers.
- **Multi-language Support**: Fully localized response rendering supporting English, Hindi, and Marathi.
- **Session History Management**: Tracks multiple chat sessions, history retrieval, and user preferences.
- **Flexible Backend**: Easily switch between local LLMs (Ollama Llama 3/Mistral) and paid Cloud LLM options (OpenAI GPT-4).

## Technologies Used
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide icons.
- **Backend**: FastAPI (Python 3.11), LangChain (AI framework orchestration).
- **Embeddings**: HuggingFace (`sentence-transformers/all-MiniLM-L6-v2` running on CPU/GPU).
- **Vector DB**: ChromaDB (local directory vector store).
- **Chat History DB**: SQLite.
- **LLM Engine**: Ollama (local Llama 3 / Mistral) or OpenAI API.

## Screenshots
Screenshots of the chatbot can be added to the `screenshots/` directory.

## Run Locally

### Step 1: Install & Set Up Ollama (For Local LLM)
1. Download and install Ollama from [ollama.ai](https://ollama.ai/download).
2. Open your terminal and pull a model:
   ```bash
   ollama pull llama3
   ```
   *(Or pull Mistral: `ollama pull mistral`)*
3. Make sure the Ollama background service is running:
   ```bash
   ollama serve
   ```

### Step 2: Backend Setup
1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```powershell
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   ```
3. Install dependencies including AI-specific packages:
   ```bash
   pip install -r requirements.txt
   pip install -r requirements-ai.txt
   ```
4. Copy the environment template:
   ```bash
   cp .env.example .env
   ```
5. Import CSV transit data to initialize and populate the ChromaDB vector database:
   ```bash
   python app/utils/csv_importer.py data/sample_routes.csv
   ```
6. Launch the FastAPI server:
   ```bash
   python -m uvicorn app.main:app --reload
   ```

### Step 3: Frontend Setup
1. Navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser.
5. Log in (default admin credentials: `admin@smartbus.com` / `Admin@12345` or register a new user).
6. Click the **AI Assistant** link in the navigation bar to start chatting with the route assistant!
