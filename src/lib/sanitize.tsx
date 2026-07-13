import React from "react";

const ALLOWED_TAGS = new Set([
  "p", "br", "strong", "em", "u", "s", "ol", "ul", "li",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "a", "img", "blockquote", "span", "div",
]);

const ALLOWED_ATTRS: Record<string, string[]> = {
  a: ["href", "target", "rel"],
  img: ["src", "alt", "width", "height"],
  span: ["style"],
  div: ["style"],
  p: ["style"],
};

function sanitizeNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent || "";
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return "";

  const el = node as Element;
  const tag = el.tagName.toLowerCase();

  if (!ALLOWED_TAGS.has(tag)) return "";

  const allowedAttrs = ALLOWED_ATTRS[tag] || [];
  const attrs: string[] = [];

  for (const attr of Array.from(el.attributes)) {
    if (!allowedAttrs.includes(attr.name)) continue;
    if (attr.name === "href" || attr.name === "src") {
      const val = attr.value;
      if (/^(javascript|data:text\/html|vbscript)/i.test(val)) continue;
      attrs.push(`${attr.name}="${escapeAttr(val)}"`);
    } else if (attr.name === "style") {
      const sanitized = sanitizeStyle(attr.value);
      if (sanitized) attrs.push(`style="${escapeAttr(sanitized)}"`);
    } else {
      attrs.push(`${attr.name}="${escapeAttr(attr.value)}"`);
    }
  }

  if (tag === "a") {
    attrs.push('rel="noopener noreferrer"');
    if (!attrs.some((a) => a.startsWith("target="))) {
      attrs.push('target="_blank"');
    }
  }

  const children = Array.from(el.childNodes).map(sanitizeNode).join("");
  const selfClosing = tag === "br" || tag === "img";
  if (selfClosing && tag === "img") {
    return `<${tag} ${attrs.join(" ")} />`;
  }
  if (selfClosing) {
    return `<${tag} ${attrs.join(" ")} />`;
  }
  return `<${tag}${attrs.length ? " " + attrs.join(" ") : ""}>${children}</${tag}>`;
}

function sanitizeStyle(style: string): string {
  const allowedProps = [
    "color", "background-color", "font-size", "font-weight",
    "font-style", "text-align", "text-decoration", "line-height",
    "margin", "padding", "border", "border-radius",
  "font-family", "letter-spacing",
  "text-transform",
  "list-style-type",
  "display",
    "width", "height", "max-width",
  "border-color", "border-width", "border-style",
  "padding-left", "padding-right", "padding-top", "padding-bottom",
    "margin-left", "margin-right", "margin-top", "margin-bottom",
  "background",
  "opacity",
  "font-variant",
  "word-spacing",
    "text-indent",
    "white-space",
    "vertical-align",
    "text-shadow",
    "box-shadow",
    "border-bottom", "border-top", "border-left", "border-right",
    "border-bottom-color", "border-top-color", "border-left-color", "border-right-color",
    "border-bottom-width", "border-top-width", "border-left-width", "border-right-width",
    "border-bottom-style", "border-top-style", "border-left-style", "border-right-style",
  ];
  const declarations = style.split(";").filter((d) => d.trim());
  const sanitized = declarations
    .filter((d) => {
      const [prop] = d.split(":");
      const propName = prop.trim().toLowerCase();
      return allowedProps.some((p) => propName === p || propName.startsWith(p));
    })
    .map((d) => d.trim())
    .join("; ");
  return sanitized;
}

function escapeAttr(val: string): string {
  return val.replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

export function sanitizeHtml(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const body = doc.body;
  const sanitized = Array.from(body.childNodes).map(sanitizeNode).join("");
  return sanitized;
}

export function RichTextContent({ html, className }: { html: string; className?: string }) {
  const sanitized = React.useMemo(() => sanitizeHtml(html || ""), [html]);
  return (
    <div
      className={`rich-content ${className || ""}`}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}
