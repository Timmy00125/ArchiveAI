# Activity Diagrams - ArchiveAI (PlantUML)

Activity diagrams for the three primary workflows: document processing, chat RAG pipeline, and semantic search.

Sources: `diagrams/03-activity-document-processing.md`, `diagrams/04-activity-chat-rag.md`, `diagrams/05-activity-semantic-search.md`

---

## 1. Document Processing Activity Diagram

Shows the detailed flow of document upload, processing, chunking, embedding, and indexing.

Source: `diagrams/03-activity-document-processing.md`

### Main Flow (Indexed Upload)

```plantuml
@startuml
start
:User drops file;
if (Validate file extension & size?) then (valid)
  if (Check if filename already in ChromaDB?) then (already indexed)
    :Skip processing;
    #palegreen:Return already_indexed status;
  else (new file)
    :Write bytes to temporary file;
    if (File Type?) then (.txt .md)
      :Read UTF-8 directly;
    else (.pdf .docx .pptx .html .htm)
      :Docling DocumentConverter
     with OCR + tables;
      :Export to Markdown format;
    endif
    :Wrap as Markdown
     LangChain Document;
    :RecursiveCharacterTextSplitter
     chunk_size=1000, overlap=100;
    :Attach metadata:
     filename, file_type, source;
    :Google Generative AI
     gemini-embedding-001;
    :Store in ChromaDB
     documents collection;
    :StructureVisualizer
     .export_full_structure;
    :Cache structure in
     app.state.document_structures;
    :Delete temporary file;
    #palegreen:Return JSON response:
     filename, chunks, status;
  endif
else (invalid)
  #pink:Return 400 Error
   Unsupported type / too large;
endif
stop
@enduml
```

### Context Upload Flow (Non-Indexed)

```plantuml
@startuml
start
:User uploads context file;
if (Validate file extension & size?) then (valid)
  :DocumentProcessor
   .extract_text_for_context;
  :Wrap extracted text
   in context prompt;
  :Send to ChatService.chat
   with context prompt;
  :LangGraph Agent processes
   and confirms receipt;
  #palegreen:Return confirmation + session_id;
else (invalid)
  #pink:Return 400 Error;
endif
stop
@enduml
```

---

## 2. Chat & RAG Pipeline Activity Diagram

Shows the detailed flow of a chat query through the RAG agent pipeline.

Source: `diagrams/04-activity-chat-rag.md`

```plantuml
@startuml
start
:User sends message;
:ChatArea component
 calls POST /chat/query;
if (stream=true?) then (yes)
  :Server-Sent Events
   text/event-stream;
else (no)
  :Standard JSON response;
endif
:Get ChatService
 from app.state;
if (Session exists?) then (no)
  :Create session in
   PostgreSQL chat_sessions;
else (yes)
  :Load session context
   from PostgresSaver;
endif
:Initialize LangGraph
 ReAct Agent;
:Agent processes user prompt;
if (Agent Decision: needs context?) then (needs context)
  :Invoke search_documents tool;
  :VectorStoreManager
   .search_similar top-k=8;
  :Format results with
   Source N: filename citations;
  :Assemble context
   + original query;
else (direct answer)
endif
:Generate response
 via Gemini 2.5 Flash;
if (Streaming?) then (yes)
  :Yield tokens as SSE events
   data: token, session_id;
  :Send data: DONE event;
else (no)
  :Return complete response JSON;
endif
:Save message to
 PostgreSQL chat_messages;
:Update session
 updated_at timestamp;
:Return response to ChatArea;
:Add assistant message
 to React useState;
if (New session?) then (yes)
  :router.replace /chat/sessionId;
else (no)
endif
stop
@enduml
```

---

## 3. Semantic Search Activity Diagram

Shows the flow of a direct semantic search query (not through the chat agent).

Source: `diagrams/05-activity-semantic-search.md`

```plantuml
@startuml
start
:User enters query;
:SearchUI component
 POST /search endpoint;
if (Query non-empty?) then (yes)
  :Get VectorStoreManager
   from app.state;
  :search_similar
   or search_with_scores;
  :Embed query via
   gemini-embedding-001;
  :ChromaDB similarity search
   top-k results;
  if (with_scores=true?) then (yes)
    :Format results with
     relevance scores;
  else (no)
    :Format results
     without scores;
  endif
  :Return JSON:
   query, results
   with content + metadata;
  :SearchUI renders result cards
   with scores + content;
else (no)
  #pink:Return 400
   Query is required;
endif
stop
@enduml
```
