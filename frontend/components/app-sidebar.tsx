"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { MessageSquare, FileText, Search, Clock, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { motion } from "framer-motion";
import { useChatSessions } from "@/hooks/use-chat-sessions";

export function AppSidebar() {
  const pathname = usePathname();
  const params = useParams();
  const sessionId = params?.sessionId as string;

  const { sessions: recentChats, loading } = useChatSessions();

  const navigation = [
    { name: "Chat", href: "/chat", icon: MessageSquare },
    { name: "Documents", href: "/documents", icon: FileText },
    { name: "Search", href: "/search", icon: Search },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <Sidebar>
      <SidebarHeader className="p-4 flex flex-row items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-2 h-2 bg-foreground transition-all duration-300 group-hover:w-4" />
          <span className="font-sans font-bold text-sm tracking-[0.15em] uppercase text-foreground">
            Archive<span className="text-muted-foreground">AI</span>
          </span>
        </Link>
        <ThemeToggle />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => {
                const isActive = pathname === item.href;

                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.name}
                      className="relative overflow-hidden group"
                    >
                      <Link href={item.href}>
                        <item.icon
                          className={`${
                            isActive
                              ? "text-foreground"
                              : "text-muted-foreground group-hover:text-foreground"
                          } transition-colors duration-150`}
                        />
                        <span className="font-mono text-[12px] tracking-[0.05em]">
                          {item.name}
                        </span>
                        {isActive && (
                          <motion.div
                            layoutId="active-pill"
                            className="absolute left-0 w-0.5 h-5 bg-foreground"
                            transition={{
                              type: "spring",
                              stiffness: 300,
                              damping: 30,
                            }}
                          />
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground px-4 mb-2">
            Recent Chats
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {recentChats.length > 0 ? (
                recentChats.map((chat) => {
                  const isActive = sessionId === chat.session_id;

                  return (
                    <SidebarMenuItem key={chat.session_id}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        className="group py-3"
                      >
                        <Link href={`/chat/${chat.session_id}`}>
                          <Clock
                            size={14}
                            className={`${
                              isActive
                                ? "text-foreground"
                                : "text-muted-foreground group-hover:text-foreground"
                            } transition-colors duration-150`}
                          />
                          <div className="flex flex-col gap-0.5 overflow-hidden">
                            <span className="font-mono text-[11px] tracking-tight truncate">
                              {chat.last_message || "New Conversation"}
                            </span>
                            <span className="font-mono text-[9px] text-muted-foreground tabular-nums">
                              {chat.session_id.slice(0, 8)}...
                            </span>
                          </div>
                          {isActive && (
                            <motion.div
                              layoutId="active-pill-recent"
                              className="absolute left-0 w-0.5 h-6 bg-foreground"
                              transition={{
                                type: "spring",
                                stiffness: 300,
                                damping: 30,
                              }}
                            />
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })
              ) : loading ? (
                <div className="px-4 py-2">
                  <div className="h-4 w-full rounded bg-muted animate-pulse" />
                  <div className="h-4 w-3/4 rounded bg-muted animate-pulse mt-2" />
                </div>
              ) : (
                <div className="px-4 py-2 font-mono text-[10px] text-muted-foreground italic">
                  No recent sessions
                </div>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-border/40">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>ArchiveAI v0.1</span>
          <ThemeToggle />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
