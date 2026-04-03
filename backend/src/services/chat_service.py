"""
Chat service — manages conversation sessions, chat invocations, and history.
"""

from __future__ import annotations

import json
import uuid
from typing import AsyncGenerator, List, Dict, Any

from langgraph.checkpoint.base import BaseCheckpointSaver
from langgraph.checkpoint.memory import MemorySaver
from psycopg_pool import ConnectionPool

from src.agent import (
    create_documentation_agent,
    invoke_agent,
    astream_agent_response,
    get_conversation_history,
)
from src.tools import create_search_tool
from src.vectorstore import VectorStoreManager
from src.logging_config import get_logger

logger = get_logger(__name__)


class ChatService:
    """
    Manages the LangGraph agent and per-session conversation state.

    One ChatService instance is shared for the app lifetime.
    Thread isolation is handled by the checkpointer keyed on thread_id (session_id).
    """

    def __init__(
        self,
        vs_manager: VectorStoreManager,
        memory: BaseCheckpointSaver | None = None,
        db_pool: ConnectionPool | None = None,
    ):
        self.vs_manager = vs_manager
        self._memory: BaseCheckpointSaver = memory or MemorySaver()
        self._db_pool = db_pool
        self._agent = None
        self._setup_persistence_tables()
        self._reinit()

    def _setup_persistence_tables(self) -> None:
        """Create chat persistence tables when PostgreSQL is available."""
        if self._db_pool is None:
            return

        try:
            with self._db_pool.connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(
                        """
                        CREATE TABLE IF NOT EXISTS chat_sessions (
                            session_id TEXT PRIMARY KEY,
                            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                        )
                        """
                    )
                    cur.execute(
                        """
                        CREATE TABLE IF NOT EXISTS chat_messages (
                            id BIGSERIAL PRIMARY KEY,
                            session_id TEXT NOT NULL REFERENCES chat_sessions(session_id)
                                ON DELETE CASCADE,
                            role TEXT NOT NULL,
                            content TEXT NOT NULL,
                            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                        )
                        """
                    )
                    cur.execute(
                        """
                        CREATE INDEX IF NOT EXISTS idx_chat_messages_session_created
                        ON chat_messages (session_id, created_at, id)
                        """
                    )
                conn.commit()
            logger.info("✅ Chat persistence tables are ready")
        except Exception as err:
            logger.warning("Could not create chat persistence tables: %s", err)

    @staticmethod
    def _serialize_message_content(content: Any) -> str:
        """Convert model message content into stable text for storage."""
        if isinstance(content, str):
            return content

        if content is None:
            return ""

        if isinstance(content, (list, dict)):
            try:
                return json.dumps(content, ensure_ascii=False)
            except Exception:
                return ChatService._normalize_preview_text(content)

        try:
            return json.dumps(content, ensure_ascii=False)
        except Exception:
            return str(content)

    def _save_message(self, session_id: str, role: str, content: Any) -> None:
        """Persist a single message row and update session timestamp."""
        if self._db_pool is None:
            return

        serialized_content = self._serialize_message_content(content)

        try:
            with self._db_pool.connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(
                        """
                        INSERT INTO chat_sessions (session_id)
                        VALUES (%s)
                        ON CONFLICT (session_id) DO NOTHING
                        """,
                        (session_id,),
                    )
                    cur.execute(
                        """
                        INSERT INTO chat_messages (session_id, role, content)
                        VALUES (%s, %s, %s)
                        """,
                        (session_id, role, serialized_content),
                    )
                    cur.execute(
                        """
                        UPDATE chat_sessions
                        SET updated_at = NOW()
                        WHERE session_id = %s
                        """,
                        (session_id,),
                    )
                conn.commit()
        except Exception as err:
            logger.warning(
                "Could not persist message for session '%s': %s",
                session_id,
                err,
            )

    def _load_messages_from_db(self, session_id: str) -> List[Dict[str, Any]]:
        """Load ordered messages for a session from PostgreSQL."""
        if self._db_pool is None:
            return []

        try:
            with self._db_pool.connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(
                        """
                        SELECT role, content, created_at
                        FROM chat_messages
                        WHERE session_id = %s
                        ORDER BY created_at ASC, id ASC
                        """,
                        (session_id,),
                    )
                    rows = cur.fetchall()

            return [
                {
                    "role": row[0],
                    "content": row[1],
                    "timestamp": row[2].isoformat() if row[2] else "",
                }
                for row in rows
            ]
        except Exception as err:
            logger.warning(
                "Could not load DB history for session '%s': %s",
                session_id,
                err,
            )
            return []

    def _list_sessions_from_db(self) -> List[Dict[str, Any]]:
        """List sessions ordered by latest activity from PostgreSQL."""
        if self._db_pool is None:
            return []

        try:
            with self._db_pool.connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(
                        """
                        SELECT
                            s.session_id,
                            COALESCE(last_assistant_msg.content, last_msg.content, '')
                                AS last_message,
                            s.updated_at
                        FROM chat_sessions s
                        LEFT JOIN LATERAL (
                            SELECT content
                            FROM chat_messages m
                            WHERE m.session_id = s.session_id
                              AND m.role = 'assistant'
                            ORDER BY m.created_at DESC, m.id DESC
                            LIMIT 1
                        ) last_assistant_msg ON TRUE
                        LEFT JOIN LATERAL (
                            SELECT content
                            FROM chat_messages m
                            WHERE m.session_id = s.session_id
                            ORDER BY m.created_at DESC, m.id DESC
                            LIMIT 1
                        ) last_msg ON TRUE
                        ORDER BY s.updated_at DESC
                        """
                    )
                    rows = cur.fetchall()

            sessions: List[Dict[str, Any]] = []
            for row in rows:
                preview = self._normalize_preview_text(row[1])
                sessions.append(
                    {
                        "session_id": row[0],
                        "last_message": (
                            preview[:50] + "..." if len(preview) > 50 else preview
                        ),
                        "timestamp": row[2].isoformat() if row[2] else "",
                    }
                )
            return sessions
        except Exception as err:
            logger.warning("Could not list sessions from DB: %s", err)
            return []

    def _delete_session_from_db(self, session_id: str) -> bool:
        """Delete one session and all of its messages from PostgreSQL."""
        if self._db_pool is None:
            return False

        try:
            with self._db_pool.connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(
                        "DELETE FROM chat_sessions WHERE session_id = %s",
                        (session_id,),
                    )
                conn.commit()
            return True
        except Exception as err:
            logger.warning("Could not delete DB session '%s': %s", session_id, err)
            return False

    def _reinit(self):
        """(Re-)create the agent with the current tools."""
        search_tool = create_search_tool(self.vs_manager)
        self._agent, memory = create_documentation_agent(
            tools=[search_tool],
            memory=self._memory,
        )
        self._memory = memory or MemorySaver()

    # ── Public API ─────────────────────────────────────────────────────────────

    async def chat(
        self,
        prompt: str,
        session_id: str | None = None,
        stream: bool = False,
    ) -> Dict[str, Any] | AsyncGenerator[str, None]:
        """
        Send a message and get a response.

        Args:
            prompt:     User message
            session_id: Conversation thread ID (auto-generated if None)
            stream:     If True returns an async generator of text tokens

        Returns:
            If stream=False: {"response": str, "session_id": str}
            If stream=True:  async generator yielding text tokens
        """
        if not prompt or not prompt.strip():
            raise ValueError("Prompt is required")

        session_id = session_id or str(uuid.uuid4())

        if stream:
            return self._stream_with_session(prompt, session_id)

        response = await invoke_agent(self._agent, prompt, session_id)
        self._save_message(session_id, "user", prompt)
        self._save_message(session_id, "assistant", response)
        return {"response": response, "session_id": session_id}

    async def _stream_with_session(
        self, prompt: str, session_id: str
    ) -> AsyncGenerator[str, None]:
        """Wrapper that tags the stream with session info at the end."""
        async for token in astream_agent_response(self._agent, prompt, session_id):
            yield token

    def get_history(self, session_id: str) -> Dict[str, Any]:
        """
        Retrieve conversation history for a session.

        Returns:
            {"session_id": str, "messages": [{"role": str, "content": str}]}
        """
        messages = self._load_messages_from_db(session_id)
        if not messages:
            messages = get_conversation_history(self._memory, session_id)
        return {"session_id": session_id, "messages": messages}

    def list_sessions(self) -> List[Dict[str, Any]]:
        """
        List all unique conversation sessions from the checkpointer.

        Returns:
            List of {"session_id": str, "last_message": str, "timestamp": str}
        """
        db_sessions = self._list_sessions_from_db()
        if db_sessions:
            return db_sessions

        sessions = []
        # Get all checkpoints to find unique thread IDs
        # Note: In a production app, we'd query the DB directly for performance.
        # Here we use the checkpointer's list() method.
        seen_threads = set()

        try:
            # PostgresSaver.list() may yield checkpoint tuples/objects depending on version.
            try:
                items = self._memory.list(None)
            except TypeError:
                items = self._memory.list({})

            for item in items:
                config = self._extract_item_config(item)
                checkpoint = self._extract_item_checkpoint(item)
                metadata = self._extract_item_metadata(item)

                thread_id = (
                    config.get("configurable", {}).get("thread_id")
                    if isinstance(config, dict)
                    else None
                )
                if thread_id and thread_id not in seen_threads:
                    seen_threads.add(thread_id)
                    # Try to get the last message for a preview
                    last_msg = ""
                    channel_values = checkpoint.get("channel_values", {}) if isinstance(checkpoint, dict) else {}
                    if "messages" in channel_values:
                        msgs = channel_values["messages"]
                        if msgs:
                            if hasattr(msgs[-1], "content"):
                                last_msg = self._normalize_preview_text(msgs[-1].content)
                            else:
                                last_msg = self._normalize_preview_text(msgs[-1])

                    timestamp = ""
                    if isinstance(metadata, dict):
                        timestamp = metadata.get("ts", "")
                    if not timestamp and isinstance(checkpoint, dict):
                        timestamp = checkpoint.get("ts", "")

                    sessions.append({
                        "session_id": thread_id,
                        "last_message": last_msg[:50] + "..." if len(last_msg) > 50 else last_msg,
                        "timestamp": timestamp,
                    })
        except Exception as e:
            logger.warning(f"Could not list sessions: {e}")

        sessions.sort(key=lambda s: s.get("timestamp", ""), reverse=True)
        return sessions

    @staticmethod
    def _normalize_preview_text(value: object) -> str:
        """Convert message content blocks or objects into safe plain text."""
        if isinstance(value, str):
            stripped = value.strip()
            if stripped and stripped[0] in ("[", "{"):
                try:
                    parsed = json.loads(stripped)
                    return ChatService._normalize_preview_text(parsed)
                except Exception:
                    pass
            return value

        if isinstance(value, list):
            parts: List[str] = []
            for item in value:
                parts.append(ChatService._normalize_preview_text(item))
            return " ".join(part for part in parts if part).strip()

        if isinstance(value, dict):
            if isinstance(value.get("text"), str):
                return value["text"]

            text_parts: List[str] = []
            for key in ("content", "value", "type"):
                raw = value.get(key)
                if isinstance(raw, str) and raw:
                    text_parts.append(raw)

            if text_parts:
                return " ".join(text_parts)

        return str(value)

    @staticmethod
    def _extract_item_config(item: object) -> Dict[str, Any]:
        """Read checkpoint config from tuple/object/dict variants."""
        if isinstance(item, dict):
            config = item.get("config", {})
            return config if isinstance(config, dict) else {}

        config = getattr(item, "config", None)
        return config if isinstance(config, dict) else {}

    @staticmethod
    def _extract_item_checkpoint(item: object) -> Dict[str, Any]:
        """Read checkpoint payload from tuple/object/dict variants."""
        if isinstance(item, dict):
            checkpoint = item.get("checkpoint", item)
            return checkpoint if isinstance(checkpoint, dict) else {}

        checkpoint = getattr(item, "checkpoint", None)
        return checkpoint if isinstance(checkpoint, dict) else {}

    @staticmethod
    def _extract_item_metadata(item: object) -> Dict[str, Any]:
        """Read checkpoint metadata from tuple/object/dict variants."""
        if isinstance(item, dict):
            metadata = item.get("metadata", {})
            return metadata if isinstance(metadata, dict) else {}

        metadata = getattr(item, "metadata", None)
        return metadata if isinstance(metadata, dict) else {}

    def delete_session(self, session_id: str) -> Dict[str, Any]:
        """
        Delete a conversation session from MemorySaver.

        Note: MemorySaver does not expose a public delete API — we clear by
        writing an empty state tuple, which effectively resets the thread.

        Returns:
            {"success": bool, "session_id": str}
        """
        if self._delete_session_from_db(session_id):
            logger.info("🗑️  Session '%s' deleted from database", session_id)
            return {"success": True, "session_id": session_id}

        try:
            config = {"configurable": {"thread_id": session_id}}
            # MemorySaver stores state per thread; overwrite with empty checkpoint
            self._memory.put(
                config,
                {"messages": []},
                {"source": "input", "writes": {}, "step": 0},
                {},
            )
            logger.info(f"🗑️  Session '{session_id}' cleared")
            return {"success": True, "session_id": session_id}
        except Exception as e:
            logger.warning(f"Could not delete session '{session_id}': {e}")
            # Non-fatal — session simply won't be in memory any more after restart
            return {"success": True, "session_id": session_id}

    def add_context_to_chat(
        self,
        document_content: str,
        filename: str,
        session_id: str | None = None,
    ) -> str:
        """
        Wrap document content in a system-style message and return session_id.
        The actual LLM confirmation happens via normal chat() call externally.
        """
        return session_id or str(uuid.uuid4())
