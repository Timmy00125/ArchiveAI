"""
Document service — orchestrates upload, listing, and deletion of documents.
"""

from __future__ import annotations

from typing import List, Dict, Any, Tuple

from src.document_processor import DocumentProcessor
from src.vectorstore import VectorStoreManager
from src.logging_config import get_logger

logger = get_logger(__name__)


class DocumentService:
    """High-level document management: upload → process → index → CRUD."""

    def __init__(
        self,
        vs_manager: VectorStoreManager,
        processor: DocumentProcessor,
    ):
        self.vs_manager = vs_manager
        self.processor = processor

    # ── Upload ────────────────────────────────────────────────────────────────

    async def upload_file(
        self,
        content: bytes,
        filename: str,
        content_type: str = "",
        skip_if_exists: bool = True,
    ) -> Dict[str, Any]:
        """
        Process and index a single file into the vector store.

        Args:
            content:       Raw file bytes
            filename:      Original filename
            content_type:  MIME type
            skip_if_exists: If True and file already indexed, return 'unchanged'

        Returns:
            {"status": "indexed"|"unchanged"|"error", "filename": str, "chunks_added": int}
        """
        if skip_if_exists and self.vs_manager.document_exists(filename):
            logger.info(f"⏭️  Skipping '{filename}' — already indexed")
            return {"status": "unchanged", "filename": filename, "chunks_added": 0}

        try:
            docs, _ = self.processor.process_file_bytes(content, filename, content_type)

            if not docs:
                return {"status": "error", "filename": filename, "error": "No content extracted"}

            chunks_added = self.vs_manager.add_documents(docs)
            logger.info(f"✅ Indexed '{filename}': {chunks_added} chunks")
            return {"status": "indexed", "filename": filename, "chunks_added": chunks_added}

        except Exception as e:
            logger.error(f"❌ Failed to index '{filename}': {e}")
            return {"status": "error", "filename": filename, "error": str(e)}

    async def upload_multiple(
        self,
        files: List[Tuple[bytes, str, str]],
    ) -> List[Dict[str, Any]]:
        """
        Process and index multiple files.

        Args:
            files: List of (content_bytes, filename, content_type)

        Returns:
            List of result dicts per file
        """
        results = []
        for content, filename, content_type in files:
            result = await self.upload_file(content, filename, content_type)
            results.append(result)
        return results

    async def upload_context(
        self,
        content: bytes,
        filename: str,
    ) -> Dict[str, Any]:
        """
        Extract text from a file for in-chat context (does NOT index it).

        Returns:
            {"filename": str, "content": str, "content_length": int}
        """
        try:
            text = self.processor.extract_text_for_context(content, filename)
            return {
                "filename": filename,
                "content": text,
                "content_length": len(text),
            }
        except Exception as e:
            logger.error(f"❌ Context extraction failed for '{filename}': {e}")
            return {"filename": filename, "content": "", "content_length": 0, "error": str(e)}

    # ── Listing / deletion ───────────────────────────────────────────────────

    def list_documents(self) -> List[Dict[str, Any]]:
        """
        Return all indexed documents with chunk counts.

        Returns:
            [{"filename": str, "chunks": int}, ...]
        """
        return self.vs_manager.list_documents()

    def delete_document(self, filename: str) -> Dict[str, Any]:
        """
        Delete all chunks for a given filename.

        Returns:
            {"success": bool, "filename": str, "deleted_chunks": int}
        """
        if not filename or not filename.strip():
            return {"success": False, "filename": filename, "error": "Filename is required"}

        deleted = self.vs_manager.delete_documents_by_filename(filename.strip())

        if deleted == 0:
            return {
                "success": False,
                "filename": filename,
                "deleted_chunks": 0,
                "error": "No chunks found for this filename",
            }

        return {"success": True, "filename": filename, "deleted_chunks": deleted}

    def check_file_exists(self, filename: str) -> bool:
        """Return True if the file is already indexed."""
        return self.vs_manager.document_exists(filename)

    def get_stats(self) -> Dict[str, Any]:
        """Return high-level stats about the knowledge base."""
        docs = self.list_documents()
        return {
            "total_documents": len(docs),
            "total_chunks": self.vs_manager.total_chunks(),
            "documents": docs,
        }
