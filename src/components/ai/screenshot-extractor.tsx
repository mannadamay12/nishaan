"use client";

import { useState, useCallback } from "react";
import { Loader2, ImageIcon, X, ExternalLink, Upload } from "lucide-react";
import { CheckIcon } from "@/components/ui/check";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

interface ScreenshotExtractorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveUrls: (urls: string[]) => Promise<void>;
}

export function ScreenshotExtractor({
  open,
  onOpenChange,
  onSaveUrls,
}: ScreenshotExtractorProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>("image/png");
  const [extractedUrls, setExtractedUrls] = useState<string[]>([]);
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file");
      return;
    }

    setMimeType(file.type);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setImagePreview(dataUrl);
      // Extract base64 without the data URL prefix
      const base64 = dataUrl.split(",")[1];
      setImageBase64(base64);
    };
    reader.readAsDataURL(file);
  }, []);

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData.items;
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            processFile(file);
            break;
          }
        }
      }
    },
    [processFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) {
        processFile(file);
      }
    },
    [processFile]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        processFile(file);
      }
    },
    [processFile]
  );

  async function handleExtract() {
    if (!imageBase64) return;

    setIsExtracting(true);
    setError(null);

    try {
      const response = await fetch("/api/bookmarks/screenshot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageBase64, mimeType }),
      });

      if (!response.ok) {
        throw new Error("Failed to extract URLs");
      }

      const { urls } = await response.json();
      setExtractedUrls(urls);
      setSelectedUrls(new Set(urls));
    } catch (e) {
      setError("Failed to extract URLs from screenshot. Please try again.");
      console.error(e);
    } finally {
      setIsExtracting(false);
    }
  }

  async function handleSave() {
    if (selectedUrls.size === 0) return;

    setIsSaving(true);
    try {
      await onSaveUrls(Array.from(selectedUrls));
      handleClose();
    } catch (e) {
      setError("Failed to save bookmarks. Please try again.");
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  }

  function handleClose() {
    setImagePreview(null);
    setImageBase64(null);
    setExtractedUrls([]);
    setSelectedUrls(new Set());
    setError(null);
    onOpenChange(false);
  }

  function toggleUrl(url: string) {
    const newSelected = new Set(selectedUrls);
    if (newSelected.has(url)) {
      newSelected.delete(url);
    } else {
      newSelected.add(url);
    }
    setSelectedUrls(newSelected);
  }

  function toggleAll() {
    if (selectedUrls.size === extractedUrls.length) {
      setSelectedUrls(new Set());
    } else {
      setSelectedUrls(new Set(extractedUrls));
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Extract URLs from Screenshot
          </DialogTitle>
          <DialogDescription>
            Paste or upload a screenshot and we&apos;ll extract URLs from it.
          </DialogDescription>
        </DialogHeader>

        {extractedUrls.length === 0 ? (
          <div className="space-y-4">
            {!imagePreview ? (
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25"
                }`}
                onPaste={handlePaste}
                onDrop={handleDrop}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                tabIndex={0}
              >
                <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground mb-2">
                  Paste screenshot (Cmd+V) or drag & drop
                </p>
                <label>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileInput}
                  />
                  <Button variant="outline" size="sm" asChild>
                    <span>Or choose file</span>
                  </Button>
                </label>
              </div>
            ) : (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Screenshot preview"
                  className="w-full max-h-[300px] object-contain rounded-lg border"
                />
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    setImagePreview(null);
                    setImageBase64(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleExtract}
                disabled={!imageBase64 || isExtracting}
              >
                {isExtracting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Extracting...
                  </>
                ) : (
                  <>
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Extract URLs
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Found {extractedUrls.length} URL
                {extractedUrls.length !== 1 && "s"}
              </p>
              <Button variant="ghost" size="sm" onClick={toggleAll}>
                {selectedUrls.size === extractedUrls.length
                  ? "Deselect all"
                  : "Select all"}
              </Button>
            </div>

            <div className="max-h-[300px] overflow-y-auto space-y-2 border rounded-md p-2">
              {extractedUrls.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No URLs found in this screenshot
                </p>
              ) : (
                extractedUrls.map((url, index) => (
                  <label
                    key={index}
                    className="flex items-center gap-3 p-2 rounded-md hover:bg-accent cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedUrls.has(url)}
                      onCheckedChange={() => toggleUrl(url)}
                    />
                    <span className="flex-1 text-sm truncate">{url}</span>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </label>
                ))
              )}
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => {
                  setExtractedUrls([]);
                  setSelectedUrls(new Set());
                }}
              >
                Back
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={selectedUrls.size === 0 || isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckIcon size={16} className="mr-2" />
                      Save {selectedUrls.size} bookmark
                      {selectedUrls.size !== 1 && "s"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
