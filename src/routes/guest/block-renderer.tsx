import { useState, useEffect } from "react";
import { RichTextContent } from "../../lib/sanitize";
import { getCountdown, formatDate, formatTime12 } from "../../lib/utils";
import type { Json } from "../../lib/supabase";

interface BlockContent {
  text?: string;
  level?: 1 | 2 | 3;
  align?: "left" | "center" | "right";
  src?: string;
  alt?: string;
  width?: string;
  href?: string;
  label?: string;
  variant?: "primary" | "secondary";
  height?: number;
  images?: string[];
  videoUrl?: string;
  columns?: { blocks: Block[] }[];
  items?: string[];
  author?: string;
  targetDate?: string;
  mapQuery?: string;
  mapEmbedUrl?: string;
  title?: string;
  subtitle?: string;
  venue?: string;
  address?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  faqs?: { question: string; answer: string }[];
  schedule?: { time: string; title: string; description?: string }[];
}

export interface Block {
  id: string;
  type: string;
  content: BlockContent;
}

function jsonToBlocks(json: Json | null | undefined): Block[] {
  if (!json || !Array.isArray(json)) return [];
  return json as unknown as Block[];
}

const alignClass: Record<string, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

export function BlockRenderer({ blocks }: { blocks: Json | null | undefined }) {
  const parsed = jsonToBlocks(blocks);
  if (parsed.length === 0) return null;
  return (
    <div className="space-y-6">
      {parsed.map((block) => (
        <BlockItem key={block.id} block={block} />
      ))}
    </div>
  );
}

