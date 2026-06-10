from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .core.config import settings
from .core.database import engine, Base, SessionLocal
from .api import auth, chat, kb, feedback, analytics
from .services.ai_service import ai_service
from .core.seeding import seed_database

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup actions
    print("Starting up AI Chatbot Platform...")
    
    # 1. Recreate database schema and seed if necessary
    try:
        # Recreate tables (safe operation, won't drop existing ones)
        Base.metadata.create_all(bind=engine)
        
        # Run seeding script logic to ensure admin and FAQs exist
        seed_database()
    except Exception as e:
        print(f"Error seeding database during startup lifespan: {e}")
        
    # 2. Rebuild the FAISS vector search index
    db = SessionLocal()
    try:
        print("Preloading and rebuilding FAISS Index...")
        ai_service.rebuild_kb_index(db)
    except Exception as e:
        print(f"Error building FAISS index during startup: {e}")
    finally:
        db.close()
        
    yield
    
    # Shutdown actions
    print("Shutting down AI Chatbot Platform...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    lifespan=lifespan,
)

# CORS Policy configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permit requests from all origins (including React dev servers)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Router endpoints
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(chat.router, prefix=settings.API_V1_STR)
app.include_router(kb.router, prefix=settings.API_V1_STR)
app.include_router(feedback.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router, prefix=settings.API_V1_STR)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "app": settings.PROJECT_NAME,
        "version": "1.0.0",
        "api_docs": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
