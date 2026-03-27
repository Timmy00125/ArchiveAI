"""
FastAPI application entry point.

Run with:
    uvicorn src.main:app --reload --port 8000
"""

from __future__ import annotations

import gc
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from langgraph.checkpoint.postgres import PostgresSaver
from psycopg_pool import ConnectionPool

from src.config import settings
from src.logging_config import setup_logging, get_logger
from src.document_processor import DocumentProcessor
from src.vectorstore import VectorStoreManager
from src.services.document_service import DocumentService
from src.services.chat_service import ChatService

# Import routers
from src.api import chat as chat_router
from src.api import documents as documents_router
from src.api import upload as upload_router
from src.api import search as search_router

setup_logging()
logger = get_logger(__name__)


def _cleanup_resource(resource, name: str):
    """Best-effort shutdown for stateful resources."""
    if resource is None:
        return

    for method_name in ("close", "shutdown", "stop"):
        method = getattr(resource, method_name, None)
        if callable(method):
            try:
                method()
                logger.info(f"🧹 Closed {name} via `{method_name}()`")
                return
            except Exception as err:
                logger.warning(f"⚠️ Failed to close {name} via `{method_name}()`: {err}")


# ── Lifespan ──────────────────────────────────────────────────────────────────


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialise shared resources at startup, clean up on shutdown."""
    logger.info("🚀 Starting Document Intelligence API…")

    if not settings.GOOGLE_API_KEY:
        logger.warning(
            "⚠️  GOOGLE_API_KEY is not set. "
            "Set it in your .env file or environment before making LLM calls."
        )

    # Database and Checkpointer setup
    pool = None
    checkpointer = None
    try:
        pool = ConnectionPool(conninfo=settings.POSTGRES_URI, max_size=10, open=True)
        checkpointer = PostgresSaver(pool)
        # Setup tables if they don't exist
        checkpointer.setup()
        logger.info("✅ PostgreSQL chat history storage initialized")
    except Exception as e:
        logger.warning(f"⚠️ Could not connect to PostgreSQL: {e}. Falling back to MemorySaver.")
        checkpointer = None

    # Shared components — created once and stored on app.state
    processor = DocumentProcessor()
    vs_manager = VectorStoreManager()
    document_service = DocumentService(vs_manager=vs_manager, processor=processor)
    chat_service = ChatService(vs_manager=vs_manager, memory=checkpointer)

    app.state.processor = processor
    app.state.vs_manager = vs_manager
    app.state.document_service = document_service
    app.state.chat_service = chat_service
    app.state.db_pool = pool
    app.state.document_structures = {}  # in-session Docling structure cache

    logger.info(
        f"✅ Startup complete. "
        f"Chroma: {settings.CHROMA_PERSIST_DIR} | "
        f"Model: {settings.GEMINI_MODEL} | "
        f"Embed: {settings.GEMINI_EMBED_MODEL}"
    )

    yield

    logger.info("🛑 Shutting down…")
    _cleanup_resource(getattr(app.state, "chat_service", None), "chat_service")
    _cleanup_resource(getattr(app.state, "document_service", None), "document_service")
    _cleanup_resource(getattr(app.state, "vs_manager", None), "vector_store")
    _cleanup_resource(getattr(app.state, "processor", None), "document_processor")

    if pool:
        pool.close()
        logger.info("🧹 Closed PostgreSQL connection pool")

    # Encourage timely cleanup of multiprocessing resources from third-party libs.
    gc.collect()


# ── App ───────────────────────────────────────────────────────────────────────


app = FastAPI(
    title="Document Intelligence API",
    description=(
        "RAG-powered document Q&A API built with Docling + LangGraph + Gemini + Chroma.\n\n"
        "Upload documents, chat with them, search semantically, and manage your knowledge base."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────

PREFIX = settings.API_PREFIX  # /api/v1

app.include_router(chat_router.router, prefix=PREFIX)
app.include_router(documents_router.router, prefix=PREFIX)
app.include_router(upload_router.router, prefix=PREFIX)
app.include_router(search_router.router, prefix=PREFIX)


# ── Root endpoints ────────────────────────────────────────────────────────────


@app.get("/", tags=["info"])
async def root():
    """API info and available endpoints."""
    return JSONResponse(
        {
            "name": "Document Intelligence API",
            "version": "1.0.0",
            "docs": "/docs",
            "endpoints": {
                "upload": f"{PREFIX}/upload",
                "upload_context": f"{PREFIX}/upload/context",
                "documents": f"{PREFIX}/documents",
                "search": f"{PREFIX}/search",
                "chat": f"{PREFIX}/chat/query",
                "chat_history": f"{PREFIX}/chat/history/{{session_id}}",
                "delete_session": f"{PREFIX}/chat/sessions/{{session_id}}",
            },
        }
    )


@app.get("/health", tags=["info"])
async def health():
    """Health check."""
    try:
        chunk_count = app.state.vs_manager.total_chunks()
        doc_count = len(app.state.document_service.list_documents())
    except Exception:
        chunk_count = -1
        doc_count = -1

    return JSONResponse(
        {
            "status": "ok",
            "vector_store": {
                "persist_dir": settings.CHROMA_PERSIST_DIR,
                "total_chunks": chunk_count,
                "total_documents": doc_count,
            },
            "models": {
                "llm": settings.GEMINI_MODEL,
                "embedding": settings.GEMINI_EMBED_MODEL,
            },
        }
    )
