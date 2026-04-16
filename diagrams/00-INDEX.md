# Complete Interaction Overview — All Diagrams Index

This file serves as an index of all UML diagrams created for the ArchiveAI project.

## Diagram Catalog

| # | File | Diagram Type | Description |
|---|------|-------------|-------------|
| 01 | [System Overview](./01-system-overview.md) | Component | High-level system architecture showing all subsystems and data flows |
| 02 | [Use Case](./02-use-case.md) | Use Case | All user interactions with the system, with includes/extends relationships |
| 03 | [Document Processing](./03-activity-document-processing.md) | Activity | File upload, validation, Docling conversion, chunking, embedding pipeline |
| 04 | [Chat & RAG Pipeline](./04-activity-chat-rag.md) | Activity | Full chat query flow through the ReAct agent with RAG retrieval |
| 05 | [Semantic Search](./05-activity-semantic-search.md) | Activity | Direct semantic similarity search flow |
| 06 | [Document Upload Sequence](./06-sequence-document-upload.md) | Sequence | Frontend-to-storage interactions during file upload |
| 07 | [Chat Query Sequence](./07-sequence-chat-query.md) | Sequence | Frontend-to-LLM interactions during a chat query |
| 08 | [Document Deletion Sequence](./08-sequence-document-deletion.md) | Sequence | File deletion flow from UI to ChromaDB |
| 09 | [App Startup Sequence](./09-sequence-app-startup.md) | Sequence | Application lifecycle: resource initialization and shutdown |
| 10 | [Backend Class Diagram](./10-class-diagram-backend.md) | Class | Backend service classes, their attributes, methods, and relationships |
| 11 | [Frontend Component Diagram](./11-component-diagram-frontend.md) | Component | React/Next.js component hierarchy and props flow |
| 12 | [Database ER Diagram](./12-er-diagram-database.md) | ER | PostgreSQL schema, ChromaDB collection, LangGraph checkpoint tables |
| 13 | [API Endpoint Map](./13-deployment-api-map.md) | Deployment | All REST API endpoints and their storage dependencies |
| 14 | [RAG Agent State Machine](./14-state-diagram-rag-agent.md) | State | LangGraph ReAct agent internal state transitions |
| 15 | [Graceful Degradation](./15-state-diagram-fallback.md) | State | Fallback handling when PostgreSQL or Gemini API is unavailable |
| 16 | [Design Patterns](./16-design-patterns.md) | Object | Key patterns: DI, Factory, Strategy, Service Layer, SSE Streaming |
| 17 | [Frontend Routing & Layout](./17-frontend-routing-layout.md) | Package | Next.js App Router structure, route groups, and layout nesting |
| 18 | [RAG Data Flow](./18-data-flow-rag-pipeline.md) | Data Flow | Complete pipeline from document ingestion to chat response |
| 19 | [Error Handling](./19-error-handling.md) | Activity | Error detection, mapping to HTTP status codes, and client handling |
| 20 | [Configuration Flow](./20-configuration-flow.md) | Object | Environment variables → Settings → all consuming components |
| 21 | [Deployment Infrastructure](./21-deployment-infrastructure.md) | Deployment | Physical architecture: Docker, ports, volumes, external services |
| 22 | [Tech Stack](./22-tech-stack.md) | Package | All technologies and their dependency relationships |
| 23 | [Chat Session Lifecycle](./23-chat-session-lifecycle.md) | State | Chat session from creation through idle to deletion |
| 24 | [Frontend State Management](./24-frontend-state-management.md) | Activity | React local state patterns in ChatArea, DocumentTable, SearchUI, Sidebar |
| 25 | [Directory Structure](./25-directory-structure.md) | Package | Complete project file tree with purpose annotations |
| 26 | [Context Upload Sequence](./26-sequence-context-upload.md) | Sequence | Non-indexed document context upload for in-chat use |
| 27 | [SSE Streaming](./27-sequence-sse-streaming.md) | Sequence | Server-Sent Events streaming architecture |
| 28 | [Structure Visualization](./28-sequence-structure-visualization.md) | Sequence | Document structure extraction and display flow |
| 29 | [Embedding & Search](./29-sequence-embedding-search.md) | Sequence | Internal mechanics of query embedding and ChromaDB similarity search |

## Diagram Types Used

- **Component Diagrams** — System decomposition and subsystem relationships
- **Use Case Diagrams** — Actor-system interactions
- **Activity Diagrams** — Workflow and process flows
- **Sequence Diagrams** — Time-ordered interactions between components
- **Class Diagrams** — Object structure, attributes, methods, and relationships
- **ER Diagrams** — Database schema and entity relationships
- **State Diagrams** — Object lifecycle and state transitions
- **Package Diagrams** — Module grouping and dependencies
- **Deployment Diagrams** — Physical infrastructure and node allocation
- **Data Flow Diagrams** — Information transformation through pipeline stages

## How to Render

All diagrams use **Mermaid.js** syntax. You can render them using:

1. **VS Code** — Install the "Mermaid Preview" extension
2. **GitHub** — Mermaid renders natively in `.md` files in repositories
3. **Online** — [mermaid.live](https://mermaid.live) editor
4. **CLI** — `mmdc` (mermaid-cli) to export as SVG/PNG:
   ```bash
   npx @mermaid-js/mermaid-cli input.md -o output.svg
   ```
