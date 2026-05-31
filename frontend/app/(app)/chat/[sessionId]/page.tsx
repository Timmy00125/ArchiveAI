"use client";

import { ChatArea } from "@/components/chat/chat-area";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Message } from "@/lib/types";
import { fetchApi } from "@/lib/api";
import { normalizeMessageContent } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

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
          <div className="h-full flex flex-col items-center justify-center gap-4 p-8">
            <Skeleton className="h-16 w-full max-w-2xl rounded-xl" />
            <Skeleton className="h-24 w-full max-w-2xl rounded-xl" />
            <Skeleton className="h-16 w-full max-w-2xl rounded-xl" />
          </div>
        ) : (
          <ChatArea sessionId={sessionId} initialMessages={initialMessages} />
        )}
      </div>
    </>
  );
}
