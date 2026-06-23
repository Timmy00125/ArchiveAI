# State Machine Diagrams - ArchiveAI (PlantUML)

State diagrams for object lifecycles: RAG agent internal state, graceful degradation, and chat session lifecycle.

Sources: `diagrams/14-state-diagram-rag-agent.md`, `diagrams/15-state-diagram-fallback.md`, `diagrams/23-chat-session-lifecycle.md`

---

## 1. RAG Agent Internal State Machine

Shows the LangGraph ReAct agent's internal state transitions during query processing.

Source: `diagrams/14-state-diagram-rag-agent.md`

```plantuml
@startuml
[*] --> ReceiveQuery : User prompt arrives

ReceiveQuery --> Evaluate : Load conversation state from checkpointer

Evaluate --> SearchNeeded : Context required for response
Evaluate --> DirectAnswer : Sufficient context already available

SearchNeeded --> CallSearchTool : Invoke search_documents(query)
CallSearchTool --> ProcessResults : Format results with source citations
ProcessResults --> GenerateResponse : Assemble context + original query

DirectAnswer --> GenerateResponse : Use existing conversation context

GenerateResponse --> StreamTokens : LLM generates response tokens
StreamTokens --> CheckComplete : Token generation cycle

CheckComplete --> StreamTokens : More tokens to emit
CheckComplete --> Finalize : Generation complete

Finalize --> SaveCheckpoint : Persist conversation state to checkpointer
SaveCheckpoint --> SaveMessage : Save assistant message to PostgreSQL
SaveMessage --> [*] : Response returned

note right of SearchNeeded
  Agent decides based on
  system prompt instructions:
  "Use the search tool for
  document-related queries.
  Cite sources."
end note

note right of GenerateResponse
  Gemini 2.5 Flash
  temperature=0
  with context from
  search results
end note
@enduml
```

---

## 2. Graceful Degradation & Fallback State Machine

Shows how the system handles failures and degrades gracefully.

Source: `diagrams/15-state-diagram-fallback.md`

```plantuml
@startuml
[*] --> Startup : App initialization

state Startup {
  [*] --> TryPostgres : Connect to PostgreSQL
  TryPostgres --> PGConnected : Connection successful
  TryPostgres --> PGFailed : Connection refused

  PGConnected --> TryCheckpointer : Setup PostgresSaver
  TryCheckpointer --> CPSaverReady : Tables created
  TryCheckpointer --> CPFallback : Setup failed

  PGFailed --> UseMemorySaver : Fallback to MemorySaver
  CPFallback --> UseMemorySaver : Fallback to MemorySaver
}

CPSaverReady --> Running : Full persistence
UseMemorySaver --> Running : Degraded persistence

state Running {
  [*] --> HandleRequest

  HandleRequest --> ChatQuery : /chat/query
  HandleRequest --> DocUpload : /upload
  HandleRequest --> Search : /search

  ChatQuery --> TryPGHistory : get_history()
  TryPGHistory --> PGHistorySuccess : PostgreSQL available
  TryPGHistory --> CPHistoryFallback : PostgreSQL unavailable
  PGHistorySuccess --> ReturnHistory
  CPHistoryFallback --> TryCPHistory : Try checkpointer
  TryCPHistory --> CPHistorySuccess : Memory/PG saver available
  TryCPHistory --> EmptyHistory : Both failed
  CPHistorySuccess --> ReturnHistory
  EmptyHistory --> ReturnHistory

  DocUpload --> TryEmbed : Embed document
  TryEmbed --> EmbedSuccess : Gemini API available
  TryEmbed --> EmbedQuotaExceeded : 429 rate limit
  TryEmbed --> EmbedAuthError : 503 API key issue
  EmbedSuccess --> StoreChroma
  EmbedQuotaExceeded --> Return429 : Error with retry-after
  EmbedAuthError --> Return503 : API key error

  Search --> TrySearch : Similarity search
  TrySearch --> SearchSuccess : ChromaDB available
  TrySearch --> SearchError : ChromaDB error
  SearchSuccess --> ReturnResults
  SearchError --> Return500

  ChatQuery --> TryAgent : Invoke agent
  TryAgent --> TryAsync : ainvoke()
  TryAsync --> AsyncSuccess : Async supported
  TryAsync --> SyncFallback : NotImplementedError
  SyncFallback --> SyncInvoke : invoke() via asyncio.to_thread
  AsyncSuccess --> AgentResponse
  SyncInvoke --> AgentResponse
  AgentResponse --> TrySavePG
  TrySavePG --> PDSaveSuccess : PostgreSQL available
  TrySavePG --> CPSaveOnly : PostgreSQL unavailable
  PDSaveSuccess --> ResponseReturned
  CPSaveOnly --> ResponseReturned
}
@enduml
```

---

## 3. Chat Session Lifecycle State Machine

Shows the lifecycle of a chat session from creation to deletion.

Source: `diagrams/23-chat-session-lifecycle.md`

```plantuml
@startuml
[*] --> Uninitialized : User navigates to /chat

Uninitialized --> Active : User sends first message

state Active {
  [*] --> AwaitingInput : Ready for user input
  AwaitingInput --> Processing : User sends message
  Processing --> Searching : Agent calls search tool
  Searching --> Generating : Search results received
  Processing --> Generating : Direct answer (no search)
  Generating --> AwaitingInput : Response delivered
}

Active --> Idle : User stops interacting (session persists in DB)
Idle --> Active : User sends new message (loads from DB)

Active --> HistoryRequested : GET /chat/history/:id
HistoryRequested --> Active : History returned

Active --> Listed : GET /chat/sessions (appears in sidebar)
Listed --> Active 

Idle --> Deleted : DELETE /chat/sessions/:id
Active --> Deleted : DELETE /chat/sessions/:id
Deleted --> [*] : Session + all messages removed (CASCADE)

note right of Active
  Session data:
  - session_id (UUID)
  - created_at, updated_at
  - LangGraph checkpoint state
  - All messages in chat_messages
end note

note right of Deleted
  CASCADE DELETE removes:
  - chat_sessions row
  - ALL chat_messages rows
  - LangGraph checkpoint state
end note
@enduml
```
