# Sequence Diagrams - ArchiveAI (PlantUML)

Sequence diagrams for time-ordered interactions between components across eight scenarios.

Sources: `diagrams/06` through `diagrams/09`, and `diagrams/26` through `diagrams/29`.

---

## 1. Document Upload Sequence

Shows the interactions between frontend, backend services, and storage during file upload.

Source: `diagrams/06-sequence-document-upload.md`

```plantuml
@startuml
actor User
box "Frontend" #LightBlue
  participant "DocumentUpload" as FE
end box
box "Backend (FastAPI)" #LightYellow
  participant "/api/v1/upload" as API
  participant "DocumentService" as DS
  participant "DocumentProcessor" as DP
  participant "VectorStoreManager" as VSM
  participant "StructureVisualizer" as SV
end box
box "Storage & External" #LightGreen
  participant "ChromaDB" as Chroma
  participant "Google Gemini API" as Gemini
  participant "Temp Filesystem" as FS
end box

User -> FE: Drop files via react-dropzone
FE -> API: POST /upload (multipart/form-data)
API -> API: Validate extensions & size

loop For each file
  API -> DS: upload_file(filename, bytes)
  DS -> VSM: document_exists(filename)
  VSM -> Chroma: collection.get(where={filename})

  alt Already indexed
    Chroma --> VSM: Document found
    VSM --> DS: True (skip)
    DS --> API: {status: already_indexed}
  else New file
    Chroma --> VSM: Not found
    VSM --> DS: False (proceed)

    DS -> DP: process_file_bytes(filename, bytes)
    DP -> FS: Write temp file
    FS --> DP: temp_path

    alt .txt or .md
      DP -> DP: Read UTF-8 directly
    else .pdf, .docx, .pptx, .html
      DP -> DP: Docling DocumentConverter (OCR + table extraction)
      DP -> DP: Export to Markdown
    end

    DP -> FS: Delete temp file
    DP --> DS: LangChain Documents + DoclingDocument

    DS -> VSM: add_documents(documents)
    VSM -> VSM: RecursiveCharacterTextSplitter (chunk_size=1000, overlap=100)
    VSM -> Gemini: Embed chunks (gemini-embedding-001)
    Gemini --> VSM: Embedding vectors
    VSM -> Chroma: collection.add(documents, embeddings)
    Chroma --> VSM: Stored
    VSM --> DS: Document indexed

    DS -> SV: export_full_structure(DoclingDocument)
    SV --> DS: Structure data
    DS -> DS: Cache in app.state.document_structures
  end
end

API --> FE: JSON response with per-file status
FE -> FE: Increment refreshTrigger
FE -> FE: Re-fetch document list
FE --> User: Updated document table
@enduml
```

---

## 2. Chat Query Sequence

Shows the interactions during a chat query through the RAG agent pipeline.

Source: `diagrams/07-sequence-chat-query.md`

```plantuml
@startuml
actor User
box "Frontend" #LightBlue
  participant "ChatArea" as FE
end box
box "Backend (FastAPI)" #LightYellow
  participant "POST /chat/query" as API
  participant "ChatService" as CS
  participant "LangGraph ReAct Agent" as Agent
  participant "search_documents Tool" as Tool
  participant "VectorStoreManager" as VSM
end box
box "Storage & External" #LightGreen
  participant "PostgreSQL" as PG
  participant "ChromaDB" as Chroma
  participant "Gemini 2.5 Flash" as LLM
  participant "PostgresSaver Checkpointer" as CP
end box

User -> FE: Type message & send
FE -> FE: Add user message to state
FE -> API: POST /chat/query {prompt, session_id, stream}
API -> CS: chat(prompt, session_id, stream)

alt No session_id
  CS -> PG: INSERT INTO chat_sessions
  PG --> CS: new session_id (UUID)
else Existing session
  CS -> PG: SELECT from chat_sessions
  PG --> CS: Session found
end

CS -> PG: INSERT INTO chat_messages (role=user)
PG --> CS: Saved

CS -> Agent: ainvoke/invoke with thread_id

note over Agent: ReAct Agent Decision Loop

loop Agent iterations
  Agent -> Agent: Evaluate if context needed

  alt Needs document context
    Agent -> Tool: search_documents(query)
    Tool -> VSM: search_similar(query, k=8)
    VSM -> Chroma: similarity_search(query, k)
    Chroma --> VSM: Top-k document chunks
    VSM --> Tool: Documents with content & metadata
    Tool --> Agent: Formatted results with source citations
  else Direct answer possible
    note over Agent: Proceed with existing context
  end

  Agent -> LLM: Generate response with context + system prompt
  LLM --> Agent: Response tokens
end

Agent --> CS: Final response

alt Streaming mode
  CS --> API: SSE generator yielding tokens
  API --> FE: data: {"token": "...", "session_id": "..."}
  note over FE: Infrastructure ready, currently uses non-streaming
else Non-streaming
  CS --> API: Complete response JSON
end

CS -> PG: INSERT INTO chat_messages (role=assistant)
PG --> CS: Saved
CS -> PG: UPDATE chat_sessions SET updated_at

API --> FE: Response with session_id
FE -> FE: Add assistant message to state

alt New session
  FE -> FE: router.replace(/chat/sessionId)
end

FE --> User: Display AI response in MessageBubble with Markdown rendering
@enduml
```

