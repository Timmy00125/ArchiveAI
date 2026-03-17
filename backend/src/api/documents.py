"""
Document management API router — list and delete indexed documents.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from src.logging_config import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/documents", tags=["documents"])


# ── Dependency helper ─────────────────────────────────────────────────────────


def get_document_service(request: Request):
    return request.app.state.document_service


# ── Pydantic models ───────────────────────────────────────────────────────────


class DeleteDocumentRequest(BaseModel):
    filename: str


# ── Routes ────────────────────────────────────────────────────────────────────


@router.get("")
async def list_documents(
    document_service=Depends(get_document_service),
):
    """
    List all indexed documents with their chunk counts.

    Returns:
        {"documents": [{"filename": str, "chunks": int}], "total_documents": int, "total_chunks": int}
    """
    stats = document_service.get_stats()
    return JSONResponse(stats)


@router.delete("")
async def delete_document(
    body: DeleteDocumentRequest,
    document_service=Depends(get_document_service),
):
    """
    Delete all chunks for a given filename from the vector store.

    Body: `{"filename": "my_document.pdf"}`
    """
    filename = (body.filename or "").strip()
    if not filename:
        return JSONResponse({"error": "Filename is required"}, status_code=400)

    result = document_service.delete_document(filename)
    status_code = 200 if result.get("success") else 404
    return JSONResponse(result, status_code=status_code)


@router.get("/exists")
async def check_document_exists(
    filename: str,
    document_service=Depends(get_document_service),
):
    """
    Check whether a document is already indexed.

    Query param: `?filename=my_document.pdf`
    """
    exists = document_service.check_file_exists(filename)
    return JSONResponse({"filename": filename, "exists": exists})


@router.get("/{filename}/structure")
async def get_document_structure(
    filename: str,
    request: Request,
    document_service=Depends(get_document_service),
):
    """
    Return Docling structural analysis for an indexed document.

    Note: structure data is only available for documents processed in the
    current server session (not re-loaded from Chroma persistence).
    """
    # Structure info is stored in app state; populated at upload time
    structures = getattr(request.app.state, "document_structures", {})
    structure = structures.get(filename)

    if structure is None:
        return JSONResponse(
            {
                "filename": filename,
                "message": "Structure data not available (document may have been indexed in a previous session).",
                "available_files": list(structures.keys()),
            },
            status_code=404,
        )

    return JSONResponse({"filename": filename, "structure": structure})
