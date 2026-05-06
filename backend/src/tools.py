"""
Agent tools for document search, summarization, and vision analysis.
"""

import base64
import mimetypes
import os
from pathlib import Path
from typing import Annotated

from langchain_core.messages import HumanMessage
from langchain_core.tools import tool
from langchain_google_vertexai import ChatVertexAI

from src.config import settings
from src.logging_config import get_logger

logger = get_logger(__name__)


def create_search_tool(vectorstore_manager):
    """
    Create a search tool bound to a VectorStoreManager.
    """

    @tool
    def search_documents(
        query: Annotated[str, "The search query or question about the documents"],
    ) -> str:
        """
        Search the uploaded documents for relevant information.
        """
        try:
            results = vectorstore_manager.search_similar(query)

            if not results:
                return "No relevant information found in the documents for this query."

            context_parts = []
            for i, doc in enumerate(results, 1):
                source = doc.metadata.get(
                    "filename", doc.metadata.get("source", "Unknown source")
                )
                content = doc.page_content.strip()

                context_parts.append(f"[Source {i}: {source}]\nContent: {content}\n")

            return "\n---\n".join(context_parts)

        except Exception as e:
            return f"Error searching documents: {str(e)}"

    return search_documents


def create_summarize_tool():
    """Create a tool that summarizes a full document."""

    @tool
    async def summarize_document(
        filename: Annotated[str, "The exact filename of the document to summarize"],
    ) -> str:
        """
        Summarize an entire document.
        Use this tool when a user asks for a high-level overview, a summary, or
        general understanding of a specific file, bypassing the chunked vector search.
        """
        safe_filename = Path(filename).name
        markdown_path = os.path.join(settings.MARKDOWN_DIR, f"{safe_filename}.md")
        if not os.path.exists(markdown_path):
            return f"Error: Could not find the extracted text for document '{safe_filename}'. Are you sure the filename is correct?"

        try:
            with open(markdown_path, "r", encoding="utf-8") as f:
                content = f.read()

            llm = ChatVertexAI(
                model_name=settings.GEMINI_MODEL,
                temperature=0,
                project=settings.GOOGLE_CLOUD_PROJECT,
                location=settings.GOOGLE_CLOUD_LOCATION,
            )

            prompt = (
                f"Please provide a comprehensive summary of the following document. "
                f"Highlight the main points, key arguments, and structure.\n\n"
                f"Document: {safe_filename}\n\nContent:\n{content}"
            )

            response = await llm.ainvoke(prompt)
            return f"Summary of {safe_filename}:\n\n{response.content}"

        except Exception as e:
            logger.error(f"Error summarizing document {safe_filename}: {e}")
            return f"Error summarizing document: {str(e)}"

    return summarize_document


def create_vision_tool():
    """Create a tool that passes the raw file to Gemini for visual analysis."""

    @tool
    async def analyze_image_document(
        filename: Annotated[str, "The exact filename of the document to analyze"],
        query: Annotated[
            str, "The specific question about the document's visual content or layout"
        ],
    ) -> str:
        """
        Analyze the original raw document (image or PDF) using a vision model.
        Use this tool when standard search fails to answer questions about diagrams,
        charts, complex layouts, or handwriting in a specific file.
        """
        safe_filename = Path(filename).name
        upload_path = os.path.join(settings.UPLOAD_DIR, safe_filename)
        if not os.path.exists(upload_path):
            return f"Error: Original file '{safe_filename}' not found. It may not have been saved or the filename is incorrect."

        # Guard against oversized files for vision API
        file_size = os.path.getsize(upload_path)
        if file_size > 5 * 1024 * 1024:  # 5 MB
            return (
                f"Error: File '{safe_filename}' is too large ({file_size / (1024 * 1024):.1f} MB) "
                f"for visual analysis. Try summarizing the document instead."
            )

        try:
            mime_type, _ = mimetypes.guess_type(upload_path)
            if not mime_type:
                mime_type = "application/pdf"

            with open(upload_path, "rb") as f:
                file_bytes = f.read()

            file_data = base64.b64encode(file_bytes).decode("utf-8")

            llm = ChatVertexAI(
                model_name=settings.GEMINI_VISION_MODEL,
                temperature=0,
                project=settings.GOOGLE_CLOUD_PROJECT,
                location=settings.GOOGLE_CLOUD_LOCATION,
            )

            message = HumanMessage(
                content=[
                    {
                        "type": "text",
                        "text": f"Context: The user is asking about the file '{safe_filename}'.\nQuery: {query}",
                    },
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:{mime_type};base64,{file_data}"},
                    },
                ]
            )

            response = await llm.ainvoke([message])
            return response.content

        except Exception as e:
            logger.error(f"Error visually analyzing document {safe_filename}: {e}")
            return f"Error visually analyzing document: {str(e)}"

    return analyze_image_document
