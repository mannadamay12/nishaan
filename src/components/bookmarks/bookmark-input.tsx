"use client";

import { useState, forwardRef, useImperativeHandle, useRef } from "react";
import { Plus, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface BookmarkInputProps {
  onAdd: (url: string) => Promise<void>;
  disabled?: boolean;
}

export interface BookmarkInputHandle {
  focus: () => void;
}

export const BookmarkInput = forwardRef<BookmarkInputHandle, BookmarkInputProps>(
  function BookmarkInput({ onAdd, disabled }, ref) {
    const [url, setUrl] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
    }));

    async function handleSubmit(e: React.FormEvent) {
      e.preventDefault();
      if (!url.trim() || isLoading) return;

      let normalizedUrl = url.trim();

      // Add https:// if no protocol
      if (!normalizedUrl.match(/^https?:\/\//)) {
        normalizedUrl = "https://" + normalizedUrl;
      }

      // Basic URL validation
      try {
        new URL(normalizedUrl);
      } catch {
        return;
      }

      setIsLoading(true);
      try {
        await onAdd(normalizedUrl);
        setUrl("");
      } finally {
        setIsLoading(false);
      }
    }

    return (
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          ref={inputRef}
          type="text"
          placeholder="Paste URL or press ⌘N to add..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={disabled || isLoading}
          className="flex-1"
        />
        <Button type="submit" disabled={disabled || isLoading || !url.trim()}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
        </Button>
      </form>
    );
  }
);
