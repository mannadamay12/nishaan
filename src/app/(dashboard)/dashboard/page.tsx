import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch initial data
  const [groupsResult, bookmarksResult] = await Promise.all([
    supabase
      .from("groups")
      .select("*")
      .eq("user_id", user.id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("bookmarks")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_archived", false)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <DashboardClient
      userEmail={user.email ?? ""}
      initialGroups={groupsResult.data ?? []}
      initialBookmarks={bookmarksResult.data ?? []}
    />
  );
}
