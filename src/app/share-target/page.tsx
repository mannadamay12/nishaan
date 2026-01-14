import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createBookmark } from "@/app/actions/bookmarks";

export default async function ShareTargetPage({
  searchParams,
}: {
  searchParams: { title?: string; text?: string; url?: string };
}) {
  // Check authentication
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // Not authenticated, redirect to login
    redirect("/login?error=Please+sign+in+to+save+bookmarks");
  }

  // Extract shared data
  const { title, text, url } = searchParams;

  // URL is the most important - if no URL, try to extract from text
  let targetUrl = url;

  if (!targetUrl && text) {
    // Try to extract URL from text (e.g., "Check this out: https://...")
    const urlMatch = text.match(/https?:\/\/[^\s]+/);
    if (urlMatch) {
      targetUrl = urlMatch[0];
    }
  }

  if (!targetUrl) {
    // No valid URL found, redirect with error
    redirect("/dashboard?error=No+URL+found+in+shared+content");
  }

  // Create the bookmark (will fetch metadata automatically)
  try {
    const result = await createBookmark(targetUrl, null);

    if (result.error) {
      redirect(`/dashboard?error=${encodeURIComponent(result.error)}`);
    }

    // Success! Redirect to dashboard with success message
    redirect("/dashboard?bookmarked=success");
  } catch (error) {
    console.error("[Share Target] Error creating bookmark:", error);
    redirect("/dashboard?error=Failed+to+save+bookmark");
  }
}
