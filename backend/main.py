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


from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "service": "document-vault-backend"}

# Mount React frontend static build assets for unified single-service orchestration
frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))
if os.path.exists(frontend_dist):
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        if full_path.startswith("api/") or full_path.startswith("docs") or full_path.startswith("openapi.json"):
            return None
        target_file = os.path.join(frontend_dist, full_path)
        if full_path and os.path.isfile(target_file):
            return FileResponse(target_file)
        return FileResponse(os.path.join(frontend_dist, "index.html"))
else:
    @app.get("/")
    async def root():
        return {
            "app": "Intelligent Document Vault API",
            "status": "online",
            "docs_url": "/docs"
        }


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("backend.main:app", host="0.0.0.0", port=port, reload=False)
