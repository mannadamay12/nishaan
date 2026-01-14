"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { fetchMetadata } from "@/lib/metadata/fetcher";

export async function getBookmarks(groupId?: string | null) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated", bookmarks: [] };
  }

  let query = supabase
    .from("bookmarks")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_archived", false)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (groupId) {
    query = query.eq("group_id", groupId);
  }

  const { data, error } = await query;

  if (error) {
    return { error: error.message, bookmarks: [] };
  }

  return { bookmarks: data };
}

export async function createBookmark(url: string, groupId?: string | null) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Fetch metadata directly (no HTTP request to self)
  const metadata = await fetchMetadata(url);

  const { error } = await supabase.from("bookmarks").insert({
    user_id: user.id,
    url,
    group_id: groupId || null,
    title: metadata.title || null,
    description: metadata.description || null,
    favicon_url: metadata.favicon_url || null,
    preview_image_url: metadata.preview_image_url || null,
    site_name: metadata.site_name || null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateBookmark(
  id: string,
  data: {
    title?: string | null;
    description?: string | null;
    group_id?: string | null;
  }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("bookmarks")
    .update(data)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteBookmark(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("bookmarks")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

export async function toggleFavorite(id: string, isFavorite: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("bookmarks")
    .update({ is_favorite: isFavorite })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

export async function reorderBookmarks(orderedIds: string[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Update sort_order for each bookmark based on position in array
  const updates = orderedIds.map((id, index) =>
    supabase
      .from("bookmarks")
      .update({ sort_order: index })
      .eq("id", id)
      .eq("user_id", user.id)
  );

  const results = await Promise.all(updates);
  const failed = results.find((r) => r.error);

  if (failed?.error) {
    return { error: failed.error.message };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

export async function archiveBookmark(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("bookmarks")
    .update({ is_archived: true })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

export async function restoreBookmark(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("bookmarks")
    .update({ is_archived: false })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

export async function getArchivedBookmarks() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated", bookmarks: [] };
  }

  const { data, error } = await supabase
    .from("bookmarks")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_archived", true)
    .order("updated_at", { ascending: false });

  if (error) {
    return { error: error.message, bookmarks: [] };
  }

  return { bookmarks: data };
}

export async function addTag(id: string, tag: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // First get current tags
  const { data: bookmark, error: fetchError } = await supabase
    .from("bookmarks")
    .select("tags")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchError) {
    return { error: fetchError.message };
  }

  const currentTags = bookmark?.tags || [];
  if (currentTags.includes(tag)) {
    return { success: true }; // Already has tag
  }

  const { error } = await supabase
    .from("bookmarks")
    .update({ tags: [...currentTags, tag] })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

export async function removeTag(id: string, tag: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // First get current tags
  const { data: bookmark, error: fetchError } = await supabase
    .from("bookmarks")
    .select("tags")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchError) {
    return { error: fetchError.message };
  }

  const currentTags = bookmark?.tags || [];
  const newTags = currentTags.filter((t: string) => t !== tag);

  const { error } = await supabase
    .from("bookmarks")
    .update({ tags: newTags })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

export async function getBookmarksByTag(tag: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated", bookmarks: [] };
  }

  const { data, error } = await supabase
    .from("bookmarks")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_archived", false)
    .contains("tags", [tag])
    .order("created_at", { ascending: false });

  if (error) {
    return { error: error.message, bookmarks: [] };
  }

  return { bookmarks: data };
}
