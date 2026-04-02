# Chapter 2: Literature Review and Background Study

## 2.1 Introduction

This chapter reviews foundational and contemporary work relevant to ArchiveAI. The review synthesizes concepts from digital archives, OCR, semantic retrieval, large language models, and software architecture for intelligent information systems. The goal is not only to summarize prior work but also to identify gaps that justify the proposed implementation.

## 2.2 Digital Archives and Unstructured Information Retrieval

Digital archives preserve records in machine-storable formats, but preservation alone does not ensure usability. A key challenge is that many archive assets are semi-structured or unstructured, often containing layout artifacts, scanned pages, handwritten annotations, tables, and mixed-language text. Traditional retrieval in such environments relies on metadata fields and lexical search. While metadata indexing supports catalog-level access, it does not sufficiently expose internal semantic content.

Information retrieval theory distinguishes lexical relevance from semantic relevance. Lexical systems focus on token overlap; semantic systems attempt to capture meaning. For archive use cases, semantic retrieval is advantageous when user queries paraphrase source content, when document language is inconsistent, or when concepts are distributed across sections. Therefore, modern archive systems increasingly combine extraction pipelines with embedding-based retrieval to improve recall and reduce query reformulation overhead.

## 2.3 OCR and Document Intelligence

OCR has evolved from character-level pattern matching to full document intelligence pipelines that model layout, reading order, and semantic elements such as headings, tables, and figures. Classical OCR engines perform adequately on clean text images but degrade on noisy scans, complex page layouts, and mixed typography. Newer systems combine visual and structural analysis to produce richer outputs suitable for downstream machine reasoning.

Docling represents this modern category by coupling OCR with document conversion workflows that export structured textual forms (such as markdown) and expose document-level objects for hierarchy, tables, and images. This is particularly relevant to RAG systems where extracted text quality and structure preservation directly affect chunk semantics and retrieval precision.

## 2.4 Multi-Engine OCR Perspective

A multi-engine OCR perspective recognizes that no single extraction pipeline performs optimally across all document classes. For example, one engine may excel on scanned typed text while another may better preserve table boundaries or complex visual layouts. In industrial practice, this often leads to fallback or ensemble strategies.

Although ArchiveAI currently implements a Docling-centered extraction path, its architecture and research framing are aligned with a multi-engine extension model. The rationale is that archive collections are heterogeneous; robust systems should be designed for engine interchangeability, comparative benchmarking, and confidence-aware routing. This design stance improves extensibility and supports future empirical studies on engine fusion.

## 2.5 Retrieval-Augmented Generation (RAG)

RAG addresses one major limitation of standalone LLMs: answers may be fluent but unsupported by available evidence. In RAG, user queries first trigger retrieval from an external knowledge store, and retrieved context is then injected into generation. This improves grounding and traceability.

The canonical RAG pipeline includes:

1. document preprocessing and chunking,
2. embedding and vector indexing,
3. semantic retrieval at query time,
4. context-conditioned answer generation.

RAG quality depends on each stage. Poor chunking can split important context; weak embeddings reduce semantic matching; noisy retrieved passages increase hallucination risk. Consequently, robust archive-oriented RAG requires tight integration between extraction quality, indexing design, and generation policy.

## 2.6 Embeddings and Vector Search

Embeddings map text into high-dimensional vector spaces where semantically similar inputs are geometrically close. Vector databases support efficient nearest-neighbor retrieval over such representations. In practice, performance is influenced by:

- model choice,
- chunk size and overlap,
- metadata design,
- top-k selection,
- ranking or reranking strategy.

ArchiveAI uses embedding-based retrieval to support conceptual matches rather than exact keyword matches. This is suitable for archival question answering where users may ask interpretive or paraphrased questions. However, embedding systems also require careful calibration to reduce irrelevant retrieval, especially in long document collections with repetitive sections.

## 2.7 Agentic LLM Systems

Agentic systems extend prompt-response LLM interaction by enabling tool use and iterative reasoning patterns. In ReAct-like paradigms, the model can decide when to call tools, inspect results, and formulate final responses. This approach is beneficial for archive assistants because retrieval should be explicit and purposeful.

In ArchiveAI, the agent has access to a document search tool and is instructed to prioritize focused retrieval with source citation. This design aligns with trustworthy AI principles: responses should be grounded in retrievable evidence and should communicate uncertainty when evidence is insufficient.

## 2.8 Vector Databases and Persistence Considerations

Vector stores differ in deployment complexity, persistence guarantees, metadata filtering capability, and ecosystem compatibility. Chroma is widely adopted in rapid prototyping because it integrates well with common AI frameworks and supports persistent local storage. For archive systems, persistence is critical; re-indexing large document sets repeatedly is computationally expensive.

ArchiveAI uses a persistent Chroma directory and metadata keyed by filename/source fields. This enables document listing, deletion by filename, and semantic search across indexed chunks. While suitable for prototype-scale workloads, growth in collection size introduces considerations around indexing throughput, retrieval latency, and operational observability.

## 2.9 Related Systems and Comparative View

Existing archive intelligence systems typically fall into three categories:

- OCR-first digitization tools with weak semantic querying,
- chatbot interfaces without verifiable retrieval grounding,
- enterprise search systems requiring heavy infrastructure and integration effort.

ArchiveAI targets a balanced middle ground: academically rigorous, technically modern, and practically deployable in resource-constrained settings. Its distinguishing aspects include document structure extraction via Docling, semantic indexing with explicit CRUD operations, and conversation checkpointing integrated with retrieval-based answering.

## 2.10 Identified Gaps

From the reviewed literature and systems landscape, the following gaps remain relevant:

1. End-to-end reproducible pipelines that combine extraction, retrieval, and agentic conversation in a single maintainable architecture.
2. Archive-focused implementations that handle heterogeneous file formats with explicit lifecycle management (upload, index, list, delete, inspect).
3. Session-aware conversational interfaces with persistent memory and source-aware response behavior.
4. Transparent engineering documentation bridging theoretical concepts and implementation-level decisions.

This thesis addresses these gaps through the ArchiveAI implementation and evaluation.

## 2.11 Conceptual Framework

The conceptual model for this project is an evidence-centric knowledge loop:

1. Input Layer: user uploads unstructured documents.
2. Processing Layer: OCR and structural conversion produce machine-usable text.
3. Representation Layer: chunks are embedded and indexed in vector space.
4. Retrieval Layer: query-time similarity search returns relevant evidence.
5. Reasoning Layer: an LLM agent synthesizes grounded responses.
6. Interaction Layer: users query, inspect, and iterate through web interfaces.
7. Memory Layer: session checkpoints preserve conversation continuity.

This framework guided both architecture and evaluation planning.

## 2.12 Chapter Summary

The literature indicates strong momentum toward retrieval-grounded intelligent document systems but also exposes implementation fragmentation across OCR, retrieval, and conversational orchestration. ArchiveAI is designed as an integrated response to this fragmentation. The next chapter details the methodological approach and system analysis that translated these concepts into implementable software requirements and architectural decisions.
