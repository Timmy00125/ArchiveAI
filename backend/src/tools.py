"""
Agent tools for document search and retrieval.
"""

from typing import Annotated
from langchain_core.tools import tool


def create_search_tool(vectorstore_manager):
    """
    Create a search tool bound to a VectorStoreManager.

    Args:
        vectorstore_manager: VectorStoreManager instance

    Returns:
        LangChain tool function
    """

    @tool
    def search_documents(
        query: Annotated[str, "The search query or question about the documents"],
    ) -> str:
        """
        Search the uploaded documents for relevant information.

        Use this tool when you need to find specific information from the
        uploaded documents to answer user questions.
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
                file_type = doc.metadata.get("file_type", "")
                content = doc.page_content.strip()

                context_parts.append(
                    f"[Source {i}: {source}]\n"
                    f"Content: {content}\n"
                )

            return "\n---\n".join(context_parts)

        except Exception as e:
            return f"Error searching documents: {str(e)}"

    return search_documents
