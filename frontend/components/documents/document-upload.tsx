"use client";

import { useCallback, useState } from "react";
import { FileRejection, useDropzone } from "react-dropzone";
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  Loader2,
  UploadCloud,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

interface DocumentUploadProps {
  onUploadSuccess: () => void;
}

interface UploadApiResult {
  filename: string;
  status: "indexed" | "unchanged" | "rejected" | "error" | string;
  chunks_added?: number;
  error?: string;
}

interface UploadApiResponse {
  results?: UploadApiResult[];
  total_indexed?: number;
  total_skipped?: number;
  total_files?: number;
}

interface UploadCard {
  id: string;
  name: string;
  size?: number;
  status: "queued" | "uploading" | "processing" | "indexed" | "unchanged" | "rejected" | "error";
  progress: number;
  message?: string;
}

function formatBytes(bytes?: number): string {
  if (!bytes) return "";

  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function parseUploadError(responseText: string, status: number): string {
  if (!responseText) return `Upload failed (${status})`;

  try {
    const parsed = JSON.parse(responseText) as { detail?: unknown; error?: unknown };
    if (typeof parsed.detail === "string") return parsed.detail;
    if (typeof parsed.error === "string") return parsed.error;
  } catch {
    return responseText;
  }

  return responseText;
}

function getRejectedMessage(rejection: FileRejection): string {
  const firstError = rejection.errors[0];
  if (!firstError) return "File rejected.";
  return firstError.message;
}

function resultToCardStatus(result: UploadApiResult): UploadCard["status"] {
  if (result.status === "indexed") return "indexed";
  if (result.status === "unchanged") return "unchanged";
  if (result.status === "rejected") return "rejected";
  return "error";
}

function resultToMessage(result: UploadApiResult): string {
  if (result.status === "indexed") {
    return `${result.chunks_added ?? 0} chunks indexed`;
  }

  if (result.status === "unchanged") {
    return "Already indexed. Skipped duplicate.";
  }

  return result.error || "Could not process this file.";
}

function StatusIcon({ status }: { status: UploadCard["status"] }) {
  if (status === "indexed") {
    return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
  }

  if (status === "unchanged") {
    return <AlertTriangle className="h-4 w-4 text-amber-600" />;
  }

  if (status === "rejected" || status === "error") {
    return <XCircle className="h-4 w-4 text-destructive" />;
  }

  if (status === "uploading" || status === "processing") {
    return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
  }

  return <FileText className="h-4 w-4 text-muted-foreground" />;
}

export function DocumentUpload({ onUploadSuccess }: DocumentUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadCards, setUploadCards] = useState<UploadCard[]>([]);
  const invalidateSessions = useAppStore((s) => s.invalidateSessions);

  const onDrop = useCallback(
    async (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      const rejectedCards: UploadCard[] = fileRejections.map((rejection) => ({
        id: `${rejection.file.name}-${rejection.file.size}-rejected`,
        name: rejection.file.name,
        size: rejection.file.size,
        status: "rejected",
        progress: 0,
        message: getRejectedMessage(rejection),
      }));

      if (acceptedFiles.length === 0) {
        setUploadCards(rejectedCards);
        if (rejectedCards.length > 0) toast.error("No files were accepted");
        return;
      }

      const formData = new FormData();
      for (const file of acceptedFiles) {
        formData.append("files", file);
      }

      setIsUploading(true);
      setProgress(0);
      setUploadCards([
        ...acceptedFiles.map((file) => ({
          id: `${file.name}-${file.size}-${file.lastModified}`,
          name: file.name,
          size: file.size,
          status: "queued" as const,
          progress: 0,
        })),
        ...rejectedCards,
      ]);

      try {
        const xhr = new XMLHttpRequest();

        const uploadResponse = await new Promise<UploadApiResponse>((resolve, reject) => {
          xhr.upload.addEventListener("progress", (e) => {
            if (e.lengthComputable) {
              const nextProgress = Math.round((e.loaded / e.total) * 100);
              setProgress(nextProgress);
              setUploadCards((cards) =>
                cards.map((card) =>
                  card.status === "queued" || card.status === "uploading"
                    ? {
                        ...card,
                        status: nextProgress >= 100 ? "processing" : "uploading",
                        progress: nextProgress,
                      }
                    : card,
                ),
              );
            }
          });

          xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                resolve(JSON.parse(xhr.responseText) as UploadApiResponse);
              } catch {
                resolve({});
              }
            } else {
              reject(new Error(parseUploadError(xhr.responseText, xhr.status)));
            }
          });

          xhr.addEventListener("error", () => reject(new Error("Network error")));

          const baseUrl =
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
          xhr.open("POST", `${baseUrl}/upload`);
          xhr.send(formData);
        });

        const results = uploadResponse.results ?? [];
        setUploadCards((cards) =>
          cards.map((card) => {
            const result = results.find((item) => item.filename === card.name);
            if (!result || card.status === "rejected") return card;

            return {
              ...card,
              status: resultToCardStatus(result),
              progress: 100,
              message: resultToMessage(result),
            };
          }),
        );

        const indexed = uploadResponse.total_indexed ?? 0;
        const skipped = uploadResponse.total_skipped ?? 0;
        const failed = results.filter((result) =>
          ["rejected", "error"].includes(result.status),
        ).length + rejectedCards.length;

        if (indexed > 0) toast.success(`${indexed} file${indexed === 1 ? "" : "s"} indexed`);
        if (skipped > 0) toast.info(`${skipped} duplicate file${skipped === 1 ? "" : "s"} skipped`);
        if (failed > 0) toast.error(`${failed} file${failed === 1 ? "" : "s"} failed`);

        onUploadSuccess();
        invalidateSessions();
      } catch (error) {
        console.error(error);
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        setUploadCards((cards) =>
          cards.map((card) =>
            card.status === "queued" ||
            card.status === "uploading" ||
            card.status === "processing"
              ? {
                  ...card,
                  status: "error",
                  message: errorMessage,
                }
              : card,
          ),
        );
        toast.error(`Upload failed: ${errorMessage}`);
      } finally {
        setIsUploading(false);
      }
    },
    [onUploadSuccess, invalidateSessions],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 10,
    disabled: isUploading,
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          "cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors",
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/30 hover:bg-muted/50",
          isUploading && "cursor-not-allowed opacity-80",
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center gap-4">
          {isUploading ? (
            <div className="flex w-full max-w-xs flex-col items-center gap-3">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">
                {progress >= 100 ? "Processing" : `${progress}%`}
              </span>
            </div>
          ) : (
            <div className="rounded-full bg-primary/10 p-3">
              <UploadCloud className="h-6 w-6 text-primary" />
            </div>
          )}
          <div>
            {isUploading ? (
              <p className="text-sm font-medium">Uploading documents...</p>
            ) : (
              <>
                <p className="text-sm font-medium">
                  Click or drag files here to upload
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Supports PDF, DOCX, TXT, MD, HTML, and PPTX files
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {uploadCards.length > 0 && (
        <div className="grid gap-2">
          {uploadCards.map((card) => (
            <div
              key={card.id}
              className="rounded-lg border bg-background p-3 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <StatusIcon status={card.status} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{card.name}</p>
                      {formatBytes(card.size) && (
                        <p className="text-xs text-muted-foreground">
                          {formatBytes(card.size)}
                        </p>
                      )}
                    </div>
                    <span
                      className={cn(
                        "w-fit rounded-md px-2 py-0.5 text-xs font-medium capitalize",
                        card.status === "indexed" &&
                          "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
                        card.status === "unchanged" &&
                          "bg-amber-500/10 text-amber-700 dark:text-amber-400",
                        (card.status === "rejected" || card.status === "error") &&
                          "bg-destructive/10 text-destructive",
                        (card.status === "queued" ||
                          card.status === "uploading" ||
                          card.status === "processing") &&
                          "bg-primary/10 text-primary",
                      )}
                    >
                      {card.status}
                    </span>
                  </div>

                  {(card.status === "uploading" || card.status === "processing") && (
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-300"
                        style={{ width: `${card.progress}%` }}
                      />
                    </div>
                  )}

                  {card.message && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {card.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
