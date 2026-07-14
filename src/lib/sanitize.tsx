import { useMemo, type ReactNode } from "react";
import { cn } from "./utils";

const ALLOWED_TAGS = new Set([
  "p", "br", "strong", "em", "u", "s", "sup", "sub",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "ul", "ol", "li",
  "a", "img", "blockquote", "hr",
  "span", "div",
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
};

const ALLOWED_STYLE_PROPS = new Set([
  "color", "background-color", "font-weight", "font-style",
  "text-decoration", "text-align", "font-size",
]);

function sanitizeStyleValue(prop: string, value: string): string {
  const v = value.trim().toLowerCase();
  if (prop === "color" || prop === "background-color") {
    return /^(#[0-9a-f]{3,8}|rgb[a]?\([^)]*\)|[a-z]+)$/.test(v) ? v : "";
  }
  if (prop === "font-weight") {
    return /^(normal|bold|[1-9]00)$/.test(v) ? v : "";
  }
  if (prop === "font-style") {
    return /^(normal|italic)$/.test(v) ? v : "";
  }
  if (prop === "text-decoration") {
    return /^(none|underline|line-through)$/.test(v) ? v : "";
  }
  if (prop === "text-align") {
    return /^(left|center|right|justify)$/.test(v) ? v : "";
  }
  if (prop === "font-size") {
    return /^(\d+(px|em|rem|%)|small|medium|large)$/.test(v) ? v : "";
  }
  return "";
}

function sanitizeStyle(styleStr: string): string {
  const declarations = styleStr.split(";");
  const clean: string[] = [];
  for (const decl of declarations) {
    const idx = decl.indexOf(":");
    if (idx === -1) continue;
    const prop = decl.slice(0, idx).trim().toLowerCase();
    const val = decl.slice(idx + 1).trim();
    if (!ALLOWED_STYLE_PROPS.has(prop)) continue;
    const safe = sanitizeStyleValue(prop, val);
    if (safe) clean.push(`${prop}: ${safe}`);
  }
  return clean.join("; ");
}

function processNode(node: Node, parent: Element): void {
  if (node.nodeType === Node.TEXT_NODE) {
    parent.appendChild(node.cloneNode(true));
    return;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return;
  const el = node as Element;
  const tag = el.tagName.toLowerCase();
  if (!ALLOWED_TAGS.has(tag)) return;
  const clean = parent.ownerDocument!.createElement(tag);
  const allowedAttrs = ALLOWED_ATTRS[tag];
  if (allowedAttrs) {
    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase();
      if (!allowedAttrs.has(name)) continue;
      if (name === "style") {
        const s = sanitizeStyle(attr.value);
        if (s) clean.setAttribute("style", s);
      } else if (name === "href" || name === "src") {
        const val = attr.value.trim();
        if (/^(https?:|mailto:|tel:|\/|#)/i.test(val) && !/^javascript:/i.test(val)) {
          clean.setAttribute(name, val);
        }
      } else if (name === "target") {
        if (attr.value === "_blank" || attr.value === "_self") {
          clean.setAttribute(name, attr.value);
        }
      } else if (name === "rel") {
        if (/^(noopener|noreferrer|noopener noreferrer)$/.test(attr.value)) {
          clean.setAttribute(name, attr.value);
        }
      } else {
        clean.setAttribute(name, attr.value);
      }
    }
  }
  if (tag === "a" && clean.getAttribute("target") === "_blank" && !clean.getAttribute("rel")) {
    clean.setAttribute("rel", "noopener noreferrer");
  }
  for (const child of Array.from(el.childNodes)) {
    processNode(child, clean);
  }
  parent.appendChild(clean);
}

export function sanitizeHtml(dirty: string): string {
  if (!dirty) return "";
  if (typeof window === "undefined" || typeof DOMParser === "undefined") {
    return dirty;
  }
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<body>${dirty}</body>`, "text/html");
    const body = doc.body;
    const container = document.createElement("div");
    for (const child of Array.from(body.childNodes)) {
      processNode(child, container);
    }
    return container.innerHTML;
  } catch {
    return "";
  }
}

interface RichTextContentProps {
  html: string;
  className?: string;
}

export function RichTextContent({ html, className }: RichTextContentProps): ReactNode {
  const clean = useMemo(() => sanitizeHtml(html), [html]);
  return (
    <div
      className={cn("rich-content", className)}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
