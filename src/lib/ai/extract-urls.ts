import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

const urlExtractionSchema = z.object({
  urls: z.array(z.string()).describe("Array of extracted URLs"),
});

export async function extractUrlsFromText(text: string): Promise<string[]> {
  const { object } = await generateObject({
    model: google("gemini-2.0-flash"),
    schema: urlExtractionSchema,
    prompt: `You are a URL extraction assistant. Given a block of text, extract all valid URLs.

Rules:
1. Include URLs with or without protocol (add https:// if missing)
2. Handle shortened URLs (t.co, bit.ly, etc.)
3. Ignore email addresses
4. Ignore file paths that aren't URLs
5. Deduplicate results
6. Return as JSON array of strings

Text to analyze:
${text}`,
  });

  return object.urls;
}

export async function extractUrlsFromImage(
  imageBase64: string,
  mimeType: string = "image/png"
): Promise<string[]> {
  const { object } = await generateObject({
    model: google("gemini-2.0-flash"),
    schema: urlExtractionSchema,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            image: imageBase64,
            mimeType: mimeType as "image/png" | "image/jpeg" | "image/gif" | "image/webp",
          },
          {
            type: "text",
            text: `Analyze this image and extract any URLs that are visible.

Rules:
1. Look for URLs in browser address bars, links, text
2. Include partial URLs if the domain is clear
3. Add https:// protocol if not visible
4. Ignore QR codes for now
5. Deduplicate results

Return only the URLs found. If no URLs found, return an empty array.`,
          },
        ],
      },
    ],
  });

  return object.urls;
}
