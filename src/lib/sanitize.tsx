import { useMemo, type ReactNode } from "react";

const ALLOWED_TAGS = new Set([
  "P",
  "BR",
  "STRONG",
  "EM",
  "U",
  "S",
  "OL",
  "UL",
  "LI",
  "A",
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
  "BLOCKQUOTE",
  "IMG",
  "SPAN",
  "DIV",
]);

const ALLOWED_ATTRS: Record<string, Set<string>> = {
  A: new Set(["href", "target", "rel"]),
  IMG: new Set(["src", "alt", "width", "height"]),
  SPAN: new Set(["style"]),
  DIV: new Set(["style"]),
  P: new Set(["style"]),
};

function sanitizeNode(node: Node, out: string[]): void {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent ?? "";
    out.push(text.replace(/</g, "&lt;").replace(/>/g, "&gt;"));
    return;
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return;

  const el = node as Element;
  const tag = el.tagName;

  if (!ALLOWED_TAGS.has(tag)) {
    // Recurse into children but skip the tag itself
    el.childNodes.forEach((child) => sanitizeNode(child, out));
    return;
  }

  const attrSet = ALLOWED_ATTRS[tag] ?? new Set<string>();
  const attrs: string[] = [];

  for (const attr of Array.from(el.attributes)) {
    const name = attr.name.toLowerCase();
    if (!attrSet.has(name)) continue;
    if (name === "href" || name === "src") {
      const val = attr.value;
      if (/^(javascript:|data:|vbscript:)/i.test(val)) continue;
      attrs.push(`${name}="${escapeAttr(val)}"`);
    } else {
      attrs.push(`${name}="${escapeAttr(attr.value)}"`);
    }
  }

  const openTag = attrs.length > 0 ? `<${tag} ${attrs.join(" ")}>` : `<${tag}>`;
  out.push(openTag);

  el.childNodes.forEach((child) => sanitizeNode(child, out));

  out.push(`</${tag}>`);
}

function escapeAttr(val: string): string {
  return val.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function sanitizeHtml(html: string): string {
  if (typeof window === "undefined") return html;
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<body>${html}</body>`, "text/html");
  const body = doc.body;
  const out: string[] = [];
  body.childNodes.forEach((child) => sanitizeNode(child, out));
  return out.join("");
}

interface RichTextContentProps {
  html: string;
  className?: string;
}

export function RichTextContent({ html, className }: RichTextContentProps): ReactNode {
  const sanitized = useMemo(() => sanitizeHtml(html), [html]);
  return (
    <div
      className={["rich-content", className].filter(Boolean).join(" ")}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}
