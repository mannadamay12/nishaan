"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { GroupList } from "@/components/groups/group-list";
import { BookmarkList } from "@/components/bookmarks/bookmark-list";
import { BookmarkInput, type BookmarkInputHandle } from "@/components/bookmarks/bookmark-input";
import { BookmarkSearch } from "@/components/bookmarks/bookmark-search";
import { SearchTrigger } from "@/components/bookmarks/search-trigger";
import { TextExtractor } from "@/components/ai/text-extractor";
import { ScreenshotExtractor } from "@/components/ai/screenshot-extractor";
import { Button } from "@/components/ui/button";
import { FileText, ImageIcon } from "lucide-react";
import { signOut } from "@/app/actions/auth";
import {
  getGroups,
  createGroup,
  updateGroup,
  deleteGroup,
} from "@/app/actions/groups";
import {
  getBookmarks,
  createBookmark,
  updateBookmark,
  deleteBookmark,
  toggleFavorite,
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
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [textExtractorOpen, setTextExtractorOpen] = useState(false);
  const [screenshotExtractorOpen, setScreenshotExtractorOpen] = useState(false);
  const bookmarkInputRef = useRef<BookmarkInputHandle>(null);

  // Keyboard shortcuts
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // Cmd+K - Search
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((open) => !open);
      }
      // Cmd+N - New bookmark
      if (e.key === "n" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        bookmarkInputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Filter bookmarks by selected group
  const filteredBookmarks = selectedGroupId
    ? bookmarks.filter((b) => b.group_id === selectedGroupId)
    : bookmarks;

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

    const result = await updateBookmark(id, data);
    if (result.error) {
      setBookmarks(originalBookmarks);
    }
  }

  async function handleDeleteBookmark(id: string) {
    // Optimistic update
    const originalBookmarks = [...bookmarks];
    setBookmarks((prev) => prev.filter((b) => b.id !== id));

    const result = await deleteBookmark(id);
    if (result.error) {
      setBookmarks(originalBookmarks);
    }
  }

  async function handleToggleFavorite(id: string, isFavorite: boolean) {
    // Optimistic update
    setBookmarks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, is_favorite: isFavorite } : b))
    );

    const result = await toggleFavorite(id, isFavorite);
    if (result.error) {
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

  return (
    <>
      <BookmarkSearch
        bookmarks={bookmarks}
        groups={groups}
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

            <SearchTrigger onClick={() => setSearchOpen(true)} />

            <GroupList
              groups={groups}
              selectedGroupId={selectedGroupId}
              onSelectGroup={setSelectedGroupId}
              onCreateGroup={handleCreateGroup}
              onUpdateGroup={handleUpdateGroup}
              onDeleteGroup={handleDeleteGroup}
            />

            <form action={signOut}>
              <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground">
                Sign out
              </Button>
            </form>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 space-y-6">
          <div className="space-y-3">
            <BookmarkInput ref={bookmarkInputRef} onAdd={handleAddBookmark} />
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTextExtractorOpen(true)}
                className="text-muted-foreground"
              >
                <FileText className="h-4 w-4 mr-2" />
                Extract from text
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setScreenshotExtractorOpen(true)}
                className="text-muted-foreground"
              >
                <ImageIcon className="h-4 w-4 mr-2" />
                Extract from screenshot
              </Button>
            </div>
          </div>
          <BookmarkList
            bookmarks={filteredBookmarks}
            groups={groups}
            onUpdate={handleUpdateBookmark}
            onDelete={handleDeleteBookmark}
            onToggleFavorite={handleToggleFavorite}
          />
        </main>
      </div>
    </>
  );
}
