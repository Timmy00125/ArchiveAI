# Appendices

---

## Appendix A: Complete API Endpoint Catalogue

All endpoints are served under the base prefix `/api/v1`. The API is implemented with FastAPI and interactive documentation is available at `/docs` (Swagger UI) and `/redoc` (ReDoc).

### A.1 Information Endpoints

#### `GET /`

Returns API metadata and available endpoint paths.

**Response:**

```json
{
  "name": "Document Intelligence API",
  "version": "1.0.0",
  "docs": "/docs",
  "endpoints": {
    "upload": "/api/v1/upload",
    "upload_context": "/api/v1/upload/context",
    "documents": "/api/v1/documents",
    "search": "/api/v1/search",
    "chat": "/api/v1/chat/query",
    "chat_history": "/api/v1/chat/history/{session_id}",
    "delete_session": "/api/v1/chat/sessions/{session_id}"
  }
}
```

#### `GET /health`

Returns system health status including vector store statistics and model configuration.

**Response:**

```json
{
  "status": "ok",
  "vector_store": {
    "backend": "pgvector",
    "collection": "documents",
    "total_chunks": 247,
    "total_documents": 5
  },
  "models": {
    "llm": "gemini-2.5-flash",
    "embedding": "text-embedding-004"
  }
}
```

---

### A.2 Upload Endpoints

#### `POST /api/v1/upload`

Upload one or more files and index them into the vector store. Accepts `multipart/form-data`.

**Request:**

| Field   | Type             | Required | Description                         |
| ------- | ---------------- | -------- | ----------------------------------- |
| `files` | `List[UploadFile]` | Yes    | One or more files to upload         |

**Supported file types:** `.pdf`, `.docx`, `.pptx`, `.html`, `.htm`, `.txt`, `.md`

**Constraints:** Maximum file size is configurable via `MAX_UPLOAD_SIZE_MB` (default: 50 MB).

**Response (201 Created):**

```json
{
  "results": [
    {
      "status": "indexed",
      "filename": "report.pdf",
      "chunks_added": 42
    },
    {
      "status": "unchanged",
      "filename": "existing_doc.pdf",
      "chunks_added": 0
    }
  ],
  "total_indexed": 1,
  "total_skipped": 1,
  "total_files": 2
}
```

**Error responses:**

| Status | Condition                              |
| ------ | -------------------------------------- |
| 400    | No files provided                      |
| 400    | Unsupported file extension             |
| 400    | File exceeds maximum upload size       |

---

#### `POST /api/v1/upload/context`

Upload a file and inject its extracted text as context into a chat session without permanent indexing.

**Request:**

| Field        | Type         | Required | Description                          |
| ------------ | ------------ | -------- | ------------------------------------ |
| `file`       | `UploadFile` | Yes      | Document file                        |
| `session_id` | `string`     | No       | Session to attach context to (auto-generated if omitted) |

**Response (200 OK):**

```json
{
  "status": "context_added",
  "filename": "notes.txt",
  "content_length": 3842,
  "session_id": "a1b2c3d4-...",
  "confirmation": "I've received the document 'notes.txt' and I'm ready to answer questions about it."
}
```

---

### A.3 Document Management Endpoints

#### `GET /api/v1/documents`

List all indexed documents with chunk counts.

**Response (200 OK):**

```json
{
  "documents": [
    { "filename": "report.pdf", "chunks": 42 },
    { "filename": "thesis_draft.docx", "chunks": 87 }
  ],
  "total_documents": 2,
  "total_chunks": 129
}
```

---

#### `DELETE /api/v1/documents`

Delete all indexed chunks and associated disk artifacts for a given filename.

**Request body:**

```json
{
  "filename": "report.pdf"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "filename": "report.pdf",
  "deleted_chunks": 42
}
```

**Response (404 Not Found):**

```json
{
  "success": false,
  "filename": "nonexistent.pdf",
  "deleted_chunks": 0,
  "error": "No chunks found for this filename"
}
```

---

#### `GET /api/v1/documents/exists?filename={filename}`

Check whether a document is already indexed.

**Response (200 OK):**

