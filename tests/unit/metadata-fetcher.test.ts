import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchMetadata } from "@/lib/metadata/fetcher";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("fetchMetadata", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("should extract og:title from HTML", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => `
        <html>
          <head>
            <meta property="og:title" content="Test Title" />
          </head>
        </html>
      `,
    });

    const result = await fetchMetadata("https://example.com");
    expect(result.title).toBe("Test Title");
  });

  it("should fall back to <title> tag when og:title is missing", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => `
        <html>
          <head>
            <title>Fallback Title</title>
          </head>
        </html>
      `,
    });

    const result = await fetchMetadata("https://example.com");
    expect(result.title).toBe("Fallback Title");
  });

  it("should extract og:description", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => `
        <html>
          <head>
            <meta property="og:description" content="Test Description" />
          </head>
        </html>
      `,
    });

    const result = await fetchMetadata("https://example.com");
    expect(result.description).toBe("Test Description");
  });

  it("should fall back to meta description when og:description is missing", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => `
        <html>
          <head>
            <meta name="description" content="Meta Description" />
          </head>
        </html>
      `,
    });

    const result = await fetchMetadata("https://example.com");
    expect(result.description).toBe("Meta Description");
  });

  it("should extract og:image and resolve relative URLs", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => `
        <html>
          <head>
            <meta property="og:image" content="/images/og.jpg" />
          </head>
        </html>
      `,
    });

    const result = await fetchMetadata("https://example.com/page");
    expect(result.preview_image_url).toBe("https://example.com/images/og.jpg");
  });

  it("should extract favicon from link tag", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => `
        <html>
          <head>
            <link rel="icon" href="/favicon.png" />
          </head>
        </html>
      `,
    });

    const result = await fetchMetadata("https://example.com");
    expect(result.favicon_url).toBe("https://example.com/favicon.png");
  });

  it("should default to /favicon.ico when no favicon link found", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => `
        <html>
          <head>
            <title>No Favicon</title>
          </head>
        </html>
      `,
    });

    const result = await fetchMetadata("https://example.com");
    expect(result.favicon_url).toBe("https://example.com/favicon.ico");
  });

  it("should extract og:site_name", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => `
        <html>
          <head>
            <meta property="og:site_name" content="Example Site" />
          </head>
        </html>
      `,
    });

    const result = await fetchMetadata("https://example.com");
    expect(result.site_name).toBe("Example Site");
  });

  it("should decode HTML entities", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => `
        <html>
          <head>
            <meta property="og:title" content="Tom &amp; Jerry&#039;s Adventure" />
            <meta property="og:description" content="&lt;script&gt; &quot;test&quot;" />
          </head>
        </html>
      `,
    });

    const result = await fetchMetadata("https://example.com");
    expect(result.title).toBe("Tom & Jerry's Adventure");
    expect(result.description).toBe('<script> "test"');
  });

  it("should handle meta tags with content before property", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => `
        <html>
          <head>
            <meta content="Reverse Order Title" property="og:title" />
          </head>
        </html>
      `,
    });

    const result = await fetchMetadata("https://example.com");
    expect(result.title).toBe("Reverse Order Title");
  });

  it("should return null metadata when fetch fails", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    const result = await fetchMetadata("https://example.com/not-found");
    expect(result.title).toBeNull();
    expect(result.description).toBeNull();
    expect(result.favicon_url).toBeNull();
  });

  it("should return null metadata on network error", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const result = await fetchMetadata("https://example.com");
    expect(result.title).toBeNull();
    expect(result.description).toBeNull();
  });

  it("should handle complete HTML with all metadata", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Page Title</title>
            <meta property="og:title" content="OG Title" />
            <meta property="og:description" content="OG Description" />
            <meta property="og:image" content="https://example.com/og.jpg" />
            <meta property="og:site_name" content="Example" />
            <link rel="icon" href="https://example.com/icon.png" />
          </head>
          <body></body>
        </html>
      `,
    });

    const result = await fetchMetadata("https://example.com");
    expect(result.title).toBe("OG Title");
    expect(result.description).toBe("OG Description");
    expect(result.preview_image_url).toBe("https://example.com/og.jpg");
    expect(result.site_name).toBe("Example");
    expect(result.favicon_url).toBe("https://example.com/icon.png");
  });
});
