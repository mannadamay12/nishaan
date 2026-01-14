"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { GroupList } from "@/components/groups/group-list";
import { BookmarkList } from "@/components/bookmarks/bookmark-list";
import { BookmarkInput } from "@/components/bookmarks/bookmark-input";
import { BookmarkSearch } from "@/components/bookmarks/bookmark-search";
import { TextExtractor } from "@/components/ai/text-extractor";
import { ScreenshotExtractor } from "@/components/ai/screenshot-extractor";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Archive, BookMarked, CheckSquare, FileText, FolderInput, ImageIcon, RotateCcw, Trash2, X } from "lucide-react";
import { signOut } from "@/app/actions/auth";
import { useOnlineStatus } from "@/lib/pwa/offline-manager";
import { OfflineBanner } from "@/components/pwa/offline-banner";
import { SyncIndicator } from "@/components/pwa/sync-indicator";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { queueOperation, processQueue, getQueueStatus } from "@/lib/pwa/sync-queue";
import type { QueuedOperationType } from "@/lib/pwa/sync-queue";
import {
  getGroups,
  createGroup,
  updateGroup,
  deleteGroup,
  reorderGroups,
} from "@/app/actions/groups";
import {
  getBookmarks,
  createBookmark,
  updateBookmark,
  deleteBookmark,
  toggleFavorite,
  reorderBookmarks,
  archiveBookmark,
  restoreBookmark,
  getArchivedBookmarks,
  addTag,
  removeTag,
} from "@/app/actions/bookmarks";
import type { Group, Bookmark } from "@/types/database";

interface DashboardClientProps {
  userEmail: string;
  initialGroups: Group[];
  initialBookmarks: Bookmark[];
}

