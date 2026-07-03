import { cn } from "@/lib/utils";
import { EvidenceSource, Message } from "@/lib/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  BrainCircuit,
  User,
  Copy,
  Check,
  RefreshCw,
  FileText,
  PanelRightOpen,
  Quote,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useState, memo } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface MessageBubbleProps {
  message: Message;
  onRegenerate?: () => void;
}

interface StructuredResponseBlock {
  type?: unknown;
  text?: unknown;
  extras?: unknown;
  [key: string]: unknown;
}

function toDisplayString(value: unknown): string {
  if (typeof value === "string") return value;
  if (value == null) return "";

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function parseStructuredBlocks(
  content: string,
): StructuredResponseBlock[] | null {
  try {
    const parsed: unknown = JSON.parse(content);

    if (Array.isArray(parsed)) {
      const objectBlocks = parsed.filter(
        (item): item is StructuredResponseBlock =>
          !!item && typeof item === "object" && !Array.isArray(item),
      );
      return objectBlocks.length > 0 ? objectBlocks : null;
    }

    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return [parsed as StructuredResponseBlock];
    }

    return null;
  } catch {
    return null;
  }
}

function getEvidenceSources(message: Message): EvidenceSource[] {
  const sources = message.metadata?.sources;
  if (!Array.isArray(sources)) return [];

  return sources.filter(
    (source): source is EvidenceSource =>
      !!source && typeof source === "object" && !Array.isArray(source),
  );
}

function getSourceTitle(source: EvidenceSource, index: number): string {
  return source.filename || source.source || `Source ${index + 1}`;
}

function getSourceMeta(source: EvidenceSource): string {
  const details: string[] = [];
  if (source.page) details.push(`Page ${source.page}`);
  if (typeof source.score === "number") {
    details.push(`Score ${source.score.toFixed(4)}`);
  }
  return details.join(" / ");
}

