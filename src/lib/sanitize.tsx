import React from "react";

const ALLOWED_TAGS = new Set([
  "p", "br", "strong", "em", "u", "s", "ol", "ul", "li",
  "h1", "h2", "h3", "h4", "h5", "h6", "a", "img", "blockquote", "span", "div",
]);

const ALLOWED_ATTRS: Record<string, string[]> = {
  a: ["href", "target", "rel"], img: ["src", "alt", "width", "height"],
  span: ["style"], div: ["style"], p: ["style"],
};

function sanitizeNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return (node.textContent || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return "";
  const el = node as Element;
  const tag = el.tagName.toLowerCase();
  if (!ALLOWED_TAGS.has(tag)) return "";
  const allowedAttrs = ALLOWED_ATTRS[tag] || [];
  const attrs: string[] = [];
  for (const attr of Array.from(el.attributes)) {
    if (!allowedAttrs.includes(attr.name)) continue;
    if (attr.name === "href" || attr.name === "src") {
      if (/^(javascript|data:text\/html|vbscript)/i.test(attr.value)) continue;
      attrs.push(`${attr.name}="${escapeAttr(attr.value)}"`);
    } else if (attr.name === "style") {
      const sanitized = sanitizeStyle(attr.value);
      if (sanitized) attrs.push(`style="${escapeAttr(sanitized)}"`);
    } else {
      attrs.push(`${attr.name}="${escapeAttr(attr.value)}"`);
    }
  }
  if (tag === "a") {
    attrs.push('rel="noopener noreferrer"');
    if (!attrs.some((a) => a.startsWith("target="))) attrs.push('target="_blank"');
  }
  const children = Array.from(el.childNodes).map(sanitizeNode).join("");
  if (tag === "br" || tag === "img") return `<${tag} ${attrs.join(" ")} />`;
  return `<${tag}${attrs.length ? " " + attrs.join(" ") : ""}>${children}</${tag}>`;
}

function sanitizeStyle(style: string): string {
  const allowed = ["color","background-color","font-size","font-weight","font-style","text-align","text-decoration","line-height","font-family","letter-spacing","text-transform","list-style-type","display","width","height","max-width","border","border-radius","padding","margin","opacity","background"];
  return style.split(";").filter((d) => {
    const [prop] = d.split(":");
    return allowed.some((p) => (prop || "").trim().toLowerCase() === p);
  }).map((d) => d.trim()).join("; ");
}

function escapeAttr(val: string): string {
  return val.replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

export function sanitizeHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return Array.from(doc.body.childNodes).map(sanitizeNode).join("");
}

export function RichTextContent({ html, className }: { html: string; className?: string }) {
  const sanitized = React.useMemo(() => sanitizeHtml(html || ""), [html]);
  return <div className={`rich-content ${className || ""}`} dangerouslySetInnerHTML={{ __html: sanitized }} />;
}