export function DashboardClient({
  userEmail,
  initialGroups,
  initialBookmarks,
}: DashboardClientProps) {
  const [groups, setGroups] = useState<Group[]>(initialGroups);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(initialBookmarks);
  const [archivedBookmarks, setArchivedBookmarks] = useState<Bookmark[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [textExtractorOpen, setTextExtractorOpen] = useState(false);
  const [screenshotExtractorOpen, setScreenshotExtractorOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [filterByTag, setFilterByTag] = useState<string | null>(null);
  const isOnline = useOnlineStatus();
  const [queuedCount, setQueuedCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showShareSuccess, setShowShareSuccess] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  // Sync queue when coming back online
  useEffect(() => {
    if (isOnline && queuedCount > 0 && !isSyncing) {
      setIsSyncing(true);
      processQueue()
        .then(async (result) => {
          console.log("[Dashboard] Sync complete:", result);
          if (result.processed > 0) {
            await refreshBookmarks();
            await refreshGroups();
            await refreshArchivedBookmarks();
          }
          const status = await getQueueStatus();
          setQueuedCount(status.size);
        })
        .catch((error) => {
          console.error("[Dashboard] Sync failed:", error);
        })
        .finally(() => {
          setIsSyncing(false);
        });
    }
  }, [isOnline, queuedCount, isSyncing]);

  // Update queued count periodically
  useEffect(() => {
    async function updateQueueCount() {
      const status = await getQueueStatus();
      setQueuedCount(status.size);
    }

    updateQueueCount();

    const interval = setInterval(updateQueueCount, 5000);
    return () => clearInterval(interval);
  }, []);

  // Check for share target success
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    if (params.get("bookmarked") === "success") {
      setShowShareSuccess(true);

      // Remove query param from URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);

      // Hide success message after 3 seconds
      const timer = setTimeout(() => {
        setShowShareSuccess(false);
      }, 3000);

      // Refresh bookmarks to show the newly added one
      refreshBookmarks();

      return () => clearTimeout(timer);
    }
  }, []);

  // Show install prompt after user has interacted with app
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if user has created at least 3 bookmarks (engaged user)
    if (bookmarks.length >= 3) {
      // Delay showing prompt by 10 seconds to avoid being pushy
      const timer = setTimeout(() => {
        setShowInstallPrompt(true);
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [bookmarks.length]);

  // Keyboard shortcuts
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // Cmd+F - Search
      if (e.key === "f" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Filter bookmarks by selected group, tag, or show archived (memoized)
  const displayBookmarks = showArchived ? archivedBookmarks : bookmarks;
  const filteredBookmarks = useMemo(() => {
    let result = displayBookmarks;
    if (selectedGroupId && !showArchived) {
      result = result.filter((b) => b.group_id === selectedGroupId);
    }
    if (filterByTag && !showArchived) {
      result = result.filter((b) => b.tags?.includes(filterByTag));
    }
    return result;
  }, [displayBookmarks, selectedGroupId, showArchived, filterByTag]);

  // Count bookmarks with read-later tag (memoized)
  const readLaterCount = useMemo(
    () => bookmarks.filter((b) => b.tags?.includes("read-later")).length,
    [bookmarks]
  );

  // Refresh data
  const refreshGroups = useCallback(async () => {
    const result = await getGroups();
    if (result.groups) {
      setGroups(result.groups);
    }
  }, []);

  const refreshBookmarks = useCallback(async () => {
    const result = await getBookmarks();
    if (result.bookmarks) {
      setBookmarks(result.bookmarks);
    }
  }, []);

  const refreshArchivedBookmarks = useCallback(async () => {
    const result = await getArchivedBookmarks();
    if (result.bookmarks) {
      setArchivedBookmarks(result.bookmarks);
    }
  }, []);

  // Helper: Execute operation with offline queueing
  async function executeOrQueue(
    operationType: QueuedOperationType,
    payload: any,
    onlineAction: () => Promise<any>
  ): Promise<{ queued: boolean; error?: string }> {
    if (!isOnline) {
      // Queue for later
      try {
        await queueOperation(operationType, payload);
        const status = await getQueueStatus();
        setQueuedCount(status.size);
        return { queued: true };
      } catch (error) {
        console.error("[Dashboard] Failed to queue operation:", error);
        return { queued: false, error: "Failed to queue operation" };
      }
    } else {
      // Execute immediately
      try {
        const result = await onlineAction();
        return { queued: false };
      } catch (error) {
        console.error("[Dashboard] Operation failed:", error);
        return { queued: false, error: "Operation failed" };
      }
    }
  }

  // Group handlers
  async function handleCreateGroup(data: { name: string; color: string }) {
    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    const tempGroup: Group = {
      id: tempId,
      user_id: "",
      name: data.name,
      color: data.color,
      sort_order: groups.length,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setGroups((prev) => [...prev, tempGroup]);

    const result = await createGroup(data);
    if (result.error) {
      // Rollback
      setGroups((prev) => prev.filter((g) => g.id !== tempId));
    } else {
      await refreshGroups();
    }
  }

  async function handleUpdateGroup(id: string, data: { name: string; color: string }) {
    // Optimistic update
    const originalGroups = [...groups];
    setGroups((prev) =>
      prev.map((g) => (g.id === id ? { ...g, ...data } : g))
    );

    const result = await updateGroup(id, data);
    if (result.error) {
      setGroups(originalGroups);
    }
  }

  async function handleDeleteGroup(id: string) {
    // Optimistic update
    const originalGroups = [...groups];
    setGroups((prev) => prev.filter((g) => g.id !== id));

    // Also update bookmarks to remove group reference
    setBookmarks((prev) =>
      prev.map((b) => (b.group_id === id ? { ...b, group_id: null } : b))
    );

    const result = await deleteGroup(id);
    if (result.error) {
      setGroups(originalGroups);
      await refreshBookmarks();
    }
  }

  // Bookmark handlers
  async function handleAddBookmark(url: string) {
    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    const tempBookmark: Bookmark = {
      id: tempId,
      user_id: "",
      url,
      title: null,
      description: null,
      favicon_url: null,
      preview_image_url: null,
      site_name: null,
      group_id: selectedGroupId,
      tags: [],
      sort_order: 0,
      source: "manual",
      source_metadata: {},
      is_archived: false,
      is_favorite: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setBookmarks((prev) => [tempBookmark, ...prev]);

    const result = await createBookmark(url, selectedGroupId);
    if (result.error) {
      setBookmarks((prev) => prev.filter((b) => b.id !== tempId));
    } else {
      await refreshBookmarks();
    }
  }

  async function handleUpdateBookmark(
    id: string,
    data: { title: string; description: string; group_id: string | null }
  ) {
    // Optimistic update
    const originalBookmarks = [...bookmarks];
    setBookmarks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...data } : b))
    );

    const result = await executeOrQueue(
      "UPDATE_BOOKMARK",
      { id, data },
      () => updateBookmark(id, data)
    );

    if (result.error && !result.queued) {
      setBookmarks(originalBookmarks);
    }
  }

  async function handleDeleteBookmark(id: string) {
    // Optimistic update
    const originalBookmarks = [...bookmarks];
    setBookmarks((prev) => prev.filter((b) => b.id !== id));

    const result = await executeOrQueue(
      "DELETE_BOOKMARK",
      { id },
      () => deleteBookmark(id)
    );

    if (result.error && !result.queued) {
      setBookmarks(originalBookmarks);
    }
  }

  async function handleToggleFavorite(id: string, isFavorite: boolean) {
    // Optimistic update
    setBookmarks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, is_favorite: isFavorite } : b))
    );

    const result = await executeOrQueue(
      "TOGGLE_FAVORITE",
      { id, isFavorite },
      () => toggleFavorite(id, isFavorite)
    );

    if (result.error && !result.queued) {
      setBookmarks((prev) =>
        prev.map((b) => (b.id === id ? { ...b, is_favorite: !isFavorite } : b))
      );
    }
  }

  // Batch save URLs from AI extraction
  async function handleBatchSaveUrls(urls: string[]) {
    for (const url of urls) {
      await createBookmark(url, selectedGroupId);
    }
    await refreshBookmarks();
  }

  // Reorder handlers
  async function handleReorderBookmarks(orderedIds: string[]) {
    // Optimistic update
    const reordered = orderedIds
      .map((id) => bookmarks.find((b) => b.id === id))
      .filter((b): b is Bookmark => b !== undefined);
    setBookmarks(reordered);

    const result = await reorderBookmarks(orderedIds);
    if (result.error) {
      await refreshBookmarks();
    }
  }

  async function handleReorderGroups(orderedIds: string[]) {
    // Optimistic update
    const reordered = orderedIds
      .map((id) => groups.find((g) => g.id === id))
      .filter((g): g is Group => g !== undefined);
    setGroups(reordered);

    const result = await reorderGroups(orderedIds);
    if (result.error) {
      await refreshGroups();
    }
  }

  async function handleArchiveBookmark(id: string) {
    // Optimistic update
    const bookmark = bookmarks.find((b) => b.id === id);
    if (bookmark) {
      setBookmarks((prev) => prev.filter((b) => b.id !== id));
      setArchivedBookmarks((prev) => [{ ...bookmark, is_archived: true }, ...prev]);
    }

    const result = await executeOrQueue(
      "ARCHIVE_BOOKMARK",
      { id },
      () => archiveBookmark(id)
    );

    if (result.error && !result.queued) {
      await refreshBookmarks();
      await refreshArchivedBookmarks();
    }
  }

  async function handleRestoreBookmark(id: string) {
    // Optimistic update
    const bookmark = archivedBookmarks.find((b) => b.id === id);
    if (bookmark) {
      setArchivedBookmarks((prev) => prev.filter((b) => b.id !== id));
      setBookmarks((prev) => [{ ...bookmark, is_archived: false }, ...prev]);
    }

    const result = await executeOrQueue(
      "RESTORE_BOOKMARK",
      { id },
      () => restoreBookmark(id)
    );

    if (result.error && !result.queued) {
      await refreshBookmarks();
      await refreshArchivedBookmarks();
    }
  }

  async function handleToggleArchiveView() {
    const newShowArchived = !showArchived;
    setShowArchived(newShowArchived);
    setSelectedGroupId(null);
    setFilterByTag(null);
    setSelectedIds(new Set());
    setSelectionMode(false);
    if (newShowArchived && archivedBookmarks.length === 0) {
      await refreshArchivedBookmarks();
    }
  }

  function handleToggleSelection(id: string) {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }

  function handleSelectAll() {
    const allIds = filteredBookmarks.map((b) => b.id);
    setSelectedIds(new Set(allIds));
  }

  function handleClearSelection() {
    setSelectedIds(new Set());
    setSelectionMode(false);
  }

  async function handleBulkDelete() {
    const idsToDelete = Array.from(selectedIds);
    // Optimistic update
    if (showArchived) {
      setArchivedBookmarks((prev) => prev.filter((b) => !selectedIds.has(b.id)));
    } else {
      setBookmarks((prev) => prev.filter((b) => !selectedIds.has(b.id)));
    }
    setSelectedIds(new Set());
    setSelectionMode(false);

    // Parallel operations with error handling
    const results = await Promise.allSettled(
      idsToDelete.map((id) => deleteBookmark(id))
    );

    // Check for failures and refresh data if any failed
    const failures = results.filter((r) => r.status === "rejected");
    if (failures.length > 0) {
      console.error(`[Bulk Delete] ${failures.length} operations failed`);
      await refreshBookmarks();
      await refreshArchivedBookmarks();
    }
  }

  async function handleBulkArchive() {
    const idsToArchive = Array.from(selectedIds);
    // Optimistic update
    const toArchive = bookmarks.filter((b) => selectedIds.has(b.id));
    setBookmarks((prev) => prev.filter((b) => !selectedIds.has(b.id)));
    setArchivedBookmarks((prev) => [...toArchive.map((b) => ({ ...b, is_archived: true })), ...prev]);
    setSelectedIds(new Set());
    setSelectionMode(false);

    // Parallel operations with error handling
    const results = await Promise.allSettled(
      idsToArchive.map((id) => archiveBookmark(id))
    );

    // Check for failures and refresh data if any failed
    const failures = results.filter((r) => r.status === "rejected");
    if (failures.length > 0) {
      console.error(`[Bulk Archive] ${failures.length} operations failed`);
      await refreshBookmarks();
      await refreshArchivedBookmarks();
    }
  }

  async function handleBulkRestore() {
    const idsToRestore = Array.from(selectedIds);
    // Optimistic update
    const toRestore = archivedBookmarks.filter((b) => selectedIds.has(b.id));
    setArchivedBookmarks((prev) => prev.filter((b) => !selectedIds.has(b.id)));
    setBookmarks((prev) => [...toRestore.map((b) => ({ ...b, is_archived: false })), ...prev]);
    setSelectedIds(new Set());
    setSelectionMode(false);

    // Parallel operations with error handling
    const results = await Promise.allSettled(
      idsToRestore.map((id) => restoreBookmark(id))
    );

    // Check for failures and refresh data if any failed
    const failures = results.filter((r) => r.status === "rejected");
    if (failures.length > 0) {
      console.error(`[Bulk Restore] ${failures.length} operations failed`);
      await refreshBookmarks();
      await refreshArchivedBookmarks();
    }
  }

  async function handleBulkMove(groupId: string | null) {
    const idsToMove = Array.from(selectedIds);
    // Optimistic update
    setBookmarks((prev) =>
      prev.map((b) => (selectedIds.has(b.id) ? { ...b, group_id: groupId } : b))
    );
    setSelectedIds(new Set());
    setSelectionMode(false);

    // Parallel operations with error handling
    const results = await Promise.allSettled(
      idsToMove.map((id) => updateBookmark(id, { group_id: groupId }))
    );

    // Check for failures and refresh data if any failed
    const failures = results.filter((r) => r.status === "rejected");
    if (failures.length > 0) {
      console.error(`[Bulk Move] ${failures.length} operations failed`);
      await refreshBookmarks();
    }
  }

  async function handleAddTag(id: string, tag: string) {
    // Optimistic update
    setBookmarks((prev) =>
      prev.map((b) =>
        b.id === id ? { ...b, tags: [...(b.tags || []), tag] } : b
      )
    );

    const result = await executeOrQueue(
      "ADD_TAG",
      { id, tag },
      () => addTag(id, tag)
    );

    if (result.error && !result.queued) {
      await refreshBookmarks();
    }
  }

  async function handleRemoveTag(id: string, tag: string) {
    // Optimistic update
    setBookmarks((prev) =>
      prev.map((b) =>
        b.id === id ? { ...b, tags: (b.tags || []).filter((t) => t !== tag) } : b
      )
    );

    const result = await executeOrQueue(
      "REMOVE_TAG",
      { id, tag },
      () => removeTag(id, tag)
    );

    if (result.error && !result.queued) {
      await refreshBookmarks();
    }
  }

  function handleToggleReadLaterFilter() {
    if (filterByTag === "read-later") {
      setFilterByTag(null);
    } else {
      setFilterByTag("read-later");
      setShowArchived(false);
      setSelectedGroupId(null);
    }
  }

  return (
    <>
      <OfflineBanner isOnline={isOnline} />
      <SyncIndicator
        queuedCount={queuedCount}
        isSyncing={isSyncing}
        isOnline={isOnline}
      />
      {showShareSuccess && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-top">
          <CheckSquare className="h-4 w-4" />
          <span className="font-medium">Bookmark saved!</span>
        </div>
      )}
      {showInstallPrompt && (
        <InstallPrompt
          variant="banner"
          onInstall={() => setShowInstallPrompt(false)}
          onDismiss={() => setShowInstallPrompt(false)}
        />
      )}
      <BookmarkSearch
        open={searchOpen}
        onOpenChange={setSearchOpen}
      />
      <TextExtractor
        open={textExtractorOpen}
        onOpenChange={setTextExtractorOpen}
        onSaveUrls={handleBatchSaveUrls}
      />
      <ScreenshotExtractor
        open={screenshotExtractorOpen}
        onOpenChange={setScreenshotExtractorOpen}
        onSaveUrls={handleBatchSaveUrls}
      />
      <div className="flex gap-8">
        {/* Sidebar */}
        <aside className="w-48 flex-shrink-0">
          <div className="sticky top-8 space-y-6">
            <div>
              <h1 className="text-lg font-semibold">nish.aan</h1>
              <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
            </div>

            <GroupList
              groups={groups}
              selectedGroupId={showArchived || filterByTag ? null : selectedGroupId}
              onSelectGroup={(id) => {
                setShowArchived(false);
                setFilterByTag(null);
                setSelectedGroupId(id);
              }}
              onCreateGroup={handleCreateGroup}
              onUpdateGroup={handleUpdateGroup}
              onDeleteGroup={handleDeleteGroup}
              onReorderGroups={handleReorderGroups}
            />

            <div className="space-y-1">
              <Button
                variant={filterByTag === "read-later" ? "secondary" : "ghost"}
                size="sm"
                className="w-full justify-start text-muted-foreground"
                onClick={handleToggleReadLaterFilter}
              >
                <BookMarked className="h-4 w-4 mr-2" />
                Read Later
                {readLaterCount > 0 && (
                  <span className="ml-auto text-xs">{readLaterCount}</span>
                )}
              </Button>
              <Button
                variant={showArchived ? "secondary" : "ghost"}
                size="sm"
                className="w-full justify-start text-muted-foreground"
                onClick={handleToggleArchiveView}
              >
                <Archive className="h-4 w-4 mr-2" />
                Archive
                {archivedBookmarks.length > 0 && (
                  <span className="ml-auto text-xs">{archivedBookmarks.length}</span>
                )}
              </Button>
              <form action={signOut}>
                <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground">
                  Sign out
                </Button>
              </form>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 space-y-6">
          {/* Bulk action toolbar */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/50">
              <span className="text-sm font-medium">
                {selectedIds.size} selected
              </span>
              <div className="flex-1" />
              {!showArchived && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <FolderInput className="h-4 w-4 mr-2" />
                      Move to
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleBulkMove(null)}>
                      No group
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {groups.map((g) => (
                      <DropdownMenuItem key={g.id} onClick={() => handleBulkMove(g.id)}>
                        <span
                          className="h-2 w-2 rounded-full mr-2"
                          style={{ backgroundColor: g.color }}
                        />
                        {g.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              {showArchived ? (
                <Button variant="outline" size="sm" onClick={handleBulkRestore}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Restore
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={handleBulkArchive}>
                  <Archive className="h-4 w-4 mr-2" />
                  Archive
                </Button>
              )}
              <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
              <Button variant="ghost" size="sm" onClick={handleClearSelection}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {showArchived ? (
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Archived Bookmarks</h2>
                <p className="text-sm text-muted-foreground">
                  {archivedBookmarks.length} archived bookmark{archivedBookmarks.length !== 1 ? "s" : ""}
                </p>
              </div>
              {archivedBookmarks.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectionMode(!selectionMode)}
                >
                  <CheckSquare className="h-4 w-4 mr-2" />
                  {selectionMode ? "Cancel" : "Select"}
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <BookmarkInput
                    onAdd={handleAddBookmark}
                    disabled={!isOnline}
                  />
                </div>
                {filteredBookmarks.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectionMode(!selectionMode)}
                  >
                    <CheckSquare className="h-4 w-4 mr-2" />
                    {selectionMode ? "Cancel" : "Select"}
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTextExtractorOpen(true)}
                  className="text-muted-foreground"
                  disabled={!isOnline}
                  title={!isOnline ? "Requires internet connection" : ""}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Extract from text
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setScreenshotExtractorOpen(true)}
                  className="text-muted-foreground"
                  disabled={!isOnline}
                  title={!isOnline ? "Requires internet connection" : ""}
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Extract from screenshot
                </Button>
              </div>
            </div>
          )}
          <BookmarkList
            bookmarks={filteredBookmarks}
            groups={groups}
            onUpdate={handleUpdateBookmark}
            onDelete={handleDeleteBookmark}
            onToggleFavorite={handleToggleFavorite}
            onReorder={showArchived ? undefined : handleReorderBookmarks}
            onArchive={showArchived ? undefined : handleArchiveBookmark}
            onRestore={showArchived ? handleRestoreBookmark : undefined}
            isArchiveView={showArchived}
            selectionMode={selectionMode}
            selectedIds={selectedIds}
            onToggleSelection={handleToggleSelection}
            onAddTag={showArchived ? undefined : handleAddTag}
            onRemoveTag={showArchived ? undefined : handleRemoveTag}
          />
        </main>
      </div>
    </>
  );
}
