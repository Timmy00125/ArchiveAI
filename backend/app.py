"""
FastAPI entry point (project root).

This file re-exports the FastAPI app from src/main.py so the server
can be started from the project root with:

    uvicorn app:app --reload --port 8000

All logic lives in src/main.py.
"""

from src.main import app  # noqa: F401  re-exported for uvicorn

__all__ = ["app"]
