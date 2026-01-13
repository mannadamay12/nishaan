/**
 * Fetches and parses metadata from a URL
 */
export async function fetchMetadata(url: string): Promise<{
  title: string | null;
  description: string | null;
  site_name: string | null;
  preview_image_url: string | null;
  favicon_url: string | null;
}> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; nishaan/1.0)",
      },
      redirect: "follow",
    });

    if (!response.ok) {
      return nullMetadata();
    }

    const html = await response.text();
    return parseMetadata(html, url);
  } catch (error) {
    console.error("Metadata fetch error:", error);
    return nullMetadata();
  }
}

function nullMetadata() {
  return {
    title: null,
    description: null,
    site_name: null,
    preview_image_url: null,
    favicon_url: null,
  };
}

function parseMetadata(html: string, url: string) {
  const getMetaContent = (name: string): string | null => {
    // Try property first (og:*), then name
    const propertyMatch = html.match(
      new RegExp(`<meta[^>]*property=["']${name}["'][^>]*content=["']([^"']*)["']`, "i")
    );
    if (propertyMatch) return propertyMatch[1];

    const propertyMatchAlt = html.match(
      new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*property=["']${name}["']`, "i")
    );
    if (propertyMatchAlt) return propertyMatchAlt[1];

    const nameMatch = html.match(
      new RegExp(`<meta[^>]*name=["']${name}["'][^>]*content=["']([^"']*)["']`, "i")
    );
    if (nameMatch) return nameMatch[1];

    const nameMatchAlt = html.match(
      new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*name=["']${name}["']`, "i")
    );
    if (nameMatchAlt) return nameMatchAlt[1];

    return null;
  };

  // Get title
  let title = getMetaContent("og:title");
  if (!title) {
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    title = titleMatch ? titleMatch[1].trim() : null;
  }

  // Get description
  const description = getMetaContent("og:description") || getMetaContent("description");

  // Get site name
  const siteName = getMetaContent("og:site_name");

  // Get preview image
  let previewImageUrl = getMetaContent("og:image");
  if (previewImageUrl && !previewImageUrl.startsWith("http")) {
    try {
      const baseUrl = new URL(url);
      previewImageUrl = new URL(previewImageUrl, baseUrl.origin).href;
    } catch {
      previewImageUrl = null;
    }
  }

  // Get favicon
  let faviconUrl: string | null = null;
  const iconMatch = html.match(/<link[^>]*rel=["'](?:icon|shortcut icon)["'][^>]*href=["']([^"']*)["']/i);
  if (iconMatch) {
    faviconUrl = iconMatch[1];
    if (!faviconUrl.startsWith("http")) {
      try {
        const baseUrl = new URL(url);
        faviconUrl = new URL(faviconUrl, baseUrl.origin).href;
      } catch {
        faviconUrl = null;
      }
    }
  }

  if (!faviconUrl) {
    try {
      const baseUrl = new URL(url);
      faviconUrl = `${baseUrl.origin}/favicon.ico`;
    } catch {
      faviconUrl = null;
    }
  }

  return {
    title: title ? decodeHTMLEntities(title) : null,
    description: description ? decodeHTMLEntities(description) : null,
    site_name: siteName ? decodeHTMLEntities(siteName) : null,
    preview_image_url: previewImageUrl,
    favicon_url: faviconUrl,
  };
}

function decodeHTMLEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/");
}
