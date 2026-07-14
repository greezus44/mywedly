import { useMemo, type ReactNode } from "react";

const ALLOWED_TAGS = new Set([
  "P", "BR", "STRONG", "EM", "U", "S", "SPAN", "A", "UL", "OL", "LI",
  "H1", "H2", "H3", "H4", "H5", "H6", "BLOCKQUOTE", "IMG", "DIV",
]);

const ALLOWED_ATTRS: Record<string, Set<string>> = {
  A: new Set(["href", "target", "rel"]),
  IMG: new Set(["src", "alt", "width", "height"]),
  SPAN: new Set(["style"]),
  P: new Set(["style"]),
  DIV: new Set(["style"]),
  H1: new Set(["style"]),
  H2: new Set(["style"]),
  H3: new Set(["style"]),
  H4: new Set(["style"]),
  H5: new Set(["style"]),
  H6: new Set(["style"]),
  LI: new Set(["style"]),
  BLOCKQUOTE: new Set(["style"]),
};

const ALLOWED_STYLE_PROPS = new Set([
  "color", "font-size", "font-family", "font-weight", "font-style",
  "text-decoration", "text-align", "line-height", "letter-spacing",
  "background-color", "margin", "padding",
]);

function sanitizeStyle(styleValue: string): string {
  return styleValue
    .split(";")
    .filter((decl) => {
      const colon = decl.indexOf(":");
      if (colon === -1) return false;
      const prop = decl.slice(0, colon).trim().toLowerCase();
      return ALLOWED_STYLE_PROPS.has(prop);
    })
    .join("; ");
}

export function sanitizeHtml(html: string): string {
  if (typeof document === "undefined") return html;
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const fragment = doc.createDocumentFragment();

  while (doc.body.firstChild) {
    fragment.appendChild(doc.body.firstChild);
  }

  function walk(node: Node) {
    if (node.nodeType === Node.TEXT_NODE) return;
    if (node.nodeType !== Node.ELEMENT_NODE) {
      node.parentNode?.removeChild(node);
      return;
    }
    const el = node as Element;
    const tag = el.tagName;

    if (!ALLOWED_TAGS.has(tag)) {
      const parent = el.parentNode;
      if (parent) {
        while (el.firstChild) {
          parent.insertBefore(el.firstChild, el);
        }
        parent.removeChild(el);
        // Re-walk inserted children
        return;
      }
      return;
    }

    // Clean attributes
    const allowed = ALLOWED_ATTRS[tag] ?? new Set<string>();
    const attrs = Array.from(el.attributes);
    for (const attr of attrs) {
      if (!allowed.has(attr.name.toLowerCase())) {
        el.removeAttribute(attr.name);
      } else if (attr.name.toLowerCase() === "style") {
        el.setAttribute("style", sanitizeStyle(attr.value));
      } else if (attr.name.toLowerCase() === "href") {
        const val = attr.value;
        if (!/^(https?:|mailto:|tel:|\/|#)/i.test(val)) {
          el.removeAttribute(attr.name);
        }
      }
    }

    // Force rel on links
    if (tag === "A" && el.hasAttribute("href")) {
      el.setAttribute("rel", "noopener noreferrer");
      if (!el.getAttribute("target")) {
        el.setAttribute("target", "_blank");
      }
    }

    // Walk children (copy because walk may mutate)
    const children = Array.from(el.childNodes);
    for (const child of children) {
      walk(child);
    }
  }

  const children = Array.from(fragment.childNodes);
  for (const child of children) {
    walk(child);
  }

  const wrapper = document.createElement("div");
  wrapper.appendChild(fragment);
  return wrapper.innerHTML;
}

interface RichTextContentProps {
  html: string;
  className?: string;
}

export function RichTextContent({ html, className }: RichTextContentProps): ReactNode {
  const clean = useMemo(() => sanitizeHtml(html), [html]);
  return <div className={className} dangerouslySetInnerHTML={{ __html: clean }} />;
}
