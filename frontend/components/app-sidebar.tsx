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
import { MessageSquare, FileText, Search, BrainCircuit, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { motion } from "framer-motion";

export function AppSidebar() {
  const pathname = usePathname();

  const navigation = [
    { name: "Chat", href: "/", icon: MessageSquare, color: "text-blue-500" },
    { name: "Documents", href: "/documents", icon: FileText, color: "text-emerald-500" },
    { name: "Search", href: "/search", icon: Search, color: "text-amber-500" },
  ];

  return (
    <Sidebar>
      <SidebarHeader className="p-4 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <motion.div 
            whileHover={{ rotate: 15, scale: 1.1 }}
            className="bg-primary text-primary-foreground p-1.5 rounded-xl shadow-lg shadow-primary/20"
          >
            <BrainCircuit size={20} />
          </motion.div>
          <div className="font-bold text-lg tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text">
            ArchiveAI
          </div>
        </div>
        <ThemeToggle />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => {
                const isActive =
                  item.href === "/"
                    ? pathname === "/" || pathname.startsWith("/chat")
                    : pathname.startsWith(item.href);

                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.name} className="relative overflow-hidden group">
                      <Link href={item.href}>
                        <item.icon className={`${isActive ? item.color : 'text-muted-foreground group-hover:text-foreground'} transition-colors duration-300`} />
                        <span className="font-medium">{item.name}</span>
                        {isActive && (
                          <motion.div
                            layoutId="active-pill"
                            className="absolute left-0 w-1 h-6 bg-primary rounded-full"
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
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
        <div className="rounded-2xl bg-muted/50 p-4 flex flex-col gap-2 items-center text-center border border-border/50">
          <div className="p-2 bg-primary/10 rounded-full text-primary">
            <Sparkles size={16} />
          </div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Pro Version</div>
          <div className="text-xs text-muted-foreground leading-tight">Unlock advanced extraction & larger context</div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
