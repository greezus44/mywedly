import { useMemo, type ReactNode } from "react";

const ALLOWED_TAGS = new Set([
  "P", "BR", "STRONG", "EM", "U", "S", "SPAN", "A", "UL", "OL", "LI",
  "H1", "H2", "H3", "H4", "H5", "H6", "BLOCKQUOTE", "IMG", "DIV",
]);

const ALLOWED_ATTRS: Record<string, string[]> = {
  a: ["href", "target", "rel"],
  img: ["src", "alt", "width", "height"],
  span: ["style"],
  p: ["style"],
  div: ["style"],
  h1: ["style"], h2: ["style"], h3: ["style"], h4: ["style"], h5: ["style"], h6: ["style"],
  strong: ["style"], em: ["style"], u: ["style"], s: ["style"],
  blockquote: ["style"],
  ul: ["style"], ol: ["style"], li: ["style"],
};

const ALLOWED_STYLE_PROPS = new Set([
  "color", "background-color", "font-size", "font-family", "font-weight",
  "font-style", "text-decoration", "text-align", "line-height",
  "letter-spacing", "margin", "padding",
]);

function sanitizeStyle(style: string): string {
  return style
    .split(";")
    .map((decl) => decl.trim())
    .filter((decl) => {
      if (!decl) return false;
      const prop = decl.split(":")[0].trim().toLowerCase();
      return ALLOWED_STYLE_PROPS.has(prop);
    })
    .join("; ");
}

export function sanitizeHtml(html: string): string {
  if (typeof document === "undefined") return html;
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const clean = (node: Element) => {
    const children = Array.from(node.children);
    for (const child of children) {
      const tag = child.tagName;
      if (!ALLOWED_TAGS.has(tag)) {
        const text = document.createTextNode(child.textContent ?? "");
        child.replaceWith(text);
        continue;
      }
      const allowed = ALLOWED_ATTRS[tag.toLowerCase()] ?? [];
      for (const attr of Array.from(child.attributes)) {
        if (!allowed.includes(attr.name.toLowerCase())) {
          child.removeAttribute(attr.name);
        } else if (attr.name.toLowerCase() === "style") {
          child.setAttribute("style", sanitizeStyle(attr.value));
        } else if (attr.name.toLowerCase() === "href" && attr.value.toLowerCase().startsWith("javascript:")) {
          child.removeAttribute("href");
        }
      }
      clean(child);
    }
  };
  clean(doc.body);
  return doc.body.innerHTML;
}

interface RichTextContentProps {
  html: string;
  className?: string;
}

export function RichTextContent({ html, className }: RichTextContentProps): ReactNode {
  const sanitized = useMemo(() => sanitizeHtml(html), [html]);
  return <div className={className} dangerouslySetInnerHTML={{ __html: sanitized }} />;
}
