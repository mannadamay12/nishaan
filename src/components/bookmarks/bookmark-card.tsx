"use client";

import { useState } from "react";
import { Archive, BookMarked, ExternalLink, MoreHorizontal, Pencil, RotateCcw, Square, CheckSquare, X } from "lucide-react";
import { HeartIcon } from "@/components/ui/heart";
import { DeleteIcon } from "@/components/ui/delete";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Bookmark, Group } from "@/types/database";

interface BookmarkCardProps {
  bookmark: Bookmark;
  group?: Group | null;
  onEdit: (bookmark: Bookmark) => void;
  onDelete: (bookmark: Bookmark) => void;
  onToggleFavorite: (bookmark: Bookmark) => void;
  onArchive?: (bookmark: Bookmark) => void;
  onRestore?: (bookmark: Bookmark) => void;
  isArchived?: boolean;
  selectionMode?: boolean;
  selected?: boolean;
  onToggleSelection?: () => void;
  onAddTag?: (bookmark: Bookmark, tag: string) => void;
  onRemoveTag?: (bookmark: Bookmark, tag: string) => void;
}

export function BookmarkCard({
  bookmark,
  group,
  onEdit,
  onDelete,
  onToggleFavorite,
  onArchive,
  onRestore,
  isArchived = false,
  selectionMode = false,
  selected = false,
  onToggleSelection,
  onAddTag,
  onRemoveTag,
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
    <div
      className={`group flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/30 transition-colors ${
        selected ? "ring-2 ring-primary" : ""
      }`}
      onClick={selectionMode && onToggleSelection ? onToggleSelection : undefined}
    >
      {/* Selection checkbox */}
      {selectionMode && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelection?.();
          }}
          className="flex-shrink-0 mt-0.5"
        >
          {selected ? (
            <CheckSquare className="h-5 w-5 text-primary" />
          ) : (
            <Square className="h-5 w-5 text-muted-foreground" />
          )}
        </button>
      )}

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
        {/* Tags */}
        {bookmark.tags && bookmark.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {bookmark.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary"
              >
                {tag}
                {onRemoveTag && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onRemoveTag(bookmark, tag);
                    }}
                    className="hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Favorite indicator (always visible when favorited) */}
      {bookmark.is_favorite && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 flex-shrink-0 text-red-500"
          onClick={() => onToggleFavorite(bookmark)}
        >
          <HeartIcon size={16} className="[&_svg]:fill-current" />
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
            <HeartIcon size={16} />
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
            {onAddTag && !bookmark.tags?.includes("read-later") && (
              <DropdownMenuItem onClick={() => onAddTag(bookmark, "read-later")}>
                <BookMarked className="h-4 w-4 mr-2" />
                Read later
              </DropdownMenuItem>
            )}
            {isArchived && onRestore ? (
              <DropdownMenuItem onClick={() => onRestore(bookmark)}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Restore
              </DropdownMenuItem>
            ) : onArchive ? (
              <DropdownMenuItem onClick={() => onArchive(bookmark)}>
                <Archive className="h-4 w-4 mr-2" />
                Archive
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem
              onClick={() => onDelete(bookmark)}
              className="text-destructive"
            >
              <DeleteIcon size={16} className="mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
