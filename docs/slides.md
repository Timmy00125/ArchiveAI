# ArchiveAI Academic Presentation Slides

---
## Slide 1: Title Slide
**Project Title:** ArchiveAI: An Intelligent Archival Document Retrieval and Question-Answering System  
**Project Type:** Final Year Project / Academic Software Prototype  
**Presentation Focus:** OCR-driven document digitization, semantic retrieval, and conversational access to archives  
**Core Idea:** Convert unstructured archived documents into a searchable, explainable knowledge base using OCR + RAG + LLMs.

**Presenter Notes:**
- ArchiveAI addresses the difficulty of searching and understanding large collections of unstructured archived documents.
- The system combines document extraction, semantic indexing, and AI-assisted question answering.
- It is designed as a practical prototype for academic and institutional archive environments.

---
## Slide 2: Background to the Study
- Many archives still exist as scanned PDFs, images, and mixed-format digital files.
- Traditional archive systems are usually keyword-based and weak at understanding context or meaning.
- Users often spend excessive time opening files manually to locate relevant information.
- OCR alone is not enough; extracted text must also be structured, indexed, and made queryable.
- Recent AI methods such as Retrieval-Augmented Generation (RAG) make document-grounded interaction possible.

**Presenter Notes:**
- The motivation comes from the gap between document storage and meaningful access.
- Even when documents are digitized, retrieval remains difficult if the content is unstructured.
- This project explores how modern AI can improve access to archived knowledge.

---
## Slide 3: Problem Statement
**The Problem:**
Existing archive workflows do not adequately support intelligent retrieval from heterogeneous unstructured documents.

**Observed Challenges:**
- Archived materials may contain scanned text, tables, images, and complex layouts.
- Manual search is slow, repetitive, and error-prone.
- Keyword search misses semantically related information.
- Users need answers, summaries, and context—not only file names.
- Most simple OCR pipelines do not preserve structure well enough for downstream reasoning.

---
## Slide 4: Aim and Objectives
**Aim:**
To develop an AI-powered archival assistant that ingests documents, extracts content, indexes it semantically, and supports conversational querying.

**Specific Objectives:**
- Implement document upload and ingestion for multiple file types.
- Extract text and structure using Docling-based processing.
- Chunk and embed documents into a persistent vector store.
- Enable semantic search across archived content.
- Provide conversational question answering over indexed documents.
- Support chat history and session persistence.
- Deliver a modern web interface for archive interaction.

---
## Slide 5: Research Questions
- How effectively can archival documents be converted into machine-usable text?
- Can semantic retrieval outperform simple keyword-style access for archive exploration?
- How well can an LLM generate grounded answers from retrieved document evidence?
- Can a single integrated system support upload, indexing, search, and chat in a usable workflow?
- What are the practical strengths and limitations of such a prototype in an academic setting?

---
## Slide 6: Proposed Solution Overview
**ArchiveAI** is a full-stack document intelligence platform that:
- accepts uploaded archival documents,
- extracts content using Docling OCR and structure analysis,
- converts documents into semantic chunks,
- stores embeddings in ChromaDB,
- retrieves relevant chunks for a user query,
- generates grounded answers through a Gemini-powered LangGraph agent,
- stores conversation history in PostgreSQL.

**One-Line Summary:**
ArchiveAI turns static archived files into an interactive question-answering system.

---
## Slide 7: Scope of the Project
**Included in Scope:**
- Upload and indexing of supported document types such as PDF, TXT, and Markdown.
- OCR-enabled document extraction.
- Semantic search and conversational querying.
- Document listing, existence checks, and deletion.
- Session-based chat history.
- Local/developer deployment architecture.

**Out of Scope / Limitations:**
- Enterprise-grade user authentication and access control.
- Large-scale distributed deployment.
- Massive benchmark-driven evaluation.
- Full institutional governance and records policy integration.

---
## Slide 8: Users and Use Cases
**Primary Users:**
- Archivists
- Researchers
- Students
- Knowledge workers in institutions

**Major Use Cases:**
- Upload documents for indexing
- Search semantically across archived content
- Ask questions about uploaded documents
- Retrieve chat history for previous sessions
- View extracted content and document structure
- Delete documents no longer needed in the index

---
## Slide 9: System Architecture
**Architecture Style:** Layered full-stack architecture

**Main Layers:**
- Frontend: Next.js web application
- Backend API: FastAPI service layer
- AI Processing Layer: Docling, embeddings, LangGraph agent, Gemini
- Storage Layer: ChromaDB and PostgreSQL

**Architectural Strength:**
The design separates presentation, orchestration, AI processing, and persistence, which improves maintainability and extensibility.

