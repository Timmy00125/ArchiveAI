"""
Document service — orchestrates upload, listing, and deletion of documents.
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import List, Dict, Any, Tuple

from src.config import settings
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
        # Sanitize filename to prevent path traversal
        safe_filename = Path(filename).name

        if skip_if_exists and self.vs_manager.document_exists(safe_filename):
            logger.info(f"⏭️  Skipping '{safe_filename}' — already indexed")
            return {"status": "unchanged", "filename": safe_filename, "chunks_added": 0}

        try:
            # Save original file to disk for vision analysis tool
            os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
            upload_path = os.path.join(settings.UPLOAD_DIR, safe_filename)
            with open(upload_path, "wb") as f:
                f.write(content)

            docs, _ = self.processor.process_file_bytes(content, safe_filename, content_type)

            if not docs:
                return {"status": "error", "filename": safe_filename, "error": "No content extracted"}

            # Save full markdown text to disk for summarization tool
            try:
                os.makedirs(settings.MARKDOWN_DIR, exist_ok=True)
                markdown_path = os.path.join(settings.MARKDOWN_DIR, f"{safe_filename}.md")
                full_text = "\n\n".join(doc.page_content for doc in docs)
                with open(markdown_path, "w", encoding="utf-8") as f:
                    f.write(full_text)
            except Exception as e:
                logger.warning(f"Could not save markdown for {safe_filename}: {e}")

            chunks_added = self.vs_manager.add_documents(docs)
            logger.info(f"✅ Indexed '{safe_filename}': {chunks_added} chunks")
            return {"status": "indexed", "filename": safe_filename, "chunks_added": chunks_added}

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
        Delete all chunks for a given filename and clean up disk files.

        Returns:
            {"success": bool, "filename": str, "deleted_chunks": int}
        """
        if not filename or not filename.strip():
            return {"success": False, "filename": filename, "error": "Filename is required"}

        safe_filename = Path(filename).name
        deleted = self.vs_manager.delete_documents_by_filename(safe_filename)

        if deleted == 0:
            return {
                "success": False,
                "filename": safe_filename,
                "deleted_chunks": 0,
                "error": "No chunks found for this filename",
            }

        # Clean up saved disk files
        try:
            upload_path = os.path.join(settings.UPLOAD_DIR, safe_filename)
            markdown_path = os.path.join(settings.MARKDOWN_DIR, f"{safe_filename}.md")
            if os.path.exists(upload_path):
                os.remove(upload_path)
            if os.path.exists(markdown_path):
                os.remove(markdown_path)
        except Exception as e:
            logger.warning(f"Could not clean up disk files for {safe_filename}: {e}")

        return {"success": True, "filename": safe_filename, "deleted_chunks": deleted}

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
