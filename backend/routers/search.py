from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import List, Optional, Any, Dict
from backend.services.ai_processor import AIProcessor
from backend.services.supabase_service import db_service

router = APIRouter(prefix="/api/search", tags=["search"])


class SearchRequest(BaseModel):
    query: str
    limit: Optional[int] = 10


def _flatten_search_results(raw_results: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Flattens vector search wrapper objects into clean top-level document records."""
    flattened = []
    for item in raw_results:
        if isinstance(item, dict) and "document" in item and isinstance(item["document"], dict):
            doc = dict(item["document"])
            doc["similarity_score"] = item.get("similarity", item.get("score", 0))
            flattened.append(doc)
        elif isinstance(item, dict):
            flattened.append(item)
    return flattened


@router.post("")
@router.post("/vector")
async def semantic_search(body: SearchRequest, x_user_id: Optional[str] = Header(None)):
    """
    Plain English Semantic Vector Search Endpoint:
    1. Generates 1024-dim query embedding vector using NVIDIA Llama Embedding NIM.
    2. Executes cosine similarity search against user document embeddings.
    3. Flattens results so frontend components render documents seamlessly.
    """
    query_text = body.query.strip()
    if not query_text:
        return {"query": "", "results": []}

    user_id = x_user_id or "usr_anandha"

    # Generate 1024-dim vector embedding for input prompt
    query_embedding = await AIProcessor.generate_embedding(query_text)

    # Perform vector cosine similarity search in database
    raw_results = db_service.search_documents_vector(
        query_embedding,
        user_id=user_id,
        limit=body.limit or 10,
        match_threshold=0.05
    )

    flattened = _flatten_search_results(raw_results)

    return {
        "query": query_text,
        "results": flattened
    }


@router.get("/text")
async def text_search(query: str, x_user_id: Optional[str] = Header(None)):
    """Full-Text Keyword Search Endpoint."""
    query_text = query.strip()
    if not query_text:
        return {"query": "", "results": []}

    user_id = x_user_id or "usr_anandha"
    docs_res = db_service.list_documents(user_id=user_id, limit=100)
    all_docs = docs_res.get("documents", [])

    q_lower = query_text.lower()
    matched = []
    for doc in all_docs:
        combined = f"{doc.get('suggested_filename', '')} {doc.get('original_filename', '')} {doc.get('summary', '')} {' '.join(doc.get('tags', []))}".lower()
        if q_lower in combined:
            matched.append(doc)

    return {
        "query": query_text,
        "results": matched
    }
