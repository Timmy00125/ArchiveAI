# Collaboration Diagrams - ArchiveAI (PlantUML)

Shows the structural organization of components and the sequenced messages passed between them during the five primary use cases. PlantUML does not have a native "collaboration/communication diagram" type, so these use object/instance notation with numbered message labels on graph-styled links, which visually matches a UML collaboration diagram.

Source: `diagrams/30-collaboration-diagram.md`

## Diagram Conventions

- **Solid arrows (`-->`)**: Synchronous request/response messages in the active use-case flow
- **Dotted arrows (`..>`)**: Background initialization and configuration dependencies
- **Numbered labels (`1:`, `2:`, ...)**: Show the approximate sequence within each use case
- **Subsystem grouping (`rectangle`)**: Objects grouped by layer (Client, Frontend, Backend, Storage)

---

## 1. Document Upload Collaboration

Path: User -> DocumentUpload -> api.ts -> /upload router -> DocumentService -> DocumentProcessor + VectorStoreManager -> ChromaDB + Gemini API

```plantuml
@startuml
skinparam componentStyle rectangle

rectangle "Client" {
  object "User" as User
}

rectangle "Frontend - Next.js" {
  object "DocumentUpload" as DocUpload
  object "api.ts\nfetchApi<T>" as ApiClient
  object "DocumentTable" as DocTable
}

rectangle "Backend - FastAPI" {
  object "/upload router" as UploadRouter
  object "DocumentService" as DocService
  object "DocumentProcessor" as DocProcessor
  object "VectorStoreManager" as VSManager
  object "StructureVisualizer" as StructureViz
}

rectangle "Storage & External" {
  object "PostgreSQL" as PG
  object "ChromaDB" as Chroma
  object "Google Gemini API" as Gemini
  object "Temp Filesystem" as TempFS
}

User --> DocUpload : 1: drop files
DocUpload --> ApiClient : 2: POST /upload (multipart)
ApiClient --> UploadRouter : 3: POST /api/v1/upload
UploadRouter --> DocService : 4: upload_file()
DocService --> VSManager : 5: document_exists()
VSManager --> Chroma : 6: collection.get()
Chroma --> VSManager : 7: found / not found
VSManager --> DocService : 8: exists?

DocService --> DocProcessor : 9: process_file_bytes()
DocProcessor --> TempFS : 10: write temp file
TempFS --> DocProcessor : 11: temp_path
DocProcessor --> DocProcessor : 12: Docling convert / read text
DocProcessor --> TempFS : 13: delete temp file
DocProcessor --> DocService : 14: Documents + DoclingDoc

DocService --> VSManager : 15: add_documents()
VSManager --> Gemini : 16: chunk & embed
Gemini --> VSManager : 17: embedding vectors
VSManager --> Chroma : 18: collection.add()
Chroma --> VSManager : 19: stored
VSManager --> DocService : 20: indexed

DocService --> StructureViz : 21: export_full_structure()
StructureViz --> DocService : 22: structure data
DocService --> DocService : 23: cache on app.state
DocService --> UploadRouter : 24: response JSON
UploadRouter --> ApiClient : 25: JSON response
ApiClient --> DocUpload : 26: status
DocUpload --> DocTable : 27: refresh list
DocTable --> ApiClient : 28: GET /documents
DocTable --> User : 29: render updated table
@enduml
```

---

## 2. Chat Query (RAG) Collaboration

Path: User -> ChatInput -> ChatArea -> api.ts -> /chat router -> ChatService -> LangGraph Agent -> search_documents Tool -> VectorStoreManager -> ChromaDB + Gemini API

```plantuml
@startuml
skinparam componentStyle rectangle

rectangle "Client" {
  object "User" as User
}

rectangle "Frontend - Next.js" {
  object "ChatInput" as ChatInput
  object "ChatArea" as ChatArea
  object "MessageBubble" as MessageBubble
  object "api.ts\nfetchApi<T>" as ApiClient
}

rectangle "Backend - FastAPI" {
  object "/chat router" as ChatRouter
  object "ChatService" as ChatService
  object "LangGraph ReAct Agent" as Agent
  object "search_documents Tool" as SearchTool
  object "VectorStoreManager" as VSManager
}

rectangle "Storage & External" {
  object "PostgreSQL" as PG
  object "ChromaDB" as Chroma
  object "Google Gemini API" as Gemini
}

User --> ChatInput : 1: type & send
ChatInput --> ChatArea : 2: handleSend()
ChatArea --> ChatArea : 3: add user msg to state
ChatArea --> ApiClient : 4: POST /chat/query
ApiClient --> ChatRouter : 5: POST /api/v1/chat/query
ChatRouter --> ChatService : 6: chat(prompt, session_id)

ChatService --> PG : 7a: INSERT session (new)
ChatService --> PG : 7b: SELECT session (existing)
PG --> ChatService : 8: session record

ChatService --> PG : 9: INSERT user message
PG --> ChatService : 10: saved

ChatService --> Agent : 11: ainvoke/invoke with thread_id

Agent --> Agent : 12: evaluate need for context
Agent --> SearchTool : 13: search_documents(query)
SearchTool --> VSManager : 14: search_similar(query, k=8)
VSManager --> Gemini : 15: embed_query()
Gemini --> VSManager : 16: embedding vector
VSManager --> Chroma : 17: collection.query()
Chroma --> VSManager : 18: top-k chunks
VSManager --> SearchTool : 19: documents with metadata
SearchTool --> Agent : 20: formatted results + citations

Agent --> Gemini : 21: generate with context + system prompt
Gemini --> Agent : 22: response tokens
Agent --> ChatService : 23: final response

ChatService --> PG : 24: INSERT assistant message
PG --> ChatService : 25: saved
ChatService --> PG : 26: UPDATE session updated_at
ChatService --> ChatRouter : 27: response JSON
ChatRouter --> ApiClient : 28: response
ApiClient --> ChatArea : 29: response data
ChatArea --> ChatArea : 30: add assistant msg to state
ChatArea --> MessageBubble : 31: render
MessageBubble --> User : 32: display to user
@enduml
```

