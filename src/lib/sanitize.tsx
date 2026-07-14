import React from "react";

const ALLOWED_TAGS = new Set([
  "p", "br", "strong", "em", "b", "i", "u", "s", "span", "div",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "ul", "ol", "li",
  "a", "img", "blockquote", "hr",
  "table", "thead", "tbody", "tr", "td", "th",
]);

const ALLOWED_ATTRS: Record<string, string[]> = {
  a: ["href", "target", "rel", "title"],
  img: ["src", "alt", "width", "height"],
  span: ["style", "class"],
  div: ["style", "class"],
  p: ["style", "class"],
  h1: ["style", "class"],
  h2: ["style", "class"],
  h3: ["style", "class"],
  h4: ["style", "class"],
  h5: ["style", "class"],
  h6: ["style", "class"],
  blockquote: ["style", "class"],
  td: ["style", "class", "colspan", "rowspan"],
  th: ["style", "class", "colspan", "rowspan"],
};

const ALLOWED_STYLE_PROPS = new Set([
  "color", "background-color", "font-size", "font-weight", "font-style",
  "text-align", "text-decoration", "line-height", "margin", "padding",
]);

function sanitizeStyle(styleStr: string): string {
  return styleStr
    .split(";")
    .map((decl) => {
      const [prop, ...valParts] = decl.split(":");
      const trimmedProp = prop.trim().toLowerCase();
      const val = valParts.join(":").trim();
      if (!trimmedProp || !val) return "";
      if (!ALLOWED_STYLE_PROPS.has(trimmedProp)) return "";
      return `${trimmedProp}: ${val}`;
    })
    .filter(Boolean)
    .join("; ");
}

export function sanitizeHtml(html: string): string {
  if (typeof document === "undefined") return html;
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  const cleanNode = (node: Node, parent: Element | null) => {
    if (node.nodeType === Node.TEXT_NODE) return;
    if (node.nodeType !== Node.ELEMENT_NODE) {
      if (parent) parent.removeChild(node);
      return;
    }
    const el = node as Element;
    const tag = el.tagName.toLowerCase();

    if (!ALLOWED_TAGS.has(tag)) {
      while (el.childNodes.length > 0) {
        parent?.insertBefore(el.childNodes[0], el);
      }
      parent?.removeChild(el);
      return;
    }

    const allowed = ALLOWED_ATTRS[tag] ?? [];
    Array.from(el.attributes).forEach((attr) => {
      if (!allowed.includes(attr.name)) {
        el.removeAttribute(attr.name);
      } else if (attr.name === "style") {
        const cleaned = sanitizeStyle(attr.value);
        if (cleaned) el.setAttribute("style", cleaned);
        else el.removeAttribute("style");
      } else if (attr.name === "href" || attr.name === "src") {
        const val = attr.value.trim();
        if (/^(javascript|data|vbscript):/i.test(val)) {
          el.removeAttribute(attr.name);
        }
      }
    });

    if (tag === "a") {
      el.setAttribute("rel", "noopener noreferrer");
      if (el.getAttribute("target") === "_blank") {
        el.setAttribute("target", "_blank");
      }
    }

    Array.from(el.childNodes).forEach((child) => cleanNode(child, el));
  };

  Array.from(doc.body.childNodes).forEach((node) => cleanNode(node, doc.body));

  return doc.body.innerHTML;
}

export function RichTextContent({
  html,
  className,
}: {
  html: string;
  className?: string;
}) {
  const clean = React.useMemo(() => sanitizeHtml(html ?? ""), [html]);
  return (
    <div
      className={`rich-content ${className ?? ""}`}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
