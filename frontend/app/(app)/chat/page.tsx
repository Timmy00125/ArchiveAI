"use client";

import { Suspense } from "react";
import { ChatArea } from "@/components/chat/chat-area";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useSearchParams } from "next/navigation";

function ChatPageContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("query") || undefined;

  return (
    <>
      <header className="flex h-14 items-center gap-4 border-b border-border px-6 shrink-0">
        <SidebarTrigger />
        <div className="h-4 w-px bg-border" />
        <h1 className="font-mono text-[12px] tracking-[0.1em] text-foreground uppercase">
          New Conversation
        </h1>
      </header>
      <div className="flex-1 overflow-hidden bg-background">
        <ChatArea initialQuery={initialQuery} />
      </div>
    </>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      }
    >
      <ChatPageContent />
    </Suspense>
  );
}
