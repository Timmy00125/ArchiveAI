# AGENTS.md

## Project layout

- `backend/` — Python FastAPI API (Docling + LangGraph + Gemini + pgvector)
- `frontend/` — Next.js 16 / React 19 / pnpm / shadcn-ui / Tailwind v4 / Zustand
- `docker-compose.yml` — PostgreSQL 16 with pgvector for local dev
- `docs/` — thesis chapters (prose, not code)

## Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn src.main:app --reload --port 8000
```

- Entrypoint: `src.main:app`
- Config: `backend/.env` (copy from `.env.example`)
- API prefix: `/api/v1` — health: `/health` — Swagger: `/docs`
- Local Postgres port is **5433** (Docker maps 5433→5432). Use 5432 only for Cloud SQL.
- Start Postgres before the backend: `docker compose up -d`
- Backend creates `data/uploads`, `data/markdown`, `data/structures` — these must exist or be created at startup.
- pgvector extension must be enabled (`CREATE EXTENSION IF NOT EXISTS vector`) — the Docker init script handles this.
- `numpy<2` is pinned for compatibility. Don't remove the cap.
- No test suite or linter configured for backend.

## Frontend

```bash
cd frontend
pnpm install
pnpm dev        # http://localhost:3000
pnpm build      # production build
pnpm lint       # ESLint (eslint-config-next)
```

- Package manager: **pnpm** (lockfile present)
- API base URL: `NEXT_PUBLIC_API_URL` env var, defaults to `http://localhost:8000/api/v1`
- Path alias: `@/*` maps to `./*` (configured in tsconfig.json)
- UI components: shadcn/ui (config in `components.json`, components in `components/ui/`)
- State management: Zustand (`lib/store.ts`)
- API client: `lib/api.ts` (`fetchApi` / `fetchApiRaw`)
- No test suite configured for frontend.

## Conventions

- Backend routers live in `src/api/` (chat, documents, upload, search)
- Backend services live in `src/services/` (chat_service, document_service)
- Frontend routes use Next.js App Router under `app/(app)/` (chat, documents, search, settings)
- Frontend hooks in `hooks/`, feature components in `components/{chat,documents,search,landing}/`
