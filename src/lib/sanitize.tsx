import React from "react";

const ALLOWED_TAGS = new Set([
  "p", "br", "strong", "em", "u", "s", "span", "div", "h1", "h2", "h3", "h4", "h5", "h6",
  "ul", "ol", "li", "a", "img", "blockquote", "hr", "table", "thead", "tbody", "tr", "th", "td",
]);

const ALLOWED_ATTRS: Record<string, string[]> = {
  a: ["href", "target", "rel"],
  img: ["src", "alt", "width", "height"],
  span: ["style"],
  div: ["style"],
  p: ["style"],
  h1: ["style"], h2: ["style"], h3: ["style"], h4: ["style"], h5: ["style"], h6: ["style"],
  td: ["style"], th: ["style"],
};

const ALLOWED_STYLES = new Set([
  "color", "background-color", "font-size", "font-weight", "font-family", "font-style",
  "text-align", "text-decoration", "line-height", "letter-spacing", "margin", "padding",
  "text-transform",
]);

export function sanitizeHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  cleanNode(doc.body);
  return doc.body.innerHTML;
}

function cleanNode(node: HTMLElement) {
  const children = Array.from(node.children);
  for (const child of children) {
    const tag = child.tagName.toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) {
      const text = document.createTextNode(child.textContent || "");
      child.replaceWith(text);
      continue;
    }
    const allowed = ALLOWED_ATTRS[tag] || [];
    Array.from(child.attributes).forEach((attr) => {
      if (!allowed.includes(attr.name)) {
        child.removeAttribute(attr.name);
      }
      if (attr.name === "style") {
        const cleaned = cleanStyle(attr.value);
        if (cleaned) child.setAttribute("style", cleaned);
        else child.removeAttribute("style");
      }
      if (attr.name === "href" && attr.value.startsWith("javascript:")) {
        child.removeAttribute("href");
      }
    });
    cleanNode(child as HTMLElement);
  }
}

function cleanStyle(styleStr: string): string {
  return styleStr
    .split(";")
    .map((s) => s.trim())
    .filter((s) => {
      const [prop] = s.split(":");
      return prop && ALLOWED_STYLES.has(prop.trim().toLowerCase());
    })
    .join("; ");
}

export function SafeHtml({ html, className }: { html: string; className?: string }) {
  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
    />
  );
}
