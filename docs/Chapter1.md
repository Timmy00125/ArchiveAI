# Chapter 1: Introduction

## 1.1 Background and Context

Institutional and personal archives still contain a large volume of historical and operational knowledge in paper form. Although scanning initiatives have improved document availability, scanned artifacts remain difficult to use when they are stored as image-heavy PDFs, mixed-format office files, or long text documents without effective semantic indexing. In practical settings such as universities, legal offices, and records departments, users often require answers to targeted questions rather than full-document reading. Traditional keyword search systems perform poorly when vocabulary mismatch occurs, when information is distributed across sections, or when relevant content is embedded in tables and irregular layouts.

Recent advances in optical character recognition (OCR), document intelligence, and large language models (LLMs) have created an opportunity to redesign archive interaction. Rather than treating archives as static repositories, modern systems can process unstructured files, extract machine-usable text and structure, build semantic representations, and support natural language querying through retrieval-augmented generation (RAG). The ArchiveAI project is positioned within this transition: it aims to provide an end-to-end software engineering solution that transforms uploaded archival documents into a searchable and conversationally accessible knowledge base.

## 1.2 Problem Statement

The core problem addressed in this thesis is that conventional archive systems are not optimized for deep queryability of heterogeneous unstructured documents. Existing practices typically suffer from one or more of the following issues:

- dependence on manual browsing,
- brittle keyword matching,
- poor handling of layout-rich documents,
- lack of evidence-grounded conversational interfaces,
- minimal support for persistent session memory in document-centered chats.

As a result, users spend excessive time locating information, face inconsistent retrieval quality, and encounter low trust in generated answers when citations are absent.

## 1.3 Aim of the Study

The aim of this study is to design and implement a robust multi-stage archive intelligence platform that integrates OCR-enabled document processing with RAG-based conversational querying. Specifically, the project seeks to operationalize a full pipeline where uploaded files are converted into structured text, indexed semantically, retrieved by meaning, and used to generate grounded answers with source references.

## 1.4 Objectives of the Study

To achieve this aim, the project is guided by the following objectives:

1. Build a backend ingestion pipeline capable of accepting multiple document formats common in archival environments.
2. Integrate Docling-based OCR and structure-aware conversion for extracting high-quality textual representations.
3. Implement semantic chunking, embedding, and persistent vector indexing for scalable retrieval.
4. Develop API endpoints for upload, search, chat, document management, and session history.
5. Implement an agentic chat layer that uses document retrieval tools to produce evidence-grounded responses.
6. Design a usable frontend interface for chat, document operations, and direct semantic search.
7. Evaluate functional correctness, retrieval behavior, response quality criteria, and system reliability characteristics.

## 1.5 Research Questions

This thesis is organized around the following research questions:

1. How effectively can a Docling-driven extraction pipeline convert heterogeneous archival documents into semantically indexable content?
2. To what extent does RAG improve answer relevance and traceability compared to non-retrieval chat approaches?
3. How does chunking and vector retrieval configuration influence downstream response quality?
4. Can an integrated API-first architecture provide reliable document search and chat workflows under realistic operational constraints?
5. What implementation trade-offs emerge between accuracy, latency, maintainability, and deployment simplicity?

## 1.6 Scope and Delimitation

The implemented system supports a practical but bounded scope.

Included in scope:

- ingestion of PDF, DOCX, PPTX, HTML/HTM, TXT, and MD files,
- OCR-enabled processing and markdown conversion using Docling,
- recursive text chunking and vector indexing in Chroma,
- semantic search and score-aware retrieval,
- conversational querying through a LangGraph ReAct-style agent,
- session-oriented chat history persistence using PostgreSQL checkpointing,
- web frontend for chat, upload, search, and document management.

Out of scope:

- enterprise authentication and authorization,
- distributed multi-node scaling and sharding,
- domain-specific fine-tuning of language models,
- guaranteed correctness of OCR for all low-quality scans,
- legal compliance frameworks beyond general privacy and ethical considerations.

The system is developed as an academically rigorous prototype targeted at functional viability and architectural soundness rather than production-grade institutional deployment.

## 1.7 Significance of the Study

This study is significant in three dimensions.

Academic significance: it contributes an applied software engineering case study at the intersection of OCR, retrieval systems, and LLM-driven interfaces, demonstrating how these components can be integrated into a coherent architecture.

Practical significance: it offers a framework for modernizing archive access workflows by reducing manual search burden and improving discoverability of information embedded in unstructured records.

Engineering significance: it documents design decisions related to modular backend services, tool-augmented agents, persistence strategy, error handling, and user experience within a full-stack implementation.

## 1.8 Organization of the Thesis

The remainder of this thesis is structured as follows.

- Chapter 2 reviews relevant literature on OCR, document intelligence, RAG, embedding-based retrieval, and agentic systems.
- Chapter 3 describes methodology, requirements analysis, system modeling, and key engineering decisions.
- Chapter 4 presents the system design and implementation details of ArchiveAI, including backend, retrieval stack, and frontend modules.
- Chapter 5 discusses testing and evaluation strategy, reports findings, and analyzes limitations and validity threats.
- Chapter 6 concludes the study by summarizing contributions and proposing future work directions.

Together, these chapters provide a complete account of how ArchiveAI was conceptualized, built, and evaluated as a software engineering final year project.
