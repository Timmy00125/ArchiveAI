# Class Diagram - ArchiveAI Backend (PlantUML)

Shows the main backend classes, their attributes, methods, and relationships.

Source: `diagrams/10-class-diagram-backend.md`

## Diagram

```plantuml
@startuml
class Settings {
  +GOOGLE_API_KEY: str
  +GEMINI_MODEL: str
  +GEMINI_EMBED_MODEL: str
  +CHROMA_PERSIST_DIR: str
  +CHROMA_COLLECTION: str
  +CHUNK_SIZE: int
  +CHUNK_OVERLAP: int
  +SEARCH_K: int
  +MAX_UPLOAD_SIZE_MB: int
  +ALLOWED_EXTENSIONS: str
  +POSTGRES_USER: str
  +POSTGRES_PASSWORD: str
  +POSTGRES_DB: str
  +POSTGRES_HOST: str
  +POSTGRES_PORT: str
  +CORS_ORIGINS: str
  +API_PREFIX: str
}

class DocumentProcessor {
  -_converter: DocumentConverter
  +process_file_bytes(filename: str, file_bytes: bytes): tuple
  +extract_text_for_context(filename: str, file_bytes: bytes): str
  -_process_via_docling(temp_path: Path): DoclingDocument
  -_process_plain_text(file_bytes: bytes): str
}

class VectorStoreManager {
  -_embeddings: GoogleGenerativeAIEmbeddings
  -_text_splitter: RecursiveCharacterTextSplitter
  -_vectorstore: Chroma
  +add_documents(docs: list): None
  +delete_documents_by_filename(filename: str): int
  +list_documents(): list
  +document_exists(filename: str): bool
  +search_similar(query: str, k: int): list
  +search_with_scores(query: str, k: int): list
  +total_chunks(): int
  +persist(): None
}

class StructureVisualizer {
  +export_full_structure(doc: DoclingDocument): dict
  -_extract_hierarchy(doc: DoclingDocument): list
  -_extract_tables(doc: DoclingDocument): list
  -_extract_pictures(doc: DoclingDocument): list
}

class DocumentService {
  -_vs_manager: VectorStoreManager
  -_processor: DocumentProcessor
  +upload_file(filename: str, file_bytes: bytes): dict
  +upload_multiple(files: list): list
  +upload_context(filename: str, file_bytes: bytes, session_id: str): dict
  +list_documents(): list
  +delete_document(filename: str): dict
  +check_file_exists(filename: str): bool
  +get_stats(): dict
}

class ChatService {
  -_vs_manager: VectorStoreManager
  -_memory: BaseCheckpointSaver
  -_db_pool: ConnectionPool
  -_model: ChatGoogleGenerativeAI
  +chat(prompt: str, session_id: str, stream: bool): dict
  +get_history(session_id: str): list
  +list_sessions(): list
  +delete_session(session_id: str): bool
  +add_context_to_chat(text: str, session_id: str): dict
  -_setup_persistence_tables(): None
  -_save_message(session_id: str, role: str, content: str): None
  -_ensure_session(session_id: str): str
}

class AgentModule << (M,#FF7700) module >> {
  +create_documentation_agent(tools, model_name, memory): CompiledGraph
  +astream_agent_response(agent, prompt, thread_id): AsyncGenerator
  +invoke_agent(agent, prompt, thread_id): dict
}

class SearchTool << (F,#FF7700) factory function >> {
  +create_search_tool(vs_manager: VectorStoreManager): Tool
  +search_documents(query: str): str
}

DocumentService --> VectorStoreManager : uses
DocumentService --> DocumentProcessor : uses
ChatService --> VectorStoreManager : uses
ChatService --> AgentModule : creates agent
AgentModule --> SearchTool : creates tool
SearchTool --> VectorStoreManager : queries
DocumentProcessor --> StructureVisualizer : extracts structure
VectorStoreManager ..> Settings : configured by
ChatService ..> Settings : configured by
DocumentService ..> Settings : configured by
@enduml
```

## Class Descriptions

### Settings
Configuration class holding all environment-driven settings. Singleton-like instance loaded at startup via `lifespan()`. All service classes depend on its values (PostgreSQL connection params, Gemini API key, ChromaDB directory, chunking parameters, CORS origins, API prefix).

### DocumentProcessor
Wraps Docling's `DocumentConverter` to convert uploaded files to LangChain `Document` objects. Handles two paths:
- Plain text (`.txt`, `.md`) - read UTF-8 directly
- Binary formats (`.pdf`, `.docx`, `.pptx`, `.html`) - Docling conversion with OCR + table extraction, then export to Markdown

### VectorStoreManager
Manages the ChromaDB vector store and the Google Generative AI embeddings model. Provides methods for adding documents (with chunking via `RecursiveCharacterTextSplitter`), deleting by filename, listing, similarity search (with or without scores), and deduplication checks.

### StructureVisualizer
Extracts structural information (headings hierarchy, tables as DataFrames, pictures with bounding boxes) from a `DoclingDocument` and returns it as a JSON-serializable dictionary.

### DocumentService
Service layer orchestrating `DocumentProcessor` and `VectorStoreManager` for file uploads (single, multiple, and context-only), document listing, deletion, existence checks, and stats retrieval.

### ChatService
Service layer for chat functionality. Manages PostgreSQL-backed chat sessions and messages, invokes the LangGraph ReAct agent with checkpointer-based persistence, and supports both sync and streaming responses. Falls back to `MemorySaver` if PostgreSQL is unavailable.

### AgentModule
Module providing factory functions for creating and invoking the LangGraph documentation agent. Creates the ReAct agent with tools, model, and memory, and exposes both async streaming and sync invocation methods.

### SearchTool
Factory function that creates a `search_documents` tool bound to a specific `VectorStoreManager` instance. The tool is used by the LangGraph agent to retrieve relevant document chunks based on the user's query.

## Relationships

| From | To | Type | Description |
|------|----|----|-------------|
| DocumentService | VectorStoreManager | Dependency (`-->`) | Uses VSM for indexing, listing, deletion |
| DocumentService | DocumentProcessor | Dependency (`-->`) | Uses DP for file conversion |
| ChatService | VectorStoreManager | Dependency (`-->`) | Uses VSM for search tool binding |
| ChatService | AgentModule | Dependency (`-->`) | Creates the LangGraph agent |
| AgentModule | SearchTool | Dependency (`-->`) | Creates the search tool for the agent |
| SearchTool | VectorStoreManager | Dependency (`-->`) | Queries VSM at runtime |
| DocumentProcessor | StructureVisualizer | Dependency (`-->`) | Extracts structure during processing |
| VectorStoreManager | Settings | Dependency (`..>`) | Configured by Settings |
| ChatService | Settings | Dependency (`..>`) | Configured by Settings |
| DocumentService | Settings | Dependency (`..>`) | Configured by Settings |
