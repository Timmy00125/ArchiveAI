# PlantUML Diagrams - ArchiveAI

PlantUML source code for all UML diagrams in the ArchiveAI project. Each diagram is wrapped in `@startuml` / `enduml` blocks so you can copy-paste each block directly into the [PlantUML online server](https://www.plantuml.com/plantuml/uml/) for rendering.

## Diagram Catalog

| # | File | Diagram Type | Diagrams | Source |
|---|------|-------------|----------|--------|
| 01 | [Use Case](./01-use-case.md) | Use Case | 1 | `diagrams/02-use-case.md` |
| 02 | [Activity Diagrams](./02-activity-diagrams.md) | Activity | 4 | `diagrams/03`, `04`, `05` |
| 03 | [Sequence Diagrams](./03-sequence-diagrams.md) | Sequence | 8 | `diagrams/06`-`09`, `26`-`29` |
| 04 | [State Machine Diagrams](./04-state-machine-diagrams.md) | State Machine | 3 | `diagrams/14`, `15`, `23` |
| 05 | [Class Diagram](./05-class-diagram.md) | Class | 1 | `diagrams/10` |
| 06 | [Collaboration Diagrams](./06-collaboration-diagram.md) | Collaboration | 5 | `diagrams/30` |

**Total: 22 PlantUML diagrams** across 6 files.

> **Verified**: All 22 diagrams have been syntactically validated and render successfully with PlantUML. Each `@startuml` / `enduml` block is self-contained and can be pasted directly into the [online server](https://www.plantuml.com/plantuml/uml/).

## How to Render

### Option 1 - Online (Easiest)

1. Open [plantuml.com online server](https://www.plantuml.com/plantuml/uml/)
2. Copy any `@startuml ... @enduml` block from these files
3. Paste it into the text area
4. The diagram renders automatically

### Option 2 - VS Code

1. Install the "PlantUML" extension by Jebbs
2. Open any `.md` file in this directory
3. Press `Alt+D` (or `Option+D` on Mac) to preview the diagram

### Option 3 - CLI

```bash
# Install PlantUML (requires Java)
# Render a single diagram to PNG
plantuml -tpng 01-use-case.md

# Render all diagrams in a file to SVG
plantuml -tsvg 03-sequence-diagrams.md

# Render all files in the directory
plantuml -tpng *.md
```

### Option 4 - GitHub Rendering

Install the [PlantUML for GitHub](https://github.com/plantuml/plantuml-for-github) browser extension to render these diagrams inline on GitHub.

### Option 5 - Local Batch Render (Project Script)

All 22 diagrams have been pre-rendered into [`images/`](./images/) (PNG + SVG) using the bundled script and PlantUML jar. Re-render at any time:

```bash
# from repo root - requires Java (JDK 11+) and tools/plantuml.jar (already committed)
python3 tools/render_plantuml.py
```

- Script: [`tools/render_plantuml.py`](../tools/render_plantuml.py)
- PlantUML jar: [`tools/plantuml.jar`](../tools/plantuml.jar) (v1.2026.6)
- Output: `plantuml_diagrams/images/<source-file-stem>--<header-slug>.{png,svg}`
- Each `@startuml ... @enduml` block is named after its nearest preceding `##` / `###` header in the source markdown, so filenames map directly to diagram titles.
- 44 files total: 22 PNG + 22 SVG. Verified PNG signatures and SVG element counts.

## Diagram Types

### Use Case Diagram (`01-use-case.md`)
Shows all actors and their interactions with the ArchiveAI system. Includes 17 use cases with `<<include>>` and `<<extend>>` relationships. Uses `left to right direction` for better readability.

### Activity Diagrams (`02-activity-diagrams.md`)
Three activity diagrams showing workflow flows:
1. **Document Processing (Main Flow)** - File upload, validation, Docling conversion, chunking, embedding, and indexing
2. **Document Processing (Context Upload)** - Non-indexed document context upload for in-chat use
3. **Chat & RAG Pipeline** - Full chat query flow through the ReAct agent with RAG retrieval
4. **Semantic Search** - Direct semantic similarity search flow

### Sequence Diagrams (`03-sequence-diagrams.md`)
Eight sequence diagrams showing time-ordered interactions:
1. **Document Upload** - Frontend-to-storage interactions during file upload
2. **Chat Query** - Frontend-to-LLM interactions during a chat query
3. **Document Deletion** - File deletion flow from UI to ChromaDB
4. **App Startup** - Application lifecycle: resource initialization and shutdown
5. **Context Upload** - Non-indexed document context upload for in-chat use
6. **SSE Streaming** - Server-Sent Events streaming architecture
7. **Structure Visualization** - Document structure extraction and display flow
8. **Embedding & Search** - Internal mechanics of query embedding and ChromaDB similarity search

All sequence diagrams use `box` grouping for Frontend/Backend/Storage layers and `alt`/`loop` frames for conditional and iterative behavior.

### State Machine Diagrams (`04-state-machine-diagrams.md`)
Three state diagrams showing object lifecycles:
1. **RAG Agent** - LangGraph ReAct agent's internal state transitions during query processing
2. **Graceful Degradation** - Fallback handling when PostgreSQL or Gemini API is unavailable (uses composite states for Startup and Running phases)
3. **Chat Session Lifecycle** - Chat session from creation through idle to deletion

### Class Diagram (`05-class-diagram.md`)
Backend class diagram showing 8 service classes with their attributes, methods, visibility modifiers, stereotypes (`<<module>>`, `<<factory function>>`), and relationships (dependency, configuration). Includes the `Settings` configuration class that all services depend on.

### Collaboration Diagrams (`06-collaboration-diagram.md`)
Five collaboration diagrams showing structural organization of components and sequenced messages:
1. **Document Upload** (29 messages)
2. **Chat Query with RAG** (32 messages)
3. **Document Deletion** (16 messages)
4. **Semantic Search** (12 messages)
5. **App Startup** (10 messages, dotted lines for background init)

> **Note**: PlantUML does not have a native "collaboration/communication diagram" type. These use object/instance notation with numbered message labels on graph-styled links, which visually matches a UML collaboration diagram.

## PlantUML Syntax Notes

- Each diagram is self-contained between `@startuml` and `@enduml`
- `box "Name" #Color ... end box` groups participants in sequence diagrams
- `alt/else/end` creates conditional frames in sequence diagrams
- `loop/end` creates iteration frames
- `note over X: text` adds notes to sequence diagrams
- `state X { ... }` creates composite states in state machine diagrams
- `<<stereotype>>` adds stereotypes to classes and use cases
- `-->` solid arrow (dependency/synchronous), `..>` dotted arrow (dependency/configuration)
- `+` public, `-` private, `#` protected, `~` package private (class member visibility)

## Source Diagrams

These PlantUML diagrams are conversions of the Mermaid.js diagrams in the [`diagrams/`](../diagrams/) directory. The original diagrams use Mermaid syntax; these use PlantUML syntax for native UML rendering. See [`diagrams/00-INDEX.md`](../diagrams/00-INDEX.md) for the complete catalog of source diagrams.
