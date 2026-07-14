import React from "react";
import { cn } from "./utils";

const ALLOWED_TAGS = new Set([
  "p", "br", "strong", "em", "u", "s", "span", "a", "ul", "ol", "li",
  "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "img", "div",
  "table", "thead", "tbody", "tr", "td", "th",
]);

const ALLOWED_ATTRS: Record<string, Set<string>> = {
  a: new Set(["href", "title", "target", "rel"]),
  img: new Set(["src", "alt", "width", "height"]),
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
};

const ALLOWED_STYLE_PROPS = new Set([
  "color", "background-color", "font-size", "font-family", "font-weight",
  "font-style", "text-decoration", "text-align", "line-height",
  "letter-spacing", "margin", "padding",
]);

function sanitizeStyleString(style: string): string {
  return style
    .split(";")
    .map((decl) => decl.trim())
    .filter((decl) => {
      if (!decl) return false;
      const prop = decl.split(":")[0]?.trim().toLowerCase();
      return prop ? ALLOWED_STYLE_PROPS.has(prop) : false;
    })
    .join("; ");
}

export function sanitizeHtml(html: string): string {
  if (typeof window === "undefined" || typeof DOMParser === "undefined") {
    return html;
  }
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  function walk(node: Element) {
    const children = Array.from(node.children);
    for (const child of children) {
      const tag = child.tagName.toLowerCase();
      if (!ALLOWED_TAGS.has(tag)) {
        const parent = child.parentNode;
        if (parent) {
          while (child.firstChild) {
            parent.insertBefore(child.firstChild, child);
          }
          parent.removeChild(child);
        }
        continue;
      }
      const allowedAttrs = ALLOWED_ATTRS[tag];
      const attrs = Array.from(child.attributes);
      for (const attr of attrs) {
        if (!allowedAttrs || !allowedAttrs.has(attr.name.toLowerCase())) {
          child.removeAttribute(attr.name);
        } else if (attr.name.toLowerCase() === "style") {
          child.setAttribute("style", sanitizeStyleString(attr.value));
        } else if (attr.name.toLowerCase() === "href") {
          const val = attr.value;
          if (!/^(https?:|mailto:|tel:|#)/i.test(val)) {
            child.removeAttribute(attr.name);
          }
        } else if (attr.name.toLowerCase() === "src") {
          const val = attr.value;
          if (!/^(https?:|data:image)/i.test(val)) {
            child.removeAttribute(attr.name);
          }
        }
      }
      if (tag === "a") {
        child.setAttribute("target", "_blank");
        child.setAttribute("rel", "noopener noreferrer");
      }
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
  const sanitized = React.useMemo(() => sanitizeHtml(html), [html]);
  return (
    <div
      className={cn("rich-content", className)}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}
