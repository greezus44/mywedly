import React from "react";

const ALLOWED_TAGS = new Set([
  "p", "br", "strong", "em", "b", "i", "u", "s", "span",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "ul", "ol", "li",
  "a", "img", "blockquote",
  "div",
]);

const ALLOWED_ATTRS: Record<string, Set<string>> = {
  a: new Set(["href", "target", "rel", "title"]),
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
};

const ALLOWED_STYLE_PROPS = new Set([
  "color", "background-color", "font-weight", "font-style",
  "text-decoration", "text-align", "font-size",
  "margin", "padding", "line-height",
]);

function sanitizeStyleString(style: string): string {
  return style
    .split(";")
    .map((rule) => {
      const [prop, ...valueParts] = rule.split(":");
      const trimmedProp = prop?.trim().toLowerCase();
      const value = valueParts.join(":").trim();
      if (!trimmedProp || !value) return "";
      if (!ALLOWED_STYLE_PROPS.has(trimmedProp)) return "";
      return `${trimmedProp}: ${value}`;
    })
    .filter(Boolean)
    .join("; ");
}

function sanitizeNode(node: Node, parent: HTMLElement): void {
  const childNodes = Array.from(node.childNodes);
  for (const child of childNodes) {
    if (child.nodeType === Node.TEXT_NODE) {
      parent.appendChild(document.createTextNode(child.textContent ?? ""));
      continue;
    }
    if (child.nodeType !== Node.ELEMENT_NODE) continue;

    const el = child as HTMLElement;
    const tag = el.tagName.toLowerCase();

    if (!ALLOWED_TAGS.has(tag)) {
      // Recursively process children, skipping the disallowed tag
      sanitizeNode(el, parent);
      continue;
    }

    const newEl = document.createElement(tag);
    const allowedAttrs = ALLOWED_ATTRS[tag] ?? new Set<string>();

    for (const attr of Array.from(el.attributes)) {
      const attrName = attr.name.toLowerCase();
      if (!allowedAttrs.has(attrName)) continue;

      if (attrName === "href") {
        const value = attr.value.trim();
        if (!/^(https?:|mailto:|tel:|\/|#)/i.test(value)) continue;
        newEl.setAttribute("href", value);
        if (tag === "a") {
          newEl.setAttribute("target", "_blank");
          newEl.setAttribute("rel", "noopener noreferrer");
        }
      } else if (attrName === "src") {
        const value = attr.value.trim();
        if (!/^(https?:|\/|data:image\/)/i.test(value)) continue;
        newEl.setAttribute("src", value);
      } else if (attrName === "style") {
        const sanitized = sanitizeStyleString(attr.value);
        if (sanitized) newEl.setAttribute("style", sanitized);
      } else if (attrName === "class") {
        const sanitized = attr.value.replace(/[^a-zA-Z0-9\s_-]/g, "").trim();
        if (sanitized) newEl.setAttribute("class", sanitized);
      } else {
        newEl.setAttribute(attrName, attr.value);
      }
    }

    parent.appendChild(newEl);
    sanitizeNode(el, newEl);
  }
}

export function sanitizeHtml(html: string): string {
  if (!html) return "";
  if (typeof window === "undefined" || typeof DOMParser === "undefined") return html;
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div id="__sanitize_root__">${html}</div>`, "text/html");
  const root = doc.getElementById("__sanitize_root__");
  if (!root) return "";
  const container = document.createElement("div");
  sanitizeNode(root, container);
  return container.innerHTML;
}

interface RichTextContentProps {
  html: string;
  className?: string;
}

export function RichTextContent({ html, className }: RichTextContentProps) {
  const sanitized = React.useMemo(() => sanitizeHtml(html), [html]);
  return (
    <div
      className={className ? `rich-content ${className}` : "rich-content"}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}
