"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { SearchUI } from "@/components/search/search-ui";
import { Search } from "lucide-react";
import { motion } from "framer-motion";

export default function SearchPage() {
  return (
    <>
      <header className="flex h-16 items-center gap-4 border-b border-border/40 bg-background/50 backdrop-blur-md px-6 shrink-0 z-10">
        <SidebarTrigger />
        <div className="h-4 w-px bg-border/60 mx-1 hidden sm:block" />
        <div className="flex items-center gap-2">
          <Search size={18} className="text-amber-500" />
          <h1 className="font-bold tracking-tight text-sm sm:text-base">Semantic Search</h1>
        </div>
      </header>
      
      <div className="flex-1 overflow-auto bg-muted/20">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto p-6 lg:p-12"
        >
          <div className="mb-10 space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Direct Retrieval</h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Search across all indexed documents to find precise segments using vector embeddings.
            </p>
          </div>

          <SearchUI />
        </motion.div>
      </div>
    </>
  );
}
