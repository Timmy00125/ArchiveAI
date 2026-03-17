"""
Docling integration for processing uploaded documents.
Adapted for FastAPI: accepts raw bytes instead of Streamlit UploadedFile objects.
"""

import os
import tempfile
import shutil
from typing import List, Any, Tuple
from pathlib import Path

from docling.document_converter import DocumentConverter, PdfFormatOption
from docling.datamodel.base_models import InputFormat
from docling.datamodel.pipeline_options import PdfPipelineOptions
from langchain_core.documents import Document

from src.logging_config import get_logger

logger = get_logger(__name__)


class DocumentProcessor:
    """Handles document processing using Docling."""

    def __init__(self):
        """Initialize the Docling DocumentConverter."""
        pipeline_options = PdfPipelineOptions()
        pipeline_options.do_ocr = True
        pipeline_options.do_table_structure = True
        pipeline_options.generate_picture_images = True
        pipeline_options.images_scale = 2.0

        self.converter = DocumentConverter(
            format_options={
                InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options)
            }
        )

    def process_file_bytes(
        self,
        content: bytes,
        filename: str,
        content_type: str = "",
    ) -> Tuple[List[Document], List[Any]]:
        """
        Process a single file given as raw bytes.

        Args:
            content:      Raw file bytes (from FastAPI UploadFile.read())
            filename:     Original filename (used for metadata + extension detection)
            content_type: MIME type string (optional, used as metadata)

        Returns:
            Tuple of (LangChain Documents, list of Docling doc dicts)
        """
        documents: List[Document] = []
        docling_docs: List[Any] = []
        temp_dir = tempfile.mkdtemp()

        try:
            temp_file_path = os.path.join(temp_dir, filename)
            with open(temp_file_path, "wb") as f:
                f.write(content)

            logger.info(f"📄 Processing {filename} ({len(content)} bytes)...")

            # Plain text / markdown: skip Docling, use raw text
            ext = Path(filename).suffix.lower()
            if ext in {".txt", ".md"}:
                text_content = content.decode("utf-8", errors="replace")
                doc = Document(
                    page_content=text_content,
                    metadata={
                        "filename": filename,
                        "file_type": content_type or ext,
                        "source": filename,
                    },
                )
                documents.append(doc)
                logger.info(f"✅ Plain text processed: {filename}")
                return documents, docling_docs

            # All other formats: use Docling
            result = self.converter.convert(temp_file_path)
            markdown_content = result.document.export_to_markdown()

            doc = Document(
                page_content=markdown_content,
                metadata={
                    "filename": filename,
                    "file_type": content_type or ext,
                    "source": filename,
                },
            )
            documents.append(doc)

            docling_docs.append({"filename": filename, "doc": result.document})

            logger.info(f"✅ Successfully processed {filename}")

        except Exception as e:
            logger.error(f"❌ Error processing {filename}: {e}")

        finally:
            try:
                shutil.rmtree(temp_dir)
            except Exception as cleanup_err:
                logger.warning(f"⚠️ Could not clean up temp dir: {cleanup_err}")

        return documents, docling_docs

    def process_multiple(
        self,
        files: List[Tuple[bytes, str, str]],
    ) -> Tuple[List[Document], List[Any]]:
        """
        Process multiple files.

        Args:
            files: List of (content_bytes, filename, content_type) tuples

        Returns:
            Aggregated (langchain_docs, docling_docs) across all files
        """
        all_documents: List[Document] = []
        all_docling_docs: List[Any] = []

        for content, filename, content_type in files:
            docs, docling = self.process_file_bytes(content, filename, content_type)
            all_documents.extend(docs)
            all_docling_docs.extend(docling)

        logger.info(
            f"✅ Processed {len(files)} files → {len(all_documents)} documents"
        )
        return all_documents, all_docling_docs

    def extract_text_for_context(
        self, content: bytes, filename: str
    ) -> str:
        """
        Extract plain text from a file for use as chat context (no indexing).

        Returns raw text string.
        """
        docs, _ = self.process_file_bytes(content, filename)
        if docs:
            return docs[0].page_content
        return ""
