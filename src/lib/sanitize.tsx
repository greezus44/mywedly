import React from "react";

const ALLOWED_TAGS = new Set([
  "p",
  "br",
  "strong",
  "em",
  "u",
  "s",
  "ol",
  "ul",
  "li",
  "a",
  "span",
  "div",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "blockquote",
  "img",
  "figure",
  "figcaption",
  "hr",
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
  blockquote: new Set(["style", "class"]),
  li: new Set(["style", "class"]),
  ul: new Set(["style", "class"]),
  ol: new Set(["style", "class"]),
  figure: new Set(["style", "class"]),
  figcaption: new Set(["style", "class"]),
};

const ALLOWED_STYLE_PROPS = new Set([
  "color",
  "background-color",
  "font-weight",
  "font-style",
  "text-decoration",
  "text-align",
  "font-size",
  "line-height",
  "margin",
  "margin-top",
  "margin-bottom",
  "padding",
  "font-family",
]);

function sanitizeStyleValue(prop: string, value: string): string {
  // block any url() or expression() in styles to prevent CSS-based attacks
  if (/url\s*\(|expression\s*\(|javascript:/i.test(value)) return "";
  if (!ALLOWED_STYLE_PROPS.has(prop)) return "";
  return value;
}

function sanitizeNode(node: Element): void {
  const tag = node.tagName.toLowerCase();
  if (!ALLOWED_TAGS.has(tag)) {
    // replace disallowed element with its children
    while (node.firstChild) {
      node.parentNode?.insertBefore(node.firstChild, node);
    }
    node.parentNode?.removeChild(node);
    return;
  }
  // sanitize attributes
  const allowed = ALLOWED_ATTRS[tag] ?? new Set<string>();
  const attrs = Array.from(node.attributes);
  for (const attr of attrs) {
    const name = attr.name.toLowerCase();
    if (!allowed.has(name)) {
      node.removeAttribute(name);
      continue;
    }
    if (name === "href" || name === "src") {
      const val = attr.value.trim();
      if (/^\s*javascript:/i.test(val) || /^\s*data:text\/html/i.test(val)) {
        node.removeAttribute(name);
      }
    }
    if (name === "target") {
      node.setAttribute("target", "_blank");
      node.setAttribute("rel", "noopener noreferrer");
    }
    if (name === "style") {
      const cleaned = attr.value
        .split(";")
        .map((part) => {
          const idx = part.indexOf(":");
          if (idx === -1) return "";
          const prop = part.slice(0, idx).trim().toLowerCase();
          const val = part.slice(idx + 1).trim();
          const safe = sanitizeStyleValue(prop, val);
          return safe ? `${prop}: ${safe}` : "";
        })
        .filter(Boolean)
        .join("; ");
      if (cleaned) node.setAttribute("style", cleaned);
      else node.removeAttribute("style");
    }
  }
  // recurse into children (copy array since we mutate)
  const children = Array.from(node.children);
  for (const child of children) sanitizeNode(child);
}

export function sanitizeHtml(html: string): string {
  if (!html) return "";
  if (typeof window === "undefined" || typeof DOMParser === "undefined") return html;
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div id="__sanitize_root">${html}</div>`, "text/html");
  const root = doc.getElementById("__sanitize_root");
  if (!root) return "";
  const children = Array.from(root.children);
  for (const child of children) sanitizeNode(child);
  return root.innerHTML;
}

interface RichTextContentProps {
  html: string;
  className?: string;
}

export const RichTextContent: React.FC<RichTextContentProps> = ({ html, className }) => {
  const clean = React.useMemo(() => sanitizeHtml(html), [html]);
  return (
    <div
      className={className ? `rich-content ${className}` : "rich-content"}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
};
