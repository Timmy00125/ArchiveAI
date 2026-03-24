"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { MessageSquare, FileText, Search, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { motion } from "framer-motion";

export function AppSidebar() {
  const pathname = usePathname();

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
                const isActive = pathname.startsWith(item.href);

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
