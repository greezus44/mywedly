import { useMemo, type ReactNode } from "react";

const ALLOWED_TAGS = new Set([
  "a", "b", "br", "div", "em", "h1", "h2", "h3", "h4", "h5", "h6",
  "i", "img", "li", "mark", "ol", "p", "span", "strong", "sub", "sup",
  "table", "tbody", "td", "tfoot", "th", "thead", "tr", "u", "ul",
  "blockquote", "hr", "pre", "code",
]);

const ALLOWED_ATTRS: Record<string, string[]> = {
  a: ["href", "target", "rel"],
  img: ["src", "alt", "width", "height"],
  span: ["style", "class"],
  div: ["style", "class"],
  p: ["style", "class"],
  h1: ["style", "class"],
  h2: ["style", "class"],
  h3: ["style", "class"],
  h4: ["style", "class"],
  h5: ["style", "class"],
  h6: ["style", "class"],
  li: ["style", "class"],
  ul: ["style", "class"],
  ol: ["style", "class"],
  blockquote: ["style", "class"],
  td: ["style", "class", "colspan", "rowspan"],
  th: ["style", "class", "colspan", "rowspan"],
  mark: ["style", "class"],
  strong: ["style", "class"],
  em: ["style", "class"],
  b: ["style", "class"],
  i: ["style", "class"],
  u: ["style", "class"],
  pre: ["style", "class"],
  code: ["style", "class"],
};

const ALLOWED_STYLE_PROPS = new Set([
  "color", "background-color", "font-size", "font-family", "font-weight",
  "font-style", "text-align", "text-decoration", "line-height",
  "margin", "margin-top", "margin-bottom", "margin-left", "margin-right",
  "padding", "padding-top", "padding-bottom", "padding-left", "padding-right",
  "border", "border-color", "border-width", "border-style", "border-radius",
  "width", "height", "max-width", "max-height",
]);

function sanitizeStyle(styleStr: string): string {
  const rules = styleStr.split(";");
  const clean: string[] = [];
  for (const rule of rules) {
    const idx = rule.indexOf(":");
    if (idx === -1) continue;
    const prop = rule.slice(0, idx).trim().toLowerCase();
    const value = rule.slice(idx + 1).trim();
    if (prop && ALLOWED_STYLE_PROPS.has(prop) && value) {
      if (/javascript:|expression\(|url\(/i.test(value)) continue;
      clean.push(`${prop}: ${value}`);
    }
  }
  return clean.join("; ");
}

export function sanitizeHtml(html: string): string {
  if (!html) return "";
  if (typeof DOMParser === "undefined") return html;
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  function walk(node: Node): void {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      const tag = el.tagName.toLowerCase();
      if (!ALLOWED_TAGS.has(tag)) {
        const parent = el.parentNode;
        if (parent) {
          while (el.firstChild) parent.insertBefore(el.firstChild, el);
          parent.removeChild(el);
        }
        return;
      }
      const allowed = ALLOWED_ATTRS[tag] ?? [];
      const attrs = Array.from(el.attributes);
      for (const attr of attrs) {
        const name = attr.name.toLowerCase();
        if (!allowed.includes(name)) {
          el.removeAttribute(attr.name);
          continue;
        }
        if (name === "href" || name === "src") {
          const val = attr.value.trim().toLowerCase();
          if (val.startsWith("javascript:") || val.startsWith("data:text/html")) {
            el.removeAttribute(attr.name);
            continue;
          }
        }
        if (name === "style") {
          el.setAttribute("style", sanitizeStyle(attr.value));
        }
        if (name === "target" && attr.value === "_blank") {
          el.setAttribute("rel", "noopener noreferrer");
        }
      }
    }
    const children = Array.from(node.childNodes);
    for (const child of children) walk(child);
  }

  walk(doc.body);
  return doc.body.innerHTML;
}

interface RichTextContentProps {
  html: string;
  className?: string;
}

export function RichTextContent({ html, className }: RichTextContentProps): ReactNode {
  const clean = useMemo(() => sanitizeHtml(html), [html]);
  return (
    <div
      className={className ? `rich-content ${className}` : "rich-content"}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
