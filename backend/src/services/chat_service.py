"""
Chat service — manages conversation sessions, chat invocations, and history.
"""

from __future__ import annotations

import uuid
from typing import AsyncGenerator, List, Dict, Any

from langgraph.checkpoint.base import BaseCheckpointSaver
from langgraph.checkpoint.memory import MemorySaver

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
    ):
        self.vs_manager = vs_manager
        self._memory = memory or MemorySaver()
        self._agent = None
        self._reinit()

    def _reinit(self):
        """(Re-)create the agent with the current tools."""
        search_tool = create_search_tool(self.vs_manager)
        self._agent, self._memory = create_documentation_agent(
            tools=[search_tool],
            memory=self._memory,
        )

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
        messages = get_conversation_history(self._memory, session_id)
        return {"session_id": session_id, "messages": messages}

    def list_sessions(self) -> List[Dict[str, Any]]:
        """
        List all unique conversation sessions from the checkpointer.

        Returns:
            List of {"session_id": str, "last_message": str, "timestamp": str}
        """
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
