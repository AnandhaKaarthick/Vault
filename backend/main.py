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

# Dynamic CORS Configuration for Local Dev & Cloud Deployment
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "")
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000"
]
if allowed_origins_env:
    origins.extend([o.strip() for o in allowed_origins_env.split(",") if o.strip()])

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if not allowed_origins_env == "*" else ["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
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
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("backend.main:app", host="0.0.0.0", port=port, reload=False)
