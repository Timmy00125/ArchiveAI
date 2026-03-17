## Plan: Document Intelligence Frontend Build

The goal is to build a beautiful, modern Next.js frontend that fully integrates with the Python FastAPI backend (Chat, Document Upload, Search). We will use a standard sidebar-layout (shadcn's new sidebar) to navigate between Chat, Documents, and Search.

**Phase 1: Setup & Dependencies**

1. Install required shadcn components: `sidebar`, `input`, `textarea`, `card`, `dialog`, `sonner`, `scroll-area`, `avatar`, `separator`, `skeleton`, `table`.
2. Setup basic API client utility (`lib/api.ts`) with typed fetch functions pointing to `http://localhost:8000/api/v1`.

**Phase 2: Layout & Navigation**

1. Implement `app/layout.tsx` with a global `SidebarProvider` and a `Toaster` for notifications.
2. Build `components/app-sidebar.tsx` containing links to Chat, Documents, and Search, plus a clean minimal logo.

**Phase 3: Chat Interface (Main functionality)**

1. **Pages**: `app/page.tsx` (New Chat) and `app/chat/[sessionId]/page.tsx` (Existing Chat).
2. **Components**: `ChatArea` (handles real-time streaming or standard POST `/query`), `MessageBubble` (renders AI markdown and user text), `ChatInput` (expanding textarea + upload context button).
3. Connect `/api/v1/chat/history` to load past messages and `/api/v1/chat/sessions` for deletion.

**Phase 4: Document Management**

1. **Page**: `app/documents/page.tsx`.
2. Create a `DocumentUpload` dropzone connecting to `POST /upload`.
3. Create a Document Table fetching from `GET /documents`, with actions to view structure (`GET /{filename}/structure`) and delete (`DELETE /documents`).

**Phase 5: Semantic Search**

1. **Page**: `app/search/page.tsx`.
2. A search input querying `POST /search` and displaying vector similarity results in cards.

**Relevant files**

- `frontend/lib/api.ts` — API client integration.
- `frontend/components/app-sidebar.tsx` — Main navigation and layout.
- `frontend/app/page.tsx` — Default entry point (Chat).
- `frontend/app/documents/page.tsx` — Knowledge base manager.

**Verification**

1. Verify document upload correctly indexes into ChromaDB via API.
2. Verify chat streams tokens (if streamed) or returns accurate RAG responses.
3. Validate session history retention and sidebar navigation.
