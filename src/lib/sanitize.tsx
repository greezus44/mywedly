import React from "react";

const ALLOWED_TAGS = new Set(["P", "BR", "STRONG", "EM", "U", "S", "UL", "OL", "LI", "A", "BLOCKQUOTE", "H1", "H2", "H3", "SPAN", "DIV"]);
const ALLOWED_ATTRS: Record<string, Set<string>> = {
  A: new Set(["href", "target"]),
  SPAN: new Set(["style"]),
  DIV: new Set(["style"]),
};
const ALLOWED_STYLES = new Set(["color", "font-weight", "font-style", "text-decoration", "text-align", "font-size", "background-color"]);

export function sanitizeHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  function cleanNode(node: Node) {
    const children = Array.from(node.childNodes);
    for (const child of children) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const el = child as Element;
        const tag = el.tagName;
        if (!ALLOWED_TAGS.has(tag)) {
          const parent = el.parentNode;
          if (parent) {
            while (el.firstChild) parent.insertBefore(el.firstChild, el);
            parent.removeChild(el);
          }
          continue;
        }
        const allowedAttrs = ALLOWED_ATTRS[tag] || new Set();
        Array.from(el.attributes).forEach((attr) => {
          if (!allowedAttrs.has(attr.name)) {
            el.removeAttribute(attr.name);
          } else if (attr.name === "style") {
            const styles = attr.value.split(";").filter((s) => {
              const [prop] = s.split(":");
              return ALLOWED_STYLES.has(prop.trim());
            });
            el.setAttribute("style", styles.join(";"));
          }
        });
      }
      cleanNode(child);
    }
  }
  cleanNode(doc.body);
  return doc.body.innerHTML;
}

export function RichTextContent({ html, className }: { html: string; className?: string }) {
  const sanitized = React.useMemo(() => sanitizeHtml(html || ""), [html]);
  return <div className={className} dangerouslySetInnerHTML={{ __html: sanitized }} />;
}
