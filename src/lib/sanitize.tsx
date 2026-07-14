import { useMemo, type ReactNode } from "react";

const ALLOWED_TAGS = new Set([
  "P", "BR", "B", "STRONG", "I", "EM", "U", "S", "SPAN", "DIV",
  "UL", "OL", "LI", "A", "H1", "H2", "H3", "H4", "H5", "H6",
  "BLOCKQUOTE", "IMG", "HR",
]);

const ALLOWED_ATTRS: Record<string, string[]> = {
  a: ["href", "target", "rel"],
  img: ["src", "alt", "width", "height", "style"],
  span: ["style"],
  div: ["style"],
  p: ["style"],
  h1: ["style"], h2: ["style"], h3: ["style"],
  h4: ["style"], h5: ["style"], h6: ["style"],
  li: ["style"],
  blockquote: ["style"],
  b: ["style"], strong: ["style"], i: ["style"], em: ["style"], u: ["style"], s: ["style"],
};

const ALLOWED_STYLE_PROPS = new Set([
  "color", "font-family", "font-size", "font-weight", "font-style",
  "text-decoration", "text-align", "line-height", "letter-spacing",
  "background-color", "margin", "padding",
]);

function sanitizeStyle(styleStr: string): string {
  return styleStr
    .split(";")
    .map((decl) => decl.trim())
    .filter((decl) => {
      if (!decl || !decl.includes(":")) return false;
      const prop = decl.split(":")[0].trim().toLowerCase();
      return ALLOWED_STYLE_PROPS.has(prop);
    })
    .join("; ");
}

export function sanitizeHtml(html: string): string {
  if (typeof window === "undefined" || typeof DOMParser === "undefined") return html;
  const doc = new DOMParser().parseFromString(html, "text/html");
  const walk = (node: Element) => {
    Array.from(node.childNodes).forEach((child) => {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const el = child as Element;
        const tag = el.tagName.toUpperCase();
        if (!ALLOWED_TAGS.has(tag)) {
          const text = document.createTextNode(el.textContent ?? "");
          el.replaceWith(text);
          return;
        }
        const allowedAttrs = ALLOWED_ATTRS[tag.toLowerCase()] ?? [];
        Array.from(el.attributes).forEach((attr) => {
          if (!allowedAttrs.includes(attr.name.toLowerCase())) {
            el.removeAttribute(attr.name);
          } else if (attr.name.toLowerCase() === "style") {
            el.setAttribute("style", sanitizeStyle(attr.value));
          } else if (attr.name.toLowerCase() === "href") {
            const val = attr.value;
            if (!/^(https?:|mailto:|tel:|#)/i.test(val)) el.removeAttribute(attr.name);
          } else if (attr.name.toLowerCase() === "target") {
            el.setAttribute("rel", "noopener noreferrer");
          }
        });
        walk(el);
      }
    });
  };
  walk(doc.body);
  return doc.body.innerHTML;
}

interface RichTextContentProps {
  html: string;
  className?: string;
}

export function RichTextContent({ html, className }: RichTextContentProps): ReactNode {
  const sanitized = useMemo(() => sanitizeHtml(html ?? ""), [html]);
  return <div className={className} dangerouslySetInnerHTML={{ __html: sanitized }} />;
}
