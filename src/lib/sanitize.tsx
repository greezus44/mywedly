import { useMemo, type ReactNode } from "react";
import { cn } from "./utils";

const ALLOWED_TAGS = new Set([
  "a", "b", "br", "blockquote", "code", "div", "em", "h1", "h2", "h3",
  "h4", "h5", "h6", "hr", "i", "img", "li", "ol", "p", "pre", "span",
  "strong", "sub", "sup", "table", "tbody", "td", "th", "thead", "tr", "u", "ul",
]);

const ALLOWED_ATTRS: Record<string, Set<string>> = {
  a: new Set(["href", "target", "rel", "title"]),
  img: new Set(["src", "alt", "title", "width", "height"]),
  span: new Set(["style", "class"]),
  div: new Set(["style", "class"]),
  p: new Set(["style", "class"]),
  h1: new Set(["style", "class"]),
  h2: new Set(["style", "class"]),
  h3: new Set(["style", "class"]),
  h4: new Set(["style", "class"]),
  h5: new Set(["style", "class"]),
  h6: new Set(["style", "class"]),
  li: new Set(["style", "class"]),
  ul: new Set(["style", "class"]),
  ol: new Set(["style", "class"]),
  blockquote: new Set(["style", "class"]),
  td: new Set(["style", "class", "colspan", "rowspan"]),
  th: new Set(["style", "class", "colspan", "rowspan"]),
  table: new Set(["style", "class"]),
};

const ALLOWED_STYLE_PROPS = new Set([
  "color", "background-color", "font-size", "font-weight", "font-style",
  "font-family", "text-align", "text-decoration", "line-height",
  "margin", "margin-top", "margin-bottom", "margin-left", "margin-right",
  "padding", "padding-top", "padding-bottom", "padding-left", "padding-right",
]);

const SAFE_URL_PROTOCOLS = new Set(["http:", "https:", "mailto:", "tel:"]);

function sanitizeStyleString(style: string): string {
  const props = style.split(";").filter(Boolean);
  const safe: string[] = [];
  for (const prop of props) {
    const colonIdx = prop.indexOf(":");
    if (colonIdx === -1) continue;
    const key = prop.slice(0, colonIdx).trim().toLowerCase();
    const value = prop.slice(colonIdx + 1).trim();
    if (ALLOWED_STYLE_PROPS.has(key)) {
      safe.push(`${key}: ${value}`);
    }
  }
  return safe.join("; ");
}

function sanitizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  // Allow relative URLs and anchors
  if (trimmed.startsWith("#") || trimmed.startsWith("/") || trimmed.startsWith("?")) {
    return trimmed;
  }
  try {
    const parsed = new URL(trimmed);
    if (SAFE_URL_PROTOCOLS.has(parsed.protocol)) {
      return trimmed;
    }
  } catch {
    // Not a valid URL — reject
  }
  return "";
}

/**
 * Sanitize an HTML string using the DOMParser API. Strips disallowed tags,
 * attributes, and styles while preserving safe formatting.
 */
export function sanitizeHtml(html: string): string {
  if (!html) return "";
  if (typeof window === "undefined" || typeof DOMParser === "undefined") {
    return html;
  }

  const doc = new DOMParser().parseFromString(html, "text/html");
  const fragment = doc.createDocumentFragment();

  function processNode(node: Node, parent: Node): void {
    if (node.nodeType === Node.TEXT_NODE) {
      parent.appendChild(node.cloneNode(true));
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const el = node as Element;
    const tag = el.tagName.toLowerCase();

    if (!ALLOWED_TAGS.has(tag)) {
      // Recurse into children but skip the wrapper element
      for (const child of Array.from(el.childNodes)) {
        processNode(child, parent);
      }
      return;
    }

    const clean = doc.createElement(tag);
    const allowedAttrs = ALLOWED_ATTRS[tag];

    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase();
      const value = attr.value;

      if (name === "style") {
        const safeStyle = sanitizeStyleString(value);
        if (safeStyle) clean.setAttribute("style", safeStyle);
        continue;
      }

      if (name === "href" || name === "src") {
        const safeUrl = sanitizeUrl(value);
        if (safeUrl) clean.setAttribute(name, safeUrl);
        continue;
      }

      if (allowedAttrs?.has(name)) {
        clean.setAttribute(name, value);
      }
    }

    // Force safe rel on links
    if (tag === "a" && clean.hasAttribute("href")) {
      clean.setAttribute("rel", "noopener noreferrer");
      if (!clean.getAttribute("target")) {
        clean.setAttribute("target", "_blank");
      }
    }

    for (const child of Array.from(el.childNodes)) {
      processNode(child, clean);
    }

    parent.appendChild(clean);
  }

  for (const child of Array.from(doc.body.childNodes)) {
    processNode(child, fragment);
  }

  const wrapper = doc.createElement("div");
  wrapper.appendChild(fragment);
  return wrapper.innerHTML;
}

interface RichTextContentProps {
  html: string;
  className?: string;
}

/**
 * Renders sanitized HTML inside a `.rich-content` wrapper.
 */
export function RichTextContent({ html, className }: RichTextContentProps): ReactNode {
  const clean = useMemo(() => sanitizeHtml(html), [html]);
  return (
    <div
      className={cn("rich-content", className)}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
