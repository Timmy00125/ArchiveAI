"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SearchIcon, Loader2, FileText } from "lucide-react";
import { fetchApi } from "@/lib/api";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface SearchResult {
  content: string;
  metadata: {
    source: string;
    page: number;
    [key: string]: unknown;
  };
  score?: number;
}

export function SearchUI() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your documents exactly..."
            className="pl-10 h-12"
          />
        </div>
        <Button
          type="submit"
          className="h-12 px-6"
          disabled={isLoading || !query.trim()}
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
        </Button>
      </form>

      {hasSearched && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground">
            {isLoading ? "Searching..." : `Found ${results.length} results`}
          </h3>

          <div className="grid gap-4">
            {results.map((result, idx) => (
              <Card key={idx}>
                <CardHeader className="py-4 pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      {result.metadata?.source || "Unknown Document"}
                    </CardTitle>
                    {result.score !== undefined && (
                      <div className="text-xs font-mono bg-muted px-2 py-1 rounded">
                        Score: {result.score.toFixed(4)}
                      </div>
                    )}
                  </div>
                  <CardDescription>
                    Page: {result.metadata?.page || "N/A"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="py-4 pt-0">
                  <div className="text-sm bg-muted/50 p-3 rounded-md line-clamp-4">
                    {result.content}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {!isLoading && results.length === 0 && (
            <div className="text-center py-12 border rounded-lg bg-muted/20">
              <SearchIcon className="h-8 w-8 mx-auto text-muted-foreground opacity-50 mb-3" />
              <p className="font-medium">No results found</p>
              <p className="text-sm text-muted-foreground mt-1">
                Try a different search term or check if documents are uploaded
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
