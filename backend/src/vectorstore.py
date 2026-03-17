"""
Vector store management — persistent Chroma with full CRUD support.
"""

from __future__ import annotations

import os
from typing import List, Dict, Any

from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_chroma import Chroma

from src.config import settings
from src.logging_config import get_logger

logger = get_logger(__name__)


class VectorStoreManager:
    """Manages document chunking, embedding, and persistent vector storage."""

    def __init__(
        self,
        persist_dir: str | None = None,
        collection_name: str | None = None,
    ):
        self.persist_dir = persist_dir or settings.CHROMA_PERSIST_DIR
        self.collection_name = collection_name or settings.CHROMA_COLLECTION

        self.embeddings = GoogleGenerativeAIEmbeddings(
            model=settings.GEMINI_EMBED_MODEL
        )
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=settings.CHUNK_SIZE,
            chunk_overlap=settings.CHUNK_OVERLAP,
            length_function=len,
        )
        self._store: Chroma | None = None

    # ── Internal store access ─────────────────────────────────────────────────

    def _get_store(self) -> Chroma:
        """Return the active Chroma instance, creating/loading as needed."""
        if self._store is None:
            self._store = self._load_or_create()
        return self._store

    def _load_or_create(self) -> Chroma:
        """Load an existing persistent store, or create a fresh one."""
        os.makedirs(self.persist_dir, exist_ok=True)
        store = Chroma(
            collection_name=self.collection_name,
            embedding_function=self.embeddings,
            persist_directory=self.persist_dir,
        )
        count = store._collection.count()
        logger.info(
            f"🗄️  Chroma loaded: '{self.collection_name}' "
            f"({count} chunks) @ {self.persist_dir}"
        )
        return store

    # ── Public API ─────────────────────────────────────────────────────────────

    def get_vectorstore(self) -> Chroma:
        """Return the live Chroma vectorstore (load / create on first call)."""
        return self._get_store()

    def chunk_documents(self, documents: List[Document]) -> List[Document]:
        """Split documents into smaller chunks."""
        logger.info(f"✂️  Chunking {len(documents)} document(s)…")
        chunks = self.text_splitter.split_documents(documents)
        logger.info(f"✅  Created {len(chunks)} chunks")
        return chunks

    def add_documents(self, documents: List[Document]) -> int:
        """
        Chunk and add documents to the persistent store.

        Returns the number of chunks added.
        """
        if not documents:
            return 0

        chunks = self.chunk_documents(documents)
        if not chunks:
            return 0

        store = self._get_store()
        store.add_documents(chunks)
        logger.info(f"✅  Added {len(chunks)} chunks to vector store")
        return len(chunks)

    def delete_documents_by_filename(self, filename: str) -> int:
        """
        Delete all chunks whose metadata['filename'] matches.

        Returns the number of chunks deleted.
        """
        store = self._get_store()
        collection = store._collection

        # Find matching IDs
        results = collection.get(where={"filename": filename}, include=[])
        ids = results.get("ids", [])

        if not ids:
            logger.info(f"ℹ️  No chunks found for filename '{filename}'")
            return 0

        collection.delete(ids=ids)
        logger.info(f"🗑️  Deleted {len(ids)} chunks for '{filename}'")
        return len(ids)

    def list_documents(self) -> List[Dict[str, Any]]:
        """
        Return unique filenames and their chunk counts.

        Returns a list of dicts: [{"filename": str, "chunks": int}, ...]
        """
        store = self._get_store()
        collection = store._collection

        results = collection.get(include=["metadatas"])
        metadatas = results.get("metadatas") or []

        counts: Dict[str, int] = {}
        for meta in metadatas:
            if meta:
                fn = meta.get("filename", "unknown")
                counts[fn] = counts.get(fn, 0) + 1

        return [{"filename": fn, "chunks": n} for fn, n in sorted(counts.items())]

    def document_exists(self, filename: str) -> bool:
        """Return True if at least one chunk with this filename is indexed."""
        store = self._get_store()
        results = store._collection.get(
            where={"filename": filename}, include=[], limit=1
        )
        return len(results.get("ids", [])) > 0

    def search_similar(
        self, query: str, k: int | None = None
    ) -> List[Document]:
        """
        Semantic similarity search.

        Args:
            query: Search query string
            k:     Number of results (defaults to settings.SEARCH_K)

        Returns:
            List of matching Document chunks
        """
        k = k or settings.SEARCH_K
        store = self._get_store()
        try:
            return store.similarity_search(query, k=k)
        except Exception as e:
            logger.error(f"❌ Search error: {e}")
            return []

    def search_with_scores(
        self, query: str, k: int | None = None
    ) -> List[tuple[Document, float]]:
        """
        Similarity search returning (doc, score) pairs.
        Scores are cosine distances (lower = more similar for Chroma).
        """
        k = k or settings.SEARCH_K
        store = self._get_store()
        try:
            return store.similarity_search_with_score(query, k=k)
        except Exception as e:
            logger.error(f"❌ Search-with-scores error: {e}")
            return []

    def total_chunks(self) -> int:
        """Return total number of chunks in the store."""
        return self._get_store()._collection.count()
