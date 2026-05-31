import { useState, useCallback } from "react";
import { fetchApi } from "@/lib/api";
import { toast } from "sonner";

interface SearchResult {
  content: string;
  metadata: {
    source: string;
    page: number;
    [key: string]: unknown;
  };
  score?: number;
}

export function useSearch() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const search = useCallback(async (query: string) => {
    if (!query.trim()) return;

    setIsLoading(true);
    setHasSearched(true);
    try {
      const data = await fetchApi<{ results?: SearchResult[] }>("/search", {
        method: "POST",
        body: JSON.stringify({
          query: query.trim(),
          k: 10,
          with_scores: true,
        }),
      });
      setResults(data.results || []);
    } catch (error) {
      console.error(error);
      toast.error("Search failed");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { results, hasSearched, isLoading, search };
}
