import React, { useMemo } from "react";

const ALLOWED_TAGS = new Set([
  "p", "br", "strong", "b", "em", "i", "u", "s", "span",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "ul", "ol", "li",
  "a", "img",
  "blockquote", "pre", "code",
  "div",
]);

const ALLOWED_ATTRS: Record<string, string[]> = {
  a: ["href", "target", "rel"],
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
};

const ALLOWED_STYLES = new Set([
  "color", "background-color", "font-weight", "font-style",
  "text-decoration", "text-align", "font-size",
  "line-height", "margin", "padding",
]);

export function sanitizeHtml(html: string): string {
  if (typeof window === "undefined" || typeof DOMParser === "undefined") {
    return html;
  }
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  function cleanNode(node: Node) {
    if (node.nodeType === Node.TEXT_NODE) return;
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      const tag = el.tagName.toLowerCase();
      if (!ALLOWED_TAGS.has(tag)) {
        // Replace disallowed element with its children
        const parent = el.parentNode;
        if (parent) {
          while (el.firstChild) {
            parent.insertBefore(el.firstChild, el);
          }
          parent.removeChild(el);
        }
        return;
      }
      // Clean attributes
      const allowed = ALLOWED_ATTRS[tag] ?? [];
      const attrs = Array.from(el.attributes);
      for (const attr of attrs) {
        if (!allowed.includes(attr.name)) {
          el.removeAttribute(attr.name);
        } else if (attr.name === "href" || attr.name === "src") {
          const val = attr.value;
          if (/^\s*javascript:/i.test(val) || /^\s*data:/i.test(val)) {
            el.removeAttribute(attr.name);
          }
        }
        if (attr.name === "style") {
          const styleEl = el as HTMLElement;
          const props = styleEl.style;
          const toRemove: string[] = [];
          for (let i = 0; i < props.length; i++) {
            const prop = props[i];
            if (!ALLOWED_STYLES.has(prop)) {
              toRemove.push(prop);
            }
          }
          toRemove.forEach((p) => props.removeProperty(p));
        }
      }
      // Force safe rel on anchors
      if (tag === "a") {
        el.setAttribute("rel", "noopener noreferrer");
        el.setAttribute("target", "_blank");
      }
    }
    // Recurse
    const children = Array.from(node.childNodes);
    for (const child of children) {
      cleanNode(child);
    }
  }

  cleanNode(doc.body);
  return doc.body.innerHTML;
}

interface RichTextContentProps {
  html: string;
  className?: string;
}

export function RichTextContent({ html, className }: RichTextContentProps) {
  const sanitized = useMemo(() => sanitizeHtml(html), [html]);
  return (
    <div
      className={cn("rich-content", className)}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}

function cn(...inputs: (string | undefined | false | null)[]): string {
  return inputs.filter(Boolean).join(" ");
}
