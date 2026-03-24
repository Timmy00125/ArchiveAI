import { ChatArea } from "@/components/chat/chat-area";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Sparkles } from "lucide-react";

export default function Home() {
  return (
    <>
      <header className="flex h-16 items-center justify-between gap-4 border-b border-border/40 bg-background/50 backdrop-blur-md px-6 shrink-0 z-10">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div className="h-4 w-px bg-border/60 mx-1 hidden sm:block" />
          <div className="flex items-center gap-2">
            <h1 className="font-bold tracking-tight text-sm sm:text-base">
              New Conversation
            </h1>
            <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 text-[10px] font-bold text-primary border border-primary/20">
              <Sparkles size={10} />
              <span>GEMINI</span>
            </div>
          </div>
        </div>
      </header>
      <div className="flex-1 overflow-hidden bg-background">
        <ChatArea />
      </div>
    </>
  );
}
