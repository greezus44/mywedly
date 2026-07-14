import React from "react";

const ALLOWED_TAGS = new Set([
  "p", "br", "strong", "b", "em", "i", "u", "s", "span", "div",
  "ul", "ol", "li", "a", "img", "blockquote", "h1", "h2", "h3", "h4", "h5", "h6",
  "hr", "table", "thead", "tbody", "tr", "th", "td", "figure", "figcaption",
]);

const ALLOWED_ATTRS: Record<string, string[]> = {
  a: ["href", "title", "target", "rel"],
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
  figure: ["style", "class"],
  figcaption: ["style", "class"],
};

const ALLOWED_STYLE_PROPS = new Set([
  "color", "background-color", "font-size", "font-weight", "font-style",
  "text-align", "text-decoration", "line-height", "margin", "padding",
  "margin-top", "margin-bottom", "margin-left", "margin-right",
  "padding-top", "padding-bottom", "padding-left", "padding-right",
]);

function sanitizeStyle(styleStr: string): string {
  const props = styleStr.split(";").map((p) => p.trim()).filter(Boolean);
  const clean: string[] = [];
  for (const prop of props) {
    const colonIdx = prop.indexOf(":");
    if (colonIdx === -1) continue;
    const key = prop.slice(0, colonIdx).trim().toLowerCase();
    const val = prop.slice(colonIdx + 1).trim();
    if (ALLOWED_STYLE_PROPS.has(key) && val) {
      clean.push(`${key}: ${val}`);
    }
  }
  return clean.join("; ");
}

export function sanitizeHtml(html: string): string {
  if (typeof document === "undefined" || !html) return "";
  const doc = new DOMParser().parseFromString(html, "text/html");
  const cleanNode = (node: ChildNode) => {
    if (node.nodeType === Node.TEXT_NODE) return;
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
        if (!allowed.includes(attr.name)) {
          el.removeAttribute(attr.name);
        } else if (attr.name === "href") {
          const val = attr.value;
          if (!/^(https?:|mailto:|tel:|#)/i.test(val)) {
            el.removeAttribute(attr.name);
          }
        } else if (attr.name === "style") {
          el.setAttribute("style", sanitizeStyle(attr.value));
        } else if (attr.name === "src") {
          const val = attr.value;
          if (!/^(https?:|data:image\/)/i.test(val)) {
            el.removeAttribute(attr.name);
          }
        }
      }
      if (tag === "a") {
        el.setAttribute("rel", "noopener noreferrer");
        const href = el.getAttribute("href");
        if (href && !href.startsWith("#")) {
          el.setAttribute("target", "_blank");
        }
      }
      const children = Array.from(el.childNodes);
      for (const child of children) cleanNode(child);
    }
  };
  const body = doc.body;
  const children = Array.from(body.childNodes);
  for (const child of children) cleanNode(child);
  return body.innerHTML;
}

interface RichTextContentProps {
  html: string;
  className?: string;
}

export function RichTextContent({ html, className }: RichTextContentProps): React.ReactElement {
  const clean = React.useMemo(() => sanitizeHtml(html), [html]);
  return (
    <div
      className={["rich-content", className].filter(Boolean).join(" ")}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