---
## Slide 10: High-Level Architecture Flow
**End-to-End Flow:**
1. User uploads a document through the frontend.
2. Backend saves and processes the file.
3. Docling extracts markdown-like text and structural information.
4. The text is split into chunks.
5. Chunks are embedded and stored in ChromaDB.
6. User submits a search query or chat prompt.
7. Relevant chunks are retrieved from the vector store.
8. Gemini-powered agent generates a grounded response.
9. Chat history is persisted in PostgreSQL.

---
## Slide 11: Frontend Technologies
**Frontend Stack:**
- Next.js 16 with App Router
- React 19
- TypeScript
- Tailwind CSS 4
- shadcn/ui and Radix-based UI components
- Framer Motion for interaction effects
- react-markdown for rendering model output

**Frontend Responsibilities:**
- Navigation between chat, documents, and search pages
- Document upload interactions
- Display of search results and chat messages
- Session-aware interface behavior
- Theme management and user feedback

---
## Slide 12: Backend Technologies
**Backend Stack:**
- FastAPI for REST APIs
- Uvicorn as ASGI server
- Pydantic for validation
- psycopg connection pooling for PostgreSQL
- Python service modules for document and chat orchestration

**Backend Responsibilities:**
- API routing
- document ingestion
- search handling
- chat orchestration
- history persistence
- lifecycle initialization of shared resources

---
## Slide 13: AI and Retrieval Stack
**AI Components:**
- Docling for document conversion, OCR, and structural extraction
- Gemini embedding model for vector generation
- ChromaDB for persistent vector search
- LangGraph ReAct agent for tool-using reasoning
- Gemini chat model for grounded answer generation

**Why This Matters:**
The project does not rely on raw generation alone; it combines retrieval with generation to reduce hallucination and improve relevance.

---
## Slide 14: How Document Processing Works
**Document Processing Pipeline:**
- Uploaded file is received by the backend.
- A temporary file is created for processing.
- Plain text and Markdown files are handled directly.
- Other supported formats are passed to Docling.
- Docling produces extracted markdown content.
- The extracted content is wrapped as a document object.
- Structural metadata can also be retained for visualization and analysis.

**Key Benefit:**
This allows the system to move from raw files to AI-usable textual knowledge.

---
## Slide 15: How Semantic Indexing Works
**Indexing Process:**
- Extracted content is split into smaller chunks.
- Chunking uses a recursive character-based splitter.
- Each chunk is converted into an embedding vector.
- Vectors are stored in a persistent Chroma collection.
- Metadata such as filename and source are preserved.

**Importance of Chunking:**
Chunking improves retrieval granularity, making it easier to match relevant sections of long documents.

---
## Slide 16: How Search Works
**Semantic Search Workflow:**
- User submits a natural language query.
- Query is embedded into vector form.
- Similar chunks are retrieved from ChromaDB.
- Results are returned with relevance-oriented content snippets.
- Retrieved text can be used directly or passed into the chat pipeline.

**Advantage Over Keyword Search:**
The system can find conceptually related material even when exact words do not match.

---
## Slide 17: How Chat Works
**Chat Workflow:**
- User sends a prompt through the chat interface.
- A session ID is created or reused.
- The LangGraph agent receives the question.
- The agent can call tools such as search, summarization, or document vision analysis.
- Retrieved evidence is used to generate an answer.
- The response is returned to the user.
- The question and answer are saved to the session history.

**Outcome:**
The user interacts with the archive conversationally rather than manually browsing files.

---
## Slide 18: Agentic Design in ArchiveAI
**Agent Design Features:**
- ReAct-style tool-using agent
- session-aware conversation handling
- searchable archive as external knowledge source
- summarization tool for whole-document understanding
- vision tool for image-heavy or layout-sensitive files

**Academic Significance:**
This demonstrates a transition from static information systems to intelligent assistive systems that can reason over retrieved evidence.

---
## Slide 19: Data Storage Design
**Storage Components:**
- ChromaDB stores vector embeddings and chunk metadata.
- PostgreSQL stores chat sessions and messages.
- Uploaded originals are stored on disk.
- Extracted markdown is stored for content preview and summarization.

**Why Two Storage Models Are Used:**
- Vector storage is optimized for semantic retrieval.
- Relational storage is optimized for structured conversation history.

---
## Slide 20: API Modules and Endpoints
**Core API Areas:**
- Upload API for document ingestion
- Documents API for list, delete, existence, structure, and content access
- Search API for semantic retrieval
- Chat API for query, history, session listing, and deletion

**Design Benefit:**
This modular API organization makes the system easier to test, reuse, and extend.

---
## Slide 21: Key Functional Requirements Implemented
- Document upload and indexing
- Multi-page document processing
- OCR-based text extraction
- Semantic search
- Chat-based question answering
- Session storage and retrieval
- Document listing and deletion
- Structure/content inspection endpoints
- Basic health and startup configuration support