function BlockItem({ block }: { block: Block }) {
  const c = block.content;
  switch (block.type) {
    case "heading":
      return <HeadingBlock c={c} />;
    case "paragraph":
      return (
        <div className={alignClass[c.align || "left"]}>
          <RichTextContent html={c.text || ""} />
        </div>
      );
    case "image":
      return (
        <div className={alignClass[c.align || "center"]}>
          {c.src && (
            <img
              src={c.src}
              alt={c.alt || ""}
              style={{ width: c.width || "100%", borderRadius: "var(--event-radius)" }}
              className="mx-auto"
            />
          )}
        </div>
      );
    case "spacer":
      return <div style={{ height: `${c.height || 32}px` }} />;
    case "divider":
      return <hr style={{ borderColor: "var(--event-border)" }} />;
    case "gallery":
      return (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {(c.images || []).map((src, i) => (
            <img
              key={i}
              src={src}
              alt=""
              className="aspect-square w-full object-cover"
              style={{ borderRadius: "var(--event-radius)" }}
            />
          ))}
        </div>
      );
    case "video":
      return c.videoUrl ? (
        <div className="aspect-video w-full overflow-hidden" style={{ borderRadius: "var(--event-radius)" }}>
          <iframe
            src={c.videoUrl}
            className="h-full w-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : null;
    case "button":
      return (
        <div className={alignClass[c.align || "left"]}>
          <a
            href={c.href || "#"}
            className={c.variant === "secondary" ? "event-btn-secondary" : "event-btn-primary"}
            style={{ display: "inline-block" }}
          >
            {c.label || "Click Here"}
          </a>
        </div>
      );
    case "columns":
      return (
        <div className="grid gap-6 md:grid-cols-2">
          {(c.columns || []).map((col, i) => (
            <div key={i} className="space-y-4">
              {(col.blocks || []).map((b: Block) => (
                <BlockItem key={b.id} block={b} />
              ))}
            </div>
          ))}
        </div>
      );
    case "list":
      return (
        <ul className="list-disc space-y-1 pl-6" style={{ color: "var(--event-text)" }}>
          {(c.items || []).map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      );
    case "quote":
      return (
        <blockquote
          className="border-l-4 pl-6 italic"
          style={{ borderColor: "var(--event-border)", color: "var(--event-muted)" }}
        >
          <p className="text-lg" style={{ fontFamily: "var(--event-font-rich)" }}>
            {c.text}
          </p>
          {c.author && (
            <p className="mt-2 text-sm font-semibold not-italic" style={{ color: "var(--event-heading)" }}>
              — {c.author}
            </p>
          )}
        </blockquote>
      );
    case "countdown":
      return <CountdownBlock targetDate={c.targetDate} />;
    case "map":
      return <MapBlock c={c} />;
    case "rsvp-form":
      return (
        <div className="event-card text-center">
          <p className="guest-subtitle mx-auto mb-4">RSVP is available on the RSVP page.</p>
          <a href="#" className="event-btn-primary">Go to RSVP</a>
        </div>
      );
    case "guest-list":
      return <div className="event-card text-center"><p className="guest-subtitle mx-auto">Guest list is not publicly available.</p></div>;
    case "schedule":
      return (
        <div className="space-y-3">
          {(c.schedule || []).map((item, i) => (
            <div key={i} className="flex gap-4 border-b pb-3" style={{ borderColor: "var(--event-border)" }}>
              <span className="min-w-[80px] text-sm font-semibold" style={{ color: "var(--event-primary)" }}>
                {item.time}
              </span>
              <div>
                <p className="font-semibold" style={{ color: "var(--event-heading)" }}>{item.title}</p>
                {item.description && (
                  <p className="text-sm" style={{ color: "var(--event-muted)" }}>{item.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      );
    case "venue":
      return (
        <div className="event-card text-center">
          {c.title && <h3 className="mb-2 text-xl font-semibold" style={{ color: "var(--event-heading)" }}>{c.title}</h3>}
          {c.venue && <p className="font-semibold" style={{ color: "var(--event-heading)" }}>{c.venue}</p>}
          {c.address && <p className="text-sm" style={{ color: "var(--event-muted)" }}>{c.address}</p>}
          {c.date && <p className="mt-2 text-sm" style={{ color: "var(--event-muted)" }}>{formatDate(c.date)}</p>}
          {c.startTime && (
            <p className="text-sm" style={{ color: "var(--event-muted)" }}>
              {formatTime12(c.startTime)}{c.endTime ? ` – ${formatTime12(c.endTime)}` : ""}
            </p>
          )}
        </div>
      );
    case "faq":
      return (
        <div className="space-y-3">
          {(c.faqs || []).map((faq, i) => (
            <div key={i} className="event-card">
              <p className="font-semibold" style={{ color: "var(--event-heading)" }}>{faq.question}</p>
              <p className="mt-1 text-sm" style={{ color: "var(--event-text)" }}>{faq.answer}</p>
            </div>
          ))}
        </div>
      );
    default:
      return null;
  }
}

function HeadingBlock({ c }: { c: BlockContent }) {
  const level = c.level || 2;
  const fontSize = level === 1
    ? "calc(2.5rem * var(--event-font-scale, 1))"
    : level === 3
    ? "calc(1.25rem * var(--event-font-scale, 1))"
    : "calc(1.75rem * var(--event-font-scale, 1))";

  const style: React.CSSProperties = {
    color: "var(--event-heading)",
    fontFamily: "var(--event-font-heading)",
    fontSize,
    fontWeight: 700,
    marginBottom: "0.5rem",
    marginTop: 0,
    lineHeight: 1.2,
    textAlign: (c.align || "left") as "left" | "center" | "right",
  };
  if (level === 1) return <h1 style={style}>{c.text}</h1>;
  if (level === 3) return <h3 style={style}>{c.text}</h3>;
  return <h2 style={style}>{c.text}</h2>;
}

function CountdownBlock({ targetDate }: { targetDate?: string }) {
  const [countdown, setCountdown] = useState(getCountdown(targetDate));

  useEffect(() => {
    const timer = setInterval(() => setCountdown(getCountdown(targetDate)), 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  if (!targetDate || countdown.expired) return null;

  return (
    <div className="text-center">
      <div className="flex justify-center gap-6">
        {[
          { label: "Days", value: countdown.days },
          { label: "Hours", value: countdown.hours },
          { label: "Minutes", value: countdown.minutes },
          { label: "Seconds", value: countdown.seconds },
        ].map((u) => (
          <div key={u.label} className="flex flex-col items-center">
            <span className="text-3xl font-bold tabular-nums" style={{ color: "var(--event-heading)" }}>
              {String(u.value).padStart(2, "0")}
            </span>
            <span className="text-xs uppercase tracking-widest" style={{ color: "var(--event-muted)" }}>
              {u.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MapBlock({ c }: { c: BlockContent }) {
  const mapUrl = c.mapEmbedUrl || (c.mapQuery ? `https://maps.google.com/maps?q=${encodeURIComponent(c.mapQuery)}&output=embed` : null);
  if (!mapUrl) return null;
  return (
    <div className="overflow-hidden" style={{ borderRadius: "var(--event-radius)" }}>
      <iframe
        src={mapUrl}
        title="Map"
        className="h-72 w-full border-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}

export default BlockRenderer;
