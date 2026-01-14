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
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plus, MoreHorizontal, Pencil } from "lucide-react";
import { DeleteIcon } from "@/components/ui/delete";
import { GripVerticalIcon } from "@/components/ui/grip-vertical";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { GroupForm } from "./group-form";
import { cn } from "@/lib/utils";
import type { Group } from "@/types/database";

interface SortableGroupItemProps {
  group: Group;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function SortableGroupItem({
  group,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
}: SortableGroupItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: group.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center gap-1 px-2 py-1.5 text-sm rounded-md transition-colors",
        isSelected
          ? "bg-accent text-accent-foreground"
          : "hover:bg-accent/50",
        isDragging && "opacity-50 z-50"
      )}
    >
      <button
        type="button"
        className="flex-shrink-0 cursor-grab active:cursor-grabbing touch-none text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100"
        {...attributes}
        {...listeners}
      >
        <GripVerticalIcon size={14} />
      </button>

      <button
        onClick={onSelect}
        className="flex-1 flex items-center gap-2 text-left min-w-0"
      >
        <div
          className="h-3 w-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: group.color }}
        />
        <span className="truncate">{group.name}</span>
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 flex-shrink-0"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onEdit}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDelete} className="text-destructive">
            <DeleteIcon size={16} className="mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

interface GroupListProps {
  groups: Group[];
  selectedGroupId: string | null;
  onSelectGroup: (groupId: string | null) => void;
  onCreateGroup: (data: { name: string; color: string }) => Promise<void>;
  onUpdateGroup: (id: string, data: { name: string; color: string }) => Promise<void>;
  onDeleteGroup: (id: string) => Promise<void>;
  onReorderGroups?: (orderedIds: string[]) => Promise<void>;
}

export function GroupList({
  groups,
  selectedGroupId,
  onSelectGroup,
  onCreateGroup,
  onUpdateGroup,
  onDeleteGroup,
  onReorderGroups,
}: GroupListProps) {
  const [mounted, setMounted] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [deletingGroup, setDeletingGroup] = useState<Group | null>(null);

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

  async function handleCreate(data: { name: string; color: string }) {
    await onCreateGroup(data);
    setIsCreateOpen(false);
  }

  async function handleUpdate(data: { name: string; color: string }) {
    if (editingGroup) {
      await onUpdateGroup(editingGroup.id, data);
      setEditingGroup(null);
    }
  }

  async function handleDelete() {
    if (deletingGroup) {
      await onDeleteGroup(deletingGroup.id);
      setDeletingGroup(null);
      if (selectedGroupId === deletingGroup.id) {
        onSelectGroup(null);
      }
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = groups.findIndex((g) => g.id === active.id);
      const newIndex = groups.findIndex((g) => g.id === over.id);
      const newOrder = arrayMove(groups, oldIndex, newIndex);
      onReorderGroups?.(newOrder.map((g) => g.id));
    }
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between px-2 py-1">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Groups
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => setIsCreateOpen(true)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <button
        onClick={() => onSelectGroup(null)}
        className={cn(
          "w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors",
          selectedGroupId === null
            ? "bg-accent text-accent-foreground"
            : "hover:bg-accent/50"
        )}
      >
        <div className="h-3 w-3 rounded-full bg-muted-foreground" />
        <span>All Bookmarks</span>
      </button>

      {mounted ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={groups.map((g) => g.id)}
            strategy={verticalListSortingStrategy}
          >
            {groups.map((group) => (
              <SortableGroupItem
                key={group.id}
                group={group}
                isSelected={selectedGroupId === group.id}
                onSelect={() => onSelectGroup(group.id)}
                onEdit={() => setEditingGroup(group)}
                onDelete={() => setDeletingGroup(group)}
              />
            ))}
          </SortableContext>
        </DndContext>
      ) : (
        groups.map((group) => (
          <button
            key={group.id}
            onClick={() => onSelectGroup(group.id)}
            className={cn(
              "w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors",
              selectedGroupId === group.id
                ? "bg-accent text-accent-foreground"
                : "hover:bg-accent/50"
            )}
          >
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: group.color }}
            />
            <span className="truncate">{group.name}</span>
          </button>
        ))
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Group</DialogTitle>
          </DialogHeader>
          <GroupForm onSubmit={handleCreate} onCancel={() => setIsCreateOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingGroup} onOpenChange={() => setEditingGroup(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Group</DialogTitle>
          </DialogHeader>
          {editingGroup && (
            <GroupForm
              group={editingGroup}
              onSubmit={handleUpdate}
              onCancel={() => setEditingGroup(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingGroup} onOpenChange={() => setDeletingGroup(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Group</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deletingGroup?.name}&quot;?
              Bookmarks in this group will become ungrouped.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
