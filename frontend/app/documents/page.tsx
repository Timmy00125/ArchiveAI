"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { DocumentUpload } from "@/components/documents/document-upload";
import { DocumentTable } from "@/components/documents/document-table";
import { useState } from "react";

export default function DocumentsPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUploadSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <>
      <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6 shrink-0">
        <SidebarTrigger />
        <div className="font-semibold">Knowledge Base</div>
      </header>
      <div className="flex-1 overflow-auto p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight mb-2">
              Documents
            </h1>
            <p className="text-muted-foreground mb-6">
              Upload and manage documents for your AI knowledge base.
            </p>
            <DocumentUpload onUploadSuccess={handleUploadSuccess} />
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4">Indexed Documents</h2>
            <DocumentTable refreshTrigger={refreshKey} />
          </div>
        </div>
      </div>
    </>
  );
}
