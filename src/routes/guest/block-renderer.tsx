import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type EventSchedule, type EventGuest } from "../../lib/supabase";
import { resolveTypography } from "../../lib/typography";
import { RichTextContent } from "../../lib/sanitize";
import { formatDate, formatTime12, getCountdown } from "../../lib/utils";

interface Block {
  id: string;
  type: string;
  data: Record<string, unknown>;
}

interface BlockRendererProps {
  block: Block;
  eventId: string;
  slug: string;
  guest: EventGuest | null;
}

export function BlockRenderer({ block, eventId, slug, guest }: BlockRendererProps) {
  switch (block.type) {
    case "heading": return <HeadingBlock data={block.data} />;
    case "paragraph": return <ParagraphBlock data={block.data} />;
    case "image": return <ImageBlock data={block.data} />;
    case "spacer": return <SpacerBlock data={block.data} />;
    case "divider": return <DividerBlock />;
    case "gallery": return <GalleryBlock data={block.data} />;
    case "video": return <VideoBlock data={block.data} />;
    case "button": return <ButtonBlock data={block.data} />;
    case "columns": return <ColumnsBlock data={block.data} />;
    case "list": return <ListBlock data={block.data} />;
    case "quote": return <QuoteBlock data={block.data} />;
    case "countdown": return <CountdownBlock data={block.data} />;
    case "map": return <MapBlock data={block.data} />;
    case "rsvp-form": return <RsvpFormBlock eventId={eventId} slug={slug} guest={guest} />;
    case "guest-list": return <GuestListBlock eventId={eventId} />;
    case "schedule": return <ScheduleBlock eventId={eventId} />;
    case "venue": return <VenueBlock data={block.data} />;
    case "faq": return <FaqBlock data={block.data} />;
    default: return null;
  }
}

function HeadingBlock({ data }: { data: Record<string, unknown> }) {
  const { text, style } = resolveTypography(data.text, "");
  const level = (data.level as string) || "h2";
  const align = (data.align as string) || "left";
  const Tag = (level === "h1" ? "h1" : level === "h3" ? "h3" : "h2") as keyof JSX.IntrinsicElements;
  return (
    <div className="mx-auto max-w-3xl">
      <Tag style={{ ...style, textAlign: align as "left" | "center" | "right", color: "var(--event-heading)" }}>{text}</Tag>
    </div>
  );
}

function ParagraphBlock({ data }: { data: Record<string, unknown> }) {
  const html = (data.html as string) ?? "";
  const align = (data.align as string) || "left";
  return <div className="mx-auto max-w-3xl" style={{ textAlign: align as "left" | "center" | "right" }}><RichTextContent html={html} /></div>;
}

function ImageBlock({ data }: { data: Record<string, unknown> }) {
  const url = (data.url as string) ?? "";
  const caption = (data.caption as string) ?? "";
  const alt = (data.alt as string) ?? "";
  if (!url) return null;
  return (
    <figure className="mx-auto max-w-3xl">
      <img src={url} alt={alt} className="w-full" style={{ borderRadius: "var(--event-radius)" }} />
      {caption && <figcaption className="mt-2 text-center text-sm" style={{ color: "var(--event-muted)" }}>{caption}</figcaption>}
    </figure>
  );
}

function SpacerBlock({ data }: { data: Record<string, unknown> }) {
  const height = (data.height as number) ?? 40;
  return <div style={{ height: `${height}px` }} />;
}

function DividerBlock() {
  return <hr className="mx-auto my-6 max-w-3xl" style={{ borderColor: "var(--event-border)" }} />;
}

function GalleryBlock({ data }: { data: Record<string, unknown> }) {
  const images = (data.images as string[]) ?? [];
  if (images.length === 0) return null;
  return (
    <div className="mx-auto grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-3">
      {images.map((img, i) => (
        <img key={i} src={img} alt="" className="aspect-square w-full object-cover" style={{ borderRadius: "var(--event-radius)" }} />
      ))}
    </div>
  );
}

