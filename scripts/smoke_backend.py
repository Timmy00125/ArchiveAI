#!/usr/bin/env python3
"""Backend smoke checks that do not require external services."""

from __future__ import annotations

import compileall
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BACKEND = ROOT / "backend"
SRC = BACKEND / "src"


def require_path(path: Path) -> None:
    if not path.exists():
        raise SystemExit(f"Missing required path: {path.relative_to(ROOT)}")


def require_text(path: Path, needle: str) -> None:
    content = path.read_text(encoding="utf-8")
    if needle not in content:
        raise SystemExit(f"Missing '{needle}' in {path.relative_to(ROOT)}")


def main() -> None:
    for path in [
        SRC / "main.py",
        SRC / "api" / "chat.py",
        SRC / "api" / "documents.py",
        SRC / "api" / "search.py",
        SRC / "api" / "upload.py",
        SRC / "services" / "chat_service.py",
        SRC / "services" / "document_service.py",
        SRC / "vectorstore.py",
        BACKEND / "requirements.txt",
    ]:
        require_path(path)

    if not compileall.compile_dir(str(SRC), quiet=1):
        raise SystemExit("Python compilation failed for backend/src")

    requirements = BACKEND / "requirements.txt"
    require_text(requirements, "numpy<2")
    require_text(requirements, "langchain-postgres")

    main_py = SRC / "main.py"
    require_text(main_py, "app.include_router")
    require_text(main_py, "/api/v1")

    print("Backend smoke checks passed.")


if __name__ == "__main__":
    main()