```json
{
  "filename": "report.pdf",
  "exists": true
}
```

---

#### `GET /api/v1/documents/{filename}/structure`

Return Docling structural analysis (headings, tables, pictures) for a processed document. Structure data is available for documents processed in the current server session or persisted to disk.

**Response (200 OK):**

```json
{
  "filename": "report.pdf",
  "structure": {
    "summary": {
      "name": "report",
      "num_pages": 12,
      "num_texts": 84,
      "num_tables": 3,
      "num_pictures": 2,
      "text_types": { "title": 1, "section_header": 8, "paragraph": 75 }
    },
    "hierarchy": [
      { "type": "title", "text": "Annual Report 2024", "page": 1, "level": 1 },
      { "type": "section_header", "text": "Executive Summary", "page": 2, "level": 2 }
    ],
    "tables": [
      {
        "table_number": 1,
        "page": 5,
        "caption": "Revenue breakdown by region",
        "shape": [6, 4],
        "is_empty": false
      }
    ],
    "pictures": [
      {
        "picture_number": 1,
        "page": 8,
        "caption": "Organizational chart",
        "bounding_box": { "left": 72, "top": 200, "right": 540, "bottom": 480 }
      }
    ]
  }
}
```

---

#### `GET /api/v1/documents/{filename}/content`

Return the full extracted markdown text for an indexed document.

**Response (200 OK):**

```json
{
  "filename": "report.pdf",
  "content": "# Annual Report 2024\n\n## Executive Summary\n\n...",
  "length": 15234
}
```

---

### A.4 Search Endpoint

#### `POST /api/v1/search`

Perform direct semantic similarity search against the vector store. Returns raw document chunks without LLM synthesis.

**Request body:**

```json
{
  "query": "What are the key findings?",
  "k": 8,
  "with_scores": true
}
```

| Field         | Type      | Required | Default | Description                            |
| ------------- | --------- | -------- | ------- | -------------------------------------- |
| `query`       | `string`  | Yes      |         | Natural language search query          |
| `k`           | `integer` | No       | 8       | Number of results (1-50)               |
| `with_scores` | `boolean` | No       | false   | Include cosine similarity scores       |

**Response (200 OK):**

```json
{
  "query": "What are the key findings?",
  "results": [
    {
      "content": "The primary finding of this study indicates that...",
      "metadata": {
        "filename": "research_paper.pdf",
        "source": "research_paper.pdf",
        "file_type": "application/pdf"
      },
      "score": 0.1823
    }
  ],
  "total": 8
}
```

---

### A.5 Chat Endpoints

#### `POST /api/v1/chat/query`

Send a conversational query to the document intelligence agent. Supports both standard JSON response and Server-Sent Events (SSE) streaming.

**Request body:**

```json
{
  "prompt": "Summarize the main arguments in the uploaded report",
  "session_id": "a1b2c3d4-...",
  "stream": false
}
```

| Field        | Type      | Required | Default | Description                            |
| ------------ | --------- | -------- | ------- | -------------------------------------- |
| `prompt`     | `string`  | Yes      |         | User question or instruction           |
| `session_id` | `string`  | No       | auto    | Conversation session identifier        |
| `stream`     | `boolean` | No       | false   | Enable SSE token streaming             |

**Standard response (200 OK, `stream: false`):**

```json
{
  "response": "Based on the uploaded report, the main arguments are...",
  "session_id": "a1b2c3d4-..."
}
```

**Streaming response (`stream: true`):**

Content-Type: `text/event-stream`

```
data: {"token": "Based", "session_id": "a1b2c3d4-..."}

data: {"token": " on the", "session_id": "a1b2c3d4-..."}

data: {"token": " uploaded report...", "session_id": "a1b2c3d4-..."}

data: [DONE]
```

**Error responses:**

| Status | Condition                                |
| ------ | ---------------------------------------- |
| 400    | Empty or missing prompt                  |
| 429    | AI provider quota exceeded               |
| 502    | Upstream AI provider error               |
| 503    | AI provider misconfigured (API key issue)|

---

#### `GET /api/v1/chat/history/{session_id}`

