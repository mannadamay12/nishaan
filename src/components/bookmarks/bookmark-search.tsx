"use client";

import { useCallback } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { ExternalLink, Star } from "lucide-react";
import type { Bookmark, Group } from "@/types/database";

interface BookmarkSearchProps {
  bookmarks: Bookmark[];
  groups: Group[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BookmarkSearch({ bookmarks, groups, open, onOpenChange }: BookmarkSearchProps) {

  const handleSelect = useCallback((url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
    onOpenChange(false);
  }, [onOpenChange]);

  const getGroupName = (groupId: string | null) => {
    if (!groupId) return null;
    return groups.find((g) => g.id === groupId)?.name;
  };

  const getGroupColor = (groupId: string | null) => {
    if (!groupId) return null;
    return groups.find((g) => g.id === groupId)?.color;
  };

  // Group bookmarks by favorites and rest
  const favorites = bookmarks.filter((b) => b.is_favorite);
  const others = bookmarks.filter((b) => !b.is_favorite);

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Search Bookmarks"
      description="Search through your bookmarks"
    >
      <CommandInput placeholder="Search bookmarks..." />
      <CommandList>
        <CommandEmpty>No bookmarks found.</CommandEmpty>

        {favorites.length > 0 && (
          <CommandGroup heading="Favorites">
            {favorites.map((bookmark) => (
              <CommandItem
                key={bookmark.id}
                value={`${bookmark.title} ${bookmark.url} ${bookmark.description}`}
                onSelect={() => handleSelect(bookmark.url)}
                className="flex items-center gap-3"
              >
                {bookmark.favicon_url ? (
                  <img
                    src={bookmark.favicon_url}
                    alt=""
                    className="h-4 w-4 rounded"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                )}
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="truncate font-medium">
                    {bookmark.title || bookmark.url}
                  </span>
                  {bookmark.title && (
                    <span className="text-xs text-muted-foreground truncate">
                      {new URL(bookmark.url).hostname}
                    </span>
                  )}
                </div>
                <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                {bookmark.group_id && (
                  <span
                    className="text-xs px-1.5 py-0.5 rounded"
                    style={{
                      backgroundColor: getGroupColor(bookmark.group_id) + "20",
                      color: getGroupColor(bookmark.group_id),
                    }}
                  >
                    {getGroupName(bookmark.group_id)}
                  </span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {others.length > 0 && (
          <CommandGroup heading="All Bookmarks">
            {others.map((bookmark) => (
              <CommandItem
                key={bookmark.id}
                value={`${bookmark.title} ${bookmark.url} ${bookmark.description}`}
                onSelect={() => handleSelect(bookmark.url)}
                className="flex items-center gap-3"
              >
                {bookmark.favicon_url ? (
                  <img
                    src={bookmark.favicon_url}
                    alt=""
                    className="h-4 w-4 rounded"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                )}
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="truncate font-medium">
                    {bookmark.title || bookmark.url}
                  </span>
                  {bookmark.title && (
                    <span className="text-xs text-muted-foreground truncate">
                      {new URL(bookmark.url).hostname}
                    </span>
                  )}
                </div>
                {bookmark.group_id && (
                  <span
                    className="text-xs px-1.5 py-0.5 rounded"
                    style={{
                      backgroundColor: getGroupColor(bookmark.group_id) + "20",
                      color: getGroupColor(bookmark.group_id),
                    }}
                  >
                    {getGroupName(bookmark.group_id)}
                  </span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
