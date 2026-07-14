import { useState, useEffect, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { resolveTypography } from "../../lib/typography";
import { RichTextContent } from "../../lib/sanitize";
import { getCountdown } from "../../lib/utils";

export interface Block {
  id: string;
  type: string;
  content: Record<string, unknown>;
}

type C = Record<string, unknown>;
const R = "var(--event-radius)";
const B = "var(--event-border)";

export function BlockRenderer({ block }: { block: Block }) {
  const c = block.content;
  switch (block.type) {
    case "heading": return <HeadingBlock c={c} />;
    case "paragraph": return <ParagraphBlock c={c} />;
    case "image": return <ImageBlock c={c} />;
    case "spacer": return <SpacerBlock c={c} />;
    case "divider": return <DividerBlock />;
    case "gallery": return <GalleryBlock c={c} />;
    case "video": return <VideoBlock c={c} />;
    case "button": return <ButtonBlock c={c} />;
    case "columns": return <ColumnsBlock c={c} />;
    case "list": return <ListBlock c={c} />;
    case "quote": return <QuoteBlock c={c} />;
    case "countdown": return <CountdownBlock c={c} />;
    case "map": return <MapBlock c={c} />;
    case "rsvp-form": return <RsvpFormBlock c={c} />;
    case "guest-list": return <GuestListBlock c={c} />;
    case "schedule": return <ScheduleBlock c={c} />;
    case "venue": return <VenueBlock c={c} />;
    case "faq": return <FaqBlock c={c} />;
    default: return null;
  }
}

function Section({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

function HeadingBlock({ c }: { c: C }) {
  const resolved = resolveTypography(c, "");
  const level = (c.level as number) || 2;
  const Tag = (`h${Math.min(Math.max(level, 1), 6)}`) as keyof JSX.IntrinsicElements;
  return <Section className="guest-section-tight text-center"><Tag className="guest-title" style={resolved.style}>{resolved.text}</Tag></Section>;
}

function ParagraphBlock({ c }: { c: C }) {
  const html = (c.html as string) || (c.text as string) || "";
  const align = (c.align as string) || "left";
  return <Section className="guest-section-tight"><div className="mx-auto max-w-2xl" style={{ textAlign: align as "left" | "center" | "right" }}><RichTextContent html={html} /></div></Section>;
}

function ImageBlock({ c }: { c: C }) {
  const url = c.url as string | null;
  if (!url) return null;
  const width = (c.width as string) || "full";
  return <Section className="guest-section-tight"><img src={url} alt={(c.alt as string) || ""} style={{ width: width === "full" ? "100%" : "auto", maxWidth: "100%", borderRadius: R }} /></Section>;
}

function SpacerBlock({ c }: { c: C }) {
  return <div style={{ height: (c.height as number) || 32 }} />;
}

function DividerBlock() {
  return <div className="guest-section-tight"><hr style={{ border: "none", borderTop: `1px solid ${B}` }} /></div>;
}

function GalleryBlock({ c }: { c: C }) {
  const images = (c.images as Array<{ url: string; alt?: string }>) || [];
  if (images.length === 0) return null;
  return <Section className="guest-section-tight"><div className="grid grid-cols-2 gap-3 md:grid-cols-3">{images.map((img, i) => <img key={i} src={img.url} alt={img.alt || ""} style={{ width: "100%", borderRadius: R, aspectRatio: "1", objectFit: "cover" }} />)}</div></Section>;
}

function VideoBlock({ c }: { c: C }) {
  const url = c.url as string | null;
  if (!url) return null;
  const isYoutube = url.includes("youtube.com") || url.includes("youtu.be");
  const embedUrl = isYoutube ? url.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/") : url;
  return <Section className="guest-section-tight"><div className="mx-auto max-w-3xl" style={{ position: "relative", paddingBottom: "56.25%", height: 0, borderRadius: R, overflow: "hidden" }}><iframe src={embedUrl} title="Video" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }} allowFullScreen /></div></Section>;
}

function ButtonBlock({ c }: { c: C }) {
  const text = (c.text as string) || "Click Here";
  const url = (c.url as string) || "";
  const align = (c.align as string) || "center";
  const style: CSSProperties = { textAlign: align as "left" | "center" | "right" };
  if (!url) return <Section className="guest-section-tight"><div style={style}><button type="button" className="event-btn-primary" disabled>{text}</button></div></Section>;
  const isExternal = /^https?:/.test(url);
  const btnStyle: CSSProperties = { display: "inline-block", textDecoration: "none" };
  return <Section className="guest-section-tight"><div style={style}>{isExternal ? <a href={url} target="_blank" rel="noopener noreferrer" className="event-btn-primary" style={btnStyle}>{text}</a> : <Link to={url} className="event-btn-primary" style={btnStyle}>{text}</Link>}</div></Section>;
}

function ColumnsBlock({ c }: { c: C }) {
  const cols = (c.columns as Array<Record<string, unknown>>) || [];
  if (cols.length === 0) return null;
  return <Section className="guest-section-tight"><div className="grid gap-6 md:grid-cols-2">{cols.map((col, i) => <div key={i}><RichTextContent html={(col.html as string) || ""} /></div>)}</div></Section>;
}

function ListBlock({ c }: { c: C }) {
  const items = (c.items as string[]) || [];
  if (items.length === 0) return null;
  const Tag = c.ordered ? "ol" : "ul";
  return <Section className="guest-section-tight"><div className="mx-auto max-w-2xl"><Tag style={{ paddingLeft: "1.5em" }}>{items.map((item, i) => <li key={i} style={{ marginBottom: "0.5rem" }}>{item}</li>)}</Tag></div></Section>;
}

function QuoteBlock({ c }: { c: C }) {
  const text = (c.text as string) || "";
  const author = (c.author as string) || "";
  return <Section className="guest-section-tight"><blockquote className="mx-auto max-w-2xl" style={{ borderLeft: `3px solid ${B}`, paddingLeft: "1rem", fontStyle: "italic", color: "var(--event-muted)" }}><p>{text}</p>{author && <footer style={{ marginTop: "0.5rem", fontSize: "0.875rem" }}>— {author}</footer>}</blockquote></Section>;
}

function CountdownBlock({ c }: { c: C }) {
  const target = c.targetDate as string | null;
  const [countdown, setCountdown] = useState(() => getCountdown(target));
  useEffect(() => {
    const t = setInterval(() => setCountdown(getCountdown(target)), 1000);
    return () => clearInterval(t);
  }, [target]);
  if (!target || countdown.isPast) return null;
  const items = [
    { label: "Days", value: countdown.days },
    { label: "Hours", value: countdown.hours },
    { label: "Minutes", value: countdown.minutes },
    { label: "Seconds", value: countdown.seconds },
  ];
  return <Section className="guest-section-tight text-center"><div className="flex justify-center gap-6">{items.map((item) => <div key={item.label}><div className="text-3xl font-bold" style={{ color: "var(--event-heading)" }}>{item.value}</div><div className="text-xs uppercase tracking-wider" style={{ color: "var(--event-muted)" }}>{item.label}</div></div>)}</div></Section>;
}

function MapBlock({ c }: { c: C }) {
  const query = (c.query as string) || (c.address as string) || "";
  if (!query) return null;
  return <Section className="guest-section-tight"><div className="overflow-hidden rounded-lg" style={{ border: `1px solid ${B}` }}><iframe title="Map" src={`https://maps.google.com/maps?q=${encodeURIComponent(query)}&output=embed`} width="100%" height="300" style={{ border: 0, display: "block" }} loading="lazy" /></div></Section>;
}

function RsvpFormBlock({ c }: { c: C }) {
  return <Section className="guest-section-tight text-center"><Link to="./rsvp" className="event-btn-primary" style={{ display: "inline-block", textDecoration: "none" }}>{(c.text as string) || "RSVP"}</Link></Section>;
}

function GuestListBlock({ c }: { c: C }) {
  const names = (c.names as string[]) || [];
  if (names.length === 0) return null;
  return <Section className="guest-section-tight text-center"><div className="mx-auto max-w-md">{names.map((name, i) => <p key={i} style={{ color: "var(--event-text)" }}>{name}</p>)}</div></Section>;
}

function ScheduleBlock({ c }: { c: C }) {
  const items = (c.items as Array<{ title: string; time?: string; location?: string; description?: string }>) || [];
  if (items.length === 0) return null;
  return <Section className="guest-section-tight"><div className="mx-auto max-w-2xl space-y-4">{items.map((item, i) => <div key={i} className="event-card"><div className="flex items-baseline justify-between gap-4"><h3 className="font-semibold" style={{ color: "var(--event-heading)" }}>{item.title}</h3>{item.time && <span className="text-sm" style={{ color: "var(--event-muted)" }}>{item.time}</span>}</div>{item.location && <p className="text-sm mt-1" style={{ color: "var(--event-muted)" }}>{item.location}</p>}{item.description && <p className="mt-2" style={{ color: "var(--event-text)" }}>{item.description}</p>}</div>)}</div></Section>;
}

function VenueBlock({ c }: { c: C }) {
  const name = (c.name as string) || "";
  const address = (c.address as string) || "";
  const query = [name, address].filter(Boolean).join(", ");
  return <Section className="guest-section-tight text-center"><div className="mx-auto max-w-md">{name && <h3 className="font-semibold mb-1" style={{ color: "var(--event-heading)" }}>{name}</h3>}{address && <p style={{ color: "var(--event-muted)" }}>{address}</p>}{query && <div className="mt-4 overflow-hidden rounded-lg" style={{ border: `1px solid ${B}` }}><iframe title="Venue Map" src={`https://maps.google.com/maps?q=${encodeURIComponent(query)}&output=embed`} width="100%" height="250" style={{ border: 0, display: "block" }} loading="lazy" /></div>}</div></Section>;
}

function FaqBlock({ c }: { c: C }) {
  const items = (c.items as Array<{ question: string; answer: string }>) || [];
  if (items.length === 0) return null;
  return <Section className="guest-section-tight"><div className="mx-auto max-w-2xl space-y-3">{items.map((item, i) => <details key={i} className="event-card"><summary className="cursor-pointer font-semibold" style={{ color: "var(--event-heading)" }}>{item.question}</summary><p className="mt-2" style={{ color: "var(--event-text)" }}>{item.answer}</p></details>)}</div></Section>;
}
