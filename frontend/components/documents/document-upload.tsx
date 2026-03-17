"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, File, Loader2 } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";
import { toast } from "sonner";

interface DocumentUploadProps {
  onUploadSuccess: () => void;
}

export function DocumentUpload({ onUploadSuccess }: DocumentUploadProps) {
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];
      const formData = new FormData();
      // Backend expects multipart field name `files` (supports one or more uploads).
      formData.append("files", file);

      setIsUploading(true);

      // We cannot use fetchApi directly because we need to send FormData
      // without the Content-Type JSON header
      try {
        const response = await fetch(`${API_BASE_URL}/upload`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error(await response.text());
        }

        toast.success(`${file.name} uploaded successfully!`);
        onUploadSuccess();
      } catch (error) {
        console.error(error);
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        toast.error(`Upload failed: ${errorMessage}`);
      } finally {
        setIsUploading(false);
      }
    },
    [onUploadSuccess],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1, // Focus on single file upload for now
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
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
        ) : (
          <div className="bg-primary/10 p-3 rounded-full">
            <UploadCloud className="h-6 w-6 text-primary" />
          </div>
        )}
        <div>
          {isUploading ? (
            <p className="text-sm font-medium">Processing your document...</p>
          ) : (
            <>
              <p className="text-sm font-medium">
                Click or drag a file here to upload
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Supports PDF, DOCX, TXT, etc.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
