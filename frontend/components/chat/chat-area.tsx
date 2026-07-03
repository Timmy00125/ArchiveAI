"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { EvidenceSource, Message } from "@/lib/types";
import { MessageBubble } from "./message-bubble";
import { ChatInput } from "./chat-input";
import { API_BASE_URL } from "@/lib/api";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BrainCircuit, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { normalizeMessageContent } from "@/lib/utils";
import { useAppStore } from "@/lib/store";

interface ChatAreaProps {
  sessionId?: string;
  initialMessages?: Message[];
  initialQuery?: string;
}

export function ChatArea({
  sessionId: initialSessionId,
  initialMessages = [],
  initialQuery,
}: ChatAreaProps) {
  const router = useRouter();
  const invalidateSessions = useAppStore((s) => s.invalidateSessions);
  const addError = useAppStore((s) => s.addError);
  const [sessionId, setSessionId] = useState<string | undefined>(
    initialSessionId,
  );
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const querySentRef = useRef(false);

  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector(
        "[data-radix-scroll-area-viewport]",
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, isLoading, streamingContent]);

  const handleSendMessage = useCallback(
    async (content: string) => {
      const tempUserMsg: Message = {
        id: Date.now().toString(),
        role: "user",
        content,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, tempUserMsg]);
      setIsLoading(true);
      setStreamingContent("");

      try {
        const response = await fetch(`${API_BASE_URL}/chat/query`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: content,
            session_id: sessionId,
            stream: true,
          }),
        });

        if (!response.ok) {
          throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        const contentType = response.headers.get("content-type") || "";

        if (contentType.includes("text/event-stream") || contentType.includes("application/x-ndjson")) {
          const reader = response.body?.getReader();
          if (!reader) throw new Error("No response body");

          const decoder = new TextDecoder();
          let accumulated = "";
          let newSessionId = sessionId;
          let sources: EvidenceSource[] = [];

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split("\n").filter(Boolean);

            for (const line of lines) {
              try {
                const data = line.startsWith("data: ") ? line.slice(6) : line;
                if (data === "[DONE]") continue;

                const parsed = JSON.parse(data);
                if (parsed.session_id) {
                  newSessionId = parsed.session_id;
                }

                if (Array.isArray(parsed.sources)) {
                  sources = parsed.sources as EvidenceSource[];
                }

                const token =
                  parsed.token ??
                  parsed.chunk ??
                  parsed.delta ??
                  parsed.content ??
                  parsed.response ??
                  parsed.answer ??
                  "";

                if (typeof token === "string") {
                  accumulated += token;
                  setStreamingContent(accumulated);
                }
              } catch {
                accumulated += line;
                setStreamingContent(accumulated);
              }
            }
          }

          const assistantMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: accumulated || "Sorry, I could not process that.",
            metadata: sources.length > 0 ? { sources } : undefined,
            timestamp: new Date().toISOString(),
          };

          setMessages((prev) => [...prev, assistantMsg]);
          setStreamingContent("");

          if (newSessionId && newSessionId !== sessionId) {
            setSessionId(newSessionId);
            router.replace(`/chat/${newSessionId}`);
          }
        } else {
          const json = await response.json();
          const nextSessionId = json.session_id ?? sessionId;
          const sources = Array.isArray(json.sources)
            ? (json.sources as EvidenceSource[])
            : [];

          const assistantMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: normalizeMessageContent(
              json.response ?? json.answer ?? json.content ?? "Sorry, I could not process that.",
            ),
            metadata: sources.length > 0 ? { sources } : undefined,
            timestamp: new Date().toISOString(),
          };

          setMessages((prev) => [...prev, assistantMsg]);
          setStreamingContent("");

          if (json.session_id && !sessionId) {
            setSessionId(json.session_id);
            router.replace(`/chat/${json.session_id}`);
          } else if (nextSessionId) {
            setSessionId(nextSessionId);
          }
        }

        invalidateSessions();
      } catch (error) {
        console.error(error);
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        toast.error(`Failed to send message: ${errorMessage}`);
        addError(`Chat: ${errorMessage}`);
        setStreamingContent("");
      } finally {
        setIsLoading(false);
      }
    },
    [sessionId, router, invalidateSessions, addError],
  );

  const handleRegenerate = useCallback(
    (messageIndex: number) => {
      const userMsg = messages
        .slice(0, messageIndex)
        .reverse()
        .find((m) => m.role === "user");
      if (!userMsg) return;

      setMessages((prev) => prev.slice(0, messageIndex));
      handleSendMessage(userMsg.content);
    },
    [messages, handleSendMessage],
  );

  useEffect(() => {
    if (initialQuery && !querySentRef.current && messages.length === 0) {
      querySentRef.current = true;
      handleSendMessage(initialQuery);
    }
  }, [initialQuery, handleSendMessage, messages.length]);

  return (
    <div className="flex flex-col h-full bg-background max-w-5xl mx-auto w-full border-x border-border/40 shadow-2xl relative">
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        <AnimatePresence mode="wait">
          {messages.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex-1 flex flex-col items-center justify-center gap-6 text-center p-12 overflow-y-auto"
            >
              <div className="relative">
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="bg-primary/10 p-6 rounded-3xl text-primary shadow-inner"
                >
                  <BrainCircuit size={64} className="drop-shadow-glow" />
                </motion.div>
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="absolute -top-2 -right-2 bg-amber-500 text-white p-1.5 rounded-full shadow-lg"
                >
                  <Sparkles size={16} />
                </motion.div>
              </div>

              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">
                  ArchiveAI Assistant
                </h2>
                <p className="text-muted-foreground max-w-sm text-lg leading-relaxed">
                  Experience the next generation of document intelligence.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg mt-4">
                {[
                  {
                    text: "Summarize my latest document",
                    icon: "✨",
                  },
                  {
                    text: "Extract key findings from the report",
                    icon: "🔍",
                  },
                  {
                    text: "Analyze charts and diagrams",
                    icon: "📊",
                  },
                  {
                    text: "Compare these two research papers",
                    icon: "⚖️",
                  },
                ].map((suggestion, i) => (
                  <motion.button
                    key={suggestion.text}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * i }}
                    onClick={() => handleSendMessage(suggestion.text)}
                    className="p-3 text-sm text-left rounded-xl border border-border/50 bg-muted/30 hover:bg-primary/5 hover:border-primary/30 transition-all group"
                  >
                    <span className="text-muted-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                      <span>{suggestion.icon}</span>
                      {suggestion.text}
                    </span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : (
            <ScrollArea key="chat" className="flex-1 h-full" ref={scrollRef}>
              <div className="flex flex-col py-8 min-h-full">
                <AnimatePresence initial={false}>
                  {messages.map((message, index) => {
                    const isLast = index === messages.length - 1;
                    return (
                      <motion.div
                        key={message.id}
                        initial={isLast ? { opacity: 0, y: 20 } : false}
                        animate={{ opacity: 1, y: 0 }}
                        transition={isLast ? { duration: 0.4, ease: "easeOut" } : { duration: 0 }}
                      >
                        <MessageBubble
                          message={message}
                          onRegenerate={
                            message.role === "assistant"
                              ? () => handleRegenerate(index)
                              : undefined
                          }
                        />
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {isLoading && streamingContent && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <MessageBubble
                      message={{
                        id: "streaming",
                        role: "assistant",
                        content: streamingContent,
                        timestamp: new Date().toISOString(),
                      }}
                    />
                  </motion.div>
                )}

                {isLoading && !streamingContent && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex gap-4 p-6 bg-muted/20"
                  >
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                      <BrainCircuit size={16} className="text-primary" />
                    </div>
                    <div className="flex gap-1 items-center py-2">
                      <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce"></span>
                    </div>
                  </motion.div>
                )}
              </div>
            </ScrollArea>
          )}
        </AnimatePresence>
      </div>

      <div className="px-6 pb-6 pt-2 bg-gradient-to-t from-background via-background/80 to-transparent">
        <div className="max-w-3xl mx-auto w-full">
          <ChatInput onSend={handleSendMessage} isLoading={isLoading} />
          <p className="text-center mt-3 text-xs uppercase tracking-widest font-medium text-muted-foreground/60">
            Powered by Docling Engine & Gemini 2.5
          </p>
        </div>
      </div>
    </div>
  );
}
