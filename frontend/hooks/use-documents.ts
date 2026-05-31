import { useState, useCallback } from "react";
import { fetchApi } from "@/lib/api";
import { toast } from "sonner";
import { useAppStore } from "@/lib/store";

interface DocumentStats {
  filename: string;
  chunks: number;
}

interface DocumentsResponse {
  documents: DocumentStats[];
  total_documents: number;
  total_chunks: number;
}

export function useDocuments() {
  const [data, setData] = useState<DocumentsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const invalidateSessions = useAppStore((s) => s.invalidateSessions);

  const fetchDocuments = useCallback(async () => {
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
  }, []);

  const deleteDocument = useCallback(
    async (filename: string) => {
      try {
        await fetchApi("/documents", {
          method: "DELETE",
          body: JSON.stringify({ filename }),
        });
        toast.success(`${filename} deleted`);
        fetchDocuments();
        invalidateSessions();
      } catch (error) {
        console.error(error);
        toast.error("Failed to delete document");
      }
    },
    [fetchDocuments, invalidateSessions],
  );

  return { data, isLoading, fetchDocuments, deleteDocument };
}
