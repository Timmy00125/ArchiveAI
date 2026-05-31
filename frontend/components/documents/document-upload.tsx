"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/lib/store";

interface DocumentUploadProps {
  onUploadSuccess: () => void;
}

export function DocumentUpload({ onUploadSuccess }: DocumentUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const invalidateSessions = useAppStore((s) => s.invalidateSessions);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      const formData = new FormData();
      for (const file of acceptedFiles) {
        formData.append("files", file);
      }

      setIsUploading(true);
      setProgress(0);

      try {
        const xhr = new XMLHttpRequest();

        await new Promise<void>((resolve, reject) => {
          xhr.upload.addEventListener("progress", (e) => {
            if (e.lengthComputable) {
              setProgress(Math.round((e.loaded / e.total) * 100));
            }
          });

          xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              reject(new Error(xhr.responseText || `Upload failed (${xhr.status})`));
            }
          });

          xhr.addEventListener("error", () => reject(new Error("Network error")));

          const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
          xhr.open("POST", `${baseUrl}/upload`);
          xhr.send(formData);
        });

        const fileNames = acceptedFiles.map((f) => f.name).join(", ");
        toast.success(
          `${acceptedFiles.length > 1 ? `${acceptedFiles.length} files` : fileNames} uploaded successfully!`,
        );
        onUploadSuccess();
        invalidateSessions();
      } catch (error) {
        console.error(error);
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        toast.error(`Upload failed: ${errorMessage}`);
      } finally {
        setIsUploading(false);
        setProgress(0);
      }
    },
    [onUploadSuccess, invalidateSessions],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 10,
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
        ${isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/30 hover:bg-muted/50"}
      `}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center justify-center gap-4">
        {isUploading ? (
          <div className="flex flex-col items-center gap-3 w-full max-w-xs">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground">{progress}%</span>
          </div>
        ) : (
          <div className="bg-primary/10 p-3 rounded-full">
            <UploadCloud className="h-6 w-6 text-primary" />
          </div>
        )}
        <div>
          {isUploading ? (
            <p className="text-sm font-medium">Processing your documents...</p>
          ) : (
            <>
              <p className="text-sm font-medium">
                Click or drag files here to upload
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Supports PDF, DOCX, TXT, etc. (up to 10 files)
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
