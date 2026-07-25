from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from backend.services.ai_processor import AIProcessor
from backend.services.supabase_service import db_service

router = APIRouter(prefix="/api/search", tags=["search"])


class SearchRequest(BaseModel):
    query: str
    limit: Optional[int] = 10


@router.post("")
async def semantic_search(body: SearchRequest):
    """
    Plain English Semantic Search Endpoint:
    Generates query embedding vector and executes vector similarity search against document embeddings.
    """
    query_text = body.query.strip()
    if not query_text:
        return {"results": []}

    # Generate vector embedding for input prompt
    query_embedding = await AIProcessor.generate_embedding(query_text)

    # Perform vector cosine similarity search in database
    results = db_service.search_documents_vector(query_embedding, limit=body.limit or 10)

    return {
        "query": query_text,
        "results": results
    }
