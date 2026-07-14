import React from "react";
import { cn } from "./utils";

const ALLOWED_TAGS = new Set([
  "p", "br", "strong", "em", "u", "s", "ol", "ul", "li",
  "a", "img", "blockquote", "h1", "h2", "h3", "h4", "h5", "h6",
  "span", "div", "hr", "table", "thead", "tbody", "tr", "th", "td",
]);

const ALLOWED_ATTRS: Record<string, Set<string>> = {
  a: new Set(["href", "title", "target", "rel"]),
  img: new Set(["src", "alt", "width", "height"]),
  span: new Set(["style", "class"]),
  div: new Set(["style", "class"]),
  p: new Set(["style", "class"]),
  td: new Set(["style", "class", "colspan", "rowspan"]),
  th: new Set(["style", "class", "colspan", "rowspan"]),
};

const ALLOWED_STYLE_PROPS = new Set([
  "color", "background-color", "font-weight", "font-style",
  "text-decoration", "text-align", "font-size",
]);

function sanitizeStyleValue(style: string): string {
  return style
    .split(";")
    .map((decl) => {
      const [prop, ...rest] = decl.split(":");
      const p = prop?.trim().toLowerCase();
      const v = rest.join(":").trim();
      if (!p || !v) return "";
      if (!ALLOWED_STYLE_PROPS.has(p)) return "";
      if (/expression|javascript:|url\(/i.test(v)) return "";
      return `${p}: ${v}`;
    })
    .filter(Boolean)
    .join("; ");
}

export function sanitizeHtml(dirty: string): string {
  if (typeof window === "undefined" || typeof DOMParser === "undefined") {
    return dirty;
  }
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<body>${dirty}</body>`, "text/html");
  const body = doc.body;

  const walk = (node: Element) => {
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
          continue;
        }
      }
      const allowed = ALLOWED_ATTRS[tag] ?? new Set<string>();
      const attrs = Array.from(child.attributes);
      for (const attr of attrs) {
        if (!allowed.has(attr.name)) {
          child.removeAttribute(attr.name);
          continue;
        }
        if (attr.name === "href" || attr.name === "src") {
          const val = attr.value.trim();
          if (/javascript:/i.test(val)) {
            child.removeAttribute(attr.name);
          }
        }
        if (attr.name === "style") {
          child.setAttribute("style", sanitizeStyleValue(attr.value));
        }
        if (attr.name === "target") {
          child.setAttribute("rel", "noopener noreferrer");
        }
      }
      walk(child);
    }
  };

  walk(body);
  return body.innerHTML;
}

interface RichTextContentProps {
  html: string;
  className?: string;
}

export function RichTextContent({ html, className }: RichTextContentProps) {
  const clean = React.useMemo(() => sanitizeHtml(html ?? ""), [html]);
  return (
    <div
      className={cn("rich-content", className)}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
