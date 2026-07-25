import sys
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Ensure workspace directory is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.routers import documents, search, settings, auth

app = FastAPI(
    title="Intelligent Document Vault API",
    description="Backend API for AI-powered document intake, OCR, categorization, multi-user authentication, vector search, and vault management.",
    version="1.0.0"
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
app.include_router(auth.router)
app.include_router(documents.router)
app.include_router(search.router)
app.include_router(settings.router)


@app.get("/")
async def root():
    return {
        "app": "Intelligent Document Vault API",
        "status": "online",
        "docs_url": "/docs"
    }


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "service": "document-vault-backend"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