Retrieve the full conversation history for a given session.

**Response (200 OK):**

```json
{
  "session_id": "a1b2c3d4-...",
  "messages": [
    {
      "role": "user",
      "content": "What does the report say about revenue?",
      "timestamp": "2025-03-15T10:30:00+00:00"
    },
    {
      "role": "assistant",
      "content": "According to the report, revenue increased by...",
      "timestamp": "2025-03-15T10:30:05+00:00"
    }
  ]
}
```

---

#### `GET /api/v1/chat/sessions`

List all chat sessions ordered by most recent activity.

**Response (200 OK):**

```json
{
  "sessions": [
    {
      "session_id": "a1b2c3d4-...",
      "last_message": "Based on the uploaded report, the main arguments...",
      "timestamp": "2025-03-15T10:30:05+00:00"
    },
    {
      "session_id": "e5f6g7h8-...",
      "last_message": "The document contains three main sections...",
      "timestamp": "2025-03-14T14:22:10+00:00"
    }
  ]
}
```

---

#### `DELETE /api/v1/chat/sessions/{session_id}`

Delete a conversation session and all associated messages.

**Response (200 OK):**

```json
{
  "success": true,
  "session_id": "a1b2c3d4-..."
}
```

---

## Appendix B: Configuration and Environment Variables

### B.1 Backend Environment Variables

The backend reads configuration from environment variables, with support for a `.env` file located in the `backend/` directory. The following table documents all configurable parameters and their defaults.

| Variable                 | Default                    | Description                                    |
| ------------------------ | -------------------------- | ---------------------------------------------- |
| `GOOGLE_CLOUD_PROJECT`   | *(empty)*                  | GCP project ID for Vertex AI                   |
| `GOOGLE_CLOUD_LOCATION`  | `us-central1`             | GCP region for Vertex AI services              |
| `GEMINI_MODEL`           | `gemini-2.5-flash`        | Gemini model for chat and summarization        |
| `GEMINI_VISION_MODEL`    | `gemini-2.5-flash`        | Gemini model for vision analysis               |
| `GEMINI_EMBED_MODEL`     | `text-embedding-004`      | Gemini model for text embeddings               |
| `PGVECTOR_COLLECTION`    | `documents`                | pgvector collection name                       |
| `CHUNK_SIZE`             | `1000`                     | Character count per text chunk                 |
| `CHUNK_OVERLAP`          | `100`                      | Overlap characters between consecutive chunks  |
| `SEARCH_K`               | `8`                        | Default number of results for similarity search|
| `MAX_UPLOAD_SIZE_MB`     | `50`                       | Maximum allowed upload file size in megabytes  |
| `UPLOAD_DIR`             | `./data/uploads`           | Directory for storing uploaded source files    |
| `MARKDOWN_DIR`           | `./data/markdown`          | Directory for extracted markdown outputs       |
| `STRUCTURE_DIR`          | `./data/structures`        | Directory for Docling structure JSON files     |
| `POSTGRES_USER`          | `archiveai`                | PostgreSQL database user                       |
| `POSTGRES_PASSWORD`      | `archiveai_password`       | PostgreSQL database password                   |
| `POSTGRES_DB`            | `archiveai_chat`           | PostgreSQL database name                       |
| `POSTGRES_HOST`          | `localhost`                | PostgreSQL host address                        |
| `POSTGRES_PORT`          | `5433`                     | PostgreSQL port (5433 for Docker, 5432 for Cloud SQL) |
| `CORS_ORIGINS`           | `http://localhost:3000,...` | Comma-separated list of allowed CORS origins   |

### B.2 Frontend Environment Variables

| Variable                | Default                          | Description                       |
| ----------------------- | -------------------------------- | --------------------------------- |
| `NEXT_PUBLIC_API_URL`   | `http://localhost:8000/api/v1`   | Backend API base URL              |

### B.3 Representative Environment File (`.env.example`)

