"""
Upload API router — file upload to index or for chat context.
"""

from __future__ import annotations

import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, UploadFile, HTTPException, Request
from fastapi.responses import JSONResponse

from src.config import settings
from src.logging_config import get_logger
from src.structure_visualizer import DocumentStructureVisualizer

logger = get_logger(__name__)

router = APIRouter(prefix="/upload", tags=["upload"])


# ── Dependency helpers ────────────────────────────────────────────────────────


def get_document_service(request: Request):
    return request.app.state.document_service


def get_chat_service(request: Request):
    return request.app.state.chat_service


def get_processor(request: Request):
    return request.app.state.processor


# ── Helpers ───────────────────────────────────────────────────────────────────


def _validate_extension(filename: str) -> bool:
    from pathlib import Path
    return Path(filename).suffix.lower() in settings.ALLOWED_EXTENSIONS


# ── Routes ────────────────────────────────────────────────────────────────────


@router.post("")
async def upload_files(
    files: List[UploadFile] = File(...),
    request: Request = None,
    document_service=Depends(get_document_service),
    processor=Depends(get_processor),
):
    """
    Upload one or more files and index them into the vector store.

    Supported formats: PDF, DOCX, PPTX, HTML, TXT, MD.
    Files that are already indexed are skipped (by filename).

    Returns:
        {"results": [...per-file status...], "total_indexed": int, "total_skipped": int}
    """
    if not files:
        raise HTTPException(status_code=400, detail="No files provided")

    results = []
    total_indexed = 0
    total_skipped = 0

    # Ensure document_structures dict is initialised on app state
    if not hasattr(request.app.state, "document_structures"):
        request.app.state.document_structures = {}

    for upload_file in files:
        filename = upload_file.filename or f"file_{uuid.uuid4().hex}"

        if not _validate_extension(filename):
            results.append({
                "filename": filename,
                "status": "rejected",
                "error": f"Unsupported file type. Allowed: {sorted(settings.ALLOWED_EXTENSIONS)}",
            })
            continue

        content = await upload_file.read()

        if len(content) > settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
            results.append({
                "filename": filename,
                "status": "rejected",
                "error": f"File exceeds {settings.MAX_UPLOAD_SIZE_MB} MB limit",
            })
            continue

        # Process and index
        result = await document_service.upload_file(
            content=content,
            filename=filename,
            content_type=upload_file.content_type or "",
        )
        results.append(result)

        if result.get("status") == "indexed":
            total_indexed += 1

            # Store Docling structure data for this session
            try:
                _, docling_docs = processor.process_file_bytes(
                    content, filename, upload_file.content_type or ""
                )
                if docling_docs:
                    viz = DocumentStructureVisualizer(docling_docs[0]["doc"])
                    request.app.state.document_structures[filename] = (
                        viz.export_full_structure()
                    )
            except Exception as viz_err:
                logger.warning(
                    f"Could not build structure for '{filename}': {viz_err}"
                )

        elif result.get("status") == "unchanged":
            total_skipped += 1

    return JSONResponse(
        {
            "results": results,
            "total_indexed": total_indexed,
            "total_skipped": total_skipped,
            "total_files": len(files),
        },
        status_code=201,
    )


@router.post("/context")
async def upload_context(
    file: UploadFile = File(...),
    session_id: Optional[str] = Form(None),
    document_service=Depends(get_document_service),
    chat_service=Depends(get_chat_service),
):
    """
    Upload a file and add its content as context to a chat session.
    The file is NOT permanently indexed — it's sent as a chat message.

    Returns:
        {"status": "context_added", "filename": str, "session_id": str,
         "content_length": int, "confirmation": str}
    """
    filename = file.filename or "uploaded_document"

    if not _validate_extension(filename):
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type. Allowed: {sorted(settings.ALLOWED_EXTENSIONS)}",
        )

    content = await file.read()
    doc_result = await document_service.upload_context(content, filename)

    if doc_result.get("error"):
        raise HTTPException(status_code=500, detail=doc_result["error"])

    session_id = session_id or str(uuid.uuid4())

    # Build a prompt that delivers the document content to the agent
    context_prompt = (
        f"I'm uploading a document called '{filename}'. "
        f"Here is its content:\n\n{doc_result['content']}\n\n"
        "Please confirm you've received this document and are ready to answer questions about it."
    )

    chat_result = await chat_service.chat(
        prompt=context_prompt,
        session_id=session_id,
        stream=False,
    )

    return JSONResponse({
        "status": "context_added",
        "filename": filename,
        "content_length": doc_result["content_length"],
        "session_id": session_id,
        "confirmation": chat_result.get("response", ""),
    })
