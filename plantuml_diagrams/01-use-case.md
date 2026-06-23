# Use Case Diagram - ArchiveAI (PlantUML)

Shows all actors and their interactions with the ArchiveAI system.

Source: `diagrams/02-use-case.md`

## Diagram

```plantuml
@startuml
left to right direction
skinparam packageStyle rectangle

actor "User" as User

rectangle "ArchiveAI System" {
  usecase "Browse Landing Page" as UC1
  usecase "Upload Documents for Indexing" as UC2
  usecase "Upload Document as Chat Context" as UC3
  usecase "List Indexed Documents" as UC4
  usecase "Delete Indexed Document" as UC5
  usecase "View Document Structure" as UC6
  usecase "Check Document Exists" as UC7
  usecase "Start New Chat Conversation" as UC8
  usecase "Send Chat Message / Query" as UC9
  usecase "Receive Streaming AI Response" as UC10
  usecase "View Chat History" as UC11
  usecase "List Chat Sessions" as UC12
  usecase "Delete Chat Session" as UC13
  usecase "Perform Semantic Search" as UC14
  usecase "Toggle Dark/Light Theme" as UC15
  usecase "Navigate via Sidebar" as UC16
  usecase "Check System Health" as UC17
}

User --> UC1
User --> UC2
User --> UC3
User --> UC4
User --> UC5
User --> UC6
User --> UC7
User --> UC8
User --> UC9
User --> UC10
User --> UC11
User --> UC12
User --> UC13
User --> UC14
User --> UC15
User --> UC16
User --> UC17

UC2 ..> UC7 : <<include>>
UC3 ..> UC9 : <<include>>
UC9 ..> UC14 : <<include>>
UC6 ..> UC4 : <<extend>>
UC5 ..> UC7 : <<include>>
@enduml
```

## Use Case Descriptions

| UC# | Use Case | Actor | Description |
|-----|----------|-------|-------------|
| UC1 | Browse Landing Page | User | View the marketing/hero page with features and stats |
| UC2 | Upload Documents for Indexing | User | Upload PDF, DOCX, PPTX, HTML, TXT, MD files to be chunked, embedded, and stored in ChromaDB |
| UC3 | Upload Document as Chat Context | User | Upload a file for in-chat context without permanent indexing |
| UC4 | List Indexed Documents | User | View all documents in the vector store with chunk counts |
| UC5 | Delete Indexed Document | User | Remove a document and all its chunks from ChromaDB |
| UC6 | View Document Structure | User | See Docling-extracted headings, tables, and images for a document |
| UC7 | Check Document Exists | User | Verify if a file has already been indexed (deduplication) |
| UC8 | Start New Chat Conversation | User | Begin a fresh chat session with a new session ID |
| UC9 | Send Chat Message / Query | User | Send a prompt to the RAG agent which searches documents and generates a response |
| UC10 | Receive Streaming AI Response | User | Receive tokens incrementally via SSE (infrastructure ready) |
| UC11 | View Chat History | User | Retrieve all messages in a conversation session |
| UC12 | List Chat Sessions | User | View all past chat sessions with timestamps |
| UC13 | Delete Chat Session | User | Remove a session and all its messages from PostgreSQL |
| UC14 | Perform Semantic Search | User | Direct similarity search against the vector store with configurable k results |
| UC15 | Toggle Dark/Light Theme | User | Switch between dark (default) and light mode |
| UC16 | Navigate via Sidebar | User | Use sidebar for recent chats, documents, and search navigation |
| UC17 | Check System Health | User/Admin | Hit /health endpoint to check vector store stats and model info |

## Relationships

- **UC2 (Upload for Indexing) <<includes>> UC7 (Check Document Exists)** - Before indexing, the system verifies if the file already exists for deduplication
- **UC3 (Upload as Context) <<includes>> UC9 (Send Chat Message)** - Context upload sends the document text to the chat agent as a message
- **UC9 (Send Chat Message) <<includes>> UC14 (Semantic Search)** - Chat queries that need document context trigger a semantic search
- **UC6 (View Document Structure) <<extends>> UC4 (List Documents)** - Viewing structure is an optional extension of listing documents
- **UC5 (Delete Document) <<includes>> UC7 (Check Document Exists)** - Deletion first checks the document exists
