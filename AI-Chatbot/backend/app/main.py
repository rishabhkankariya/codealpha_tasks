"""Main FastAPI application"""

from fastapi import FastAPI, Request, status  # pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware  # pyrefly: ignore [missing-import]
from fastapi.responses import JSONResponse  # pyrefly: ignore [missing-import]
from fastapi.exceptions import RequestValidationError  # pyrefly: ignore [missing-import]
from contextlib import asynccontextmanager
import time
import logging

from app.core.config import settings
from app.core.redis import redis_client
from app.core.database import engine, Base
from app.api.v1 import api_router

# Configure logging
logging.basicConfig(
    level=logging.INFO if not settings.DEBUG else logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    logger.info("Starting up Smart Bus Pass System...")
    
    # Connect to Redis
    try:
        await redis_client.connect()
        logger.info("Connected to Redis")
    except Exception as e:
        logger.warning(f"Redis not available: {e}. Caching will be disabled.")
        # Continue without Redis - it's optional for development
    
    # Create database tables and seed data
    logger.info("Running database tables initialization and seeding...")
    try:
        from app.core.seeding import seed_database
        from app.core.database import SessionLocal
        db = SessionLocal()
        try:
            seed_database(db)
        finally:
            db.close()
        logger.info("✓ Database initialization and seeding check complete")
    except Exception as e:
        logger.error(f"Error during database initialization/seeding: {e}", exc_info=True)
    
    logger.info("Application startup complete")
    
    yield
    
    # Shutdown
    logger.info("Shutting down Smart Bus Pass System...")
    
    # Disconnect from Redis
    try:
        await redis_client.disconnect()
        logger.info("Disconnected from Redis")
    except Exception as e:
        logger.error(f"Error disconnecting from Redis: {e}")
    
    logger.info("Application shutdown complete")


# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="A cloud-native transport management platform with digital ticketing, bus passes, and AI-powered assistance",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request timing middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    """Add processing time header to responses"""
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response


# Exception handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors with human-readable messages"""
    errors = exc.errors()
    # Build a readable message from the first error
    if errors:
        first = errors[0]
        loc = " → ".join(str(l) for l in first.get("loc", []) if l != "body")
        msg = first.get("msg", "Invalid input")
        readable = f"{loc}: {msg}" if loc else msg
    else:
        readable = "Invalid request data"
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": readable}
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle general exceptions"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"}
    )


# Health check endpoint
@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT
    }


# Root endpoint
@app.get("/", tags=["Root"])
async def root():
    """Root endpoint"""
    return {
        "message": "Smart Bus Pass & Ticket Booking System API",
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "health": "/health"
    }


# Include API router
app.include_router(api_router, prefix=settings.API_V1_PREFIX)


if __name__ == "__main__":
    import uvicorn  # pyrefly: ignore [missing-import]
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )
