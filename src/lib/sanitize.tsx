import { useMemo } from "react";

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

function sanitizeStyle(style: string): string {
  const declarations: string[] = [];
  for (const part of style.split(";")) {
    const decl = part.trim();
    if (!decl) continue;
    const colonIdx = decl.indexOf(":");
    if (colonIdx < 0) continue;
    const prop = decl.slice(0, colonIdx).trim().toLowerCase();
    const value = decl.slice(colonIdx + 1).trim();
    if (!prop || !value) continue;
    if (ALLOWED_STYLE_PROPS.has(prop)) {
      // Strip url(...) and expression(...) to prevent CSS-based attacks.
      if (/url\s*\(/i.test(value) || /expression\s*\(/i.test(value)) continue;
      declarations.push(`${prop}: ${value}`);
    }
  }
  return declarations.join("; ");
}

function sanitizeNode(node: Node): Node | null {
  if (node.nodeType === Node.TEXT_NODE) {
    return node;
  }
  if (node.nodeType === Node.ELEMENT_NODE) {
    const el = node as Element;
    const tag = el.tagName.toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) {
      // Replace disallowed element with its children (preserves text content).
      const fragment = document.createDocumentFragment();
      for (const child of Array.from(el.childNodes)) {
        const sanitized = sanitizeNode(child);
        if (sanitized) fragment.appendChild(sanitized);
      }
      return fragment;
    }

    const clean = document.createElement(tag);
    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase();
      if (!ALLOWED_ATTRS.has(name)) continue;
      let value = attr.value;
      if (name === "style") {
        value = sanitizeStyle(value);
        if (!value) continue;
      }
      if (name === "href" || name === "src") {
        // Block javascript: and data: URLs (except data:image for img).
        const trimmed = value.trim().toLowerCase();
        if (trimmed.startsWith("javascript:")) continue;
        if (trimmed.startsWith("data:") && !(tag === "img" && trimmed.startsWith("data:image"))) {
          continue;
        }
      }
      clean.setAttribute(name, value);
    }
    for (const child of Array.from(el.childNodes)) {
      const sanitized = sanitizeNode(child);
      if (sanitized) clean.appendChild(sanitized);
    }
    return clean;
  }
  // Drop comments, processing instructions, etc.
  return null;
}

export function sanitizeHtml(html: string): string {
  if (!html) return "";
  const doc = new DOMParser().parseFromString(html, "text/html");
  const fragment = document.createDocumentFragment();
  for (const child of Array.from(doc.body.childNodes)) {
    const sanitized = sanitizeNode(child);
    if (sanitized) fragment.appendChild(sanitized);
  }
  const wrapper = document.createElement("div");
  wrapper.appendChild(fragment);
  return wrapper.innerHTML;
}

export function RichTextContent({
  html,
  className,
}: {
  html: string;
  className?: string;
}) {
  const sanitized = useMemo(() => sanitizeHtml(html), [html]);
  return (
    <div
      className={className}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}
