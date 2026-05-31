import { useEffect, useCallback } from "react";
import { fetchApi } from "@/lib/api";
import { ChatSessionSummary } from "@/lib/types";
import { useAppStore } from "@/lib/store";

interface ChatSessionSummaryApi {
  session_id: string;
  last_message?: unknown;
  timestamp?: string;
}

function normalizePreviewText(value: unknown): string {
  if (typeof value === "string") return value;
  if (value == null) return "";

  if (Array.isArray(value)) {
    return value
      .map((item) => normalizePreviewText(item))
      .filter(Boolean)
      .join(" ")
      .trim();
  }

  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if (typeof obj.text === "string") return obj.text;

    const parts = [obj.content, obj.value, obj.type]
      .filter(
        (item): item is string => typeof item === "string" && item.length > 0,
      )
      .join(" ")
      .trim();

    if (parts) return parts;
  }

  try {
    return String(value);
  } catch {
    return "";
  }
}

export function useChatSessions() {
  const sessions = useAppStore((s) => s.sessions);
  const loading = useAppStore((s) => s.sessionsLoading);
  const version = useAppStore((s) => s.sessionsVersion);
  const setSessions = useAppStore((s) => s.setSessions);
  const setLoading = useAppStore((s) => s.setSessionsLoading);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchApi<{ sessions: ChatSessionSummaryApi[] }>(
        "/chat/sessions",
      );
      const sanitized: ChatSessionSummary[] = (response.sessions || []).map(
        (session) => ({
          session_id: session.session_id,
          last_message: normalizePreviewText(session.last_message),
          timestamp: session.timestamp || "",
        }),
      );
      const sorted = sanitized.sort((a, b) => {
        if (!a.timestamp) return 1;
        if (!b.timestamp) return -1;
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });
      setSessions(sorted.slice(0, 10));
    } catch (err) {
      console.error("Failed to load chat sessions:", err);
    } finally {
      setLoading(false);
    }
  }, [setSessions, setLoading]);

  useEffect(() => {
    refresh();
  }, [version, refresh]);

  return { sessions, loading, refresh };
}
