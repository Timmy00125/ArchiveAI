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

    # ── Vertex AI ───────────────────────────────────────────────────────────
    GOOGLE_CLOUD_PROJECT: str = os.environ.get("GOOGLE_CLOUD_PROJECT", "")
    GOOGLE_CLOUD_LOCATION: str = os.environ.get("GOOGLE_CLOUD_LOCATION", "us-central1")
    GEMINI_MODEL: str = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")
    GEMINI_VISION_MODEL: str = os.environ.get("GEMINI_VISION_MODEL", "gemini-2.5-flash")
    GEMINI_EMBED_MODEL: str = os.environ.get("GEMINI_EMBED_MODEL", "text-embedding-004")

    # ── Vector Store (pgvector) ─────────────────────────────────────────────
    PGVECTOR_COLLECTION: str = os.environ.get("PGVECTOR_COLLECTION", "documents")

    # ── Chunking ─────────────────────────────────────────────────────────────
    CHUNK_SIZE: int = int(os.environ.get("CHUNK_SIZE", "1000"))
    CHUNK_OVERLAP: int = int(os.environ.get("CHUNK_OVERLAP", "100"))
    SEARCH_K: int = int(os.environ.get("SEARCH_K", "8"))

    # ── Upload ───────────────────────────────────────────────────────────────
    MAX_UPLOAD_SIZE_MB: int = int(os.environ.get("MAX_UPLOAD_SIZE_MB", "50"))
    ALLOWED_EXTENSIONS: set = {".pdf", ".docx", ".pptx", ".html", ".htm", ".txt", ".md"}
    UPLOAD_DIR: str = os.environ.get("UPLOAD_DIR", "./data/uploads")
    MARKDOWN_DIR: str = os.environ.get("MARKDOWN_DIR", "./data/markdown")
    STRUCTURE_DIR: str = os.environ.get("STRUCTURE_DIR", "./data/structures")

    # ── Database (PostgreSQL) ────────────────────────────────────────────────
    # A full connection URL takes precedence over the individual POSTGRES_* vars.
    # This is required for Neon/Cloud SQL/etc. where sslmode / extra params matter.
    DATABASE_URL: str = os.environ.get("DATABASE_URL", "")

    POSTGRES_USER: str = os.environ.get("POSTGRES_USER", "archiveai")
    POSTGRES_PASSWORD: str = os.environ.get("POSTGRES_PASSWORD", "archiveai_password")
    POSTGRES_DB: str = os.environ.get("POSTGRES_DB", "archiveai_chat")
    POSTGRES_HOST: str = os.environ.get("POSTGRES_HOST", "localhost")
    POSTGRES_PORT: str = os.environ.get("POSTGRES_PORT", "5433")

    @property
    def POSTGRES_URI(self) -> str:
        """Construct PostgreSQL connection URI."""
        if self.DATABASE_URL:
            return self.DATABASE_URL
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    @property
    def PGVECTOR_URI(self) -> str:
        """Construct PostgreSQL+psycopg URI for pgvector (SQLAlchemy driver)."""
        if self.DATABASE_URL:
            # SQLAlchemy needs the +psycopg2 driver; swap the scheme only.
            url = self.DATABASE_URL
            if url.startswith("postgresql://"):
                url = "postgresql+psycopg2://" + url[len("postgresql://"):]
            return url
        return f"postgresql+psycopg2://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    # ── Server / CORS ─────────────────────────────────────────────────────────
    CORS_ORIGINS: list = os.environ.get(
        "CORS_ORIGINS",
        "http://localhost:3000,http://localhost:5173,http://localhost:8080",
    ).split(",")

    API_PREFIX: str = "/api/v1"


settings = Settings()
