"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { BookmarkCard } from "./bookmark-card";
import { BookmarkForm } from "./bookmark-form";
import type { Bookmark, Group } from "@/types/database";

interface BookmarkListProps {
  bookmarks: Bookmark[];
  groups: Group[];
  onUpdate: (id: string, data: { title: string; description: string; group_id: string | null }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onToggleFavorite: (id: string, isFavorite: boolean) => Promise<void>;
}

export function BookmarkList({
  bookmarks,
  groups,
  onUpdate,
  onDelete,
  onToggleFavorite,
}: BookmarkListProps) {
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [deletingBookmark, setDeletingBookmark] = useState<Bookmark | null>(null);

  const getGroup = (groupId: string | null) => {
    if (!groupId) return null;
    return groups.find((g) => g.id === groupId) ?? null;
  };

  async function handleUpdate(data: { title: string; description: string; group_id: string | null }) {
    if (editingBookmark) {
      await onUpdate(editingBookmark.id, data);
      setEditingBookmark(null);
    }
  }

  async function handleDelete() {
    if (deletingBookmark) {
      await onDelete(deletingBookmark.id);
      setDeletingBookmark(null);
    }
  }

  if (bookmarks.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-muted-foreground">
          No bookmarks yet. Add your first bookmark above.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {bookmarks.map((bookmark) => (
          <BookmarkCard
            key={bookmark.id}
            bookmark={bookmark}
            group={getGroup(bookmark.group_id)}
            onEdit={setEditingBookmark}
            onDelete={setDeletingBookmark}
            onToggleFavorite={(b) => onToggleFavorite(b.id, !b.is_favorite)}
          />
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingBookmark} onOpenChange={() => setEditingBookmark(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Bookmark</DialogTitle>
          </DialogHeader>
          {editingBookmark && (
            <BookmarkForm
              bookmark={editingBookmark}
              groups={groups}
              onSubmit={handleUpdate}
              onCancel={() => setEditingBookmark(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingBookmark} onOpenChange={() => setDeletingBookmark(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Bookmark</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this bookmark?
              {deletingBookmark?.title && (
                <span className="block mt-2 font-medium text-foreground">
                  {deletingBookmark.title}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
