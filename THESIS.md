# ArchiveAI Final Year Thesis

## Phase 1: Detailed Thesis Outline (For Approval)

I understand the instructions and this document currently contains only the chapter-by-chapter outline for review.

## Preliminary Pages (Non-Chapter Sections)

- Title Page: Project title, student details, department, institution, supervisor, and submission date.
- Declaration and Certification: Originality statement and supervisor endorsement page.
- Dedication and Acknowledgements: Optional personal and academic acknowledgements.
- Abstract: Concise summary of problem, method, implementation, and key results.
- Table of Contents: Chapters, sections, tables, figures, and appendices.
- List of Figures and List of Tables: Numbered visual artifacts used throughout the thesis.
- List of Abbreviations and Acronyms: OCR, RAG, LLM, API, UI/UX, SSE, etc.

## Chapter 1: Introduction

- 1.1 Background and Context: Digitization challenges in paper archives, limitations of manual retrieval, and motivation for intelligent document querying.
- 1.2 Problem Statement: Inability of conventional archive systems to extract, index, and semantically query heterogeneous unstructured documents.
- 1.3 Research Aim: Develop an OCR + RAG based system that converts archived documents into a searchable knowledge base and supports conversational querying.
- 1.4 Specific Objectives: Implement document ingestion, OCR extraction with Docling, vector indexing, semantic search, agent-driven Q and A, and persistent conversation memory.
- 1.5 Research Questions: Accuracy of extraction, retrieval effectiveness, response quality, and system performance under realistic usage.
- 1.6 Scope of the Study: Supported file formats, local deployment assumptions, API-driven architecture, and boundaries such as unsupported encrypted files.
- 1.7 Significance of the Study: Contribution to digital preservation, institutional archives, and practical software engineering of AI-enabled information systems.
- 1.8 Thesis Organization: Brief chapter flow from literature to methodology, implementation, evaluation, and conclusion.

## Chapter 2: Literature Review and Background Study

- 2.1 Concept of Digital Archives: Nature of unstructured archival data and requirements for long-term accessibility.
- 2.2 OCR Technologies and Document Intelligence: Classical OCR vs modern layout-aware pipelines, table extraction, image handling, and structure reconstruction.
- 2.3 Multi-Engine OCR Perspective: Rationale for engine orchestration, strengths and weaknesses across document types, and quality trade-offs.
- 2.4 Retrieval-Augmented Generation (RAG): Core principles, retrieval pipeline stages, and reduction of hallucination through evidence grounding.
- 2.5 Text Embeddings and Vector Search: Semantic representation, nearest-neighbor retrieval, chunking effects, and relevance ranking behavior.
- 2.6 Agentic LLM Systems: Tool-using agents, ReAct-style reasoning loops, and session-aware conversation management.
- 2.7 Vector Databases in Practice: ChromaDB capabilities, persistence considerations, metadata filtering, and scalability concerns.
- 2.8 Related Academic and Industrial Systems: Comparative synthesis of similar archive intelligence platforms.
- 2.9 Identified Research and Implementation Gaps: Need for an integrated, practical OCR-to-chat pipeline with document-grounded responses.
- 2.10 Theoretical and Conceptual Framework: End-to-end conceptual model linking ingestion, extraction, indexing, retrieval, generation, and user interaction.

## Chapter 3: Methodology and System Analysis

- 3.1 Research and Development Method: Software engineering approach used to design, implement, and iteratively validate ArchiveAI.
- 3.2 Requirement Elicitation Process: User needs for archivists/researchers and translation into system specifications.
- 3.3 Functional Requirements: Upload, parse, index, list, delete, semantic search, chat query, chat history, and session handling.
- 3.4 Non-Functional Requirements: Performance, reliability, maintainability, usability, portability, and fault tolerance.
- 3.5 Feasibility and Constraint Analysis: Hardware/software assumptions, API key dependency, storage limits, and integration constraints.
- 3.6 System Actors and Use Cases: User goals and interactions across document management, search, and conversational querying.
- 3.7 End-to-End Data Flow Analysis: File upload to extracted text, chunking, embedding, vector storage, retrieval, and answer generation.
- 3.8 Architectural Analysis: Separation into frontend, backend API, document processing service, vector layer, and memory layer.
- 3.9 Algorithmic Workflow Design: OCR and structure extraction, recursive chunking strategy, similarity retrieval, and answer synthesis.
- 3.10 Error and Risk Handling Strategy: Input validation, provider quota handling, fallback behavior, and resource lifecycle cleanup.
- 3.11 Security and Ethical Considerations: Data privacy of archived materials, access assumptions, and responsible AI use in generated responses.

