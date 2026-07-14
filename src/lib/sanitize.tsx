import React from "react";

const ALLOWED_TAGS = new Set([
  "P", "BR", "STRONG", "EM", "U", "S", "OL", "UL", "LI",
  "H1", "H2", "H3", "H4", "H5", "H6", "BLOCKQUOTE", "A", "IMG", "SPAN", "DIV",
]);

const ALLOWED_ATTRS: Record<string, string[]> = {
  a: ["href", "target", "rel"],
  img: ["src", "alt"],
  span: ["style"],
  div: ["style"],
  p: ["style"],
};

export function sanitizeHtml(html: string): string {
  if (typeof window === "undefined" || typeof DOMParser === "undefined") return html;
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div id="__root">${html}</div>`, "text/html");
  const root = doc.getElementById("__root");
  if (!root) return "";

  const walk = (node: Element) => {
    const children = Array.from(node.children);
    for (const child of children) {
      walk(child);
      if (!ALLOWED_TAGS.has(child.tagName)) {
        const text = doc.createTextNode(child.textContent || "");
        child.replaceWith(text);
        continue;
      }
      const allowed = ALLOWED_ATTRS[child.tagName.toLowerCase()] ?? [];
      for (const attr of Array.from(child.attributes)) {
        if (!allowed.includes(attr.name)) {
          child.removeAttribute(attr.name);
        }
        if (attr.name === "href" && (attr.value.startsWith("javascript:") || attr.value.startsWith("data:"))) {
          child.removeAttribute(attr.name);
        }
        if (attr.name === "style") {
          const v = attr.value.toLowerCase();
          if (v.includes("expression") || v.includes("javascript:")) {
            child.removeAttribute(attr.name);
          }
        }
      }
      if (child.tagName === "A") {
        const href = child.getAttribute("href");
        if (href && !href.startsWith("http") && !href.startsWith("/") && !href.startsWith("#")) {
          child.setAttribute("href", "#");
        }
        child.setAttribute("target", "_blank");
        child.setAttribute("rel", "noopener noreferrer");
      }
    }
  };

  walk(root);
  return root.innerHTML;
}

export function RichTextContent({ html, className }: { html: string; className?: string }) {
  const safe = React.useMemo(() => sanitizeHtml(html || ""), [html]);
  return (
    <div
      className={`rich-content ${className ?? ""}`}
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
}
