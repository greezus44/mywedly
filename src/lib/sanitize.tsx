import React from "react";

const ALLOWED_TAGS = new Set([
  "a", "abbr", "b", "blockquote", "br", "cite", "code", "dd", "del", "div",
  "dl", "dt", "em", "h1", "h2", "h3", "h4", "h5", "h6", "hr", "i", "img",
  "ins", "kbd", "li", "mark", "ol", "p", "pre", "q", "s", "samp", "small",
  "span", "strong", "sub", "sup", "u", "ul", "var",
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
  ul: new Set(["style", "class"]),
  ol: new Set(["style", "class"]),
  li: new Set(["style", "class"]),
};

const ALLOWED_STYLE_PROPS = new Set([
  "color", "background-color", "font-weight", "font-style", "text-decoration",
  "text-align", "font-size", "line-height", "margin", "padding",
]);

function sanitizeStyleValue(value: string): string {
  return value.replace(/expression\s*\(|javascript:|url\s*\(/gi, "");
}

export function sanitizeHtml(html: string): string {
  if (!html) return "";
  if (typeof window === "undefined") return html;
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const result = doc.body;

  function walk(node: Node): Node | null {
    if (node.nodeType === Node.TEXT_NODE) return node.cloneNode(true);
    if (node.nodeType !== Node.ELEMENT_NODE) return null;
    const el = node as Element;
    const tag = el.tagName.toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) return null;
    const clone = document.createElement(tag);
    const allowedAttrs = ALLOWED_ATTRS[tag] ?? new Set<string>();
    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase();
      if (!allowedAttrs.has(name)) continue;
      if (name === "href" || name === "src") {
        const val = attr.value.trim();
        if (/^(javascript|data|vbscript):/i.test(val)) continue;
        clone.setAttribute(name, val);
      } else if (name === "target") {
        clone.setAttribute(name, attr.value);
        if (attr.value === "_blank" && !clone.getAttribute("rel")) {
          clone.setAttribute("rel", "noopener noreferrer");
        }
      } else if (name === "style") {
        const style = el.getAttribute("style");
        if (style) {
          const cleaned = style
            .split(";")
            .map((decl) => {
              const [prop, ...valParts] = decl.split(":");
              if (!prop || valParts.length === 0) return "";
              const p = prop.trim().toLowerCase();
              const v = valParts.join(":").trim();
              if (!ALLOWED_STYLE_PROPS.has(p)) return "";
              return `${p}: ${sanitizeStyleValue(v)}`;
            })
            .filter(Boolean)
            .join("; ");
          if (cleaned) clone.setAttribute("style", cleaned);
        }
      } else if (name === "class") {
        const classes = attr.value
          .split(/\s+/)
          .filter((c) => c && !c.startsWith("event-") && !c.startsWith("dash-"));
        if (classes.length) clone.setAttribute("class", classes.join(" "));
      } else {
        clone.setAttribute(name, attr.value);
      }
    }
    for (const child of Array.from(el.childNodes)) {
      const sanitized = walk(child);
      if (sanitized) clone.appendChild(sanitized);
    }
    return clone;
  }

  const fragment = document.createDocumentFragment();
  for (const child of Array.from(result.childNodes)) {
    const sanitized = walk(child);
    if (sanitized) fragment.appendChild(sanitized);
  }
  const tmp = document.createElement("div");
  tmp.appendChild(fragment);
  return tmp.innerHTML;
}

interface RichTextContentProps {
  html: string;
  className?: string;
}

export function RichTextContent({ html, className }: RichTextContentProps) {
  const sanitized = React.useMemo(() => sanitizeHtml(html), [html]);
  return (
    <div
      className={className ? `rich-content ${className}` : "rich-content"}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}
