"""
Vector store management — pgvector with full CRUD support.
"""

from __future__ import annotations

from typing import Any, Dict, List

from langchain_core.documents import Document
from langchain_google_vertexai import VertexAIEmbeddings
from langchain_postgres import PGVector
from langchain_text_splitters import RecursiveCharacterTextSplitter

from src.config import settings
from src.logging_config import get_logger

logger = get_logger(__name__)


class VectorStoreManager:
    """Manages document chunking, embedding, and persistent vector storage via pgvector."""

    def __init__(
        self,
        collection_name: str | None = None,
    ):
        self.collection_name = collection_name or settings.PGVECTOR_COLLECTION

        self.embeddings = VertexAIEmbeddings(
            model_name=settings.GEMINI_EMBED_MODEL,
            project=settings.GOOGLE_CLOUD_PROJECT,
            location=settings.GOOGLE_CLOUD_LOCATION,
        )
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=settings.CHUNK_SIZE,
            chunk_overlap=settings.CHUNK_OVERLAP,
            length_function=len,
        )
        self._store: PGVector | None = None

    def _get_store(self) -> PGVector:
        """Return the active PGVector instance, creating/loading as needed."""
        if self._store is None:
            self._store = self._load_or_create()
        return self._store

    def _load_or_create(self) -> PGVector:
        """Create or connect to the pgvector-backed store."""
        store = PGVector(
            collection_name=self.collection_name,
            connection=settings.PGVECTOR_URI,
            embeddings=self.embeddings,
            use_jsonb=True,
        )
        logger.info(
            f"pgvector store ready: collection='{self.collection_name}'"
        )
        return store

    def get_vectorstore(self) -> PGVector:
        """Return the live PGVector store (load / create on first call)."""
        return self._get_store()

    def chunk_documents(self, documents: List[Document]) -> List[Document]:
        """Split documents into smaller chunks."""
        logger.info(f"Chunking {len(documents)} document(s)...")
        chunks = self.text_splitter.split_documents(documents)
        logger.info(f"Created {len(chunks)} chunks")
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

        batch_size = 50
        for i in range(0, len(chunks), batch_size):
            batch = chunks[i : i + batch_size]
            store.add_documents(batch)
            logger.info(
                f"Added batch {i // batch_size + 1} "
                f"({len(batch)} chunks) to vector store"
            )

        logger.info(f"Added {len(chunks)} chunks total to vector store")
        return len(chunks)

    def delete_documents_by_filename(self, filename: str) -> int:
        """
        Delete all chunks whose metadata['filename'] matches.

        Returns the number of chunks deleted.
        """
        try:
            from sqlalchemy import create_engine, text

            engine = create_engine(settings.PGVECTOR_URI)
            with engine.connect() as conn:
                result = conn.execute(
                    text(
                        "DELETE FROM langchain_pg_embedding "
                        "WHERE collection_id = ("
                        "  SELECT uuid FROM langchain_pg_collection WHERE name = :name"
                        ") AND cmetadata->>'filename' = :filename"
                    ),
                    {"name": self.collection_name, "filename": filename},
                )
                count = result.rowcount
                conn.commit()

            if count:
                logger.info(f"Deleted {count} chunks for '{filename}'")
            else:
                logger.info(f"No chunks found for filename '{filename}'")
            return count or 0
        except Exception as e:
            logger.warning(f"Delete failed for '{filename}': {e}")
            return 0

    def list_documents(self) -> List[Dict[str, Any]]:
        """
        Return unique filenames and their chunk counts.

        Returns a list of dicts: [{"filename": str, "chunks": int}, ...]
        """
        store = self._get_store()

        try:
            from sqlalchemy import create_engine, text

            engine = create_engine(settings.PGVECTOR_URI)
            with engine.connect() as conn:
                result = conn.execute(
                    text(
                        f"SELECT cmetadata->>'filename' AS filename, COUNT(*) AS chunks "
                        f"FROM langchain_pg_embedding "
                        f"WHERE collection_id = ("
                        f"  SELECT uuid FROM langchain_pg_collection WHERE name = :name"
                        f") "
                        f"GROUP BY cmetadata->>'filename' "
                        f"ORDER BY filename"
                    ),
                    {"name": self.collection_name},
                )
                rows = result.fetchall()

            return [
                {"filename": row[0] or "unknown", "chunks": row[1]}
                for row in rows
            ]
        except Exception as e:
            logger.warning(f"Could not list documents via SQL: {e}")
            return []

    def document_exists(self, filename: str) -> bool:
        """Return True if at least one chunk with this filename is indexed."""
        store = self._get_store()

        try:
            from sqlalchemy import create_engine, text

            engine = create_engine(settings.PGVECTOR_URI)
            with engine.connect() as conn:
                result = conn.execute(
                    text(
                        f"SELECT COUNT(*) FROM langchain_pg_embedding "
                        f"WHERE collection_id = ("
                        f"  SELECT uuid FROM langchain_pg_collection WHERE name = :name"
                        f") AND cmetadata->>'filename' = :filename"
                    ),
                    {"name": self.collection_name, "filename": filename},
                )
                count = result.scalar()

            return (count or 0) > 0
        except Exception as e:
            logger.warning(f"Could not check existence for '{filename}': {e}")
            return False

    @staticmethod
    def _matches_filename(doc: Document, filename: str | None) -> bool:
        """Return True when a document chunk belongs to the requested filename."""
        if not filename:
            return True

        metadata = doc.metadata if isinstance(doc.metadata, dict) else {}
        return metadata.get("filename") == filename or metadata.get("source") == filename

    def search_similar(
        self,
        query: str,
        k: int | None = None,
        filename: str | None = None,
    ) -> List[Document]:
        """
        Semantic similarity search.

        Args:
            query: Search query string
            k:     Number of results (defaults to settings.SEARCH_K)
            filename: Optional metadata filename filter

        Returns:
            List of matching Document chunks
        """
        k = k or settings.SEARCH_K
        store = self._get_store()
        try:
            if filename:
                try:
                    return store.similarity_search(
                        query,
                        k=k,
                        filter={"filename": filename},
                    )
                except TypeError:
                    results = store.similarity_search(query, k=max(k * 5, 25))
                    return [
                        doc
                        for doc in results
                        if self._matches_filename(doc, filename)
                    ][:k]

            return store.similarity_search(query, k=k)
        except Exception as e:
            logger.error(f"Search error: {e}")
            return []

    def search_with_scores(
        self,
        query: str,
        k: int | None = None,
        filename: str | None = None,
    ) -> List[tuple[Document, float]]:
        """
        Similarity search returning (doc, score) pairs.
        Scores are cosine distances (lower = more similar).
        """
        k = k or settings.SEARCH_K
        store = self._get_store()
        try:
            if filename:
                try:
                    return store.similarity_search_with_score(
                        query,
                        k=k,
                        filter={"filename": filename},
                    )
                except TypeError:
                    results = store.similarity_search_with_score(
                        query,
                        k=max(k * 5, 25),
                    )
                    return [
                        (doc, score)
                        for doc, score in results
                        if self._matches_filename(doc, filename)
                    ][:k]

            return store.similarity_search_with_score(query, k=k)
        except Exception as e:
            logger.error(f"Search-with-scores error: {e}")
            return []

    def total_chunks(self) -> int:
        """Return total number of chunks in the store."""
        try:
            from sqlalchemy import create_engine, text

            engine = create_engine(settings.PGVECTOR_URI)
            with engine.connect() as conn:
                result = conn.execute(
                    text(
                        f"SELECT COUNT(*) FROM langchain_pg_embedding "
                        f"WHERE collection_id = ("
                        f"  SELECT uuid FROM langchain_pg_collection WHERE name = :name"
                        f")"
                    ),
                    {"name": self.collection_name},
                )
                count = result.scalar()

            return count or 0
        except Exception as e:
            logger.warning(f"Could not count chunks: {e}")
            return 0
