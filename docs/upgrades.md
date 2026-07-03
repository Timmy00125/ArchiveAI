## ArchiveAI Upgrade Recommendations

This document captures recommended upgrades for ArchiveAI based on the current codebase and the limitations already identified in the thesis documentation.

## Current System Summary

ArchiveAI already provides:

- document upload and OCR-backed processing,
- semantic indexing with pgvector,
- conversational document Q&A via LangGraph and Gemini,
- semantic search with raw chunk inspection,
- chat session persistence in PostgreSQL,
- a Next.js frontend for chat, document management, and search.

The core platform is functional and well-structured, but it is still at prototype maturity in several important areas: retrieval quality, ingestion scalability, governance, observability, and evaluation rigor.

## Highest-Priority Upgrades

### 1. Improve Retrieval Quality

Current state:

- Retrieval is primarily single-stage vector similarity search.
- The agent depends on prompt instructions to stay grounded.
- Search results are useful, but precision may degrade for noisy OCR, ambiguous queries, or repetitive documents.

Recommended upgrades:

- Add hybrid retrieval: semantic search plus lexical or BM25 retrieval.
- Add reranking to reorder retrieved chunks before answer generation.
- Add metadata-aware retrieval filters such as filename, date, collection, or document type.
- Add page-level or section-level citation support instead of filename-only attribution.
- Explore adaptive chunking based on document structure rather than fixed character windows.

Why this matters:

- This is likely the single biggest quality improvement for answer relevance and trustworthiness.

Relevant implementation areas:

- `backend/src/vectorstore.py`
- `backend/src/tools.py`
- `backend/src/agent.py`
- `backend/src/api/search.py`

### 2. Move Ingestion to Background Jobs

Current state:

- Upload processing and indexing happen inline during the request.
- Multiple files are processed sequentially.
- OCR and embedding work can become slow or fragile under larger batches.

Recommended upgrades:

- Move OCR, markdown export, structure extraction, and vector indexing into asynchronous background jobs.
- Add upload job states such as `queued`, `processing`, `indexed`, `failed`.
- Add progress reporting in the frontend.
- Add retries for transient failures.
- Add cancellation support for large batch uploads.

Why this matters:

- This improves scalability, user experience, and operational resilience.

Relevant implementation areas:

- `backend/src/api/upload.py`
- `backend/src/services/document_service.py`
- `backend/src/document_processor.py`
- `frontend/components/documents/document-upload.tsx`

### 3. Add First-Class Document Metadata Storage

Current state:

- Indexed chunks live in pgvector.
- extracted markdown and structure data live on disk.
- There is no central relational document record with lifecycle state.

Recommended upgrades:

- Add a `documents` table for uploaded file metadata.
- Store filename, checksum, MIME type, file size, upload timestamp, page count, OCR status, indexing status, and ownership metadata.
- Add tags, collections, or project grouping.
- Track extraction confidence and processing errors.

Why this matters:

- This supports filtering, admin tooling, analytics, deduplication, and future multi-user workflows.

Relevant implementation areas:

- `backend/src/services/document_service.py`
- `backend/src/main.py`
- `backend/src/config.py`
- PostgreSQL schema in the backend persistence layer

### 4. Add Authentication, Authorization, and Audit Logging

Current state:

- The system is effectively single-tenant and unauthenticated.
- There is no role model or audit trail.

Recommended upgrades:

- Add login and session or token-based authentication.
- Add role-based access control for upload, delete, chat, and admin actions.
- Add tenant or workspace isolation.
- Add audit logs for uploads, deletions, queries, and configuration changes.

Why this matters:

- This is essential if the platform will handle institutional, sensitive, or multi-user archive content.

Relevant implementation areas:

- all backend API routers under `backend/src/api/`
- document and chat persistence flows
- frontend navigation and settings workflows

### 5. Build an Evidence-First Chat Experience

Current state:

- Chat streams correctly and supports history.
- Responses are shown as markdown, but evidence is not surfaced in a strong UX pattern.
- Structure data is available, but document inspection is still basic.

Recommended upgrades:

- Add inline citations linked to retrieved evidence chunks.
- Add a side panel showing supporting excerpts and sources used in the answer.
- Add confidence or evidence-strength indicators.
- Add document-scoped chat controls such as "ask only about this file".
- Replace raw JSON structure viewing with a richer structure explorer for headings, tables, and images.

Why this matters:

- This significantly improves explainability and user trust.

Relevant implementation areas:

- `frontend/components/chat/chat-area.tsx`
- `frontend/components/chat/message-bubble.tsx`
- `frontend/components/search/search-ui.tsx`
- `frontend/components/documents/document-table.tsx`
- `backend/src/tools.py`

## Medium-Priority Upgrades

### 6. Strengthen OCR Robustness

Current state:

- The system relies on a single Docling-based extraction path.
- Performance may vary across poor scans, unusual layouts, or low-quality archival material.

Recommended upgrades:

- Add preprocessing for skew, low contrast, and noisy scans.
- Add fallback or comparative OCR engines.
- Add extraction quality scoring and flag low-confidence documents.
- Add per-document extraction diagnostics.

Why this matters:

- Better extraction improves every downstream stage: chunking, retrieval, and answer quality.

