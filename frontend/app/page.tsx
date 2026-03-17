import { ChatArea } from "@/components/chat/chat-area";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default function Home() {
  return (
    <>
      <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6 shrink-0">
        <SidebarTrigger />
        <div className="font-semibold">New Chat</div>
      </header>
      <div className="flex-1 overflow-hidden">
        <ChatArea />
      </div>
    </>
  );
}
