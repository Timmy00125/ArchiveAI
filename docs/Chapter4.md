# Chapter 4: System Design and Implementation

## 4.1 Introduction

This chapter translates the analytical framework from Chapter 3 into concrete system architecture and implementation details. It explains how ArchiveAI was engineered as a full-stack platform integrating OCR-driven document processing, semantic retrieval, and conversational query handling.

## 4.2 High-Level System Architecture

ArchiveAI follows a modular architecture composed of five major subsystems:

1. Web Client Layer: Next.js frontend for interaction and visualization.
2. API Gateway Layer: FastAPI endpoints for document, search, and chat operations.
3. Processing and Intelligence Layer: Docling processor, vector manager, and agent tooling.
4. Persistence Layer A: Chroma vector database for indexed document chunks.
5. Persistence Layer B: PostgreSQL checkpoint store for chat session memory.

At startup, the backend initializes shared singleton-like services (document processor, vector manager, document service, chat service) inside application state to avoid repeated model and storage initialization overhead.

## 4.3 Technology Stack and Design Rationale

### 4.3.1 Backend Stack

- FastAPI: selected for typed request models, asynchronous support, and clean API documentation generation.
- Docling: selected for OCR-capable document conversion with structure extraction support.
- LangChain/LangGraph: selected for agent and tool orchestration.
- Chroma: selected for lightweight persistent vector storage suited to prototype scale.
- PostgreSQL + LangGraph checkpointer: selected for session persistence beyond in-memory runtime.

### 4.3.2 Frontend Stack

- Next.js App Router: selected for scalable route organization and modern React workflow.
- TypeScript: selected for maintainable client-side type safety.
- Shadcn/Radix UI foundations with Tailwind styling: selected for composable interface development.

## 4.4 Backend Module Design

The backend codebase is organized under a source package with clear responsibility boundaries.

### 4.4.1 Entry and Lifecycle Management

The main application module configures:

- application metadata,
- CORS policies,
- API route registration,
- startup initialization and shutdown cleanup logic.

A lifespan context manager performs stateful resource setup and teardown, including vector manager initialization and database pool handling.

### 4.4.2 Configuration Layer

A central settings object loads environment variables for:

- model selection,
- vector persistence path and collection name,
- chunking/search parameters,
- upload size and file extension constraints,
- PostgreSQL connection parameters,
- API prefix and allowed origins.

This centralization improves deployment portability and reproducibility.

### 4.4.3 Service Layer

Two service classes encapsulate business logic.

Document service responsibilities:

- orchestrate upload processing and indexing,
- provide document listing and deletion,
- support context-only extraction mode.

Chat service responsibilities:

- initialize and hold the retrieval-enabled agent,
- process chat queries,
- expose history/session operations,
- support session-level conversation management.

## 4.5 Document Ingestion and OCR Implementation

### 4.5.1 Upload Validation and Intake

The upload route accepts multipart file input and validates:

- file extension against an allowlist,
- payload size against configured maximum.

Each accepted file is processed through the document service, and indexing outcomes are returned per file with status markers such as indexed, unchanged, or rejected.

### 4.5.2 Conversion Pipeline

The document processor operates in format-sensitive mode:

- plain text and markdown are decoded directly,
- other formats are written temporarily and converted through Docling.

Docling pipeline options enable OCR and table structure extraction for robust content recovery from scanned or layout-rich files. Converted output is exported to markdown and wrapped in a document object with metadata for indexing.

### 4.5.3 Structural Visualization Support

A structure visualizer component extracts hierarchy, table, and picture descriptors from Docling document objects. These are cached in application state during the server session and exposed by a dedicated endpoint for document structure inspection.

## 4.6 Retrieval Layer Implementation

### 4.6.1 Chunking Strategy

ArchiveAI uses recursive character text splitting with configurable chunk size and overlap. This strategy balances retrieval granularity and context completeness.

### 4.6.2 Embedding and Index Persistence

Chunks are embedded using a Gemini embedding model and stored in a persistent Chroma collection. Metadata fields include filename/source references to enable CRUD and attribution.

### 4.6.3 Search APIs

Two retrieval modes are implemented:

- similarity search returning raw content and metadata,
- similarity search with score reporting for analytical inspection.

This dual mode supports both operational querying and evaluation-phase diagnostics.

## 4.7 Agent and Conversational Implementation

### 4.7.1 Tool-Enabled Agent Design

The agent is created via a ReAct-style graph with:

- a deterministic-temperature chat model,
- a search_documents tool bound to the vector manager,
- a system prompt emphasizing focused retrieval and source citation.

### 4.7.2 Response Modes

The chat API supports:

- standard request-response mode,
- server-sent events (SSE) streaming mode.

Streaming mode emits token events and session identifiers to support responsive UI updates.

### 4.7.3 Session Memory and History

Conversation state is keyed by session/thread identifiers. History retrieval and session listing endpoints allow users to revisit prior interactions. When PostgreSQL is unavailable, the architecture is designed to continue operation with reduced persistence guarantees.

## 4.8 API Contract Design

ArchiveAI exposes versioned REST-style endpoints grouped by concern.

| Endpoint Group | Key Operations                                              |
| -------------- | ----------------------------------------------------------- |
| Upload         | index files, context-only upload                            |
| Documents      | list indexed files, existence check, delete, structure view |
| Search         | semantic retrieval with optional score output               |
| Chat           | query, stream, history retrieval, session list/delete       |

Request and response models are typed via schema classes, improving input validation and API contract clarity.

## 4.9 Frontend Design and Implementation

### 4.9.1 Route and Layout Structure

Frontend routes are organized around three primary workflows:

- chat workspace,
- document management workspace,
- semantic search workspace.

A persistent sidebar provides navigation and recent session visibility.

### 4.9.2 Chat Interface

The chat area supports:

- optimistic message rendering,
- asynchronous request handling,
- session-aware URL routing,
- history loading for previous sessions,
- markdown rendering for assistant responses.

### 4.9.3 Document Interface

The document page provides drag-and-drop upload, indexed document table view, deletion controls, and structure-dialog inspection for processed files.

### 4.9.4 Search Interface

The search page provides direct semantic retrieval independent of conversational synthesis, enabling users to inspect raw evidence chunks and retrieval scores.

## 4.10 Reliability, Error Handling, and Operational Behavior

The implementation includes explicit reliability controls:

- request validation and structured error responses,
- provider quota/rate-limit error mapping in chat endpoint,
- startup health exposure and vector statistics endpoint,
- explicit resource cleanup and connection pool closure.

Logging is centralized through a configured formatter to simplify runtime diagnosis.

## 4.11 Deployment and Configuration

ArchiveAI supports local deployment with environment-driven configuration and optional containerized PostgreSQL provisioning via compose configuration. Runtime composition emphasizes low setup complexity while preserving modular separation of stateful services.

## 4.12 Implementation Challenges and Resolutions

The major engineering challenges encountered include:

1. Heterogeneous format handling: resolved through extension-aware branching and Docling conversion integration.
2. State management for conversation continuity: resolved through thread-based checkpointing with explicit history endpoints.
3. Robust response parsing in frontend: resolved through normalization logic for variable content shapes.
4. Failure tolerance under external dependency issues: resolved through guarded initialization and API-level exception mapping.

## 4.13 Chapter Summary

This chapter showed how ArchiveAI was implemented as a cohesive system combining extraction, retrieval, and conversational intelligence. The design emphasizes modularity, operational clarity, and practical extensibility. Chapter 5 evaluates the resulting system behavior against project objectives and research questions.