---

## 3. Document Deletion Sequence

Shows the interactions when deleting an indexed document.

Source: `diagrams/08-sequence-document-deletion.md`

```plantuml
@startuml
actor User
box "Frontend" #LightBlue
  participant "DocumentTable" as FE
end box
box "Backend (FastAPI)" #LightYellow
  participant "DELETE /documents" as API
  participant "DocumentService" as DS
  participant "VectorStoreManager" as VSM
end box
box "Storage" #LightGreen
  participant "ChromaDB" as Chroma
end box

User -> FE: Click delete on document row
FE -> FE: Confirm deletion dialog
FE -> API: DELETE /documents {filename}

API -> API: Validate filename parameter
API -> DS: delete_document(filename)
DS -> VSM: delete_documents_by_filename(filename)

VSM -> Chroma: collection.get(where={filename: name})
Chroma --> VSM: Matching document IDs

alt Documents found
  VSM -> Chroma: collection.delete(ids=[...])
  Chroma --> VSM: Deleted
  VSM --> DS: Success
  DS --> API: {status: deleted, chunks_removed: N}
else Not found
  Chroma --> VSM: Empty
  VSM --> DS: No documents to delete
  DS --> API: {status: not_found}
end

API --> FE: JSON response
FE -> FE: Increment refreshTrigger -> re-fetch list
FE --> User: Updated document table (file removed)
@enduml
```

---

## 4. App Startup Sequence

Shows the application startup lifecycle, resource initialization, and graceful shutdown.

Source: `diagrams/09-sequence-app-startup.md`

