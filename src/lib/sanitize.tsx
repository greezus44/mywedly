import { useMemo, type CSSProperties } from "react";
import { cn } from "./utils";

const ALLOWED_TAGS = new Set([
  "a", "b", "strong", "i", "em", "u", "br", "p", "div", "span",
  "ul", "ol", "li", "h1", "h2", "h3", "h4", "h5", "h6",
  "blockquote", "img", "hr",
]);

const ALLOWED_ATTRS: Record<string, Set<string>> = {
  a: new Set(["href", "target", "rel"]),
  img: new Set(["src", "alt", "width", "height"]),
  span: new Set(["style"]),
  p: new Set(["style"]),
  div: new Set(["style"]),
  h1: new Set(["style"]),
  h2: new Set(["style"]),
  h3: new Set(["style"]),
  h4: new Set(["style"]),
  h5: new Set(["style"]),
  h6: new Set(["style"]),
  li: new Set(["style"]),
  blockquote: new Set(["style"]),
};

const ALLOWED_STYLE_PROPS = new Set([
  "color", "background-color", "font-size", "font-family", "font-weight",
  "font-style", "text-decoration", "text-align", "line-height",
  "letter-spacing", "margin", "padding",
]);

function sanitizeStyleString(styleStr: string): string {
  const props = styleStr.split(";");
  const filtered: string[] = [];
  for (const prop of props) {
    const colonIdx = prop.indexOf(":");
    if (colonIdx === -1) continue;
    const key = prop.slice(0, colonIdx).trim().toLowerCase();
    const value = prop.slice(colonIdx + 1).trim();
    if (ALLOWED_STYLE_PROPS.has(key) && value) {
      filtered.push(`${key}: ${value}`);
    }
  }
  return filtered.join("; ");
}

export function sanitizeHtml(html: string): string {
  if (typeof window === "undefined" || typeof DOMParser === "undefined") {
    return html;
  }
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<body>${html}</body>`, "text/html");
  const body = doc.body;

  function walk(node: Node): Node[] {
    const children = Array.from(node.childNodes);
    for (const child of children) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const el = child as Element;
        const tag = el.tagName.toLowerCase();
        if (!ALLOWED_TAGS.has(tag)) {
          // Replace disallowed element with its children (unwrap)
          const parent = el.parentNode;
          if (parent) {
            const frag = doc.createDocumentFragment();
            while (el.firstChild) {
              frag.appendChild(el.firstChild);
            }
            parent.replaceChild(frag, el);
          }
          continue;
        }
        // Remove disallowed attributes
        const allowed = ALLOWED_ATTRS[tag] ?? new Set<string>();
        const attrs = Array.from(el.attributes);
        for (const attr of attrs) {
          if (!allowed.has(attr.name.toLowerCase())) {
            el.removeAttribute(attr.name);
          } else if (attr.name.toLowerCase() === "style") {
            const sanitized = sanitizeStyleString(attr.value);
            if (sanitized) {
              el.setAttribute("style", sanitized);
            } else {
              el.removeAttribute("style");
            }
          } else if (attr.name.toLowerCase() === "href") {
            const val = attr.value;
            if (!/^(https?:|mailto:|tel:|#|\/)/i.test(val)) {
              el.removeAttribute("href");
            }
          } else if (attr.name.toLowerCase() === "target") {
            el.setAttribute("target", "_blank");
            el.setAttribute("rel", "noopener noreferrer");
          }
        }
        // Ensure links have rel
        if (tag === "a" && el.hasAttribute("href")) {
          el.setAttribute("rel", "noopener noreferrer");
          if (!el.hasAttribute("target")) {
            el.setAttribute("target", "_blank");
          }
        }
      } else if (child.nodeType === Node.COMMENT_NODE) {
        child.parentNode?.removeChild(child);
      }
    }
    return [];
  }

  walk(body);
  return body.innerHTML;
}

interface RichTextContentProps {
  html: string;
  className?: string;
  style?: CSSProperties;
}

export function RichTextContent({ html, className, style }: RichTextContentProps) {
  const sanitized = useMemo(() => sanitizeHtml(html ?? ""), [html]);
  return (
    <div
      className={cn("rich-content", className)}
      style={style}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}

