import { useEffect, useState } from "react";
import type { BlockContent } from "../event/block-types";
import { getCountdown } from "../../lib/utils";

export function BlockRenderer({ block }: { block: BlockContent }) {
  switch (block.type) {
    case "heading":
      return <h2 className="guest-title mx-auto mb-4 max-w-3xl" style={{ textAlign: "center" }}>{block.text}</h2>;
    case "paragraph":
      return <p className="rich-content mx-auto max-w-3xl" style={{ textAlign: "center" }}>{block.text}</p>;
    case "image":
      return block.url ? <div className="guest-section text-center"><img src={block.url} alt={block.text ?? ""} className="mx-auto max-w-full rounded-lg" style={{ borderRadius: "var(--event-radius)" }} /></div> : null;
    case "spacer":
      return <div style={{ height: `${block.height ?? 40}px` }} />;
    case "divider":
      return <div className="mx-auto max-w-3xl"><hr style={{ borderColor: "var(--event-border)" }} /></div>;
    case "gallery":
      return block.images && block.images.length > 0 ? (
        <div className="guest-section"><div className="mx-auto grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-3">
          {block.images.filter(Boolean).map((src, i) => <img key={i} src={src} alt="" className="h-32 w-full rounded-lg object-cover sm:h-40" style={{ borderRadius: "var(--event-radius)" }} />)}
        </div></div>
      ) : null;
    case "video":
      return block.url ? <div className="guest-section text-center"><div className="mx-auto max-w-2xl"><div className="relative aspect-video overflow-hidden rounded-lg" style={{ borderRadius: "var(--event-radius)" }}>{getVideoEmbed(block.url)}</div></div></div> : null;
    case "button":
      return block.text ? <div className="guest-section text-center"><a href={block.href ?? "#"} target="_blank" rel="noopener noreferrer" className="event-btn-primary inline-block">{block.text}</a></div> : null;
    case "columns":
      return block.columns && block.columns.length > 0 ? (
        <div className="guest-section"><div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-2">
          {block.columns.map((col, i) => <div key={i}>{col.map((b, j) => <BlockRenderer key={j} block={b} />)}</div>)}
        </div></div>
      ) : null;
    case "list":
      return block.items && block.items.length > 0 ? (
        <div className="guest-section"><ul className="rich-content mx-auto max-w-3xl list-disc pl-6">{block.items.map((item, i) => <li key={i}>{item}</li>)}</ul></div>
      ) : null;
    case "quote":
      return block.text ? (
        <div className="guest-section text-center"><blockquote className="rich-content mx-auto max-w-2xl text-lg italic" style={{ color: "var(--event-muted)" }}>"{block.text}"{block.author ? <footer className="mt-2 text-sm">— {block.author}</footer> : null}</blockquote></div>
      ) : null;
    case "countdown":
      return <CountdownBlock targetDate={block.targetDate} />;
    case "map":
      return block.address ? (
        <div className="guest-section text-center">
          <div className="mx-auto max-w-2xl">
            <p className="guest-subtitle mb-3">{block.address}</p>
            <iframe title="Map" width="100%" height="300" loading="lazy" className="rounded-lg" style={{ borderRadius: "var(--event-radius)", border: "1px solid var(--event-border)" }} src={`https://maps.google.com/maps?q=${encodeURIComponent(block.address)}&output=embed`} />
          </div>
        </div>
      ) : null;
    case "rsvp-form":
      return <div className="guest-section text-center"><a href="#" className="event-btn-primary inline-block">RSVP Now</a></div>;
    case "guest-list":
      return null;
    case "schedule":
      return null;
    case "venue":
      return (
        <div className="guest-section text-center">
          <div className="mx-auto max-w-2xl">
            {block.heading && <h2 className="guest-title mb-3">{block.heading}</h2>}
            {block.text && <p className="guest-subtitle mb-2">{block.text}</p>}
            {block.address && <p className="guest-subtitle">{block.address}</p>}
          </div>
        </div>
      );
    case "faq":
      return block.faqs && block.faqs.length > 0 ? (
        <div className="guest-section"><div className="mx-auto max-w-2xl space-y-4">
          {block.faqs.map((faq, i) => (
            <div key={i} className="event-card">
              <h3 className="mb-1" style={{ fontFamily: "var(--event-font-heading)", color: "var(--event-heading)" }}>{faq.question}</h3>
              <p className="text-sm" style={{ color: "var(--event-text)" }}>{faq.answer}</p>
            </div>
          ))}
        </div></div>
      ) : null;
    default:
      return null;
  }
}

function CountdownBlock({ targetDate }: { targetDate?: string }) {
  const [countdown, setCountdown] = useState(getCountdown(targetDate ?? null));
  useEffect(() => { const t = setInterval(() => setCountdown(getCountdown(targetDate ?? null)), 1000); return () => clearInterval(t); }, [targetDate]);
  if (!targetDate) return null;
  if (countdown.isPast) return <div className="guest-section text-center"><p className="guest-subtitle">The event has begun!</p></div>;
  return (
    <div className="guest-section text-center">
      <div className="mx-auto flex max-w-md justify-center gap-6">
        {[{ label: "Days", value: countdown.days }, { label: "Hours", value: countdown.hours }, { label: "Minutes", value: countdown.minutes }, { label: "Seconds", value: countdown.seconds }].map((item) => (
          <div key={item.label} className="text-center">
            <div className="text-3xl font-bold" style={{ fontFamily: "var(--event-font-heading)", color: "var(--event-heading)" }}>{String(item.value).padStart(2, "0")}</div>
            <div className="text-xs uppercase" style={{ color: "var(--event-muted)" }}>{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function getVideoEmbed(url: string): React.ReactNode {
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  if (ytMatch) return <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${ytMatch[1]}`} title="Video" allowFullScreen />;
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return <iframe width="100%" height="100%" src={`https://player.vimeo.com/video/${vimeoMatch[1]}`} title="Video" allowFullScreen />;
  return <iframe width="100%" height="100%" src={url} title="Video" allowFullScreen />;
}
