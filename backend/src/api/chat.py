"""
Chat API router — query, history, session management.
"""

from __future__ import annotations

import json
import uuid
from typing import Optional, AsyncGenerator

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel

from src.logging_config import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/chat", tags=["chat"])


# ── Pydantic models ───────────────────────────────────────────────────────────


class ChatRequest(BaseModel):
    prompt: str
    session_id: Optional[str] = None
    stream: bool = False


# ── Dependency helper ─────────────────────────────────────────────────────────


def get_chat_service(request: Request):
    return request.app.state.chat_service


# ── Helpers ───────────────────────────────────────────────────────────────────


async def _sse_stream(generator: AsyncGenerator[str, None], session_id: str):
    """Wrap token stream as Server-Sent Events."""
    try:
        async for token in generator:
            # Escape newlines for SSE data field
            data = json.dumps({"token": token, "session_id": session_id})
            yield f"data: {data}\n\n"
    except Exception as e:
        yield f"data: {json.dumps({'error': str(e)})}\n\n"
    finally:
        yield "data: [DONE]\n\n"


# ── Routes ────────────────────────────────────────────────────────────────────


@router.post("/query")
async def chat_query(
    body: ChatRequest,
    chat_service=Depends(get_chat_service),
):
    """
    Chat with the document assistant.

    Set `stream: true` to receive a Server-Sent Events (SSE) stream.
    """
    if not body.prompt or not body.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt is required")

    session_id = body.session_id or str(uuid.uuid4())

    if body.stream:
        generator = await chat_service.chat(
            prompt=body.prompt,
            session_id=session_id,
            stream=True,
        )
        return StreamingResponse(
            _sse_stream(generator, session_id),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Session-ID": session_id,
            },
        )

    result = await chat_service.chat(
        prompt=body.prompt,
        session_id=session_id,
        stream=False,
    )
    return JSONResponse(result)


@router.get("/history/{session_id}")
async def get_chat_history(
    session_id: str,
    chat_service=Depends(get_chat_service),
):
    """Get conversation history for a session."""
    history = chat_service.get_history(session_id)
    return JSONResponse(history)


@router.delete("/sessions/{session_id}")
async def delete_session(
    session_id: str,
    chat_service=Depends(get_chat_service),
):
    """Delete / reset a conversation session."""
    result = chat_service.delete_session(session_id)
    return JSONResponse(result)
