import { cn } from "@/lib/utils";
import { Message } from "@/lib/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { BrainCircuit, User, Copy, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface MessageBubbleProps {
  message: Message;
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

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);
  
  const markdownContent =
    typeof message.content === "string"
      ? message.content
      : JSON.stringify(message.content, null, 2);
  const structuredBlocks = !isUser
    ? parseStructuredBlocks(markdownContent)
    : null;

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
        <Avatar className={cn(
          "h-10 w-10 shrink-0 border-2 shadow-sm",
          isUser ? "border-primary/20" : "border-primary/40"
        )}>
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
              <span className="text-[10px] text-muted-foreground/60 font-medium uppercase tracking-widest">
                {new Date(message.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={copyToClipboard}
            >
              {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
            </Button>
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
        </div>
      </div>
    </div>
  );
}
