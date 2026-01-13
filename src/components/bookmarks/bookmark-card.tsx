"use client";

import { useState } from "react";
import { ExternalLink, MoreHorizontal, Pencil, Trash2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Bookmark, Group } from "@/types/database";

interface BookmarkCardProps {
  bookmark: Bookmark;
  group?: Group | null;
  onEdit: (bookmark: Bookmark) => void;
  onDelete: (bookmark: Bookmark) => void;
  onToggleFavorite: (bookmark: Bookmark) => void;
}

export function BookmarkCard({
  bookmark,
  group,
  onEdit,
  onDelete,
  onToggleFavorite,
}: BookmarkCardProps) {
  const [imageError, setImageError] = useState(false);

  const hostname = (() => {
    try {
      return new URL(bookmark.url).hostname.replace("www.", "");
    } catch {
      return bookmark.url;
    }
  })();

  return (
    <div className="group flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/30 transition-colors">
      {/* Favicon */}
      <div className="flex-shrink-0 mt-0.5">
        {bookmark.favicon_url && !imageError ? (
          <img
            src={bookmark.favicon_url}
            alt=""
            className="h-5 w-5 rounded"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="h-5 w-5 rounded bg-muted flex items-center justify-center">
            <ExternalLink className="h-3 w-3 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <a
          href={bookmark.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block group/link"
        >
          <h3 className="text-sm font-medium truncate group-hover/link:underline">
            {bookmark.title || hostname}
          </h3>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {hostname}
            {group && (
              <>
                <span className="mx-1">·</span>
                <span
                  className="inline-flex items-center gap-1"
                  style={{ color: group.color }}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: group.color }}
                  />
                  {group.name}
                </span>
              </>
            )}
          </p>
        </a>
        {bookmark.description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {bookmark.description}
          </p>
        )}
      </div>

      {/* Favorite indicator (always visible when favorited) */}
      {bookmark.is_favorite && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 flex-shrink-0"
          onClick={() => onToggleFavorite(bookmark)}
        >
          <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
        </Button>
      )}

      {/* Actions (visible on hover) */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {!bookmark.is_favorite && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onToggleFavorite(bookmark)}
          >
            <Star className="h-4 w-4" />
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(bookmark)}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(bookmark)}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
