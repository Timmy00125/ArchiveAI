# Infrastructure & Deployment — Deployment Diagram

Shows the physical deployment architecture with Docker, ports, and data flows.

```mermaid
graph TB
    subgraph DeveloperMachine["Developer Machine"]
        subgraph FrontendContainer["Frontend Process"]
            NextDev["pnpm dev<br/>Next.js 16 :3000"]
            NodeModules["node_modules/"]
            AppDir["app/ directory<br/>App Router pages"]
            ComponentsDir["components/ directory"]
        end

        subgraph BackendContainer["Backend Process"]
            UvicornDev["uvicorn app:app<br/>--reload --port 8000"]
            Venv["Python venv<br/>requirements.txt"]
            SrcDir["src/ directory<br/>services, api, core"]
            ChromaData["./chroma_db/<br/>Persistent ChromaDB<br/>SQLite + Parquet files"]
            TempDir["/tmp/<br/>Upload temp files"]
        end

        subgraph DockerServices["Docker Compose"]
            PGContainer["postgres:16-alpine<br/>Container: archiveai-postgres"]
            PGPort[":5433 → :5432"]
            PGVolume["postgres_data<br/>Named Docker Volume"]
            PGData["/var/lib/postgresql/data<br/>chat_sessions, chat_messages<br/>LangGraph checkpoints"]
        end
    end

    subgraph ExternalServices["External Services"]
        GeminiCloud["Google Gemini API<br/>generativelanguage.googleapis.com<br/>gemini-2.5-flash<br/>gemini-embedding-001"]
    end

    NextDev -->|"fetch /api/v1/*"| UvicornDev
    UvicornDev -->|"SQL queries"| PGPort
    PGPort --> PGContainer
    PGContainer --> PGVolume
    PGVolume --> PGData

    UvicornDev -->|"Embed + Chat API"| GeminiCloud
    UvicornDev -->|"Read/Write vectors"| ChromaData
    UvicornDev -->|"Temp file I/O"| TempDir

    style DeveloperMachine fill:#1a1a2e,stroke:#e94560,color:#f0f0ec
    style FrontendContainer fill:#16213e,stroke:#0f3460,color:#f0f0ec
    style BackendContainer fill:#1a1a2e,stroke:#533483,color:#f0f0ec
    style DockerServices fill:#0a0a0a,stroke:#2d6a4f,color:#f0f0ec
    style ExternalServices fill:#1a1a2e,stroke:#e94560,color:#f0f0ec
```

## Startup Commands

| Service | Command | Directory |
|---------|---------|-----------|
| PostgreSQL | `docker compose up postgres` | Project root |
| Backend | `uvicorn app:app --reload --port 8000` | `backend/` |
| Frontend | `pnpm dev` | `frontend/` |

## Port Mapping

| Service | Internal Port | External Port | Protocol |
|---------|--------------|---------------|----------|
| Frontend | 3000 | 3000 | HTTP |
| Backend | 8000 | 8000 | HTTP |
| PostgreSQL | 5432 | 5433 | TCP |
