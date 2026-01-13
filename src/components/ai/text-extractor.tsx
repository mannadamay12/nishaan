"use client";

import { useState } from "react";
import { Loader2, Sparkles, X, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

interface TextExtractorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveUrls: (urls: string[]) => Promise<void>;
}

export function TextExtractor({
  open,
  onOpenChange,
  onSaveUrls,
}: TextExtractorProps) {
  const [text, setText] = useState("");
  const [extractedUrls, setExtractedUrls] = useState<string[]>([]);
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExtract() {
    if (!text.trim()) return;

    setIsExtracting(true);
    setError(null);

    try {
      const response = await fetch("/api/bookmarks/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error("Failed to extract URLs");
      }

      const { urls } = await response.json();
      setExtractedUrls(urls);
      setSelectedUrls(new Set(urls));
    } catch (e) {
      setError("Failed to extract URLs. Please try again.");
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
    setText("");
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
            <Sparkles className="h-5 w-5" />
            Extract URLs from Text
          </DialogTitle>
          <DialogDescription>
            Paste text containing URLs and we&apos;ll extract them for you.
          </DialogDescription>
        </DialogHeader>

        {extractedUrls.length === 0 ? (
          <div className="space-y-4">
            <Textarea
              placeholder="Paste your text here... We'll find all the URLs."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="min-h-[200px] resize-none"
            />

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleExtract}
                disabled={!text.trim() || isExtracting}
              >
                {isExtracting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Extracting...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
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
                Found {extractedUrls.length} URL{extractedUrls.length !== 1 && "s"}
              </p>
              <Button variant="ghost" size="sm" onClick={toggleAll}>
                {selectedUrls.size === extractedUrls.length
                  ? "Deselect all"
                  : "Select all"}
              </Button>
            </div>

            <div className="max-h-[300px] overflow-y-auto space-y-2 border rounded-md p-2">
              {extractedUrls.map((url, index) => (
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
              ))}
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

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
                      <Check className="h-4 w-4 mr-2" />
                      Save {selectedUrls.size} bookmark{selectedUrls.size !== 1 && "s"}
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