---
## Slide 22: Non-Functional Requirements Considered
- Usability through a clean multi-page interface
- Maintainability through modular service design
- Persistence through ChromaDB and PostgreSQL
- Scalability at prototype level through separated components
- Reliability through lifecycle resource management
- Extensibility for additional tools, models, and storage backends

---
## Slide 23: Implementation Highlights
**Important Implementation Decisions:**
- FastAPI lifespan initializes shared services once at startup.
- VectorStoreManager handles persistent Chroma loading and CRUD operations.
- DocumentService coordinates file processing and indexing.
- ChatService manages sessions, persistence, and agent invocation.
- Frontend separates major workflows into chat, search, and document management pages.

**Why This Is Strong:**
The system is not a one-script prototype; it is organized into reusable layers and services.

---
## Slide 24: User Interface Overview
**Main User Interfaces:**
- Landing page: project introduction and feature highlights
- Documents page: upload, inspect, and manage indexed files
- Search page: direct semantic search experience
- Chat page: session-based conversational assistant

**UI Goal:**
Provide a workflow that feels practical for real document exploration, not just technical demonstration.

---
## Slide 25: Deployment and Runtime Environment
**Deployment Setup:**
- Frontend runs on Next.js development server
- Backend runs on FastAPI/Uvicorn
- PostgreSQL runs through Docker Compose
- ChromaDB persists locally on disk
- Gemini APIs provide embeddings and generation

**Typical Ports:**
- Frontend: 3000
- Backend: 8000
- PostgreSQL: 5433 externally mapped

---
## Slide 26: Security and Error Handling Considerations
**Considerations Implemented:**
- filename sanitization using safe path handling
- validation of required request fields
- graceful handling of missing documents and empty prompts
- fallback behavior when PostgreSQL is unavailable
- provider quota and configuration error mapping
- cleanup of resources on shutdown

**Importance:**
These controls improve robustness even though the system is still a prototype.

---
## Slide 27: Evaluation Approach
**Evaluation Dimensions:**
- Document ingestion success
- OCR and extraction quality
- search relevance
- chat response usefulness
- session persistence
- usability of the interface

**Method Used:**
Prototype-oriented evaluation based on end-to-end functional testing and observation of user workflows from upload to answer retrieval.

---
## Slide 28: Key Results and Achievements
**What the Project Successfully Demonstrates:**
- archival files can be transformed into searchable knowledge units,
- semantic retrieval enables more meaningful access than basic browsing,
- conversational AI can answer questions grounded in document evidence,
- chat sessions can be stored and revisited,
- a modern full-stack academic prototype can integrate OCR, RAG, and persistent storage effectively.

---
## Slide 29: Strengths of the System
- Integrates multiple modern AI components into one coherent workflow.
- Supports both direct search and conversational querying.
- Uses persistent storage rather than temporary in-memory only design.
- Preserves extracted content for transparency and inspection.
- Provides a realistic software architecture suitable for further research.
- Offers a strong educational example of applied AI systems engineering.

---
## Slide 30: Limitations of the Prototype
- Performance depends on document quality and OCR accuracy.
- Large-scale institutional benchmarking has not yet been completed.
- Authentication and role-based security are not implemented.
- Structure data availability is session-dependent in some cases.
- Full production monitoring and governance features are outside the scope.
- Model quality depends on external provider availability and quota.

---
## Slide 31: Contribution to Knowledge / Academic Relevance
**This project contributes by:**
- showing how OCR, vector retrieval, and LLMs can be integrated into one archival system,
- demonstrating a practical RAG pipeline for unstructured document collections,
- providing a software architecture that can support future academic extension,
- bridging theory from document intelligence and RAG with working implementation.

**Academic Value:**
It is both a research artifact and an engineering prototype.

---
## Slide 32: Future Improvements
- add authentication and role-based access control,
- support larger and more diverse institutional datasets,
- improve citation-style evidence display in responses,
- add benchmarking metrics for retrieval and answer quality,
- introduce batch indexing dashboards and administrative tools,
- persist more structural analysis beyond current session scope,
- explore hybrid retrieval and reranking methods.

---
## Slide 33: Conclusion
**Conclusion:**
ArchiveAI successfully demonstrates that archived, unstructured documents can be transformed into an interactive knowledge system using OCR, semantic indexing, and Retrieval-Augmented Generation.

**Final Takeaway:**
Instead of merely storing files, archives can become systems that understand, retrieve, and explain their contents to users.

---
## Slide 34: Demo Walkthrough Slide
**Recommended Live Demo Order:**
1. Open landing page and introduce the problem.
2. Show document upload and indexing.
3. List indexed documents.
4. Run semantic search.
5. Ask a grounded question in chat.
6. Show session history persistence.
7. Briefly describe the architecture behind the response.

---
## Slide 35: Thank You / Questions
**Thank You**  
Questions, observations, and recommendations are welcome.

**Suggested Closing Sentence:**
ArchiveAI is a step toward making archives not only digital, but intelligent and interactive.
