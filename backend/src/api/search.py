"""
Search API router — direct semantic search against the vector store.
"""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from src.logging_config import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/search", tags=["search"])


# ── Dependency helper ─────────────────────────────────────────────────────────


def get_vs_manager(request: Request):
    return request.app.state.vs_manager


# ── Pydantic models ───────────────────────────────────────────────────────────


class SearchRequest(BaseModel):
    query: str
    k: int = Field(default=8, ge=1, le=50, description="Number of results to return")
    with_scores: bool = Field(default=False, description="Include similarity scores")


# ── Routes ────────────────────────────────────────────────────────────────────


@router.post("")
async def search(
    body: SearchRequest,
    vs_manager=Depends(get_vs_manager),
):
    """
    Perform a direct semantic similarity search against the vector store.

    This is a low-level endpoint — it returns raw document chunks.
    For an AI-synthesised answer use POST /chat/query instead.

    Returns:
        {"results": [...chunks...], "total": int, "query": str}
    """
    if not body.query or not body.query.strip():
        return JSONResponse({"error": "Query is required"}, status_code=400)

    try:
        if body.with_scores:
            raw = vs_manager.search_with_scores(body.query, k=body.k)
            results = [
                {
                    "content": doc.page_content,
                    "metadata": doc.metadata,
                    "score": float(score),
                }
                for doc, score in raw
            ]
        else:
            raw = vs_manager.search_similar(body.query, k=body.k)
            results = [
                {
                    "content": doc.page_content,
                    "metadata": doc.metadata,
                }
                for doc in raw
            ]

        return JSONResponse({
            "query": body.query,
            "results": results,
            "total": len(results),
        })

    except Exception as e:
        logger.error(f"Search error: {e}")
        return JSONResponse({"error": str(e)}, status_code=500)
