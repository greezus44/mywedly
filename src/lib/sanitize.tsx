import React from "react";

const ALLOWED_TAGS = new Set([
  "a", "abbr", "b", "blockquote", "br", "cite", "code", "dd", "del", "div", "dl", "dt",
  "em", "h1", "h2", "h3", "h4", "h5", "h6", "hr", "i", "img", "ins", "kbd", "li", "mark",
  "ol", "p", "pre", "q", "s", "samp", "small", "span", "strong", "sub", "sup", "table",
  "tbody", "td", "tfoot", "th", "thead", "tr", "u", "ul", "br",
]);

const ALLOWED_ATTRS: Record<string, Set<string>> = {
  a: new Set(["href", "title", "target", "rel"]),
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
  blockquote: new Set(["style", "class"]),
  li: new Set(["style", "class"]),
  ul: new Set(["style", "class"]),
  ol: new Set(["style", "class"]),
  td: new Set(["style", "class", "colspan", "rowspan"]),
  th: new Set(["style", "class", "colspan", "rowspan"]),
  table: new Set(["style", "class"]),
  b: new Set(["style", "class"]),
  strong: new Set(["style", "class"]),
  em: new Set(["style", "class"]),
  i: new Set(["style", "class"]),
  u: new Set(["style", "class"]),
  s: new Set(["style", "class"]),
  mark: new Set(["style", "class"]),
  code: new Set(["style", "class"]),
  pre: new Set(["style", "class"]),
};

const ALLOWED_STYLE_PROPS = new Set([
  "color", "background-color", "font-size", "font-weight", "font-style",
  "text-align", "text-decoration", "line-height", "letter-spacing",
  "margin", "margin-top", "margin-bottom", "margin-left", "margin-right",
  "padding", "padding-top", "padding-bottom", "padding-left", "padding-right",
  "border", "border-color", "border-radius", "width", "height", "max-width",
]);

function sanitizeStyle(styleStr: string): string {
  return styleStr
    .split(";")
    .map((decl) => {
      const [prop, ...valParts] = decl.split(":");
      const p = prop?.trim().toLowerCase();
      const v = valParts.join(":").trim();
      if (!p || !v) return "";
      if (!ALLOWED_STYLE_PROPS.has(p)) return "";
      if (/javascript:|expression\(|url\(/i.test(v)) return "";
      return `${p}: ${v}`;
    })
    .filter(Boolean)
    .join("; ");
}

export function sanitizeHtml(html: string): string {
  if (!html) return "";
  if (typeof window === "undefined" || typeof DOMParser === "undefined") return html;
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  function walk(node: Node) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      const tag = el.tagName.toLowerCase();
      if (!ALLOWED_TAGS.has(tag)) {
        const parent = el.parentNode;
        if (parent) {
          while (el.firstChild) {
            parent.insertBefore(el.firstChild, el);
          }
          parent.removeChild(el);
          return;
        }
      } else {
        const allowed = ALLOWED_ATTRS[tag] ?? new Set<string>();
        const attrs = Array.from(el.attributes);
        for (const attr of attrs) {
          if (!allowed.has(attr.name.toLowerCase())) {
            el.removeAttribute(attr.name);
          } else if (attr.name.toLowerCase() === "href") {
            const val = attr.value;
            if (/javascript:|data:/i.test(val)) {
              el.removeAttribute(attr.name);
            }
          } else if (attr.name.toLowerCase() === "style") {
            el.setAttribute("style", sanitizeStyle(attr.value));
          }
        }
      }
    }
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
  const sanitized = React.useMemo(() => sanitizeHtml(html), [html]);
  return (
    <div
      className={cn("rich-content", className)}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}

function cn(...inputs: (string | undefined | null | false)[]): string {
  return inputs.filter(Boolean).join(" ");
}
