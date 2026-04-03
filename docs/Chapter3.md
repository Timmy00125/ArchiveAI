# Chapter 3: Methodology and System Analysis

## 3.1 Introduction

This chapter presents the methodology used to engineer ArchiveAI and the analytical basis for its architecture. It defines the requirement set, system actors, workflow models, and design constraints that informed implementation choices. The intent is to show traceability from problem definition to concrete software decisions.

## 3.2 Development Methodology

ArchiveAI was developed using an iterative engineering methodology influenced by Agile principles and prototype-driven refinement. The process was organized into recurring cycles:

1. requirement interpretation,
2. module implementation,
3. integration testing,
4. interface adjustment,
5. reliability hardening.

This approach is appropriate for AI-centric systems because integration behavior (OCR output quality, retrieval relevance, model response characteristics) often cannot be fully predicted at design time. Iteration enabled continuous alignment between theoretical objectives and empirical system behavior.

## 3.3 Requirements Elicitation

Requirements were derived from the target workflow of archive users who need rapid access to specific information in large document collections. The elicitation process focused on practical interactions: upload, index, search, ask questions, and revisit conversations.

### 3.3.1 Functional Requirements

Core functional requirements are summarized below.

| ID  | Requirement          | Description                                                           |
| --- | -------------------- | --------------------------------------------------------------------- |
| FR1 | Document Upload      | System shall accept supported file types and validate constraints.    |
| FR2 | Text Extraction      | System shall process uploaded files with OCR-enabled conversion.      |
| FR3 | Vector Indexing      | System shall chunk and index extracted text for semantic retrieval.   |
| FR4 | Document Management  | System shall list indexed documents and allow deletion by filename.   |
| FR5 | Semantic Search      | System shall return relevant chunks for direct query-based retrieval. |
| FR6 | Conversational Query | System shall support chat queries grounded in indexed evidence.       |
| FR7 | Session Memory       | System shall preserve and retrieve chat history per session.          |
| FR8 | Context Upload Mode  | System shall allow non-indexed contextual document upload for chat.   |

### 3.3.2 Non-Functional Requirements

| ID   | Requirement Class | Description                                                             |
| ---- | ----------------- | ----------------------------------------------------------------------- |
| NFR1 | Performance       | Responsive API interaction for upload, search, and chat operations.     |
| NFR2 | Reliability       | Graceful degradation when external dependencies fail.                   |
| NFR3 | Maintainability   | Modular code organization by API, service, retrieval, and agent layers. |
| NFR4 | Usability         | Clear web workflows with navigation, feedback, and state visibility.    |
| NFR5 | Portability       | Local deployment support with environment-based configuration.          |
| NFR6 | Observability     | Structured logging for diagnosis and lifecycle monitoring.              |

## 3.4 Feasibility and Constraints

### 3.4.1 Technical Feasibility

The stack selection (FastAPI, Docling, LangGraph/LangChain, Chroma, PostgreSQL, Next.js) is technically feasible for prototype-to-small-production deployment. Existing ecosystem integrations reduce development overhead and allow rapid modular composition.

### 3.4.2 Operational Constraints

Key constraints include:

- dependence on external LLM/embedding provider availability and quota,
- OCR quality variance across scan quality and document complexity,
- local resource limits for large-scale indexing,
- absence of enterprise identity and access control in the current prototype.

## 3.5 System Actors and Use Cases

Two primary actor roles are considered:

1. Archive User: uploads files, executes searches, asks questions, inspects results.
2. System Administrator/Developer: configures environment, monitors logs, manages deployment and data persistence.

Principal use cases:

- UC1: Upload and index document.
- UC2: List indexed documents and inspect chunk statistics.
- UC3: Delete document and associated vector chunks.
- UC4: Execute semantic search and inspect retrieved evidence.
- UC5: Start chat session and obtain grounded answer.
- UC6: Resume prior session using persisted history.

## 3.6 End-to-End Data Flow Analysis

The ArchiveAI data flow can be modeled as a deterministic pipeline with optional branches.

1. Client submits file through multipart endpoint.
2. Backend validates extension and upload size.
3. Document processor converts bytes to extractable representation.
4. Extracted text is chunked recursively.
5. Chunks are embedded and persisted in vector storage.
6. User submits search or chat query.
7. Retrieval layer returns top-k semantically similar chunks.
8. Agent synthesizes final response with source references.
9. Conversation state is checkpointed per session thread.

An alternate branch supports context-only upload for chat without persistent vector indexing.

## 3.7 Architecture-Oriented Analysis

The system follows a layered service-oriented decomposition:

- presentation layer (Next.js frontend),
- interface layer (FastAPI routers),
- application layer (document and chat services),
- intelligence layer (Docling processor, vector manager, agent tools),
- persistence layer (Chroma and PostgreSQL checkpoints).

This decomposition enforces separation of concerns and supports future extensibility. For example, retrieval components can be replaced without redesigning API contracts, and chat memory backends can be changed independently from frontend workflows.

## 3.8 Algorithmic Workflow Design

### 3.8.1 Document Processing Algorithm

Processing logic is format-aware:

- TXT/MD files are decoded directly.
- Other supported formats are passed to Docling conversion with OCR and structure options.
- Extracted content is represented as text documents with metadata (filename, source, file type).

### 3.8.2 Chunking and Embedding

Recursive character-based chunking is used with configured chunk size and overlap. Overlap preserves local context continuity and reduces boundary information loss. Chunk vectors are generated through a Gemini embedding model and stored in a persistent collection.

### 3.8.3 Retrieval and Response Synthesis

At query time, semantic similarity search returns top-k chunks. The agent receives retrieved context through a tool function and composes a response under system rules emphasizing concise synthesis and source citation.

### 3.8.4 Session State Management

Each conversation is keyed by thread identifier. The checkpointer stores message-state transitions, enabling history retrieval and multi-session continuity.

## 3.9 Error Handling and Risk Treatment

Risk handling includes:

- input validation for extension and file-size limits,
- guarded execution paths in upload and search endpoints,
- quota/rate-limit exception mapping to user-facing API responses,
- fallback strategy when PostgreSQL checkpoint storage is unavailable,
- best-effort resource cleanup on shutdown.

This strategy prioritizes continuity of core service even under partial dependency failure.

## 3.10 Security and Ethics Considerations

Archive data may contain sensitive organizational or personal information. While this prototype does not yet implement full role-based access control, the design acknowledges key safeguards required for operational deployment:

- controlled environment variable management,
- strict transport and origin policies,
- audit-capable request logging,
- explicit user guidance on AI-generated output limitations.

Ethically, the system follows an evidence-grounded interaction philosophy: responses should be tied to retrievable source content, and uncertainty should be surfaced when evidence is insufficient.

## 3.11 Evaluation Planning

Methodological rigor requires explicit mapping between objectives and evaluation indicators. Planned dimensions include:

- functional correctness (endpoint and workflow behavior),
- extraction adequacy (text and structure quality),
- retrieval effectiveness (top-k relevance behavior),
- response quality (groundedness and citation utility),
- operational reliability (error handling and fallback behavior),
- usability (task completion and interaction clarity).

These evaluation dimensions are operationalized in Chapter 5.

## 3.12 Chapter Summary

This chapter established the engineering methodology and analytical structure behind ArchiveAI. Requirements, constraints, data flows, and risk treatments were translated into a modular architecture optimized for maintainability and practical archive querying. The next chapter details how this methodology was realized in concrete system design and implementation.
