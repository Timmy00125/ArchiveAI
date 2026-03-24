"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { DocumentUpload } from "@/components/documents/document-upload";
import { DocumentTable } from "@/components/documents/document-table";
import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileStack, Info } from "lucide-react";

export default function DocumentsPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUploadSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <>
      <header className="flex h-16 items-center gap-4 border-b border-border/40 bg-background/50 backdrop-blur-md px-6 shrink-0 z-10">
        <SidebarTrigger />
        <div className="h-4 w-px bg-border/60 mx-1 hidden sm:block" />
        <div className="flex items-center gap-2">
          <FileStack size={18} className="text-emerald-500" />
          <h1 className="font-bold tracking-tight text-sm sm:text-base">Knowledge Base</h1>
        </div>
      </header>
      
      <div className="flex-1 overflow-auto bg-muted/20">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-5xl mx-auto p-6 lg:p-10 space-y-10"
        >
          <div className="grid gap-8 lg:grid-cols-12">
            <div className="lg:col-span-8 space-y-8">
              <Card className="border-border/40 shadow-lg shadow-black/5 overflow-hidden">
                <CardHeader className="bg-muted/30 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">Upload Documents</CardTitle>
                      <CardDescription>Add PDF, DOCX, or TXT files to your knowledge base.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <DocumentUpload onUploadSuccess={handleUploadSuccess} />
                </CardContent>
              </Card>

              <Card className="border-border/40 shadow-lg shadow-black/5">
                <CardHeader>
                  <CardTitle className="text-xl">Indexed Documents</CardTitle>
                  <CardDescription>Managed files currently available for search and Q&A.</CardDescription>
                </CardHeader>
                <CardContent>
                  <DocumentTable refreshTrigger={refreshKey} />
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-4 space-y-6">
              <Card className="border-border/40 shadow-lg shadow-black/5 bg-primary/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                    <Info size={14} />
                    Storage Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-4">
                  <p className="text-muted-foreground leading-relaxed">
                    Uploaded documents are processed using <strong className="text-foreground">Docling OCR</strong> and indexed into a local <strong className="text-foreground">ChromaDB</strong> vector store.
                  </p>
                  <div className="p-3 bg-background/50 rounded-xl border border-border/20 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Vector Store Status</span>
                      <span className="text-emerald-500 font-bold">ACTIVE</span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div className="h-full w-2/3 bg-emerald-500 rounded-full" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-border/40 shadow-lg shadow-black/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    Best Practices
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs space-y-3 text-muted-foreground leading-relaxed">
                  <li className="list-disc ml-4">Use clear, searchable filenames.</li>
                  <li className="list-disc ml-4">Upload text-heavy PDFs for best results.</li>
                  <li className="list-disc ml-4">Avoid encrypted or password-protected files.</li>
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}
