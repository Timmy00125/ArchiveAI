"""
LangGraph agent configuration — Gemini-powered, async streaming, multi-session.
"""

from __future__ import annotations

from typing import Any, AsyncGenerator, Dict, List

from langchain_core.messages import BaseMessage, HumanMessage
from langchain_core.tools import BaseTool
from langchain_google_vertexai import ChatVertexAI
from langgraph.prebuilt import create_react_agent

from src.config import settings
from src.logging_config import get_logger

logger = get_logger(__name__)


def _extract_text(content: Any) -> str:
    """Normalize LLM message content (string or list of blocks) into text."""
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts: list[str] = []
        for block in content:
            if isinstance(block, str):
                parts.append(block)
            elif isinstance(block, dict):
                text = block.get("text", "")
                if isinstance(text, str) and text:
                    parts.append(text)
        return "".join(parts)
    return ""

SYSTEM_PROMPT = """\
You are a helpful document intelligence assistant. You have access to documents \
that have been uploaded and processed (PDFs, Word documents, presentations, HTML files, etc.).

GUIDELINES:
- Use the search_documents tool to find specific information within documents.
- Use the summarize_document tool to get a high-level overview or full summary of a specific file.
- Use the analyze_image_document tool to visually inspect a document if standard search fails, especially for charts, diagrams, or complex visual layouts.
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
"""


def create_documentation_agent(
    tools: List[BaseTool],
    model_name: str | None = None,
    checkpointer: Any | None = None,
):
    """
    Create a document intelligence assistant agent using LangGraph.

    Args:
        tools:        List of tools the agent can use
        model_name:   Gemini model name (defaults to settings.GEMINI_MODEL)
        checkpointer: Optional LangGraph checkpointer for multi-turn memory

    Returns:
        Compiled LangGraph agent
    """
    model_name = model_name or settings.GEMINI_MODEL
    if not settings.GOOGLE_CLOUD_PROJECT:
        raise ValueError("GOOGLE_CLOUD_PROJECT is not configured")

    llm = ChatVertexAI(
        model_name=model_name,
        temperature=0,
        project=settings.GOOGLE_CLOUD_PROJECT,
        location=settings.GOOGLE_CLOUD_LOCATION,
    )

    agent = create_react_agent(
        llm, tools=tools, prompt=SYSTEM_PROMPT, checkpointer=checkpointer
    )
    return agent


async def astream_agent_response(
    agent,
    prompt: str,
    thread_id: str,
) -> AsyncGenerator[str, None]:
    """
    Stream LLM tokens from the agent as an async generator.

    Only yields tokens from the 'agent' node (the actual LLM response),
    skipping tool-call outputs.

    Args:
        agent:     Compiled LangGraph agent
        prompt:    User's question
        thread_id: Session/conversation identifier

    Yields:
        Text token strings
    """
    config = {"configurable": {"thread_id": thread_id}}
    messages = [HumanMessage(content=prompt)]

    try:
        async for msg, metadata in agent.astream(
            {"messages": messages},
            config=config,
            stream_mode="messages",
        ):
            node = metadata.get("langgraph_node", "")
            if "agent" in node.lower() and hasattr(msg, "content") and msg.content:
                text = _extract_text(msg.content)
                if text:
                    yield text
    except Exception as e:
        logger.exception("Agent streaming error (thread=%s)", thread_id)
        message = str(e).strip() or e.__class__.__name__
        yield f"\n\n⚠️ Error generating response: {message}"


async def invoke_agent(
    agent,
    prompt: str,
    thread_id: str,
) -> Any:
    """
    Invoke the agent and return the complete response as a string.

    Args:
        agent:     Compiled LangGraph agent
        prompt:    User's question
        thread_id: Session identifier

    Returns:
        Full assistant response text
    """
    config = {"configurable": {"thread_id": thread_id}}
    messages = [HumanMessage(content=prompt)]

    try:
        result: Dict[str, Any] = await agent.ainvoke(
            {"messages": messages},
            config=config,
        )

        # The last message in the output is the assistant reply.
        output_messages: List[BaseMessage] = result.get("messages", [])
        for msg in reversed(output_messages):
            if hasattr(msg, "content") and msg.content and msg.type == "ai":
                text = _extract_text(msg.content)
                if text:
                    return text
        return ""
    except Exception as e:
        logger.exception("Agent invoke error (thread=%s)", thread_id)
        detail = str(e).strip() or e.__class__.__name__
        raise RuntimeError(detail) from e


def _extract_checkpoint_dict(state: object) -> dict:
    """Normalize saver return shapes into a checkpoint dictionary."""
    if state is None:
        return {}

    if isinstance(state, dict):
        if "channel_values" in state:
            return state
        checkpoint = state.get("checkpoint")
        if isinstance(checkpoint, dict):
            return checkpoint
        return state

    checkpoint = getattr(state, "checkpoint", None)
    if isinstance(checkpoint, dict):
        return checkpoint

    return {}


def get_conversation_history(memory: BaseCheckpointSaver, thread_id: str) -> List[dict]:
    """
    Extract conversation messages from checkpointer for a given thread.

    Returns a list of {"role": "user"|"assistant", "content": str} dicts.
    """
    try:
        config = {"configurable": {"thread_id": thread_id}}
        state = memory.get(config)
        if not state:
            return []

        checkpoint = _extract_checkpoint_dict(state)
        channel_values = checkpoint.get("channel_values", {})
        messages = channel_values.get("messages")

        if not isinstance(messages, list):
            messages = checkpoint.get("messages", [])

        history = []
        for msg in messages:
            if hasattr(msg, "type") and hasattr(msg, "content"):
                role_map = {"human": "user", "ai": "assistant"}
                role = role_map.get(msg.type)
                if role and msg.content:
                    history.append({"role": role, "content": msg.content})
                continue

            if isinstance(msg, dict):
                role_map = {
                    "human": "user",
                    "ai": "assistant",
                    "user": "user",
                    "assistant": "assistant",
                }
                role_raw = msg.get("type") or msg.get("role")
                role = role_map.get(role_raw)
                content = msg.get("content")
                if role and content:
                    history.append({"role": role, "content": content})
        return history
    except Exception as e:
        logger.warning(f"Could not read history for thread '{thread_id}': {e}")
        return []
