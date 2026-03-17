"use client";

import { useEffect, useRef, useState } from "react";
import { Message } from "@/lib/types";
import { MessageBubble } from "./message-bubble";
import { ChatInput } from "./chat-input";
import { fetchApi } from "@/lib/api";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BrainCircuit } from "lucide-react";

interface ChatAreaProps {
  sessionId?: string;
  initialMessages?: Message[];
}

export function ChatArea({
  sessionId: initialSessionId,
  initialMessages = [],
}: ChatAreaProps) {
  const [sessionId, setSessionId] = useState<string | undefined>(
    initialSessionId,
  );
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    // Optimistic UI update
    const tempUserMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setIsLoading(true);

    try {
      const response = await fetchApi<{
        session_id?: string;
        answer?: string;
        content?: string;
      }>("/chat/query", {
        method: "POST",
        body: JSON.stringify({
          prompt: content,
          session_id: sessionId,
          stream: false,
        }),
      });

      // After successful query, we should update session id if it was newly created
      if (response.session_id && !sessionId) {
        setSessionId(response.session_id);
      }

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          response.answer ||
          response.content ||
          "Sorry, I could not process that.",
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error) {
      console.error(error);
      toast.error("Failed to send message. Is the backend running?");
      // Optionally remove temp message or show error state
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background/95 max-w-4xl mx-auto w-full">
      {messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
          <div className="bg-primary/10 p-4 rounded-full text-primary">
            <BrainCircuit size={48} />
          </div>
          <h2 className="text-2xl font-bold">How can I help you today?</h2>
          <p className="text-muted-foreground max-w-md">
            Ask me anything about your uploaded documents, or just say hello.
          </p>
        </div>
      ) : (
        <ScrollArea className="flex-1 px-4 py-6" ref={scrollRef}>
          <div className="flex flex-col gap-4 pb-4">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
          </div>
        </ScrollArea>
      )}

      <div className="p-4 pt-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <ChatInput onSend={handleSendMessage} isLoading={isLoading} />
        <div className="text-center mt-2 text-xs text-muted-foreground">
          Docling AI can make mistakes. Check important info.
        </div>
      </div>
    </div>
  );
}
