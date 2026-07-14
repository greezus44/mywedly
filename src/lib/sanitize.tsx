import { useMemo, type ReactNode } from "react";

const ALLOWED_TAGS = new Set([
  "P", "BR", "STRONG", "EM", "U", "S", "OL", "UL", "LI",
  "A", "SPAN", "H1", "H2", "H3", "H4", "H5", "H6",
  "BLOCKQUOTE", "IMG", "DIV",
]);

const ALLOWED_ATTRS: Record<string, string[]> = {
  A: ["href", "target", "rel"],
  IMG: ["src", "alt", "width", "height"],
  SPAN: ["style"],
  DIV: ["style"],
  P: ["style"],
  H1: ["style"], H2: ["style"], H3: ["style"],
  H4: ["style"], H5: ["style"], H6: ["style"],
  BLOCKQUOTE: ["style"],
};

const ALLOWED_STYLE_PROPS = new Set([
  "color", "background-color", "font-weight", "font-style",
  "text-decoration", "text-align", "font-size",
]);

export function sanitizeHtml(dirty: string): string {
  if (typeof window === "undefined" || typeof DOMParser === "undefined") {
    return dirty;
  }
  const parser = new DOMParser();
  const doc = parser.parseFromString(dirty, "text/html");

  function cleanNode(node: Element): void {
    const tag = node.tagName;
    if (!ALLOWED_TAGS.has(tag)) {
      const parent = node.parentNode;
      if (parent) {
        while (node.firstChild) {
          parent.insertBefore(node.firstChild, node);
        }
        parent.removeChild(node);
        return;
      }
    }
    const allowed = ALLOWED_ATTRS[tag] ?? [];
    for (const attr of Array.from(node.attributes)) {
      if (!allowed.includes(attr.name)) {
        node.removeAttribute(attr.name);
      }
      if (attr.name === "href") {
        const val = attr.value;
        if (!/^(https?:|mailto:|tel:|#)/i.test(val)) {
          node.removeAttribute(attr.name);
        }
      }
      if (attr.name === "target" && attr.value === "_blank") {
        node.setAttribute("rel", "noopener noreferrer");
      }
      if (attr.name === "style") {
        const cleaned = attr.value
          .split(";")
          .filter((decl) => {
            const prop = decl.split(":")[0]?.trim();
            return prop ? ALLOWED_STYLE_PROPS.has(prop) : false;
          })
          .join(";");
        if (cleaned) {
          node.setAttribute("style", cleaned);
        } else {
          node.removeAttribute("style");
        }
      }
    }
    for (const child of Array.from(node.children)) {
      cleanNode(child);
    }
  }

  for (const child of Array.from(doc.body.children)) {
    cleanNode(child);
  }

  return doc.body.innerHTML;
}

interface RichTextContentProps {
  html: string;
  className?: string;
  fallback?: ReactNode;
}

export function RichTextContent({ html, className, fallback }: RichTextContentProps) {
  const sanitized = useMemo(() => {
    if (!html) return "";
    return sanitizeHtml(html);
  }, [html]);

  if (!sanitized && fallback) {
    return <>{fallback}</>;
  }

  return (
    <div
      className={`rich-content ${className ?? ""}`}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}
