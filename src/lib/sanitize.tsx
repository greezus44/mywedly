import { useMemo, type CSSProperties } from "react";
import { cn } from "./utils";

const ALLOWED_TAGS = new Set([
  "p", "br", "strong", "b", "em", "i", "u", "s", "del", "ins",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "ul", "ol", "li",
  "a", "img", "blockquote", "hr",
  "span", "div", "figure", "figcaption",
  "table", "thead", "tbody", "tr", "th", "td",
]);

const ALLOWED_ATTRS: Record<string, Set<string>> = {
  a: new Set(["href", "title", "target", "rel"]),
  img: new Set(["src", "alt", "width", "height", "style"]),
  span: new Set(["style", "class"]),
  div: new Set(["style", "class"]),
  p: new Set(["style", "class"]),
  h1: new Set(["style", "class"]),
  h2: new Set(["style", "class"]),
  h3: new Set(["style", "class"]),
  h4: new Set(["style", "class"]),
  h5: new Set(["style", "class"]),
  h6: new Set(["style", "class"]),
  td: new Set(["style", "class"]),
  th: new Set(["style", "class"]),
  figure: new Set(["style", "class"]),
  figcaption: new Set(["style", "class"]),
  blockquote: new Set(["style", "class"]),
};

const ALLOWED_STYLE_PROPS = new Set([
  "color", "background-color", "font-size", "font-family",
  "font-weight", "font-style", "text-align", "text-decoration",
  "line-height", "margin", "padding", "border",
]);

export function sanitizeHtml(html: string): string {
  if (!html) return "";
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  function cleanNode(node: Node): void {
    if (node.nodeType === Node.TEXT_NODE) return;
    if (node.nodeType !== Node.ELEMENT_NODE) {
      node.parentNode?.removeChild(node);
      return;
    }
    const el = node as Element;
    const tag = el.tagName.toLowerCase();

    if (!ALLOWED_TAGS.has(tag)) {
      const parent = el.parentNode;
      while (el.firstChild) {
        parent?.insertBefore(el.firstChild, el);
      }
      parent?.removeChild(el);
      return;
    }

    const allowedAttrs = ALLOWED_ATTRS[tag] ?? new Set<string>();
    const attrs = Array.from(el.attributes);
    for (const attr of attrs) {
      if (!allowedAttrs.has(attr.name)) {
        el.removeAttribute(attr.name);
        continue;
      }
      if (attr.name === "href" || attr.name === "src") {
        const val = attr.value;
        if (val.startsWith("javascript:") || val.startsWith("data:text/html")) {
          el.removeAttribute(attr.name);
        }
      }
      if (attr.name === "style") {
        const cleaned = cleanStyle(attr.value);
        if (cleaned) {
          el.setAttribute("style", cleaned);
        } else {
          el.removeAttribute("style");
        }
      }
    }

    if (tag === "a") {
      el.setAttribute("target", "_blank");
      el.setAttribute("rel", "noopener noreferrer");
    }

    const children = Array.from(el.childNodes);
    for (const child of children) {
      cleanNode(child);
    }
  }

  function cleanStyle(styleStr: string): string {
    const decls = styleStr.split(";");
    const valid: string[] = [];
    for (const decl of decls) {
      const [prop, ...valParts] = decl.split(":");
      const p = prop?.trim().toLowerCase();
      const v = valParts.join(":").trim();
      if (p && v && ALLOWED_STYLE_PROPS.has(p)) {
        valid.push(`${p}: ${v}`);
      }
    }
    return valid.join("; ");
  }

  const bodyChildren = Array.from(doc.body.childNodes);
  for (const child of bodyChildren) {
    cleanNode(child);
  }

  return doc.body.innerHTML;
}

interface RichTextContentProps {
  html: string;
  className?: string;
}

export function RichTextContent({ html, className }: RichTextContentProps) {
  const sanitized = useMemo(() => sanitizeHtml(html ?? ""), [html]);
  const style: CSSProperties = {};
  return (
    <div
      className={cn("rich-content", className)}
      style={style}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}
