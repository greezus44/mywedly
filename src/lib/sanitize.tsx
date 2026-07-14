import React from "react";
import { cn } from "./utils";

const ALLOWED_TAGS = new Set([
  "a", "abbr", "b", "blockquote", "br", "cite", "code", "dd", "del", "div",
  "dl", "dt", "em", "h1", "h2", "h3", "h4", "h5", "h6", "hr", "i", "img",
  "ins", "kbd", "li", "mark", "ol", "p", "pre", "q", "s", "samp", "small",
  "span", "strong", "sub", "sup", "ul", "u",
]);

const ALLOWED_ATTRS: Record<string, Set<string>> = {
  a: new Set(["href", "title", "target", "rel"]),
  img: new Set(["src", "alt", "title", "width", "height"]),
  span: new Set(["style", "class"]),
  div: new Set(["style", "class"]),
  p: new Set(["style", "class"]),
  "*": new Set(["style", "class"]),
};

const ALLOWED_PROTOCOLS = new Set([
  "http:", "https:", "mailto:", "tel:", "data:",
]);

function isDomParserAvailable(): boolean {
  return typeof window !== "undefined" && typeof window.DOMParser !== "undefined";
}

export function sanitizeHtml(html: string): string {
  if (!html) return "";
  if (!isDomParserAvailable()) {
    return html.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/on\w+\s*=/gi, "");
  }
  const doc = new DOMParser().parseFromString(html, "text/html");
  const fragment = doc.body;

  function cleanNode(node: Node) {
    const children = Array.from(node.childNodes);
    for (const child of children) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const el = child as Element;
        const tag = el.tagName.toLowerCase();
        if (!ALLOWED_TAGS.has(tag)) {
          // Replace disallowed element with its children (preserve text content)
          const parent = el.parentNode;
          if (parent) {
            while (el.firstChild) {
              parent.insertBefore(el.firstChild, el);
            }
            parent.removeChild(el);
          }
          continue;
        }
        // Clean attributes
        const allowed = ALLOWED_ATTRS[tag] ?? ALLOWED_ATTRS["*"];
        const allAttrs = Array.from(el.attributes);
        for (const attr of allAttrs) {
          const name = attr.name.toLowerCase();
          if (!allowed.has(name)) {
            el.removeAttribute(attr.name);
            continue;
          }
          if (name === "href" || name === "src") {
            const val = attr.value.trim().toLowerCase();
            try {
              const url = new URL(attr.value, window.location.origin);
              if (!ALLOWED_PROTOCOLS.has(url.protocol)) {
                el.removeAttribute(attr.name);
              }
            } catch {
              if (val && !val.startsWith("#")) {
                el.removeAttribute(attr.name);
              }
            }
          }
          if (name === "style") {
            // Remove potentially dangerous CSS (expression, javascript:)
            const val = attr.value.replace(/expression\s*\(/gi, "").replace(/javascript:/gi, "");
            el.setAttribute("style", val);
          }
        }
        // Force rel on anchor tags
        if (tag === "a") {
          el.setAttribute("rel", "noopener noreferrer");
          const href = el.getAttribute("href");
          if (href && (href.startsWith("http://") || href.startsWith("https://"))) {
            el.setAttribute("target", "_blank");
          }
        }
        cleanNode(el);
      } else if (child.nodeType === Node.TEXT_NODE) {
        // Keep text nodes as-is
      } else {
        // Remove comments, processing instructions, etc.
        child.parentNode?.removeChild(child);
      }
    }
  }

  cleanNode(fragment);
  return fragment.innerHTML;
}

interface RichTextContentProps {
  html: string;
  className?: string;
}

export function RichTextContent({ html, className }: RichTextContentProps): React.ReactElement {
  const clean = React.useMemo(() => sanitizeHtml(html), [html]);
  return (
    <div
      className={cn("rich-content", className)}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
