import React from "react";

const ALLOWED_TAGS = new Set([
  "p",
  "br",
  "strong",
  "em",
  "u",
  "s",
  "span",
  "div",
  "a",
  "ul",
  "ol",
  "li",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "img",
]);

const ALLOWED_ATTRS = new Set(["style", "href", "src", "alt"]);

const ALLOWED_STYLE_PROPS = new Set([
  "color",
  "font-size",
  "font-family",
  "font-weight",
  "font-style",
  "text-decoration",
  "text-align",
  "background-color",
  "margin",
  "padding",
]);

/**
 * Sanitize an HTML string using DOMParser with an allowlist of tags, attributes, and style properties.
 */
export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) return "";
  if (typeof window === "undefined" || typeof DOMParser === "undefined") return html;

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    const walk = (node: Node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as Element;
        const tag = el.tagName.toLowerCase();

        if (!ALLOWED_TAGS.has(tag)) {
          // Replace disallowed element with its text content
          const text = document.createTextNode(el.textContent || "");
          el.parentNode?.replaceChild(text, el);
          return;
        }

        // Remove disallowed attributes
        Array.from(el.attributes).forEach((attr) => {
          if (!ALLOWED_ATTRS.has(attr.name.toLowerCase())) {
            el.removeAttribute(attr.name);
          } else if (attr.name.toLowerCase() === "style") {
            // Filter style properties
            const cleaned = filterStyles(attr.value);
            if (cleaned) {
              el.setAttribute("style", cleaned);
            } else {
              el.removeAttribute("style");
            }
          } else if (attr.name.toLowerCase() === "href") {
            // Only allow http(s) and mailto
            const val = attr.value;
            if (!/^(https?:|mailto:|\/|#)/i.test(val)) {
              el.removeAttribute("href");
            }
          } else if (attr.name.toLowerCase() === "src") {
            // Only allow http(s) and relative
            const val = attr.value;
            if (!/^(https?:|\/|data:image)/i.test(val)) {
              el.removeAttribute("src");
            }
          }
        });
      }

      // Walk children (copy to handle removal)
      const children = Array.from(node.childNodes);
      children.forEach(walk);
    };

    walk(doc.body);

    return doc.body.innerHTML;
  } catch {
    return html;
  }
}

function filterStyles(styleStr: string): string {
  if (!styleStr) return "";
  const parts = styleStr.split(";").map((s) => s.trim()).filter(Boolean);
  const filtered = parts.filter((part) => {
    const colonIdx = part.indexOf(":");
    if (colonIdx === -1) return false;
    const prop = part.substring(0, colonIdx).trim().toLowerCase();
    return ALLOWED_STYLE_PROPS.has(prop);
  });
  return filtered.join("; ");
}

interface RichTextContentProps {
  html: string | null | undefined;
  className?: string;
}

/**
 * Render sanitized HTML content
 */
export function RichTextContent({ html, className }: RichTextContentProps) {
  const sanitized = React.useMemo(() => sanitizeHtml(html), [html]);
  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}
