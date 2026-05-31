"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import {
  Trash2,
  FileText,
  FileCode2,
  Eye,
  Sparkles,
  ImageIcon,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface DocumentStats {
  filename: string;
  chunks: number;
}

interface DocumentsResponse {
  documents: DocumentStats[];
  total_documents: number;
  total_chunks: number;
}

interface DocumentContentResponse {
  filename: string;
  content: string;
  length: number;
}

export function DocumentTable({ refreshTrigger }: { refreshTrigger: number }) {
  const router = useRouter();
  const [data, setData] = useState<DocumentsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Dialog state for structure
  const [structureOpen, setStructureOpen] = useState(false);
  const [structureData, setStructureData] = useState<string | null>(null);
  const [activeFile, setActiveFile] = useState<string | null>(null);

  // Dialog state for content preview
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

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
      const res = await fetchApi<{ structure?: string | object }>(
        `/documents/${filename}/structure`,
      );
      const structure = res.structure;
      setStructureData(
        typeof structure === "string"
          ? structure
          : JSON.stringify(structure || res, null, 2),
      );
      setStructureOpen(true);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load document structure or not available.");
    }
  };

  const handlePreview = async (filename: string) => {
    setActiveFile(filename);
    setPreviewLoading(true);
    setPreviewOpen(true);
    try {
      const res = await fetchApi<DocumentContentResponse>(
        `/documents/${filename}/content`,
      );
      setPreviewContent(res.content);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load document preview.");
      setPreviewContent(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const startChatQuery = (query: string) => {
    router.push(`/chat?query=${encodeURIComponent(query)}`);
  };

  const handleSummarize = (filename: string) => {
    startChatQuery(`Summarize the document "${filename}"`);
  };

  const handleVisualAnalysis = (filename: string) => {
    startChatQuery(
      `Analyze the charts, diagrams, and visual content in "${filename}"`,
    );
  };

  const handleAskAbout = (filename: string) => {
    startChatQuery(`Tell me about the document "${filename}"`);
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
    <TooltipProvider delayDuration={200}>
      <>
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Filename</TableHead>
                <TableHead className="w-[100px] text-right">Chunks</TableHead>
                <TableHead className="w-[200px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.documents.map((doc) => (
                <TableRow key={doc.filename}>
                  <TableCell className="font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary opacity-70 shrink-0" />
                    <span className="truncate" title={doc.filename}>
                      {doc.filename}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">{doc.chunks}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handlePreview(doc.filename)}
                            className="h-8 w-8"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Preview Content</p>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleSummarize(doc.filename)}
                            className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                          >
                            <Sparkles className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Summarize in Chat</p>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleVisualAnalysis(doc.filename)}
                            className="h-8 w-8 text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950/20"
                          >
                            <ImageIcon className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Visual Analysis in Chat</p>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleAskAbout(doc.filename)}
                            className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Ask About Document</p>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewStructure(doc.filename)}
                            className="h-8 w-8"
                          >
                            <FileCode2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>View Structure</p>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => handleDelete(doc.filename)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Delete</p>
                        </TooltipContent>
                      </Tooltip>
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

        {/* Structure Dialog */}
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

        {/* Preview Dialog */}
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-3xl h-[85vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                Document Preview: {activeFile}
              </DialogTitle>
            </DialogHeader>
            <ScrollArea className="flex-1 bg-muted/30 p-6 rounded-md border mt-2">
              {previewLoading ? (
                <div className="text-center text-muted-foreground py-12">
                  Loading content...
                </div>
              ) : previewContent ? (
                <div className="prose dark:prose-invert prose-sm max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {previewContent}
                  </ReactMarkdown>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-12">
                  No preview content available.
                </div>
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </>
    </TooltipProvider>
  );
}
