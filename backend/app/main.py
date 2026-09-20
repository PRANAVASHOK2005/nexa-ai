from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.api_keys import router as api_keys_router
from app.routes.developer_api import router as developer_api_router

from app.database import Base
from app.database import engine
from app.models import User

from app.routes.chat import router as chat_router
from app.routes.documents import router as documents_router
from app.routes.analytics import router as analytics_router
from app.routes.auth import router as auth_router


# --------------------------------------------------
# Create database tables
# --------------------------------------------------

Base.metadata.create_all(
    bind=engine
)


app = FastAPI(
    title="NexaAI API",
    description="Backend API for the NexaAI AI SaaS platform",
    version="1.0.0",
)


# --------------------------------------------------
# CORS
# --------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=[
        "X-Conversation-ID",
    ],
)


# --------------------------------------------------
# API Routes
# --------------------------------------------------

app.include_router(
    chat_router
)

app.include_router(
    documents_router
)
app.include_router(
    developer_api_router
)

app.include_router(
    auth_router
)
app.include_router(api_keys_router)

app.include_router(
    analytics_router
)


# --------------------------------------------------
# Root
# --------------------------------------------------

@app.get("/")
def root():
    return {
        "message": "NexaAI API is running 🚀",
        "status": "healthy",
    }


# --------------------------------------------------
# Health Check
# --------------------------------------------------

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "NexaAI API",
    }