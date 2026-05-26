const ALLOWED_TAGS = new Set([
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "ul",
  "ol",
  "li",
  "blockquote",
  "code",
  "pre",
  "h2",
  "h3",
  "hr",
  "a",
]);

function isSafeHref(href: string): boolean {
  try {
    const u = new URL(href, window.location.origin);
    if (u.protocol !== "https:" && u.protocol !== "http:") return false;
    return !u.href.toLowerCase().startsWith("javascript:");
  } catch {
    return false;
  }
}

export function sanitizeHtml(input: string): string {
  if (!input) return "";
  // document.createElement is more reliable in jsdom than DOMParser.
  const container = document.createElement("div");
  container.innerHTML = input;

  // Tags whose content must be discarded entirely (not unwrapped).
  const DROP_TAGS = new Set(["script", "style", "iframe", "object", "embed", "noscript"]);

  const walk = (node: Node) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const tag = el.tagName.toLowerCase();
      if (DROP_TAGS.has(tag)) {
        el.remove();
        return;
      }
      if (!ALLOWED_TAGS.has(tag)) {
        const text = document.createTextNode(el.textContent ?? "");
        el.replaceWith(text);
        return;
      }

      for (const attr of Array.from(el.attributes)) {
        const name = attr.name.toLowerCase();
        if (tag === "a" && name === "href") continue;
        el.removeAttribute(attr.name);
      }

      if (tag === "a") {
        const href = el.getAttribute("href") ?? "";
        if (!href || !isSafeHref(href)) {
          const text = document.createTextNode(el.textContent ?? "");
          el.replaceWith(text);
          return;
        }
        el.setAttribute("target", "_blank");
        el.setAttribute("rel", "noreferrer noopener");
      }
    }

    for (const child of Array.from(node.childNodes)) {
      walk(child);
    }
  };

  // Walk children only — the root container itself is just a holder.
  for (const child of Array.from(container.childNodes)) {
    walk(child);
  }
  return container.innerHTML;
}

export function safeExternalUrl(input: string): string | null {
  if (!input) return null;
  try {
    const u = new URL(input);
    if (u.protocol !== "https:") return null;
    return u.toString();
  } catch {
    return null;
  }
}

const STORAGE_VIDEO_EXTENSIONS = ['.mp4', '.webm', '.ogg', '.mov', '.avi'];

/**
 * Returns true when the URL points to a direct video file in Supabase Storage
 * (contains the bucket path segment OR ends with a video extension).
 * These URLs must be rendered with a native <video> element, not an iframe.
 */
export function isStorageVideoUrl(input: unknown): boolean {
  if (!input || typeof input !== 'string') return false;
  try {
    const u = new URL(input);
    if (u.protocol !== 'https:') return false;
    // Supabase Storage public URL pattern: /storage/v1/object/public/video-content/...
    if (u.pathname.includes('video-content')) return true;
    // Fallback: direct video file extension
    const lower = u.pathname.toLowerCase();
    return STORAGE_VIDEO_EXTENSIONS.some((ext) => lower.endsWith(ext));
  } catch {
    return false;
  }
}

export function safeEmbedUrl(input: string): string | null {
  if (!input) return null;
  try {
    const u = new URL(input);
    if (u.protocol !== "https:") return null;
    const host = u.hostname.replace(/^www\./, "").toLowerCase();
    const allow = new Set(["youtube.com", "youtu.be", "player.vimeo.com"]);
    if (!allow.has(host)) return null;
    return u.toString();
  } catch {
    return null;
  }
}

