"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, FileText, FileCode2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DocumentStats {
  filename: string;
  chunks: number;
}

interface DocumentsResponse {
  documents: DocumentStats[];
  total_documents: number;
  total_chunks: number;
}

export function DocumentTable({ refreshTrigger }: { refreshTrigger: number }) {
  const [data, setData] = useState<DocumentsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Dialog state for structure
  const [structureOpen, setStructureOpen] = useState(false);
  const [structureData, setStructureData] = useState<string | null>(null);
  const [activeFile, setActiveFile] = useState<string | null>(null);

  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      const res = await fetchApi<DocumentsResponse>("/documents");
      setData(res);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load documents");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [refreshTrigger]);

  const handleDelete = async (filename: string) => {
    if (!confirm(`Delete ${filename}?`)) return;
    try {
      await fetchApi("/documents", {
        method: "DELETE",
        body: JSON.stringify({ filename }),
      });
      toast.success(`${filename} deleted`);
      fetchDocuments();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete document");
    }
  };

  const handleViewStructure = async (filename: string) => {
    setActiveFile(filename);
    try {
      const res = await fetchApi<{ structure?: string }>(
        `/documents/${filename}/structure`,
      );
      setStructureData(res.structure || JSON.stringify(res, null, 2));
      setStructureOpen(true);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load document structure or not available.");
    }
  };

  if (isLoading) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        Loading documents...
      </div>
    );
  }

  if (!data || data.documents.length === 0) {
    return (
      <div className="text-center p-12 border rounded-xl bg-muted/20">
        <FileText className="mx-auto h-10 w-10 text-muted-foreground mb-4 opacity-50" />
        <h3 className="text-lg font-medium">No documents yet</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Upload a document to get started.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Filename</TableHead>
              <TableHead className="w-[100px] text-right">Chunks</TableHead>
              <TableHead className="w-[120px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.documents.map((doc) => (
              <TableRow key={doc.filename}>
                <TableCell className="font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary opacity-70" />
                  {doc.filename}
                </TableCell>
                <TableCell className="text-right">{doc.chunks}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleViewStructure(doc.filename)}
                      title="View Structure"
                    >
                      <FileCode2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => handleDelete(doc.filename)}
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="mt-4 text-xs text-muted-foreground flex justify-between">
        <span>Total Documents: {data.total_documents}</span>
        <span>Total Vector Chunks: {data.total_chunks}</span>
      </div>

      <Dialog open={structureOpen} onOpenChange={setStructureOpen}>
        <DialogContent className="max-w-2xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Document Structure: {activeFile}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 bg-muted/30 p-4 rounded-md border mt-2 font-mono text-xs whitespace-pre-wrap">
            {structureData || "No structure data found."}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