---

## 3. Document Deletion Collaboration

Path: User -> DocumentTable -> api.ts -> /documents router -> DocumentService -> VectorStoreManager -> ChromaDB

```plantuml
@startuml
skinparam componentStyle rectangle

rectangle "Client" {
  object "User" as User
}

rectangle "Frontend - Next.js" {
  object "DocumentTable" as DocTable
  object "api.ts\nfetchApi<T>" as ApiClient
}

rectangle "Backend - FastAPI" {
  object "/documents router" as DocsRouter
  object "DocumentService" as DocService
  object "VectorStoreManager" as VSManager
}

rectangle "Storage" {
  object "ChromaDB" as Chroma
}

User --> DocTable : 1: click delete
DocTable --> DocTable : 2: confirm dialog
DocTable --> ApiClient : 3: DELETE /documents
ApiClient --> DocsRouter : 4: DELETE /api/v1/documents
DocsRouter --> DocService : 5: delete_document()
DocService --> VSManager : 6: delete_by_filename()
VSManager --> Chroma : 7: collection.get()
Chroma --> VSManager : 8: matching IDs
VSManager --> Chroma : 9: collection.delete()
Chroma --> VSManager : 10: deleted
VSManager --> DocService : 11: success
DocService --> DocsRouter : 12: response JSON
DocsRouter --> ApiClient : 13: JSON response
ApiClient --> DocTable : 14: status
DocTable --> DocTable : 15: refresh list
DocTable --> User : 16: render updated table
@enduml
```

---

## 4. Semantic Search Collaboration

Path: User -> SearchUI -> api.ts -> /search router -> VectorStoreManager -> Gemini API -> ChromaDB

```plantuml
@startuml
skinparam componentStyle rectangle

rectangle "Client" {
  object "User" as User
}

rectangle "Frontend - Next.js" {
  object "SearchUI" as SearchUI
  object "api.ts\nfetchApi<T>" as ApiClient
}

rectangle "Backend - FastAPI" {
  object "/search router" as SearchRouter
  object "VectorStoreManager" as VSManager
}

rectangle "Storage & External" {
  object "ChromaDB" as Chroma
  object "Google Gemini API" as Gemini
}

User --> SearchUI : 1: enter query
SearchUI --> ApiClient : 2: POST /search
ApiClient --> SearchRouter : 3: POST /api/v1/search
SearchRouter --> VSManager : 4: search_with_scores()
VSManager --> Gemini : 5: embed_query()
Gemini --> VSManager : 6: embedding vector
VSManager --> Chroma : 7: collection.query()
Chroma --> VSManager : 8: results with scores
VSManager --> SearchRouter : 9: [(Document, score)]
SearchRouter --> ApiClient : 10: JSON results
ApiClient --> SearchUI : 11: results
SearchUI --> User : 12: render result cards
@enduml
```

---

## 5. App Startup Collaboration (Background)

Path: Uvicorn -> lifespan() -> Settings -> PostgreSQL -> DocumentProcessor -> VectorStoreManager -> DocumentService -> ChatService -> app.state

```plantuml
@startuml
skinparam componentStyle rectangle

rectangle "Server" {
  object "Uvicorn" as Uvicorn
}

rectangle "Application" {
  object "lifespan()" as Lifespan
  object "config.Settings" as Settings
  object "FastAPI app.state" as Backend
}

rectangle "Backend Services" {
  object "DocumentProcessor" as DocProcessor
  object "VectorStoreManager" as VSManager
  object "DocumentService" as DocService
  object "ChatService" as ChatService
}

rectangle "Storage" {
  object "PostgreSQL" as PG
  object "ChromaDB" as Chroma
}

Uvicorn ..> Lifespan : 1: start app
Lifespan ..> Settings : 2: load Settings
Lifespan ..> PG : 3: create ConnectionPool
Lifespan ..> PG : 4: create PostgresSaver
Lifespan ..> DocProcessor : 5: create DocumentProcessor
Lifespan ..> VSManager : 6: create VectorStoreManager
VSManager ..> Chroma : 7: load Chroma collection
Lifespan ..> DocService : 8: create DocumentService
Lifespan ..> ChatService : 9: create ChatService
Lifespan ..> Backend : 10: store on app.state
@enduml
```

---

## Comparison to Sequence Diagrams

| Aspect | Collaboration Diagrams (this file) | Sequence Diagrams (03-sequence-diagrams.md) |
|--------|------------------------------------|---------------------------------------------|
| **Focus** | Structural relationships between objects | Time-ordered message flow |
| **Layout** | Objects grouped by layer/subsystem | Objects arranged horizontally by role |
| **Best for** | Understanding *who talks to whom* | Understanding *when things happen* |
| **Readability** | Better for seeing overall coupling | Better for tracing step-by-step logic |

## Related Diagrams

- [Use Case Diagram](./01-use-case.md) - Actors and system interactions
- [Activity Diagrams](./02-activity-diagrams.md) - Workflow and process flows
- [Sequence Diagrams](./03-sequence-diagrams.md) - Time-ordered interactions
- [State Machine Diagrams](./04-state-machine-diagrams.md) - Object lifecycles
- [Class Diagram](./05-class-diagram.md) - Class attributes, methods, and relationships
