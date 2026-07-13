import React, { useMemo } from "react";

const ALLOWED_TAGS = new Set([
  "p", "br", "strong", "em", "u", "s", "ol", "ul", "li",
  "h1", "h2", "h3", "h4", "h5", "h6", "a", "img",
  "blockquote", "span", "div",
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
};

const ALLOWED_STYLE_PROPS = new Set([
  "color",
  "background-color",
  "font-weight",
  "font-style",
  "text-decoration",
  "text-align",
  "font-size",
  "line-height",
  "margin",
  "padding",
]);

function sanitizeStyle(style: string): string {
  return style
    .split(";")
    .map((decl) => decl.trim())
    .filter((decl) => {
      if (!decl) return false;
      const [prop] = decl.split(":");
      if (!prop) return false;
      return ALLOWED_STYLE_PROPS.has(prop.trim().toLowerCase());
    })
    .join("; ");
}

export function sanitizeHtml(dirty: string): string {
  if (typeof window === "undefined" || typeof DOMParser === "undefined") {
    return dirty;
  }
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<body>${dirty}</body>`, "text/html");
  const body = doc.body;

  const walk = (node: Element) => {
    const children = Array.from(node.children);
    for (const el of children) {
      const tag = el.tagName.toLowerCase();
      if (!ALLOWED_TAGS.has(tag)) {
        // Replace disallowed element with its children (unwrap)
        const parent = el.parentNode;
        if (!parent) continue;
        while (el.firstChild) {
          parent.insertBefore(el.firstChild, el);
        }
        parent.removeChild(el);
        continue;
      }
      // Clean attributes
      const allowed = ALLOWED_ATTRS[tag];
      const attrs = Array.from(el.attributes);
      for (const attr of attrs) {
        if (!allowed || !allowed.has(attr.name.toLowerCase())) {
          el.removeAttribute(attr.name);
        } else if (attr.name.toLowerCase() === "style") {
          el.setAttribute("style", sanitizeStyle(attr.value));
        } else if (attr.name.toLowerCase() === "href") {
          const href = attr.value;
          if (!/^(https?:|mailto:|tel:|#)/i.test(href)) {
            el.removeAttribute("href");
          }
        } else if (attr.name.toLowerCase() === "target") {
          el.setAttribute("target", "_blank");
          el.setAttribute("rel", "noopener noreferrer");
        }
      }
      walk(el);
    }
  };

  walk(body);
  return body.innerHTML;
}

export function RichTextContent({
  html,
  className,
}: {
  html: string;
  className?: string;
}) {
  const clean = useMemo(() => sanitizeHtml(html ?? ""), [html]);
  return (
    <div
      className={["rich-content", className].filter(Boolean).join(" ")}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
