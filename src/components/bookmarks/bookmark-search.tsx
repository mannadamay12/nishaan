"use client";

import { useCallback, useState } from "react";
import {
  CommandDialog,
  CommandInput,
} from "@/components/ui/command";

interface BookmarkSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BookmarkSearch({ open, onOpenChange }: BookmarkSearchProps) {
  const [search, setSearch] = useState("");

  const handleOpenChange = useCallback((newOpen: boolean) => {
    onOpenChange(newOpen);
    if (!newOpen) setSearch("");
  }, [onOpenChange]);

  return (
    <CommandDialog
      open={open}
      onOpenChange={handleOpenChange}
      title="Search Bookmarks"
      description="Search through your bookmarks"
    >
      <CommandInput
        placeholder="Search bookmarks..."
        value={search}
        onValueChange={setSearch}
        onClose={() => handleOpenChange(false)}
      />
    </CommandDialog>
  );
}
