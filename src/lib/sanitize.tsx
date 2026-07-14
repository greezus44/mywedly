import React from "react";

const ALLOWED_TAGS = new Set([
  "P", "BR", "STRONG", "B", "EM", "I", "U", "S", "SPAN",
  "UL", "OL", "LI", "A", "H1", "H2", "H3", "H4", "H5", "H6",
  "BLOCKQUOTE", "IMG", "DIV",
]);

const ALLOWED_ATTRS: Record<string, Set<string>> = {
  A: new Set(["href", "target", "rel"]),
  IMG: new Set(["src", "alt", "width", "height"]),
  SPAN: new Set(["style", "class"]),
  DIV: new Set(["style", "class"]),
  P: new Set(["style", "class"]),
  H1: new Set(["style", "class"]),
  H2: new Set(["style", "class"]),
  H3: new Set(["style", "class"]),
  H4: new Set(["style", "class"]),
  H5: new Set(["style", "class"]),
  H6: new Set(["style", "class"]),
  LI: new Set(["style", "class"]),
  UL: new Set(["style", "class"]),
  OL: new Set(["style", "class"]),
  BLOCKQUOTE: new Set(["style", "class"]),
};

const ALLOWED_STYLE_PROPS = new Set([
  "color", "background-color", "font-size", "font-weight", "font-style",
  "text-decoration", "text-align", "line-height", "letter-spacing",
  "margin", "padding", "font-family",
]);

function sanitizeStyle(style: string): string {
  return style
    .split(";")
    .map((decl) => {
      const [prop, ...valParts] = decl.split(":");
      const propName = prop?.trim().toLowerCase();
      const val = valParts.join(":").trim();
      if (!propName || !val) return "";
      if (!ALLOWED_STYLE_PROPS.has(propName)) return "";
      if (val.includes("javascript:") || val.includes("expression(")) return "";
      return `${propName}: ${val}`;
    })
    .filter(Boolean)
    .join("; ");
}

export function sanitizeHtml(html: string): string {
  if (typeof document === "undefined") return html;
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  function walk(node: Element): void {
    const children = Array.from(node.children);
    for (const child of children) {
      const tag = child.tagName;
      if (!ALLOWED_TAGS.has(tag)) {
        const parent = child.parentNode;
        if (parent) {
          while (child.firstChild) {
            parent.insertBefore(child.firstChild, child);
          }
          parent.removeChild(child);
        }
        continue;
      }
      const allowed = ALLOWED_ATTRS[tag] ?? new Set<string>();
      for (const attr of Array.from(child.attributes)) {
        const name = attr.name.toLowerCase();
        if (!allowed.has(name)) {
          child.removeAttribute(attr.name);
          continue;
        }
        if (name === "href" || name === "src") {
          const val = attr.value.trim().toLowerCase();
          if (val.startsWith("javascript:") || val.startsWith("data:text/html")) {
            child.removeAttribute(attr.name);
          }
        }
        if (name === "style") {
          const sanitized = sanitizeStyle(attr.value);
          if (sanitized) {
            child.setAttribute("style", sanitized);
          } else {
            child.removeAttribute("style");
          }
        }
        if (tag === "A" && name === "target" && attr.value === "_blank") {
          child.setAttribute("rel", "noopener noreferrer");
        }
      }
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

export const RichTextContent: React.FC<RichTextContentProps> = ({ html, className }) => {
  const sanitized = React.useMemo(() => sanitizeHtml(html), [html]);
  return (
    <div
      className={`rich-content ${className ?? ""}`}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
};