```plantuml
@startuml
box "Server" #LightGray
  participant "Uvicorn Server" as Uvicorn
end box
box "Application" #LightBlue
  participant "FastAPI App" as App
  participant "lifespan()" as Lifespan
  participant "config.Settings" as Settings
end box
box "Backend Services" #LightYellow
  participant "DocumentProcessor" as DP
  participant "VectorStoreManager" as VSM
  participant "DocumentService" as DS
  participant "ChatService" as CS
  participant "CORS Middleware" as Middleware
  participant "API Routers" as Router
end box
box "Storage & External" #LightGreen
  participant "PostgreSQL ConnectionPool" as PG
  participant "PostgresSaver" as CP
  participant "MemorySaver" as Mem
  participant "ChromaDB" as Chroma
end box

Uvicorn -> App: Start (uvicorn app:app)
App -> Lifespan: Enter async context

Lifespan -> Settings: Load environment variables
Settings --> Lifespan: Settings instance

note over Lifespan: Initialize Resources

Lifespan -> PG: ConnectionPool(conninfo, max_size=10, autocommit=True)
alt PostgreSQL available
  PG --> Lifespan: Pool ready
else PostgreSQL unavailable
  PG --> Lifespan: Connection error (logged)
end

Lifespan -> CP: PostgresSaver.from_conn_string(conninfo)
alt PostgreSQL available
  CP -> CP: setup() - create checkpoint tables
  CP --> Lifespan: Checkpointer ready
else PostgreSQL unavailable
  CP --> Lifespan: Error -> Fallback
  Lifespan -> Mem: MemorySaver()
  Mem --> Lifespan: In-memory checkpointer
  note over Lifespan: Graceful degradation
end

Lifespan -> DP: DocumentProcessor()
DP --> Lifespan: Processor ready

Lifespan -> VSM: VectorStoreManager()
VSM -> Chroma: Load/create persistent collection
Chroma --> VSM: Collection ready
VSM --> Lifespan: VSM ready

Lifespan -> DS: DocumentService(vs_manager=VSM, processor=DP)
DS --> Lifespan: DocService ready

Lifespan -> CS: ChatService(vs_manager=VSM, memory=CP, db_pool=PG)
CS --> Lifespan: ChatService ready

note over Lifespan: Store on app.state

Lifespan -> App: state.db_pool = PG
Lifespan -> App: state.memory = CP/Mem
Lifespan -> App: state.document_processor = DP
Lifespan -> App: state.vectorstore_manager = VSM
Lifespan -> App: state.document_service = DS
Lifespan -> App: state.chat_service = CS
Lifespan -> App: state.document_structures = {}

Lifespan --> App: Yield (startup complete)

App -> Middleware: Add CORSMiddleware
App -> Router: Include routers under /api/v1
App -> Uvicorn: Ready to accept requests

note over Uvicorn: Server running on :8000

== Shutdown ==

Uvicorn -> App: Shutdown signal
App -> Lifespan: Exit async context
Lifespan -> PG: _cleanup_resource(pool.close)
Lifespan -> CP: _cleanup_resource(checkpoint close)
Lifespan -> VSM: _cleanup_resource(persist chroma)
Lifespan --> App: Cleanup complete
@enduml
```

---

## 5. Context Upload Sequence

Shows the flow of uploading a document for in-chat context without permanent indexing.

Source: `diagrams/26-sequence-context-upload.md`

```plantuml
@startuml
actor User
box "Frontend" #LightBlue
  participant "ChatArea" as FE
end box
box "Backend (FastAPI)" #LightYellow
  participant "POST /upload/context" as API
  participant "DocumentService" as DS
  participant "DocumentProcessor" as DP
  participant "ChatService" as CS
  participant "LangGraph Agent" as Agent
end box
box "Storage" #LightGreen
  participant "PostgreSQL" as PG
end box

User -> FE: Upload file in chat
FE -> API: POST /upload/context (multipart + session_id)
API -> API: Validate file extension & size

API -> DS: upload_context(filename, bytes, session_id)
DS -> DP: extract_text_for_context(filename, bytes)

alt .txt or .md
  DP -> DP: Read UTF-8 directly
else Other formats
  DP -> DP: Docling convert -> Markdown -> plain text
end

DP --> DS: Extracted text string

DS -> CS: add_context_to_chat(text, session_id)
CS -> CS: Build context prompt: "The user has provided this document for context: ..."

CS -> Agent: ainvoke with context prompt + thread_id
Agent -> Agent: Process and confirm receipt
Agent --> CS: Confirmation response

CS -> PG: Save user context message + assistant confirmation
PG --> CS: Saved

CS --> DS: Response with session_id
DS --> API: {status: success, session_id, message}
API --> FE: JSON response
FE --> User: Agent confirms receipt of document context

note over User, PG
  Document is NOT stored in ChromaDB.
  It exists only within the conversation context.
  The agent can answer questions about it
  for the duration of this session.
end note
@enduml
```

---

## 6. SSE Streaming Sequence

Shows the Server-Sent Events streaming architecture for chat responses.

Source: `diagrams/27-sequence-sse-streaming.md`

