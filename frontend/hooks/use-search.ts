import { useState, useCallback } from "react";
import { fetchApi } from "@/lib/api";
import { toast } from "sonner";

interface SearchResult {
  content: string;
  metadata: {
    source: string;
    page?: number | string;
    filename?: string;
    [key: string]: unknown;
  };
  score?: number;
}

interface SearchOptions {
  filename?: string;
  k?: number;
  withScores?: boolean;
}

export function useSearch() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const search = useCallback(async (query: string, options: SearchOptions = {}) => {
    if (!query.trim()) return;

    setIsLoading(true);
    setHasSearched(true);
    try {
      const data = await fetchApi<{ results?: SearchResult[] }>("/search", {
        method: "POST",
        body: JSON.stringify({
          query: query.trim(),
          k: options.k ?? 10,
          with_scores: options.withScores ?? true,
          filename: options.filename || undefined,
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
