import { useMemo } from "react";

const ALLOWED_TAGS = new Set([
  "p", "br", "strong", "em", "u", "s", "strike",
  "ol", "ul", "li",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "a", "img", "blockquote", "span", "div",
]);

const ALLOWED_ATTRS: Record<string, Set<string>> = {
  a: new Set(["href", "target", "rel", "style"]),
  img: new Set(["src", "alt", "style", "width", "height"]),
  span: new Set(["style", "class"]),
  div: new Set(["style", "class"]),
  p: new Set(["style", "class"]),
  h1: new Set(["style", "class"]),
  h2: new Set(["style", "class"]),
  h3: new Set(["style", "class"]),
  h4: new Set(["style", "class"]),
  h5: new Set(["style", "class"]),
  h6: new Set(["style", "class"]),
  blockquote: new Set(["style", "class"]),
  li: new Set(["style", "class"]),
  ul: new Set(["style", "class"]),
  ol: new Set(["style", "class"]),
  strong: new Set(["style"]),
  em: new Set(["style"]),
  u: new Set(["style"]),
  s: new Set(["style"]),
  strike: new Set(["style"]),
};

const ALLOWED_STYLE_PROPS = new Set([
  "color",
  "background-color",
  "font-size",
  "font-weight",
  "font-style",
  "text-decoration",
  "text-align",
  "font-family",
  "line-height",
  "margin",
  "margin-top",
  "margin-bottom",
  "margin-left",
  "margin-right",
  "padding",
  "padding-top",
  "padding-bottom",
  "padding-left",
  "padding-right",
  "width",
  "height",
  "max-width",
  "max-height",
  "border-radius",
]);

function sanitizeStyle(styleStr: string): string {
  const declarations = styleStr.split(";");
  const cleaned: string[] = [];
  for (const decl of declarations) {
    const colonIdx = decl.indexOf(":");
    if (colonIdx === -1) continue;
    const prop = decl.slice(0, colonIdx).trim().toLowerCase();
    const value = decl.slice(colonIdx + 1).trim();
    if (!prop || !value) continue;
    if (ALLOWED_STYLE_PROPS.has(prop)) {
      // Block any attempt at url() or javascript: in values
      if (/url\(|javascript:|expression\(/i.test(value)) continue;
      cleaned.push(`${prop}: ${value}`);
    }
  }
  return cleaned.join("; ");
}

export function sanitizeHtml(dirty: string): string {
  if (!dirty) return "";
  if (typeof window === "undefined" || typeof DOMParser === "undefined") return dirty;
  const parser = new DOMParser();
  const doc = parser.parseFromString(dirty, "text/html");

  function walk(node: Node) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      const tag = el.tagName.toLowerCase();
      if (!ALLOWED_TAGS.has(tag)) {
        // Replace disallowed element with its children (unwrap)
        const parent = el.parentNode;
        if (parent) {
          while (el.firstChild) {
            parent.insertBefore(el.firstChild, el);
          }
          parent.removeChild(el);
        }
        return;
      }
      // Clean attributes
      const allowedAttrs = ALLOWED_ATTRS[tag] ?? new Set<string>();
      const attrs = Array.from(el.attributes);
      for (const attr of attrs) {
        if (!allowedAttrs.has(attr.name.toLowerCase())) {
          el.removeAttribute(attr.name);
          continue;
        }
        if (attr.name.toLowerCase() === "href") {
          const val = attr.value.trim().toLowerCase();
          if (val.startsWith("javascript:") || val.startsWith("data:text/html")) {
            el.removeAttribute(attr.name);
          }
        }
        if (attr.name.toLowerCase() === "src") {
          const val = attr.value.trim().toLowerCase();
          if (val.startsWith("javascript:")) {
            el.removeAttribute(attr.name);
          }
        }
        if (attr.name.toLowerCase() === "style") {
          const cleaned = sanitizeStyle(attr.value);
          if (cleaned) {
            el.setAttribute("style", cleaned);
          } else {
            el.removeAttribute(attr.name);
          }
        }
        if (attr.name.toLowerCase() === "target" && attr.value === "_blank") {
          el.setAttribute("rel", "noopener noreferrer");
        }
      }
    }
    // Walk children (use a copy since we may mutate)
    const children = Array.from(node.childNodes);
    for (const child of children) {
      walk(child);
    }
  }

  walk(doc.body);
  return doc.body.innerHTML;
}

interface RichTextContentProps {
  html: string;
  className?: string;
}

export function RichTextContent({ html, className }: RichTextContentProps) {
  const sanitized = useMemo(() => sanitizeHtml(html), [html]);
  return (
    <div
      className={`rich-content ${className ?? ""}`}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}