## Chapter 4: System Design and Implementation

- 4.1 High-Level Architecture Design: Next.js client, FastAPI services, Docling processor, Gemini models, Chroma vector store, and PostgreSQL chat checkpointing.
- 4.2 Technology Stack Justification: Why FastAPI, LangChain/LangGraph, Docling, ChromaDB, PostgreSQL, and Next.js were selected.
- 4.3 Backend Module Design: Responsibilities of API routers, service layer, agent module, tool layer, and configuration management.
- 4.4 Document Ingestion and OCR Pipeline Implementation: File validation, temporary storage, Docling conversion, markdown export, and structure visualization.
- 4.5 Retrieval Layer Implementation: Chunking parameters, embedding generation, collection persistence, and search with and without similarity scores.
- 4.6 Conversational Agent Implementation: Tool-enabled LangGraph ReAct agent, prompt policy, thread-level memory, and streamed/non-streamed interaction.
- 4.7 Session and Persistence Design: Chat history checkpointing in PostgreSQL and behavior under database unavailability.
- 4.8 API Contract Design: Endpoint definitions for upload, documents, search, chat query, session listing, and history retrieval.
- 4.9 Frontend System Design: App routing, sidebar navigation, chat workflow, upload interface, search interface, and document management table.
- 4.10 UI/UX Design Decisions: Information hierarchy, interaction feedback, loading states, error notifications, and session discoverability.
- 4.11 Deployment and Configuration: Environment variables, Docker Compose database service, local development setup, and operational startup sequence.
- 4.12 Implementation Challenges and Resolutions: Handling mixed document formats, metadata normalization, and robust parsing of message content.

## Chapter 5: Testing, Evaluation, and Results

- 5.1 Evaluation Framework: Mapping objectives and research questions to measurable indicators.
- 5.2 Test Environment and Experimental Setup: Hardware/software environment, dataset profile, and execution conditions.
- 5.3 Functional Verification: Endpoint-by-endpoint behavior checks and user flow validation for upload, indexing, search, and chat.
- 5.4 OCR and Extraction Quality Evaluation: Assessment of extracted text quality and structure fidelity across document types.
- 5.5 Retrieval Effectiveness Evaluation: Precision-oriented metrics at top-k, relevance judgments, and search quality interpretation.
- 5.6 Response Quality Evaluation: Groundedness to retrieved sources, citation usefulness, and observed hallucination behavior.
- 5.7 Performance Benchmarking: Latency for upload/index/search/chat, throughput trends, and storage growth observations.
- 5.8 Reliability and Robustness Tests: Failure mode checks for invalid files, quota exhaustion, and unavailable dependencies.
- 5.9 UI/UX Evaluation: Task completion analysis, usability observations, and qualitative user feedback.
- 5.10 Results Synthesis and Discussion: Interpretation of findings against objectives, with strengths, weaknesses, and trade-offs.
- 5.11 Threats to Validity: Internal, external, and construct validity concerns affecting generalization of results.

## Chapter 6: Conclusion and Future Work

- 6.1 Summary of the Study: Restatement of problem, approach, and implemented solution.
- 6.2 Key Contributions: Technical and practical contributions of ArchiveAI to archive digitization and retrieval workflows.
- 6.3 Objective-by-Objective Outcome Review: Which objectives were fully met, partially met, or deferred.
- 6.4 Limitations: Current constraints in OCR quality variability, retrieval depth, scale, and deployment hardening.
- 6.5 Recommendations for Operational Adoption: Practical guidance for institutions intending to use similar systems.
- 6.6 Future Enhancements: Multi-engine OCR benchmarking and fusion, reranking models, hybrid retrieval, authentication, audit logging, and CI/CD testing expansion.
- 6.7 Final Remark: Reflection on the role of software engineering rigor in building trustworthy AI archive systems.

## References

- Use IEEE or APA citation style consistently for academic sources, frameworks, and technical documentation.
- Include foundational works on OCR, vector retrieval, RAG, LLM agents, and software engineering methodology.

## Appendices

- Appendix A: Complete API endpoint catalogue and request/response samples.
- Appendix B: Representative configuration files and environment variables.
- Appendix C: Additional UI screenshots and workflow walkthroughs.
- Appendix D: Extended experimental tables and raw evaluation logs.

---

Status: Outline complete and awaiting your approval before drafting any chapter content.
