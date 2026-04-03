# Chapter 5: Testing, Evaluation, and Results

## 5.1 Introduction

This chapter evaluates ArchiveAI against the objectives and research questions defined earlier. Because the project is a final year engineering prototype, evaluation emphasizes functional validation, retrieval behavior analysis, response-groundedness assessment, and reliability characteristics under realistic development conditions.

## 5.2 Evaluation Framework

Evaluation was structured around five dimensions:

1. Functional correctness: whether core user workflows execute successfully.
2. Extraction adequacy: whether uploaded documents yield useful machine-readable text and structure.
3. Retrieval effectiveness: whether semantic search returns relevant context for representative queries.
4. Response quality: whether generated answers are coherent, grounded, and source-aware.
5. Reliability and usability: whether the system behaves predictably under normal and exceptional conditions.

## 5.3 Test Environment and Setup

The system was evaluated in a local development setup comprising:

- backend API service,
- frontend web client,
- persistent Chroma vector storage,
- PostgreSQL service for chat checkpointing.

Representative document types were used from the supported format set (PDF, DOCX, PPTX, HTML, TXT, and MD). Testing focused on end-to-end workflow behavior rather than isolated algorithmic microbenchmarks.

## 5.4 Functional Verification

Functional verification was performed through scenario-driven endpoint and UI testing.

### 5.4.1 Upload and Indexing Workflow

Observed behavior:

- valid files were accepted and processed,
- unsupported formats were rejected with clear error responses,
- oversized payloads triggered validation failure,
- duplicate filename handling prevented unnecessary re-indexing when enabled.

Result interpretation: upload and indexing flow met expected functional behavior for standard operations.

### 5.4.2 Document Management Workflow

Observed behavior:

- indexed documents were listed with chunk counts,
- deletion removed associated vector chunks by filename,
- document existence checks supported client-side controls,
- structure endpoint returned data only for files processed in the current runtime session.

Result interpretation: CRUD-like document lifecycle behavior is operational, with known runtime-session limitation on structure cache persistence.

### 5.4.3 Search and Chat Workflow

Observed behavior:

- direct semantic search returned top-k chunk results,
- score-enabled mode exposed retrieval diagnostics,
- chat endpoint returned synthesized responses with session identifiers,
- history and session listing enabled conversation continuity.

Result interpretation: query workflows function as designed across both direct retrieval and agent-mediated answering paths.

## 5.5 OCR and Extraction Evaluation

Extraction quality was reviewed qualitatively across supported file categories.

Strengths observed:

- successful conversion of mixed document formats into retrievable text,
- usable extraction from text-dominant files,
- availability of table and hierarchical information through structure visualization components.

Limitations observed:

- OCR-dependent quality variance for low-resolution scans,
- occasional noise propagation into downstream chunks,
- structure detail not persisted beyond runtime cache in current implementation.

Conclusion: extraction quality is sufficient for prototype-grade retrieval and QA, but quality assurance mechanisms (confidence scoring, post-processing cleanup, or engine fallback) remain important future enhancements.

## 5.6 Retrieval Effectiveness Evaluation

Retrieval effectiveness was assessed through relevance inspection of top-k outputs for representative natural language queries.

Findings:

- semantically aligned queries generally returned contextually relevant chunks,
- metadata fields improved interpretability of retrieved results,
- relevance degraded when source extraction contained OCR noise,
- chunking configuration influenced context coherence and answer support quality.

Methodological note: this study uses relevance-oriented qualitative inspection rather than a large labeled benchmark with statistical significance tests. That choice is consistent with project scope but constrains generalizability.

## 5.7 Response Quality Evaluation

Response quality was analyzed using three criteria: coherence, grounding, and citation utility.

Coherence: responses were generally readable and appropriately concise.

Grounding: agent tool usage encouraged evidence retrieval prior to synthesis, improving alignment with indexed sources.

Citation utility: source references (filename-level) improved answer traceability for users.

Observed failure mode: when retrieval returned weak or sparse context, answer confidence could still appear high. This reinforces the need for stronger uncertainty signaling and relevance gating in future versions.

## 5.8 Reliability and Robustness Evaluation

Robustness-focused checks included malformed inputs, unsupported formats, and external dependency disruptions.

Key outcomes:

- input validation prevented common invalid upload scenarios,
- exception handling in API routes prevented uncontrolled crashes,
- provider quota and rate-limit errors were mapped to explicit HTTP responses,
- lifecycle cleanup reduced resource leakage risk on shutdown,
- database initialization issues were handled with fallback strategy to preserve core function.

These behaviors demonstrate acceptable resilience for a student project prototype.

## 5.9 UI/UX Evaluation

Usability was assessed by traversing complete user tasks from upload to answer retrieval.

Positive observations:

- clear page-level separation of chat, search, and document management,
- immediate feedback through loading indicators and toast notifications,
- session-aware navigation supports continuity and discoverability,
- modern interaction design improves engagement.

Areas for improvement:

- stronger empty-state guidance for first-time users,
- improved visibility of retrieval evidence directly in chat responses,
- richer administrative controls for batch operations and indexing status.

## 5.10 Discussion of Results Against Objectives

Objective mapping summary:

- Objective on ingestion and processing: achieved.
- Objective on semantic indexing and retrieval: achieved.
- Objective on conversational querying with memory: achieved.
- Objective on robust evaluation depth: partially achieved, constrained by dataset scale and absence of large annotated benchmark.
- Objective on production-hardening features: partially achieved, intentionally outside prototype scope.

Overall, ArchiveAI satisfies its central aim: it demonstrates that a Docling-to-RAG pipeline can materially improve interaction with unstructured archival content through semantically grounded querying.

## 5.11 Threats to Validity

### 5.11.1 Internal Validity

Some outcomes depend on selected document samples and query phrasing patterns. Different corpora may produce different extraction and retrieval behavior.

### 5.11.2 External Validity

Results from local prototype conditions may not transfer directly to large institutional deployments without infrastructure scaling and governance extensions.

### 5.11.3 Construct Validity

Qualitative relevance judgments and response quality assessments can contain evaluator subjectivity. Future studies should include multi-rater protocols and standardized rubrics.

### 5.11.4 Conclusion Validity

Without a statistically powered benchmark dataset, claims should be interpreted as strong prototype evidence rather than final comparative proof.

## 5.12 Chapter Summary

Evaluation results indicate that ArchiveAI successfully operationalizes the intended OCR-RAG workflow with reliable core functionality and meaningful user-facing utility. Key limitations are acknowledged in extraction variability, evaluation scale, and production controls. Chapter 6 consolidates these findings and presents forward-looking improvements.
