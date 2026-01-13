import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractUrlsFromText } from "@/lib/ai/extract-urls";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { text } = await request.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Text is required" },
        { status: 400 }
      );
    }

    const urls = await extractUrlsFromText(text);

    return NextResponse.json({ urls });
  } catch (error) {
    console.error("URL extraction error:", error);
    return NextResponse.json(
      { error: "Failed to extract URLs" },
      { status: 500 }
    );
  }
}
