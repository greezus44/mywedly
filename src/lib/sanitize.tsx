import { useMemo, type ReactNode } from "react";

const ALLOWED_TAGS = new Set([
  "p",
  "br",
  "strong",
  "em",
  "u",
  "s",
  "ol",
  "ul",
  "li",
  "a",
  "span",
  "div",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "blockquote",
  "img",
  "hr",
]);

const ALLOWED_ATTRS: Record<string, Set<string>> = {
  a: new Set(["href", "target", "rel", "title"]),
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
  blockquote: new Set(["style", "class"]),
};

const ALLOWED_STYLE_PROPS = new Set([
  "color",
  "background-color",
  "font-size",
  "font-weight",
  "font-style",
  "text-align",
  "text-decoration",
  "line-height",
  "margin",
  "padding",
  "font-family",
]);

function sanitizeStyle(styleValue: string): string {
  return styleValue
    .split(";")
    .map((decl) => decl.trim())
    .filter((decl) => {
      if (!decl) return false;
      const [prop] = decl.split(":");
      return prop && ALLOWED_STYLE_PROPS.has(prop.trim().toLowerCase());
    })
    .join("; ");
}

export function sanitizeHtml(html: string): string {
  if (typeof document === "undefined") return html;
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_ELEMENT);

  const toRemove: Element[] = [];

  let node = walker.currentNode as Element;
  while (node) {
    const tag = node.tagName.toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) {
      toRemove.push(node);
    } else {
      const allowedAttrs = ALLOWED_ATTRS[tag] ?? new Set<string>();
      const attrs = Array.from(node.attributes);
      for (const attr of attrs) {
        if (!allowedAttrs.has(attr.name.toLowerCase())) {
          node.removeAttribute(attr.name);
        } else if (attr.name.toLowerCase() === "style") {
          node.setAttribute("style", sanitizeStyle(attr.value));
        } else if (attr.name.toLowerCase() === "href") {
          const href = attr.value;
          if (!/^(https?:|mailto:|tel:|#|\/)/i.test(href)) {
            node.removeAttribute(attr.name);
          }
        }
      }
      if (tag === "a") {
        node.setAttribute("rel", "noopener noreferrer");
        if (node.getAttribute("target") === "_blank") {
          // keep rel
        }
      }
    }
    node = walker.nextNode() as Element;
  }

  for (const el of toRemove) {
    const parent = el.parentNode;
    if (parent) {
      while (el.firstChild) {
        parent.insertBefore(el.firstChild, el);
      }
      parent.removeChild(el);
    }
  }

  return doc.body.innerHTML;
}

interface RichTextContentProps {
  html: string;
  className?: string;
}

export function RichTextContent({ html, className }: RichTextContentProps) {
  const sanitized = useMemo(() => sanitizeHtml(html ?? ""), [html]);
  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}

export function RichTextBlock({ children }: { children: ReactNode }) {
  return <div className="rich-text-block">{children}</div>;
}
