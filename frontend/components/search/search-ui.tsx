"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  SearchIcon,
  Loader2,
  FileText,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  SlidersHorizontal,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useSearch } from "@/hooks/use-search";
import { useDocuments } from "@/hooks/use-documents";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";

export function SearchUI() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [filename, setFilename] = useState("");
  const [topK, setTopK] = useState(10);
  const [withScores, setWithScores] = useState(true);
  const { results, hasSearched, isLoading, search } = useSearch();
  const {
    data: documentsData,
    isLoading: isLoadingDocuments,
    fetchDocuments,
  } = useDocuments();
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setExpandedIdx(null);
    search(query, {
      filename,
      k: topK,
      withScores,
    });
  };

  const openResultInChat = (content: string, source: string) => {
    const prompt = [
      `Use this retrieved source from ${source} to answer my question.`,
      `Question: ${query}`,
      `Source excerpt: ${content}`,
    ].join("\n\n");
    router.push(`/chat?query=${encodeURIComponent(prompt)}`);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSearch} className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search your documents..."
              className="h-12 pl-10"
              aria-label="Search documents"
            />
          </div>
          <Button
            type="submit"
            className="h-12 px-6"
            disabled={isLoading || !query.trim()}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
          </Button>
        </div>

        <div className="rounded-lg border border-border/60 bg-background p-3">
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Search Filters
          </div>

          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_140px_160px] md:items-end">
            <label className="space-y-1.5 text-sm font-medium">
              <span>Filename</span>
              <select
                value={filename}
                onChange={(event) => setFilename(event.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                disabled={isLoadingDocuments}
              >
                <option value="">All documents</option>
                {documentsData?.documents.map((document) => (
                  <option key={document.filename} value={document.filename}>
                    {document.filename}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1.5 text-sm font-medium">
              <span>Top results</span>
              <select
                value={topK}
                onChange={(event) => setTopK(Number(event.target.value))}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {[5, 10, 20, 50].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex h-10 items-center gap-2 rounded-md border border-border/60 px-3 text-sm font-medium">
              <input
                type="checkbox"
                checked={withScores}
                onChange={(event) => setWithScores(event.target.checked)}
                className="h-4 w-4 accent-primary"
              />
              Show scores
            </label>
          </div>
        </div>
      </form>

      {hasSearched && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground">
            {isLoading ? "Searching..." : `Found ${results.length} results`}
          </h3>

          {isLoading && (
            <div className="grid gap-4">
              <Skeleton className="h-32 w-full rounded-lg" />
              <Skeleton className="h-32 w-full rounded-lg" />
            </div>
          )}

          <div className="grid gap-4">
            {results.map((result, idx) => {
              const isExpanded = expandedIdx === idx;
              const isLong = result.content.length > 300;
              const source =
                result.metadata?.filename ||
                result.metadata?.source ||
                "Unknown Document";

              return (
                <Card key={idx}>
                  <CardHeader className="py-4 pb-2">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <CardTitle className="min-w-0 text-base flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        <span className="truncate">{source}</span>
                      </CardTitle>
                      <div className="flex shrink-0 items-center gap-2">
                        {withScores && result.score !== undefined && (
                          <div className="text-xs font-mono bg-muted px-2 py-1 rounded">
                            Score: {result.score.toFixed(4)}
                          </div>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          type="button"
                          onClick={() => openResultInChat(result.content, source)}
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                          Chat
                        </Button>
                      </div>
                    </div>
                    <CardDescription>
                      Page: {result.metadata?.page || "N/A"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="py-4 pt-0">
                    <div
                      className={`text-sm bg-muted/50 p-3 rounded-md ${!isExpanded && isLong ? "line-clamp-4" : ""}`}
                    >
                      {result.content}
                    </div>
                    {isLong && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 h-7 text-xs"
                        onClick={() =>
                          setExpandedIdx(isExpanded ? null : idx)
                        }
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="h-3 w-3 mr-1" /> Show less
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-3 w-3 mr-1" /> Show more
                          </>
                        )}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
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
