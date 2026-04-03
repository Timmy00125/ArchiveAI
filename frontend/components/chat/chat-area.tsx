"use client";

import { useEffect, useRef, useState } from "react";
import { Message } from "@/lib/types";
import { MessageBubble } from "./message-bubble";
import { ChatInput } from "./chat-input";
import { fetchApi } from "@/lib/api";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BrainCircuit, Sparkles, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

interface ChatAreaProps {
  sessionId?: string;
  initialMessages?: Message[];
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

export function ChatArea({
  sessionId: initialSessionId,
  initialMessages = [],
}: ChatAreaProps) {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | undefined>(
    initialSessionId,
  );
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector(
        "[data-radix-scroll-area-viewport]",
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, isLoading]);

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
        response?: unknown;
        answer?: unknown;
        content?: unknown;
      }>("/chat/query", {
        method: "POST",
        body: JSON.stringify({
          prompt: content,
          session_id: sessionId,
          stream: false,
        }),
      });

      const nextSessionId = response.session_id ?? sessionId;

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: normalizeMessageContent(
          response.response ??
            response.answer ??
            response.content ??
            "Sorry, I could not process that.",
        ),
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // Transition to a stable URL after the UI already reflects the reply.
      if (response.session_id && !sessionId) {
        setSessionId(response.session_id);
        router.replace(`/chat/${response.session_id}`);
      } else if (nextSessionId) {
        setSessionId(nextSessionId);
      }
    } catch (error) {
      console.error(error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to send message: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

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
                  "Summarize my latest document",
                  "Extract key findings from the report",
                  "Compare these two research papers",
                  "Explain the methodology used",
                ].map((suggestion, i) => (
                  <motion.button
                    key={suggestion}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * i }}
                    onClick={() => handleSendMessage(suggestion)}
                    className="p-3 text-sm text-left rounded-xl border border-border/50 bg-muted/30 hover:bg-primary/5 hover:border-primary/30 transition-all group"
                  >
                    <span className="text-muted-foreground group-hover:text-primary transition-colors">
                      {suggestion}
                    </span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : (
            <ScrollArea key="chat" className="flex-1 h-full" ref={scrollRef}>
              <div className="flex flex-col py-8 min-h-full">
                <AnimatePresence initial={false}>
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                    >
                      <MessageBubble message={message} />
                    </motion.div>
                  ))}
                </AnimatePresence>

                {isLoading && (
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
          <p className="text-center mt-3 text-[10px] uppercase tracking-widest font-medium text-muted-foreground/40">
            Powered by Docling Engine & Gemini 2.5
          </p>
        </div>
      </div>
    </div>
  );
}
