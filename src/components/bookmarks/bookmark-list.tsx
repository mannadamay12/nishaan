"use client";

import { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
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
import { SortableItem } from "@/components/ui/sortable-item";
import { BookmarkCard } from "./bookmark-card";
import { BookmarkForm } from "./bookmark-form";
import type { Bookmark, Group } from "@/types/database";

interface BookmarkListProps {
  bookmarks: Bookmark[];
  groups: Group[];
  onUpdate: (id: string, data: { title: string; description: string; group_id: string | null }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onToggleFavorite: (id: string, isFavorite: boolean) => Promise<void>;
  onReorder?: (orderedIds: string[]) => Promise<void>;
  onArchive?: (id: string) => Promise<void>;
  onRestore?: (id: string) => Promise<void>;
  isArchiveView?: boolean;
  selectionMode?: boolean;
  selectedIds?: Set<string>;
  onToggleSelection?: (id: string) => void;
  onAddTag?: (id: string, tag: string) => Promise<void>;
  onRemoveTag?: (id: string, tag: string) => Promise<void>;
}

export function BookmarkList({
  bookmarks,
  groups,
  onUpdate,
  onDelete,
  onToggleFavorite,
  onReorder,
  onArchive,
  onRestore,
  isArchiveView = false,
  selectionMode = false,
  selectedIds = new Set(),
  onToggleSelection,
  onAddTag,
  onRemoveTag,
}: BookmarkListProps) {
  const [mounted, setMounted] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [deletingBookmark, setDeletingBookmark] = useState<Bookmark | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = bookmarks.findIndex((b) => b.id === active.id);
      const newIndex = bookmarks.findIndex((b) => b.id === over.id);
      const newOrder = arrayMove(bookmarks, oldIndex, newIndex);
      onReorder?.(newOrder.map((b) => b.id));
    }
  }

  if (bookmarks.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-muted-foreground">
          {isArchiveView
            ? "No archived bookmarks."
            : "No bookmarks yet. Add your first bookmark above."}
        </p>
      </div>
    );
  }

  return (
    <>
      {mounted && onReorder ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={bookmarks.map((b) => b.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {bookmarks.map((bookmark) => (
                <SortableItem key={bookmark.id} id={bookmark.id}>
                  <BookmarkCard
                    bookmark={bookmark}
                    group={getGroup(bookmark.group_id)}
                    onEdit={setEditingBookmark}
                    onDelete={setDeletingBookmark}
                    onToggleFavorite={(b) => onToggleFavorite(b.id, !b.is_favorite)}
                    onArchive={onArchive ? (b) => onArchive(b.id) : undefined}
                    onRestore={onRestore ? (b) => onRestore(b.id) : undefined}
                    isArchived={isArchiveView}
                    selectionMode={selectionMode}
                    selected={selectedIds.has(bookmark.id)}
                    onToggleSelection={onToggleSelection ? () => onToggleSelection(bookmark.id) : undefined}
                    onAddTag={onAddTag ? (b, tag) => onAddTag(b.id, tag) : undefined}
                    onRemoveTag={onRemoveTag ? (b, tag) => onRemoveTag(b.id, tag) : undefined}
                  />
                </SortableItem>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="space-y-2">
          {bookmarks.map((bookmark) => (
            <BookmarkCard
              key={bookmark.id}
              bookmark={bookmark}
              group={getGroup(bookmark.group_id)}
              onEdit={setEditingBookmark}
              onDelete={setDeletingBookmark}
              onToggleFavorite={(b) => onToggleFavorite(b.id, !b.is_favorite)}
              onArchive={onArchive ? (b) => onArchive(b.id) : undefined}
              onRestore={onRestore ? (b) => onRestore(b.id) : undefined}
              isArchived={isArchiveView}
              selectionMode={selectionMode}
              selected={selectedIds.has(bookmark.id)}
              onToggleSelection={onToggleSelection ? () => onToggleSelection(bookmark.id) : undefined}
              onAddTag={onAddTag ? (b, tag) => onAddTag(b.id, tag) : undefined}
              onRemoveTag={onRemoveTag ? (b, tag) => onRemoveTag(b.id, tag) : undefined}
            />
          ))}
        </div>
      )}

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
