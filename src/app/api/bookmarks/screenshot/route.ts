import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractUrlsFromImage } from "@/lib/ai/extract-urls";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { image, mimeType } = await request.json();

    if (!image || typeof image !== "string") {
      return NextResponse.json(
        { error: "Image is required (base64 encoded)" },
        { status: 400 }
      );
    }

    const urls = await extractUrlsFromImage(image, mimeType || "image/png");

    return NextResponse.json({ urls });
  } catch (error) {
    console.error("Screenshot extraction error:", error);
    return NextResponse.json(
      { error: "Failed to extract URLs from screenshot" },
      { status: 500 }
    );
  }
}
