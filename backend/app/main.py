import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.core.config import settings
from app.api.v1.auth import router as auth_router
from app.api.v1.papers import router as papers_router
from app.db.database import SessionLocal

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Set up CORS middleware for Next.js frontend
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure upload directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

# Include routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(papers_router, prefix=settings.API_V1_STR)


@app.get("/")
def root():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "docs": "/docs"
    }


@app.get("/health", tags=["Health"])
def health_check():
    """Liveness + DB connectivity check for monitoring and deployment probes."""
    db_status = "unreachable"
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        db_status = "connected"
    except Exception:
        pass

    return {
        "status": "ok" if db_status == "connected" else "degraded",
        "database": db_status,
        "service": settings.PROJECT_NAME,
    }