```env
# Gemini
GOOGLE_API_KEY=your_google_api_key_here

# Vector Store (pgvector)
# PGVECTOR_COLLECTION=documents

# Chunking
# CHUNK_SIZE=1000
# CHUNK_OVERLAP=100
# SEARCH_K=8

# Upload
# MAX_UPLOAD_SIZE_MB=50

# Database (PostgreSQL)
# POSTGRES_USER=archiveai
# POSTGRES_PASSWORD=archiveai_password
# POSTGRES_DB=archiveai_chat
# POSTGRES_HOST=localhost
# POSTGRES_PORT=5433

# CORS
# CORS_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:8080
```

### B.4 Production Environment Template

For GCP deployment, the production environment file uses Cloud SQL connectivity:

```env
GOOGLE_CLOUD_PROJECT=YOUR_PROJECT_ID
GOOGLE_CLOUD_LOCATION=us-central1
GEMINI_MODEL=gemini-2.5-flash
GEMINI_VISION_MODEL=gemini-2.5-flash
GEMINI_EMBED_MODEL=text-embedding-004
PGVECTOR_COLLECTION=documents
CHUNK_SIZE=1000
CHUNK_OVERLAP=100
SEARCH_K=8
MAX_UPLOAD_SIZE_MB=50
UPLOAD_DIR=./data/uploads
MARKDOWN_DIR=./data/markdown
STRUCTURE_DIR=./data/structures
POSTGRES_USER=archiveai
POSTGRES_PASSWORD=YOUR_DB_PASSWORD
POSTGRES_DB=archiveai_chat
POSTGRES_HOST=127.0.0.1
POSTGRES_PORT=5432
CORS_ORIGINS=https://your-frontend-domain.com,http://localhost:3000
```

---

## Appendix C: Project Directory Structure

### C.1 Top-Level Repository Layout

```
ArchiveAI/
  .github/                        # GitHub configuration
    prompts/
  backend/                        # Python FastAPI backend
    config/
      nginx/
        archiveai                 # Nginx reverse proxy configuration
      systemd/
        archiveai.service         # Systemd service unit file
    data/
      uploads/                    # Stored uploaded source documents
      markdown/                   # Extracted markdown outputs
      structures/                 # Docling structure JSON files
    scripts/
      backup.sh                   # Local data backup script
      setup_gcp.sh                # GCP infrastructure bootstrap script
    src/
      api/
        __init__.py
        chat.py                   # Chat API router
        documents.py              # Document management API router
        search.py                 # Semantic search API router
        upload.py                 # File upload API router
      services/
        __init__.py
        chat_service.py           # Chat session and agent orchestration
        document_service.py       # Document upload, listing, deletion
      __init__.py
      agent.py                    # LangGraph ReAct agent configuration
      config.py                   # Central settings from environment
      document_processor.py       # Docling document conversion pipeline
      logging_config.py           # Structured logging setup
      main.py                     # FastAPI application entry point
      structure_visualizer.py     # Document structure extraction
      tools.py                    # Agent tools (search, summarize, vision)
      vectorstore.py              # pgvector management and retrieval
    .env.example                  # Environment variable template
    .env.production               # Production environment template
    deploy.sh                     # One-command VM deployment script
    Dockerfile                    # Container image definition
    requirements.txt              # Python dependency manifest
  diagrams/                       # UML and architecture diagrams (31 files)
  docker/
    init-pgvector.sql             # PostgreSQL pgvector extension init
  docs/                           # Thesis chapters
    Chapter1.md
    Chapter2.md
    Chapter3.md
    Chapter4.md
    Chapter5.md
    Chapter6.md
    slides.md
  frontend/                       # Next.js 16 / React 19 frontend
    app/
      (app)/
        chat/
          page.tsx                # New conversation page
          [sessionId]/
            page.tsx              # Session history page
        documents/
          page.tsx                # Document management page
        search/
          page.tsx                # Semantic search page
        settings/
          page.tsx                # Settings and diagnostics page
        layout.tsx                # Authenticated app layout with sidebar
      favicon.ico
      globals.css                 # Global styles and Tailwind imports
      layout.tsx                  # Root layout with fonts and providers
      page.tsx                    # Landing page
    components/
      chat/
        chat-area.tsx             # Chat conversation area with SSE streaming
        chat-input.tsx            # Message input with file upload
        message-bubble.tsx        # Individual message rendering
      documents/
        document-table.tsx        # Indexed documents table
        document-upload.tsx       # Drag-and-drop file upload
      landing/
        features.tsx              # Landing page features section
        footer.tsx                # Landing page footer
        hero.tsx                  # Landing page hero section
        navigation.tsx            # Landing page navigation
        stats.tsx                 # Landing page statistics
      search/
        search-ui.tsx             # Semantic search interface
      ui/                         # shadcn/ui component library
      app-sidebar.tsx             # Application sidebar navigation
      error-boundary.tsx          # React error boundary
      offline-banner.tsx          # Network connectivity indicator
      theme-provider.tsx          # Dark/light theme provider
      theme-toggle.tsx            # Theme switch control
    hooks/
      use-chat-sessions.ts        # Chat session listing hook
      use-documents.ts            # Document management hook
      use-keyboard-shortcuts.ts   # Global keyboard shortcut hook
      use-mobile.ts               # Responsive breakpoint hook
      use-search.ts               # Semantic search hook
    lib/
      api.ts                      # API client (fetchApi / fetchApiRaw)
      store.ts                    # Zustand global state store
      types.ts                    # TypeScript type definitions
      utils.ts                    # Utility functions
    package.json                  # Node.js dependency manifest
    tsconfig.json                 # TypeScript configuration
    next.config.ts                # Next.js configuration
  docker-compose.yml              # Local PostgreSQL with pgvector
  hosting.md                      # GCP deployment guide
  THESIS.md                       # Thesis outline
  AGENTS.md                       # AI agent development instructions
```

