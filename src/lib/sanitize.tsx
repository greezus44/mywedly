import React, { useMemo } from "react";

const ALLOWED_TAGS = new Set([
  "p", "br", "strong", "b", "em", "i", "u", "s", "span", "div",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "ul", "ol", "li",
  "a", "img", "blockquote", "hr",
  "table", "thead", "tbody", "tr", "td", "th",
]);

const ALLOWED_ATTRS: Record<string, Set<string>> = {
  a: new Set(["href", "target", "rel", "title"]),
  img: new Set(["src", "alt", "width", "height", "style"]),
  span: new Set(["style", "class"]),
  div: new Set(["style", "class"]),
  p: new Set(["style", "class"]),
  td: new Set(["style", "colspan", "rowspan"]),
  th: new Set(["style", "colspan", "rowspan"]),
  h1: new Set(["style", "class"]),
  h2: new Set(["style", "class"]),
  h3: new Set(["style", "class"]),
  h4: new Set(["style", "class"]),
  h5: new Set(["style", "class"]),
  h6: new Set(["style", "class"]),
  blockquote: new Set(["style", "class"]),
};

const ALLOWED_STYLE_PROPS = new Set([
  "color", "background-color", "font-size", "font-weight",
  "font-style", "text-align", "text-decoration", "line-height",
  "margin", "padding", "width", "height", "max-width",
]);

function sanitizeStyleString(styleStr: string): string {
  return styleStr
    .split(";")
    .map((decl) => decl.trim())
    .filter((decl) => {
      if (!decl) return false;
      const colonIdx = decl.indexOf(":");
      if (colonIdx === -1) return false;
      const prop = decl.substring(0, colonIdx).trim().toLowerCase();
      return ALLOWED_STYLE_PROPS.has(prop);
    })
    .join("; ");
}

export function sanitizeHtml(html: string): string {
  if (!html) return "";
  if (typeof window === "undefined" || typeof DOMParser === "undefined") return html;
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) return;
    if (node.nodeType !== Node.ELEMENT_NODE) {
      node.parentNode?.removeChild(node);
      return;
    }
    const el = node as Element;
    const tag = el.tagName.toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) {
      const parent = el.parentNode;
      if (parent) {
        while (el.firstChild) {
          parent.insertBefore(el.firstChild, el);
        }
        parent.removeChild(el);
      }
      return;
    }
    const allowedAttrs = ALLOWED_ATTRS[tag] ?? new Set<string>();
    const attrs = Array.from(el.attributes);
    for (const attr of attrs) {
      if (!allowedAttrs.has(attr.name.toLowerCase())) {
        el.removeAttribute(attr.name);
        continue;
      }
      if ((attr.name === "href" || attr.name === "src") && attr.value) {
        const val = attr.value.trim().toLowerCase();
        if (val.startsWith("javascript:") || val.startsWith("data:")) {
          el.removeAttribute(attr.name);
          continue;
        }
      }
      if (attr.name === "style") {
        const sanitized = sanitizeStyleString(attr.value);
        if (sanitized) {
          el.setAttribute("style", sanitized);
        } else {
          el.removeAttribute("style");
        }
      }
    }
    if (tag === "a") {
      el.setAttribute("rel", "noopener noreferrer");
      const href = el.getAttribute("href");
      if (href && !href.startsWith("#") && !href.startsWith("/")) {
        el.setAttribute("target", "_blank");
      }
    }
    const children = Array.from(el.childNodes);
    for (const child of children) {
      walk(child);
    }
  };

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
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}