export const MessageBubble = memo(function MessageBubble({
  message,
  onRegenerate,
}: MessageBubbleProps) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);
  const [isEvidenceOpen, setIsEvidenceOpen] = useState(false);

  const markdownContent =
    typeof message.content === "string"
      ? message.content
      : JSON.stringify(message.content, null, 2);
  const structuredBlocks = !isUser
    ? parseStructuredBlocks(markdownContent)
    : null;
  const sources = !isUser ? getEvidenceSources(message) : [];

  const copyToClipboard = () => {
    navigator.clipboard.writeText(markdownContent);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        "flex w-full gap-4 px-6 py-8 transition-colors group relative",
        isUser ? "bg-background" : "bg-muted/30 border-y border-border/20",
      )}
    >
      <div className="max-w-4xl mx-auto flex w-full gap-4 lg:gap-6">
        <Avatar
          className={cn(
            "h-10 w-10 shrink-0 border-2 shadow-sm",
            isUser ? "border-primary/20" : "border-primary/40",
          )}
        >
          {isUser ? (
            <AvatarFallback className="bg-gradient-to-br from-primary/10 to-primary/5 text-primary">
              <User size={20} />
            </AvatarFallback>
          ) : (
            <AvatarFallback className="bg-primary text-primary-foreground">
              <BrainCircuit size={20} />
            </AvatarFallback>
          )}
        </Avatar>

        <div className="flex-1 space-y-4 overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="font-bold text-sm flex items-center gap-2 tracking-tight">
              {isUser ? "You" : "ArchiveAI Assistant"}
              <span className="text-xs text-muted-foreground/60 font-medium uppercase tracking-widest">
                {new Date(message.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {onRegenerate && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={onRegenerate}
                  aria-label="Regenerate response"
                >
                  <RefreshCw size={14} />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={copyToClipboard}
                aria-label="Copy message"
              >
                {copied ? (
                  <Check size={14} className="text-emerald-500" />
                ) : (
                  <Copy size={14} />
                )}
              </Button>
            </div>
          </div>

          <div className="text-[15px] prose dark:prose-invert prose-p:leading-relaxed prose-pre:p-0 max-w-none break-words">
            {structuredBlocks ? (
              <div className="space-y-4 not-prose">
                {structuredBlocks.map((block, index) => {
                  const { type, text, extras, ...otherFields } = block;
                  const hasOtherFields = Object.keys(otherFields).length > 0;
                  const hasHiddenData = extras != null || hasOtherFields;
                  const hiddenPayload = {
                    ...(extras != null ? { extras } : {}),
                    ...(hasOtherFields ? { details: otherFields } : {}),
                  };

                  return (
                    <div key={`${message.id}-${index}`} className="space-y-3">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {toDisplayString(text ?? block)}
                      </ReactMarkdown>

                      {typeof type === "string" && (
                        <div className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                          {type}
                        </div>
                      )}

                      {hasHiddenData && (
                        <details className="rounded-xl border border-border/40 bg-background/50 backdrop-blur-sm px-4 py-3 text-xs shadow-sm group/metadata">
                          <summary className="cursor-pointer select-none text-muted-foreground font-medium hover:text-foreground transition-colors flex items-center gap-2">
                            <span>Technical Details</span>
                            <div className="h-px flex-1 bg-border/40" />
                          </summary>
                          <pre className="mt-3 overflow-x-auto whitespace-pre-wrap rounded-lg bg-muted/50 p-3 text-[11px] leading-relaxed border border-border/20 text-muted-foreground">
                            {JSON.stringify(hiddenPayload, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {markdownContent}
              </ReactMarkdown>
            )}
          </div>

          {sources.length > 0 && (
            <>
              <div className="not-prose rounded-lg border border-border/60 bg-background/70 p-3 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    <Quote className="h-3.5 w-3.5" />
                    Sources
                    <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                      {sources.length}
                    </Badge>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEvidenceOpen(true)}
                    className="w-full justify-center sm:w-auto"
                  >
                    <PanelRightOpen className="h-3.5 w-3.5" />
                    Evidence
                  </Button>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {sources.slice(0, 4).map((source, index) => (
                    <button
                      key={source.id ?? `${getSourceTitle(source, index)}-${index}`}
                      type="button"
                      onClick={() => setIsEvidenceOpen(true)}
                      className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                    >
                      <FileText className="h-3.5 w-3.5 shrink-0 text-primary" />
                      <span className="truncate">
                        {getSourceTitle(source, index)}
                      </span>
                      {source.page && (
                        <span className="shrink-0 text-muted-foreground">
                          p. {source.page}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <Sheet open={isEvidenceOpen} onOpenChange={setIsEvidenceOpen}>
                <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
                  <SheetHeader className="border-b px-5 py-4">
                    <SheetTitle>Supporting Evidence</SheetTitle>
                    <SheetDescription>
                      Source chunks retrieved for this response.
                    </SheetDescription>
                  </SheetHeader>

                  <div className="space-y-4 px-5 pb-6">
                    {sources.map((source, index) => (
                      <div
                        key={source.id ?? `${getSourceTitle(source, index)}-${index}`}
                        className="rounded-lg border border-border bg-muted/20 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-2 text-sm font-semibold">
                              <FileText className="h-4 w-4 shrink-0 text-primary" />
                              <span className="truncate">
                                {getSourceTitle(source, index)}
                              </span>
                            </div>
                            {getSourceMeta(source) && (
                              <div className="text-xs text-muted-foreground">
                                {getSourceMeta(source)}
                              </div>
                            )}
                          </div>
                          <Badge variant="outline" className="shrink-0">
                            #{source.rank ?? index + 1}
                          </Badge>
                        </div>

                        {source.excerpt && (
                          <p className="mt-3 text-sm leading-relaxed text-foreground/85">
                            {source.excerpt}
                          </p>
                        )}

                        {source.metadata &&
                          Object.keys(source.metadata).length > 0 && (
                            <details className="mt-3 text-xs">
                              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                                Metadata
                              </summary>
                              <pre className="mt-2 max-h-48 overflow-auto rounded-md border bg-background p-3 text-[11px] text-muted-foreground">
                                {JSON.stringify(source.metadata, null, 2)}
                              </pre>
                            </details>
                          )}
                      </div>
                    ))}
                  </div>
                </SheetContent>
              </Sheet>
            </>
          )}
        </div>
      </div>
    </div>
  );
});
