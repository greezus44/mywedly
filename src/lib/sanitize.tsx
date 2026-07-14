export function sanitizeHtml(html: string): string {
  if (typeof window === "undefined") return html;
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    // Remove script tags and event handlers
    const scripts = doc.querySelectorAll("script, style, link, meta, iframe, object, embed");
    scripts.forEach((el) => el.remove());

    // Remove on* attributes from all elements
    const allElements = doc.querySelectorAll("*");
    allElements.forEach((el) => {
      const attrs = Array.from(el.attributes);
      attrs.forEach((attr) => {
        if (attr.name.startsWith("on") || attr.name === "href" && (attr.value.startsWith("javascript:") || attr.value.startsWith("vbscript:"))) {
          el.removeAttribute(attr.name);
        }
      });
    });

    return doc.body.innerHTML;
  } catch {
    return html;
  }
}

interface RichTextContentProps {
  html: string;
  className?: string;
}

export function RichTextContent({ html, className }: RichTextContentProps) {
  const safe = sanitizeHtml(html);
  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
}