Relevant implementation areas:

- `backend/src/document_processor.py`
- `backend/src/structure_visualizer.py`

### 7. Add Stronger Search and Document Workflows

Current state:

- Search works as a direct raw retrieval interface.
- Documents can be uploaded, previewed, deleted, and queried through chat.

Recommended upgrades:

- Add saved searches.
- Add filters by document, collection, date, and type.
- Add compare-documents workflows.
- Add export for summaries, answer transcripts, or evidence bundles.
- Add document-level actions such as summarize, extract entities, or generate study notes.

Why this matters:

- These upgrades make ArchiveAI more useful as a working archive research environment rather than only a prototype demo.

Relevant implementation areas:

- `frontend/app/(app)/documents/page.tsx`
- `frontend/app/(app)/search/page.tsx`
- `frontend/components/documents/document-table.tsx`
- `frontend/components/search/search-ui.tsx`

### 8. Improve Observability and Diagnostics

Current state:

- The backend exposes a health endpoint.
- Logging exists, but operational telemetry is limited.
- Frontend diagnostics are mostly browser/session level.

Recommended upgrades:

- Add metrics for OCR time, indexing throughput, retrieval latency, chat latency, and error rates.
- Track model usage, token usage, and cost.
- Add dashboards for ingestion failures and queue depth.
- Add readiness and dependency health checks for database and model access.

Why this matters:

- This is necessary for stable operation and easier debugging as the system grows.

Relevant implementation areas:

- `backend/src/main.py`
- `backend/src/logging_config.py`
- `frontend/app/(app)/settings/page.tsx`

### 9. Add Evaluation Benchmarks and Quality Measurement

Current state:

- The thesis already notes limited benchmark-scale evaluation.
- There is no built-in regression dataset or automated quality measurement pipeline.

Recommended upgrades:

- Build a labeled set of representative archive questions and expected evidence.
- Measure retrieval metrics such as recall and precision at top-k.
- Evaluate answer groundedness and citation correctness.
- Track changes in retrieval quality after model or chunking updates.

Why this matters:

- This turns future upgrades into measurable engineering improvements rather than subjective changes.

Relevant implementation areas:

- evaluation dataset and scripts under a future `backend/tests/` or `evaluation/` area
- search and chat endpoints

### 10. Add Testing and CI/CD Quality Gates

Current state:

- No backend test suite was found.
- No GitHub Actions workflow was found.
- Frontend currently has lint and build scripts, but no automated pipeline.

Recommended upgrades:

- Add backend API tests for upload, search, and chat flows.
- Add smoke tests for document deletion and session persistence.
- Add frontend lint and build checks in CI.
- Add a small seeded fixture set for regression testing.

Why this matters:

- This reduces breakage risk as the codebase becomes more advanced.

Relevant implementation areas:

- `frontend/package.json`
- backend API routes and services
- repository `.github/` workflows

## Lower-Priority but Valuable Upgrades

### 11. Improve Conversation Features

Recommended upgrades:

- add pinned conversations,
- add session renaming,
- add message bookmarking,
- add answer regeneration with retrieval trace visibility,
- add export to markdown or PDF.

Why this matters:

- These features improve usability, especially for academic or archival research sessions.

### 12. Improve Structure and Visual Analysis UX

Current state:

- Structure data is available, but mostly presented as raw JSON.
- Visual analysis exists as an agent tool, but the frontend does not strongly expose image-centric workflows.

Recommended upgrades:

- Add a tree view for heading hierarchy.
- Add rendered table previews.
- Add thumbnail previews for extracted figures.
- Add page-linked navigation between chat citations and document structure.

Why this matters:

- ArchiveAI has document intelligence capabilities that are not yet fully surfaced in the UI.

### 13. Add Multi-Collection and Multi-Tenant Capabilities

Recommended upgrades:

- Add named collections or projects.
- Let users scope search and chat to selected collections.
- Separate embeddings, permissions, and metrics per collection or tenant.

Why this matters:

- This is important for institutional adoption and larger knowledge bases.

## Suggested Upgrade Order

If development time is limited, the best return-on-investment sequence is:

1. Hybrid retrieval and reranking
2. Background ingestion pipeline
3. Evidence-first chat and citation UX
4. Testing and CI quality gates
5. Authentication, authorization, and audit logging

## Suggested Roadmap by Maturity Level

### Demo-Ready

- Improve citations and evidence display
- Add reranking
- Improve structure viewer
- Add better upload progress and failure states
- Add smoke tests for the main workflows

### Thesis-Ready

- Add benchmark queries and retrieval evaluation
- Add extraction-quality diagnostics
- Add observability metrics for latency and indexing
- Align documentation and architecture notes with the live codebase

### Production-Ready

- Add auth, RBAC, and audit trails
- Add background workers and job tracking
- Add document metadata tables and collection support
- Add CI/CD gates and operational dashboards
- Add tenant isolation and scalable deployment controls

## Conclusion

ArchiveAI already has a solid prototype foundation. The best next upgrades are the ones that improve retrieval quality, ingestion reliability, trustworthiness of answers, and operational maturity. If only a few upgrades can be implemented, prioritize retrieval quality, background processing, and evidence-centered UX first.
