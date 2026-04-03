"""
Application configuration — reads environment variables (.env supported).
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from project root
load_dotenv(Path(__file__).parent.parent / ".env")


class Settings:
    """Central configuration object."""

    # ── Gemini ──────────────────────────────────────────────────────────────
    GOOGLE_API_KEY: str = os.environ.get("GOOGLE_API_KEY", "")
    GEMINI_MODEL: str = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")
    GEMINI_EMBED_MODEL: str = os.environ.get(
        "GEMINI_EMBED_MODEL", "gemini-embedding-001"
    )

    # ── Vector Store ─────────────────────────────────────────────────────────
    CHROMA_PERSIST_DIR: str = os.environ.get("CHROMA_PERSIST_DIR", "./chroma_db")
    CHROMA_COLLECTION: str = os.environ.get("CHROMA_COLLECTION", "documents")

    # ── Chunking ─────────────────────────────────────────────────────────────
    CHUNK_SIZE: int = int(os.environ.get("CHUNK_SIZE", "1000"))
    CHUNK_OVERLAP: int = int(os.environ.get("CHUNK_OVERLAP", "100"))
    SEARCH_K: int = int(os.environ.get("SEARCH_K", "8"))

    # ── Upload ───────────────────────────────────────────────────────────────
    MAX_UPLOAD_SIZE_MB: int = int(os.environ.get("MAX_UPLOAD_SIZE_MB", "50"))
    ALLOWED_EXTENSIONS: set = {".pdf", ".docx", ".pptx", ".html", ".htm", ".txt", ".md"}

    # ── Database (PostgreSQL) ────────────────────────────────────────────────
    POSTGRES_USER: str = os.environ.get("POSTGRES_USER", "archiveai")
    POSTGRES_PASSWORD: str = os.environ.get("POSTGRES_PASSWORD", "archiveai_password")
    POSTGRES_DB: str = os.environ.get("POSTGRES_DB", "archiveai_chat")
    POSTGRES_HOST: str = os.environ.get("POSTGRES_HOST", "localhost")
    POSTGRES_PORT: str = os.environ.get("POSTGRES_PORT", "5433")

    @property
    def POSTGRES_URI(self) -> str:
        """Construct PostgreSQL connection URI."""
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    # ── Server / CORS ─────────────────────────────────────────────────────────
    CORS_ORIGINS: list = os.environ.get(
        "CORS_ORIGINS", "http://localhost:3000,http://localhost:5173,http://localhost:8080"
    ).split(",")

    API_PREFIX: str = "/api/v1"


settings = Settings()
