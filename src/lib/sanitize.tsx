import React, { useMemo } from "react";
import { cn } from "./utils";

const ALLOWED_TAGS = new Set([
  "a", "abbr", "address", "article", "aside", "b", "blockquote", "br",
  "caption", "cite", "code", "col", "colgroup", "dd", "del", "details",
  "div", "dl", "dt", "em", "figcaption", "figure", "footer", "h1", "h2",
  "h3", "h4", "h5", "h6", "header", "hr", "i", "img", "ins", "kbd", "li",
  "main", "mark", "nav", "ol", "p", "pre", "q", "samp", "section", "small",
  "span", "strong", "sub", "summary", "sup", "table", "tbody", "td", "tfoot",
  "th", "thead", "time", "tr", "u", "ul", "var",
]);

const ALLOWED_ATTRS = new Set([
  "href", "title", "src", "alt", "width", "height", "colspan", "rowspan",
  "target", "rel", "datetime", "class", "style",
]);

const ALLOWED_PROTOCOLS = new Set(["http:", "https:", "mailto:", "tel:"]);

function sanitizeNode(node: Element): void {
  const children = Array.from(node.children);
  for (const child of children) {
    const tag = child.tagName.toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) {
      child.remove();
      continue;
    }
    const attrs = Array.from(child.attributes);
    for (const attr of attrs) {
      if (!ALLOWED_ATTRS.has(attr.name.toLowerCase())) {
        child.removeAttribute(attr.name);
        continue;
      }
      const val = attr.value;
      if ((attr.name === "href" || attr.name === "src") && val) {
        const trimmed = val.trim().toLowerCase();
        if (trimmed.startsWith("javascript:") || trimmed.startsWith("data:text/html")) {
          child.removeAttribute(attr.name);
          continue;
        }
        if (!trimmed.startsWith("#") && !trimmed.startsWith("/") && !trimmed.startsWith("?")) {
          try {
            const url = new URL(val, "http://example.com");
            if (!ALLOWED_PROTOCOLS.has(url.protocol)) {
              child.removeAttribute(attr.name);
              continue;
            }
          } catch {
            child.removeAttribute(attr.name);
            continue;
          }
        }
      }
      if (attr.name === "target" && val === "_blank") {
        child.setAttribute("rel", "noopener noreferrer");
      }
      if (attr.name === "style" && val) {
        if (/expression\s*\(|javascript:|@import|url\s*\(\s*['"]?\s*javascript:/i.test(val)) {
          child.removeAttribute("style");
        }
      }
    }
    sanitizeNode(child);
  }
}

export function sanitizeHtml(html: string): string {
  if (!html) return "";
  if (typeof window === "undefined" || typeof DOMParser === "undefined") return html;
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div id="__root">${html}</div>`, "text/html");
  const root = doc.getElementById("__root");
  if (!root) return "";
  sanitizeNode(root);
  return root.innerHTML;
}

interface RichTextContentProps {
  html: string;
  className?: string;
}

export function RichTextContent({ html, className }: RichTextContentProps) {
  const sanitized = useMemo(() => sanitizeHtml(html), [html]);
  return (
    <div
      className={cn("rich-content", className)}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}