---

## Appendix D: Database Schema

### D.1 PostgreSQL Tables

The system uses PostgreSQL for two purposes: chat session persistence and vector embedding storage (via pgvector).

#### Chat Sessions Table

```sql
CREATE TABLE IF NOT EXISTS chat_sessions (
    session_id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### Chat Messages Table

```sql
CREATE TABLE IF NOT EXISTS chat_messages (
    id BIGSERIAL PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES chat_sessions(session_id)
        ON DELETE CASCADE,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session_created
    ON chat_messages (session_id, created_at, id);
```

### D.2 pgvector Tables (Managed by LangChain)

The pgvector extension stores document embeddings using tables managed by the `langchain-postgres` library.

#### Collection Registry

The `langchain_pg_collection` table registers named vector collections:

| Column    | Type   | Description                       |
| --------- | ------ | --------------------------------- |
| `uuid`    | UUID   | Primary key                       |
| `name`    | TEXT   | Collection name (e.g., `documents`)|
| `cmetadata` | JSONB | Collection metadata              |

#### Embedding Storage

The `langchain_pg_embedding` table stores individual chunk embeddings:

| Column        | Type     | Description                           |
| ------------- | -------- | ------------------------------------- |
| `uuid`        | UUID     | Primary key                           |
| `collection_id` | UUID   | Foreign key to collection             |
| `embedding`   | VECTOR   | High-dimensional embedding vector     |
| `document`    | TEXT     | Original chunk text content           |
| `cmetadata`   | JSONB    | Chunk metadata (filename, source, etc.)|
| `custom_id`   | TEXT     | Optional custom identifier            |

### D.3 pgvector Extension Initialization

The Docker Compose setup initializes pgvector via an entrypoint script:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

---

## Appendix E: Technology Stack and Dependencies

### E.1 Backend Dependencies

| Package                       | Version    | Purpose                                        |
| ----------------------------- | ---------- | ---------------------------------------------- |
| `fastapi`                     | >=0.115.0  | Web framework for REST API                     |
| `uvicorn`                     | >=0.30.0   | ASGI server                                    |
| `python-multipart`            | >=0.0.9    | Multipart form data parsing for file uploads   |
| `aiofiles`                    | >=23.0.0   | Async file I/O                                 |
| `docling`                     | >=2.55.0   | Document conversion with OCR and structure     |
| `langchain-docling`           | >=0.1.0    | Docling-LangChain integration                  |
| `rapidocr-onnxruntime`        | >=1.4.0    | OCR engine for Docling                         |
| `langchain`                   | >=0.3.0    | LLM orchestration framework                    |
| `langchain-text-splitters`    | >=0.3.0    | Recursive text chunking                        |
| `langchain-google-vertexai`   | >=2.0.0    | Gemini model integration via Vertex AI         |
| `langgraph`                   | >=0.2.0    | Agent graph orchestration (ReAct pattern)      |
| `langgraph-checkpoint-postgres` | >=0.1.0  | PostgreSQL-backed agent state checkpointing    |
| `google-cloud-aiplatform`     | >=1.60.0   | Google Cloud Vertex AI SDK                     |
| `pgvector`                    | >=0.3.0    | pgvector Python support                        |
| `langchain-postgres`          | >=0.0.12   | LangChain pgvector integration                 |
| `SQLAlchemy`                  | >=2.0.0    | SQL toolkit for direct pgvector queries        |
| `psycopg2-binary`             | >=2.9.0    | PostgreSQL adapter (SQLAlchemy driver)         |
| `psycopg`                     | >=3.2.0    | PostgreSQL adapter with connection pooling     |
| `pydantic-settings`           | >=2.0.0    | Settings management with validation            |
| `python-dotenv`               | >=1.0.0    | Environment file loading                       |
| `pandas`                      | >=2.0.0    | Data manipulation for table extraction         |
| `numpy`                       | <2         | Numerical computation (pinned for compatibility)|

### E.2 Frontend Dependencies

| Package                    | Version   | Purpose                                      |
| -------------------------- | --------- | -------------------------------------------- |
| `next`                     | 16.1.7    | React framework with App Router              |
| `react`                    | 19.2.3    | UI component library                         |
| `react-dom`                | 19.2.3    | React DOM rendering                          |
| `typescript`               | ^5        | Type-safe JavaScript                         |
| `tailwindcss`              | ^4        | Utility-first CSS framework                  |
| `shadcn`                   | ^4.0.8    | UI component system                          |
| `@radix-ui/*`              | various   | Accessible headless UI primitives            |
| `zustand`                  | ^5.0.14   | Lightweight state management                 |
| `framer-motion`            | ^12.38.0  | Animation library                            |
| `lucide-react`             | ^0.577.0  | Icon library                                 |
| `react-dropzone`           | ^15.0.0   | Drag-and-drop file upload                    |
| `react-markdown`           | ^10.1.0   | Markdown rendering for chat responses        |
| `remark-gfm`               | ^4.0.1    | GitHub Flavored Markdown support             |
| `sonner`                   | ^2.0.7    | Toast notification system                    |
| `next-themes`              | ^0.4.6    | Dark/light theme management                  |
| `date-fns`                 | ^4.1.0    | Date formatting utilities                    |
| `class-variance-authority` | ^0.7.1    | Component variant styling                    |
| `clsx`                     | ^2.1.1    | Conditional class name composition           |
| `tailwind-merge`           | ^3.5.0    | Tailwind class deduplication                 |

### E.3 Infrastructure Components

| Component              | Version       | Purpose                                  |
| ---------------------- | ------------- | ---------------------------------------- |
| PostgreSQL             | 18            | Relational database and chat persistence |
| pgvector               | (pg18 image)  | Vector embedding storage and search      |
| Docker Compose         | v2            | Local development orchestration          |
| Nginx                  | (system)      | Reverse proxy for production deployment  |
| systemd                | (system)      | Service management for production        |

---

## Appendix F: Deployment Artifacts

### F.1 Docker Compose Configuration

The local development database is provisioned via Docker Compose:

```yaml
services:
  postgres:
    image: pgvector/pgvector:pg18
    container_name: archiveai-postgres
    environment:
      POSTGRES_USER: archiveai
      POSTGRES_PASSWORD: archiveai_password
      POSTGRES_DB: archiveai_chat
    ports:
      - "5433:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./docker/init-pgvector.sql:/docker-entrypoint-initdb.d/init-pgvector.sql

volumes:
  postgres_data:
```

### F.2 Backend Dockerfile

```dockerfile
FROM python:3.11-slim-bookworm

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

COPY src/ ./src/

RUN mkdir -p data/uploads data/markdown data/structures

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### F.3 Systemd Service Unit

```ini
[Unit]
Description=ArchiveAI FastAPI Backend
After=network.target

[Service]
User=archiveai
WorkingDirectory=/opt/archiveai/backend
Environment="PATH=/opt/archiveai/backend/.venv/bin"
ExecStart=/opt/archiveai/backend/.venv/bin/uvicorn src.main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

### F.4 Nginx Reverse Proxy Configuration

```nginx
server {
    listen 80;
    server_name _;

    client_max_body_size 60M;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## Appendix G: Agent Configuration and Tools

### G.1 System Prompt

The document intelligence agent operates under the following system prompt:

```
You are a helpful document intelligence assistant. You have access to documents
that have been uploaded and processed (PDFs, Word documents, presentations,
HTML files, etc.).

GUIDELINES:
- Use the search_documents tool to find specific information within documents.
- Use the summarize_document tool to get a high-level overview or full summary
  of a specific file.
- Use the analyze_image_document tool to visually inspect a document if
  standard search fails, especially for charts, diagrams, or complex visual
  layouts.
- Be efficient: one well-crafted search is usually sufficient
- Only search again if the first results are clearly incomplete
- Provide clear, accurate answers based on the document contents
- Always cite your sources with filenames or document titles
- If information isn't found, say so clearly
- Be concise but thorough

When answering:
1. Search the documents with a focused query
2. Synthesize a clear answer from the results
3. Include source citations (filenames)
4. Only search again if absolutely necessary
```

### G.2 Agent Tool: `search_documents`

Performs semantic similarity search against the pgvector store. Returns formatted context blocks with source attribution.

**Parameters:**

| Parameter | Type     | Description                          |
| --------- | -------- | ------------------------------------ |
| `query`   | `string` | Natural language search query        |

**Returns:** Formatted string of ranked document chunks with source labels.

### G.3 Agent Tool: `summarize_document`

Generates a comprehensive summary of a specific document by reading its full extracted markdown text and invoking the Gemini LLM.

**Parameters:**

| Parameter  | Type     | Description                          |
| ---------- | -------- | ------------------------------------ |
| `filename` | `string` | Exact filename of the document       |

**Returns:** Summary text generated by the LLM.

### G.4 Agent Tool: `analyze_image_document`

Performs visual analysis of a document using Gemini's vision capabilities. Passes the raw file as a base64-encoded image to the vision model. Limited to files under 5 MB.

**Parameters:**

| Parameter  | Type     | Description                                    |
| ---------- | -------- | ---------------------------------------------- |
| `filename` | `string` | Exact filename of the document                 |
| `query`    | `string` | Specific question about visual content         |

**Returns:** Vision model analysis of the document's visual elements.

### G.5 Agent Architecture

The agent is constructed using LangGraph's `create_react_agent` function with the following configuration:

- **Model:** ChatVertexAI with temperature 0 (deterministic output)
- **Tools:** `search_documents`, `summarize_document`, `analyze_image_document`
- **Checkpointer:** MemorySaver for in-session conversation continuity
- **Pattern:** ReAct (Reasoning + Acting) loop

The agent supports two invocation modes:

1. **Synchronous invocation** (`invoke_agent`): Returns the complete response as a string after full agent execution.
2. **Streaming invocation** (`astream_agent_response`): Yields tokens incrementally via an async generator, filtering to only emit tokens from the agent node (excluding tool call outputs).

---

## Appendix H: Frontend State Management

### H.1 Zustand Store Schema

The frontend uses Zustand for global state management. The store manages chat session listings, network status, and error tracking.

```typescript
interface AppState {
  sessions: ChatSessionSummary[];
  sessionsLoading: boolean;
  sessionsVersion: number;
  setSessions: (sessions: ChatSessionSummary[]) => void;
  setSessionsLoading: (loading: boolean) => void;
  invalidateSessions: () => void;
  online: boolean;
  setOnline: (online: boolean) => void;
  errors: { id: string; message: string; timestamp: string }[];
  addError: (message: string) => void;
  clearErrors: () => void;
}
```

### H.2 Core TypeScript Types

```typescript
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface ChatSession {
  id: string;
  title?: string;
  created_at: string;
  updated_at: string;
}

interface ChatSessionSummary {
  session_id: string;
  last_message: string;
  timestamp: string;
}

interface Document {
  id: string;
  filename: string;
  size?: number;
  uploaded_at: string;
  status: "processing" | "ready" | "error";
  metadata?: Record<string, unknown>;
}

interface SearchResult {
  id: string;
  filename: string;
  content: string;
  score: number;
  metadata?: Record<string, unknown>;
}
```

### H.3 Frontend Routing Structure

| Route                     | Page Component           | Description                          |
| ------------------------- | ------------------------ | ------------------------------------ |
| `/`                       | Landing page             | Public landing with hero and features|
| `/chat`                   | Chat page                | New conversation workspace           |
| `/chat/[sessionId]`       | Session page             | Resume existing conversation         |
| `/documents`              | Documents page           | Upload and manage indexed files      |
| `/search`                 | Search page              | Direct semantic retrieval            |
| `/settings`               | Settings page            | Connection status and error log      |

### H.4 Custom React Hooks

| Hook                    | Purpose                                            |
| ----------------------- | -------------------------------------------------- |
| `useChatSessions`       | Fetches and manages chat session list from API     |
| `useDocuments`          | Manages document listing, upload, and deletion     |
| `useSearch`             | Handles semantic search queries and result state   |
| `useKeyboardShortcuts`  | Global shortcuts (Ctrl+K for search navigation)    |
| `useIsMobile`           | Responsive breakpoint detection                    |

---

## Appendix I: Local Development Setup

### I.1 Prerequisites

- Python 3.11+
- Node.js 18+ and pnpm
- Docker and Docker Compose
- Google Cloud project with Vertex AI API enabled

### I.2 Startup Sequence

1. **Start the database:**

```bash
docker compose up -d
```

2. **Start the backend:**

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # Configure as needed
uvicorn src.main:app --reload --port 8000
```

3. **Start the frontend:**

```bash
cd frontend
pnpm install
pnpm dev               # http://localhost:3000
```

### I.3 Verification

- Backend health: `curl http://localhost:8000/health`
- API documentation: `http://localhost:8000/docs`
- Frontend: `http://localhost:3000`

---

## Appendix J: Error Handling and Reliability Patterns

### J.1 API Error Response Format

All API errors follow a consistent JSON structure:

```json
{
  "detail": "Human-readable error description"
}
```

### J.2 HTTP Status Code Usage

| Status | Usage                                              |
| ------ | -------------------------------------------------- |
| 200    | Successful operation                               |
| 201    | Successful resource creation (upload)              |
| 400    | Invalid request (missing fields, bad input)        |
| 404    | Resource not found (document, session, structure)  |
| 429    | AI provider quota exceeded (rate limited)          |
| 500    | Internal server error                              |
| 502    | Upstream AI provider error                         |
| 503    | AI provider misconfigured                          |

### J.3 Upstream Error Mapping

The chat endpoint maps upstream LLM provider errors to appropriate HTTP responses:

| Error Pattern                      | HTTP Status | Response                                     |
| ---------------------------------- | ----------- | -------------------------------------------- |
| `resource_exhausted` / `429`      | 429         | Quota exceeded with retry delay if available |
| `api key` / `google_api_key`      | 503         | AI provider misconfigured                    |
| Other provider errors              | 502         | Generic upstream error with detail           |

### J.4 Graceful Degradation

The system implements the following degradation strategies:

- **PostgreSQL unavailable:** Backend starts without chat persistence; core document processing and search continue.
- **LLM quota exhausted:** Returns 429 with retry guidance instead of crashing.
- **Document processing failure:** Returns per-file error status without aborting batch uploads.
- **Structure extraction failure:** Logged as warning; upload succeeds without structure data.
- **Resource cleanup:** Best-effort shutdown of connection pools, processors, and vector stores on application termination.
