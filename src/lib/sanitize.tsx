import { useMemo } from "react";

// ---------------------------------------------------------------------------
// HTML sanitizer
// ---------------------------------------------------------------------------

const ALLOWED_TAGS = new Set([
  "p",
  "br",
  "strong",
  "em",
  "u",
  "s",
  "span",
  "div",
  "a",
  "ul",
  "ol",
  "li",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "img",
]);

const ALLOWED_ATTRS = new Set(["style", "href", "src", "alt"]);

const ALLOWED_STYLE_PROPS = new Set([
  "color",
  "font-size",
  "font-family",
  "font-weight",
  "font-style",
  "text-decoration",
  "text-align",
  "background-color",
  "margin",
  "padding",
]);

/**
 * Sanitize an HTML string, allowing only a safe subset of tags, attributes,
 * and inline style properties. Strips <script>, event handlers, javascript:
 * URLs, and any disallowed styles.
 */
export function sanitizeHtml(html: string): string {
  if (!html) return "";
  const doc = new DOMParser().parseFromString(html, "text/html");
  cleanNode(doc.body);
  return doc.body.innerHTML;
}

function cleanNode(node: Node): void {
  // Walk children first so we can safely remove nodes while iterating.
  const children = Array.from(node.childNodes);
  for (const child of children) {
    if (child.nodeType === Node.ELEMENT_NODE) {
      cleanElement(child as Element);
    } else if (child.nodeType === Node.COMMENT_NODE) {
      node.removeChild(child);
    }
    // Text nodes are kept as-is.
  }
}

function cleanElement(el: Element): void {
  const tag = el.tagName.toLowerCase();

  if (!ALLOWED_TAGS.has(tag)) {
    // Replace disallowed element with its children (unwrap), or remove.
    const parent = el.parentNode;
    if (!parent) return;
    if (tag === "script" || tag === "style" || tag === "iframe" || tag === "object") {
      parent.removeChild(el);
      return;
    }
    // Unwrap: move children up, then remove the element.
    while (el.firstChild) {
      parent.insertBefore(el.firstChild, el);
    }
    parent.removeChild(el);
    return;
  }

  // Remove disallowed attributes.
  const attrs = Array.from(el.attributes);
  for (const attr of attrs) {
    if (!ALLOWED_ATTRS.has(attr.name)) {
      el.removeAttribute(attr.name);
      continue;
    }
    // Sanitize href/src — block javascript: URLs.
    if ((attr.name === "href" || attr.name === "src")) {
      const val = attr.value.trim().toLowerCase();
      if (val.startsWith("javascript:") || val.startsWith("data:text/html")) {
        el.removeAttribute(attr.name);
      }
    }
  }

  // Sanitize inline style.
  if (el.hasAttribute("style")) {
    const style = el.getAttribute("style") ?? "";
    el.setAttribute("style", sanitizeStyle(style));
  }

  // Recurse into children.
  cleanNode(el);
}

function sanitizeStyle(style: string): string {
  const declarations = style.split(";");
  const kept: string[] = [];
  for (const decl of declarations) {
    const idx = decl.indexOf(":");
    if (idx === -1) continue;
    const prop = decl.slice(0, idx).trim().toLowerCase();
    const value = decl.slice(idx + 1).trim();
    if (!prop || !value) continue;
    if (!ALLOWED_STYLE_PROPS.has(prop)) continue;
    // Block url() in style values (prevents background-image: url(javascript:...) etc.)
    if (value.toLowerCase().includes("url(")) continue;
    if (value.toLowerCase().includes("expression(")) continue;
    kept.push(`${prop}: ${value}`);
  }
  return kept.join("; ");
}

// ---------------------------------------------------------------------------
// RichTextContent component
// ---------------------------------------------------------------------------

interface RichTextContentProps {
  html: string;
  className?: string;
}

/**
 * Renders sanitized HTML content. The HTML is sanitized before being
 * inserted via dangerouslySetInnerHTML to prevent XSS.
 */
export function RichTextContent({ html, className }: RichTextContentProps) {
  const sanitized = useMemo(() => sanitizeHtml(html ?? ""), [html]);
  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}
