import { useMemo, type ReactNode } from "react";

const ALLOWED_TAGS = new Set([
  "P", "BR", "STRONG", "EM", "U", "S", "SPAN", "A", "UL", "OL", "LI",
  "H1", "H2", "H3", "H4", "H5", "H6", "BLOCKQUOTE", "IMG", "DIV",
]);

const ALLOWED_ATTRS: Record<string, string[]> = {
  a: ["href", "target", "rel"],
  img: ["src", "alt", "width", "height"],
  span: ["style"],
  p: ["style"],
  div: ["style"],
  h1: ["style"], h2: ["style"], h3: ["style"], h4: ["style"], h5: ["style"], h6: ["style"],
  strong: ["style"], em: ["style"], u: ["style"], s: ["style"],
  blockquote: ["style"],
  ul: ["style"], ol: ["style"], li: ["style"],
};

const ALLOWED_STYLE_PROPS = new Set([
  "color", "background-color", "font-size", "font-family", "font-weight",
  "font-style", "text-decoration", "text-align", "line-height",
  "letter-spacing", "margin", "padding",
]);

function sanitizeStyle(style: string): string {
  return style
    .split(";")
    .map((decl) => decl.trim())
    .filter((decl) => {
      if (!decl) return false;
      const prop = decl.split(":")[0].trim().toLowerCase();
      return ALLOWED_STYLE_PROPS.has(prop);
    })
    .join("; ");
}

const MEANINGFUL_STYLE_PROPS = new Set([
  "color", "background-color", "font-size", "font-family", "font-weight",
  "font-style", "text-decoration", "text-align", "line-height",
  "letter-spacing",
]);

function hasMeaningfulStyle(el: Element): boolean {
  const style = el.getAttribute("style");
  if (!style) return false;
  return style.split(";").some((decl) => {
    const prop = decl.split(":")[0].trim().toLowerCase();
    return MEANINGFUL_STYLE_PROPS.has(prop);
  });
}

const UNWRAP_TAGS = new Set(["SPAN", "DIV"]);

/**
 * Strip whitespace and control characters a browser ignores when resolving a
 * URL, so that "\tjavascript:..." cannot slip past a scheme check.
 */
function normalizeUrl(value: string): string {
  return value.replace(/[\u0000-\u0020\u00a0\u2000-\u200d\u2028\u2029\ufeff]/g, "").toLowerCase();
}

const SAFE_LINK_SCHEMES = ["http:", "https:", "mailto:", "tel:"];

/** Links: allow relative URLs, anchors and the safe schemes only. */
function isSafeLinkUrl(value: string): boolean {
  const v = normalizeUrl(value);
  if (v === "") return false;
  if (/^[a-z][a-z0-9+.-]*:/.test(v)) return SAFE_LINK_SCHEMES.some((s) => v.startsWith(s));
  return !v.startsWith("//");
}

/** Images: allow relative URLs, http(s) and inline image data only. */
function isSafeImageUrl(value: string): boolean {
  const v = normalizeUrl(value);
  if (v === "") return false;
  if (v.startsWith("data:")) return /^data:image\/(png|jpe?g|gif|webp|avif);/.test(v);
  if (/^[a-z][a-z0-9+.-]*:/.test(v)) return v.startsWith("http:") || v.startsWith("https:");
  return !v.startsWith("//");
}

export function sanitizeHtml(html: string): string {
  if (typeof document === "undefined") return html;
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const clean = (node: Element) => {
    const children = Array.from(node.children);
    for (const child of children) {
      const tag = child.tagName;
      if (!ALLOWED_TAGS.has(tag)) {
        const text = document.createTextNode(child.textContent ?? "");
        child.replaceWith(text);
        continue;
      }
      const allowed = ALLOWED_ATTRS[tag.toLowerCase()] ?? [];
      for (const attr of Array.from(child.attributes)) {
        if (!allowed.includes(attr.name.toLowerCase())) {
          child.removeAttribute(attr.name);
        } else if (attr.name.toLowerCase() === "style") {
          child.setAttribute("style", sanitizeStyle(attr.value));
        } else if (attr.name.toLowerCase() === "href") {
          if (!isSafeLinkUrl(attr.value)) child.removeAttribute("href");
        } else if (attr.name.toLowerCase() === "src") {
          if (!isSafeImageUrl(attr.value)) child.removeAttribute("src");
        }
      }
      // A link that opens a new tab must not hand the opener window over.
      if (tag === "A" && child.hasAttribute("target")) {
        child.setAttribute("rel", "noopener noreferrer");
      }
      clean(child);
      if (UNWRAP_TAGS.has(tag) && !hasMeaningfulStyle(child) && child.attributes.length === 0) {
        const parent = child.parentElement;
        if (parent) {
          while (child.firstChild) parent.insertBefore(child.firstChild, child);
          child.remove();
        }
      }
    }
  };
  clean(doc.body);
  return doc.body.innerHTML;
}

interface RichTextContentProps {
  html: string;
  className?: string;
}

export function RichTextContent({ html, className }: RichTextContentProps): ReactNode {
  const sanitized = useMemo(() => sanitizeHtml(html), [html]);
  return <div className={className} dangerouslySetInnerHTML={{ __html: sanitized }} />;
}
