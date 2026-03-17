import { cn } from "@/lib/utils";
import { Message } from "@/lib/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { BrainCircuit, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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
  const markdownContent =
    typeof message.content === "string"
      ? message.content
      : JSON.stringify(message.content, null, 2);
  const structuredBlocks = !isUser
    ? parseStructuredBlocks(markdownContent)
    : null;

  return (
    <div
      className={cn(
        "flex w-full gap-4 p-4",
        isUser ? "bg-background" : "bg-muted/50",
      )}
    >
      <Avatar className="h-8 w-8 shrink-0">
        {isUser ? (
          <>
            <AvatarFallback className="bg-primary/10">
              <User size={16} />
            </AvatarFallback>
          </>
        ) : (
          <>
            <AvatarFallback className="bg-primary text-primary-foreground">
              <BrainCircuit size={16} />
            </AvatarFallback>
          </>
        )}
      </Avatar>

      <div className="flex-1 space-y-2 overflow-hidden">
        <div className="font-semibold text-sm flex items-center gap-2">
          {isUser ? "You" : "Docling AI"}
          <span className="text-xs text-muted-foreground font-normal">
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>

        <div className="text-sm prose dark:prose-invert prose-p:leading-relaxed prose-pre:p-0 max-w-none wrap-break-word">
          {structuredBlocks ? (
            <div className="space-y-3 not-prose">
              {structuredBlocks.map((block, index) => {
                const { type, text, extras, ...otherFields } = block;
                const hasOtherFields = Object.keys(otherFields).length > 0;
                const hasHiddenData = extras != null || hasOtherFields;
                const hiddenPayload = {
                  ...(extras != null ? { extras } : {}),
                  ...(hasOtherFields ? { details: otherFields } : {}),
                };

                return (
                  <div key={`${message.id}-${index}`} className="space-y-2">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {toDisplayString(text ?? block)}
                    </ReactMarkdown>

                    {typeof type === "string" && (
                      <div className="text-[11px] text-muted-foreground">
                        Type: {type}
                      </div>
                    )}

                    {hasHiddenData && (
                      <details className="rounded-md border border-border/60 bg-muted/40 px-3 py-2 text-xs">
                        <summary className="cursor-pointer select-none text-muted-foreground">
                          Show metadata
                        </summary>
                        <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded bg-background/80 p-2 text-[11px] leading-relaxed">
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
  );
}