function VideoBlock({ data }: { data: Record<string, unknown> }) {
  const url = (data.url as string) ?? "";
  if (!url) return null;
  const isYouTube = /youtube\.com|youtu\.be/.test(url);
  const embedUrl = isYouTube
    ? `https://www.youtube.com/embed/${url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)?.[1] ?? ""}`
    : url;
  return (
    <div className="mx-auto max-w-3xl">
      <div className="relative w-full overflow-hidden" style={{ borderRadius: "var(--event-radius)", paddingTop: "56.25%" }}>
        <iframe src={embedUrl} className="absolute inset-0 h-full w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title="Video" />
      </div>
    </div>
  );
}

function ButtonBlock({ data }: { data: Record<string, unknown> }) {
  const text = (data.text as string) ?? "";
  const url = (data.url as string) ?? "";
  const align = (data.align as string) || "center";
  if (!text) return null;
  const justify = align === "left" ? "justify-start" : align === "right" ? "justify-end" : "justify-center";
  const isInternal = url.startsWith("/");
  return (
    <div className={`mx-auto flex max-w-3xl ${justify}`}>
      <a href={url} {...(isInternal ? {} : { target: "_blank", rel: "noopener noreferrer" })} className="event-btn-primary inline-block">{text}</a>
    </div>
  );
}

function ColumnsBlock({ data }: { data: Record<string, unknown> }) {
  const columns = (data.columns as Array<{ html?: string }>) ?? [];
  if (columns.length === 0) return null;
  return (
    <div className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-2">
      {columns.map((col, i) => <div key={i}><RichTextContent html={col.html ?? ""} /></div>)}
    </div>
  );
}

function ListBlock({ data }: { data: Record<string, unknown> }) {
  const items = (data.items as string[]) ?? [];
  const ordered = (data.ordered as boolean) ?? false;
  if (items.length === 0) return null;
  const Tag = ordered ? "ol" : "ul";
  return (
    <div className="mx-auto max-w-3xl">
      <Tag className="space-y-2 pl-6" style={{ color: "var(--event-text)" }}>
        {items.map((item, i) => <li key={i}>{item}</li>)}
      </Tag>
    </div>
  );
}

function QuoteBlock({ data }: { data: Record<string, unknown> }) {
  const { text } = resolveTypography(data.text, "");
  const { text: author } = resolveTypography(data.author, "");
  if (!text) return null;
  return (
    <blockquote className="mx-auto max-w-2xl border-l-4 pl-6 italic" style={{ borderColor: "var(--event-primary)", color: "var(--event-muted)" }}>
      <p className="text-lg">{text}</p>
      {author && <footer className="mt-2 text-sm not-italic" style={{ color: "var(--event-muted)" }}>— {author}</footer>}
    </blockquote>
  );
}

