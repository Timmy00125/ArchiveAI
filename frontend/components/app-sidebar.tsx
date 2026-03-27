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
import { MessageSquare, FileText, Search, Sparkles, Clock } from "lucide-react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { ChatSessionSummary } from "@/lib/types";

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

export function AppSidebar() {
  const pathname = usePathname();
  const params = useParams();
  const sessionId = params?.sessionId as string;

  const [recentChats, setRecentChats] = useState<ChatSessionSummary[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadSessions() {
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
        // Sort by timestamp if available
        const sorted = sanitized.sort((a, b) => {
          if (!a.timestamp) return 1;
          if (!b.timestamp) return -1;
          return (
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
        });
        setRecentChats(sorted.slice(0, 10)); // Top 10 recent
      } catch (err) {
        console.error("Failed to load chat sessions:", err);
      } finally {
        setLoading(false);
      }
    }

    loadSessions();
  }, [pathname]); // Refresh on navigation

  const navigation = [
    { name: "Chat", href: "/chat", icon: MessageSquare },
    { name: "Documents", href: "/documents", icon: FileText },
    { name: "Search", href: "/search", icon: Search },
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
                <div className="px-4 py-2 font-mono text-[10px] text-muted-foreground">
                  Loading...
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
      <SidebarFooter className="p-6">
        <div className="border border-border p-4 flex flex-col gap-2 items-center text-center">
          <div className="p-2 border border-border text-muted-foreground">
            <Sparkles size={14} />
          </div>
          <div className="font-mono text-[9px] tracking-[0.2em] text-muted-foreground uppercase">
            Pro Version
          </div>
          <div className="font-mono text-[10px] text-muted-foreground leading-tight">
            Unlock advanced extraction & larger context
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