```plantuml
@startuml
actor User
box "Frontend" #LightBlue
  participant "ChatArea" as FE
end box
box "Backend (FastAPI)" #LightYellow
  participant "POST /chat/query" as API
  participant "ChatService" as CS
  participant "LangGraph Agent" as Agent
end box
box "External" #LightGreen
  participant "Gemini 2.5 Flash" as LLM
end box

User -> FE: Send message (stream=true)
FE -> API: POST /chat/query {prompt, session_id, stream: true}

API -> CS: chat(prompt, session_id, stream=True)
CS -> Agent: astream_agent_response(agent, prompt, thread_id)

note over API: StreamingResponse created\nmedia_type="text/event-stream"

loop For each token from LLM
  Agent -> LLM: Generate next token
  LLM --> Agent: Token fragment
  Agent --> CS: Yield token
  CS --> API: Yield token
  API --> FE: SSE: data: {"token": "...", "session_id": "..."}\n\n
end

API --> FE: SSE: data: [DONE]\n\n

note over FE: Infrastructure is ready\nbut frontend currently uses\nnon-streaming mode (stream: false)

API -> CS: Save messages to PostgreSQL
API --> FE: Stream complete

FE -> FE: Assemble full response from tokens
FE --> User: Display complete response in MessageBubble

note over User, LLM
  Future: Frontend can consume SSE stream
  to render tokens incrementally
  for real-time typing effect
end note
@enduml
```

---

## 7. Structure Visualization Sequence

Shows how document structure is extracted and displayed when a user views a document's structure.

Source: `diagrams/28-sequence-structure-visualization.md`

```plantuml
@startuml
actor User
box "Frontend" #LightBlue
  participant "DocumentTable" as FE
end box
box "Backend (FastAPI)" #LightYellow
  participant "GET /documents/:name/structure" as API
  participant "app.state" as App
  participant "StructureVisualizer" as SV
  participant "DocumentProcessor" as DP
end box

User -> FE: Click "View Structure" on document row
FE -> API: GET /documents/{filename}/structure

API -> App: Check document_structures[filename]

alt Structure cached
  App --> API: Return cached structure
else Not cached
  note over API, DP: Re-process document to get structure
  API -> DP: process_file_bytes(filename, bytes)
  DP -> DP: Docling conversion
  DP --> API: DoclingDocument + LangChain Documents
  API -> SV: export_full_structure(DoclingDocument)
  SV -> SV: _extract_hierarchy() - headings
  SV -> SV: _extract_tables() - DataFrames
  SV -> SV: _extract_pictures() - bounding boxes
  SV --> API: {summary, hierarchy, tables, pictures}
  API -> App: Cache in document_structures[filename]
end

API --> FE: JSON {structure data}
FE -> FE: Open Dialog component
FE -> FE: Render heading hierarchy tree
FE -> FE: Render tables with data
FE -> FE: Show picture info with bounds
FE --> User: Document structure visualization
@enduml
```

---

## 8. Embedding & Similarity Search Sequence

Shows the internal mechanics of embedding a query and performing similarity search in ChromaDB.

Source: `diagrams/29-sequence-embedding-search.md`

```plantuml
@startuml
box "Components" #LightYellow
  participant "Search Query" as Query
  participant "VectorStoreManager" as VSM
  participant "GoogleGenerativeAIEmbeddings\ngemini-embedding-001" as Embed
  participant "ChromaDB\ndocuments collection" as Chroma
end box

note over Query, Chroma
  === Document Indexing (pre-stored) ===
  Each chunk stored as:
  id: UUID
  document: chunk text
  embedding: [float...]
  metadata: {filename, file_type, source}
end note

note over Query, Chroma
  === Similarity Search ===
end note

Query -> VSM: search_similar(query="...", k=8)
VSM -> Embed: embed_query(query)
Embed -> Embed: Call Gemini embedding API with query text
Embed --> VSM: embedding vector [768 floats]

VSM -> Chroma: collection.query(\nquery_embeddings=[vector],\nn_results=k,\ninclude=["documents","metadatas","distances"])

Chroma -> Chroma: Compute cosine similarity\nbetween query vector\nand all stored vectors

Chroma --> VSM: Top-k results:\n[{id, text, metadata, distance}]

VSM -> VSM: Map to LangChain Document objects

VSM --> Query: [Document(page_content, metadata)]

note over Query, Chroma
  === Search with Scores ===
end note

Query -> VSM: search_with_scores(query="...", k=8)
VSM -> Chroma: Same query + distances
Chroma --> VSM: Results with distance scores
VSM --> Query: [(Document, score)]
@enduml
```
