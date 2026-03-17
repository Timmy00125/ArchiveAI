"use client";

import { ChatArea } from "@/components/chat/chat-area";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Message } from "@/lib/types";
import { fetchApi } from "@/lib/api";
import { Loader2 } from "lucide-react";

interface ChatHistoryMessage {
  id?: string;
  role?: "user" | "assistant" | string;
  content?: unknown;
  text?: unknown;
  timestamp?: string;
}

interface ChatHistoryResponse {
  messages?: ChatHistoryMessage[];
}

function normalizeRole(role: ChatHistoryMessage["role"]): Message["role"] {
  return role === "assistant" ? "assistant" : "user";
}

function normalizeMessageContent(value: unknown): string {
  if (typeof value === "string") return value;
  if (value == null) return "";

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export default function ChatSessionPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const [initialMessages, setInitialMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      try {
        const data = await fetchApi<ChatHistoryResponse>(
          `/chat/history/${sessionId}`,
        );

        if (data.messages?.length) {
          const formatted = data.messages.map((message, index) => ({
            id: message.id ?? `${sessionId}-${index}`,
            role: normalizeRole(message.role),
            content: normalizeMessageContent(message.content ?? message.text),
            timestamp: message.timestamp ?? new Date().toISOString(),
          }));
          setInitialMessages(formatted);
        }
      } catch (error) {
        console.error("Failed to load chat history", error);
      } finally {
        setIsLoading(false);
      }
    }
    if (sessionId) {
      loadHistory();
    }
  }, [sessionId]);

  return (
    <>
      <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6 shrink-0">
        <SidebarTrigger />
        <div className="font-semibold">Chat Session</div>
      </header>
      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ChatArea sessionId={sessionId} initialMessages={initialMessages} />
        )}
      </div>
    </>
  );
}