function CountdownBlock({ data }: { data: Record<string, unknown> }) {
  const target = (data.target as string) ?? "";
  const { text: label } = resolveTypography(data.label, "Countdown");
  const [countdown, setCountdown] = useState(() => getCountdown(target));
  useEffect(() => {
    const interval = setInterval(() => setCountdown(getCountdown(target)), 1000);
    return () => clearInterval(interval);
  }, [target]);
  if (countdown.expired) return (
    <div className="mx-auto max-w-2xl text-center">
      {label && <p className="guest-eyebrow">{label}</p>}
      <p className="guest-subtitle">The moment has arrived!</p>
    </div>
  );
  const units = [
    { value: countdown.days, label: "Days" },
    { value: countdown.hours, label: "Hours" },
    { value: countdown.minutes, label: "Minutes" },
    { value: countdown.seconds, label: "Seconds" },
  ];
  return (
    <div className="mx-auto max-w-2xl text-center">
      {label && <p className="guest-eyebrow mb-4">{label}</p>}
      <div className="flex justify-center gap-4">
        {units.map((u) => (
          <div key={u.label} className="event-card text-center" style={{ padding: "1.25rem 1rem", minWidth: "5rem" }}>
            <div className="text-3xl font-bold" style={{ color: "var(--event-primary)" }}>{String(u.value).padStart(2, "0")}</div>
            <div className="mt-1 text-xs uppercase tracking-wider" style={{ color: "var(--event-muted)" }}>{u.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MapBlock({ data }: { data: Record<string, unknown> }) {
  const address = (data.address as string) ?? "";
  const query = (data.query as string) ?? address;
  if (!query) return null;
  const src = `https://maps.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
  return (
    <div className="mx-auto max-w-3xl overflow-hidden" style={{ borderRadius: "var(--event-radius)", border: "1px solid var(--event-border)" }}>
      <iframe src={src} className="h-72 w-full" loading="lazy" title="Map" />
    </div>
  );
}

function VenueBlock({ data }: { data: Record<string, unknown> }) {
  const { text: name } = resolveTypography(data.name, "");
  const { text: address } = resolveTypography(data.address, "");
  const mapQuery = (data.mapQuery as string) ?? address ?? name;
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      {(name || address) && (
        <div className="text-center">
          {name && <h3 className="text-xl font-semibold" style={{ color: "var(--event-heading)" }}>{name}</h3>}
          {address && <p className="mt-1" style={{ color: "var(--event-muted)" }}>{address}</p>}
        </div>
      )}
      {mapQuery && <MapBlock data={{ address: mapQuery }} />}
    </div>
  );
}

function FaqBlock({ data }: { data: Record<string, unknown> }) {
  const faqs = (data.items as Array<{ question?: string; answer?: string }>) ?? [];
  if (faqs.length === 0) return null;
  return (
    <div className="mx-auto max-w-2xl space-y-3">
      {faqs.map((faq, i) => (
        <details key={i} className="event-card" style={{ padding: "1.25rem" }}>
          <summary className="cursor-pointer font-semibold" style={{ color: "var(--event-heading)" }}>{faq.question ?? ""}</summary>
          <p className="mt-2 text-sm" style={{ color: "var(--event-text)" }}>{faq.answer ?? ""}</p>
        </details>
      ))}
    </div>
  );
}

function RsvpFormBlock({ slug }: { eventId: string; slug: string; guest: EventGuest | null }) {
  const navigate = useNavigate();
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="guest-subtitle mb-6">Let us know if you can make it.</p>
      <button onClick={() => navigate(`/e/${slug}/rsvp`)} className="event-btn-primary">Go to RSVP</button>
    </div>
  );
}

function GuestListBlock({ eventId }: { eventId: string }) {
  const { data: guests, isLoading } = useQuery({
    queryKey: ["block-guest-list", eventId],
    queryFn: async () => {
      const { data, error } = await supabase.from("event_guests").select("name").eq("event_id", eventId).order("name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Pick<EventGuest, "name">[];
    },
  });
  if (isLoading) return <div className="mx-auto max-w-2xl text-center"><p style={{ color: "var(--event-muted)" }}>Loading…</p></div>;
  const names = (guests ?? []).map((g) => g.name);
  if (names.length === 0) return null;
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="guest-eyebrow mb-4">Who's Coming</p>
      <p style={{ color: "var(--event-text)" }}>{names.join(" · ")}</p>
    </div>
  );
}

function ScheduleBlock({ eventId }: { eventId: string }) {
  const { data: schedule, isLoading } = useQuery({
    queryKey: ["block-schedule", eventId],
    queryFn: async () => {
      const { data, error } = await supabase.from("event_schedules").select("*").eq("event_id", eventId).order("order_index", { ascending: true });
      if (error) throw error;
      return (data ?? []) as EventSchedule[];
    },
  });
  if (isLoading) return <div className="mx-auto max-w-2xl text-center"><p style={{ color: "var(--event-muted)" }}>Loading…</p></div>;
  const items = schedule ?? [];
  if (items.length === 0) return null;
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {items.map((item, i) => (
        <div key={item.id ?? i} className="event-card animate-slideUpStagger" style={{ animationDelay: `${i * 60}ms`, padding: "1.5rem" }}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="font-semibold" style={{ color: "var(--event-heading)" }}>{item.title}</h3>
            {item.start_time && <span className="text-sm" style={{ color: "var(--event-muted)" }}>{formatTime12(item.start_time)}</span>}
          </div>
          {item.schedule_date && <p className="mt-1 text-sm" style={{ color: "var(--event-muted)" }}>{formatDate(item.schedule_date)}</p>}
          {item.venue && <p className="mt-1 text-sm" style={{ color: "var(--event-muted)" }}>{item.venue}</p>}
          {item.description && <p className="mt-2 text-sm" style={{ color: "var(--event-text)" }}>{item.description}</p>}
        </div>
      ))}
    </div>
  );
}
