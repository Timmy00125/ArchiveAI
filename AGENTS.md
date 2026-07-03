# AGENTS.md

## Repo Boundaries

- `backend/` is the FastAPI app; the real entrypoint is `backend/src/main.py` (`uvicorn src.main:app --reload --port 8000`).
- `frontend/` is the only JS package. There is no root workspace config, so run `pnpm` commands inside `frontend/`.
- `scripts/smoke_backend.py` is the only automated backend check wired into CI.
- `docs/`, `diagrams/`, and `plantuml_diagrams/` are thesis/design material, not runtime source of truth.

## Verified Commands

- Local Postgres: `docker compose up -d` from repo root. Docker exposes Postgres on host `5433`; `5432` is for Cloud SQL / non-Docker setups.
- Backend setup: `cd backend && python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt`
- Backend run: `cd backend && uvicorn src.main:app --reload --port 8000`
- Backend verification: `python scripts/smoke_backend.py` from repo root. CI runs this on Python 3.11; it checks file presence, Python compilation under `backend/src`, router wiring, and pinned requirements.
- Frontend setup: `cd frontend && corepack enable && pnpm install --frozen-lockfile` to match CI.
- Frontend verification: `cd frontend && pnpm lint` then `cd frontend && NEXT_TELEMETRY_DISABLED=1 CI=1 pnpm build`. There is no separate test or typecheck script.

## Backend Gotchas

- Runtime config is defined in `backend/src/config.py`, not `backend/.env.example`. The code uses Vertex AI env vars such as `GOOGLE_CLOUD_PROJECT`, `GOOGLE_CLOUD_LOCATION`, `GEMINI_MODEL`, and `GEMINI_EMBED_MODEL`.
- `backend/.env.example` is stale for AI config because it still points at `GOOGLE_API_KEY`. Use `backend/.env.production` or `backend/src/config.py` as the accurate template.
- Missing `GOOGLE_CLOUD_PROJECT` still breaks startup: `ChatService` creates the LangGraph/Vertex agent during app init even though `main.py` only logs a warning first.
- `DATABASE_URL` overrides the individual `POSTGRES_*` vars and is also reused to derive the SQLAlchemy `postgresql+psycopg2://` URI for pgvector.
- Keep `numpy<2` in `backend/requirements.txt`; CI smoke checks assert that pin.
- Routers live in `backend/src/api/{chat,documents,search,upload}.py` and are all mounted under `/api/v1` in `backend/src/main.py`.
- Upload/index writes three persisted artifacts: original files in `data/uploads`, extracted markdown in `data/markdown`, and structure JSON in `data/structures`. Deleting a document removes all three plus its pgvector rows.
- `POST /api/v1/upload` indexes documents; `POST /api/v1/upload/context` only extracts text for a chat session and does not index it.
- Chat streaming uses Server-Sent Events from `POST /api/v1/chat/query` when `stream: true`; the frontend expects `data: ...` lines and a terminating `data: [DONE]`.

## Frontend Wiring

- `frontend/app/page.tsx` is the marketing landing page. The real application shell is `frontend/app/(app)`, which provides the sidebar, offline banner, and keyboard shortcuts.
- Shared API access lives in `frontend/lib/api.ts`; `NEXT_PUBLIC_API_URL` defaults to `http://localhost:8000/api/v1`.
- Global client state lives in `frontend/lib/store.ts` (Zustand).
- TypeScript path alias `@/*` maps to `frontend/*` via `frontend/tsconfig.json`.
- shadcn CLI config is in `frontend/components.json` with `style: radix-nova`, aliases rooted at `@/`, and `app/globals.css` as the CSS entrypoint.
