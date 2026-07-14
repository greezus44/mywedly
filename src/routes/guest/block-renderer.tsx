import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type SubEvent, type EventSchedule, type EventRsvp } from "../../lib/supabase";
import { resolveTypography } from "../../lib/typography";
import { useGuestOutletContext } from "./guest-layout";
import { getCountdown, formatDate, formatTime12, cn } from "../../lib/utils";

/* Relaxed block types — the guest renderer supports more block types than the
   editor's BlockType union (countdown, map, rsvp-form, guest-list, schedule,
   venue, faq, columns), so we widen the types here. */
interface GuestBlockContent { [key: string]: unknown }
export interface Block { id: string; type: string; content: GuestBlockContent }

/* ---------- typed accessors ---------- */

const str = (v: unknown, fallback = ""): string => typeof v === "string" ? v : fallback;
const num = (v: unknown, fallback = 0): number => typeof v === "number" ? v : fallback;
const align = (v: unknown): string | undefined => v === "left" || v === "right" || v === "center" ? v : undefined;
const alignClass = (v: unknown): string => align(v) === "left" ? "text-left" : align(v) === "right" ? "text-right" : "text-center";
const strArr = (v: unknown): string[] => Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
const getYouTubeEmbed = (url: string) => { const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/); return m ? `https://www.youtube.com/embed/${m[1]}` : null; };
const getVimeoEmbed = (url: string) => { const m = url.match(/vimeo\.com\/(\d+)/); return m ? `https://player.vimeo.com/video/${m[1]}` : null; };

/* ---------- countdown ---------- */

function CountdownBlock({ target }: { target?: string }) {
  const [, setNow] = useState(Date.now());
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);
  const c = getCountdown(target);
  if (c.isPast) return <p className="guest-subtitle text-center">The countdown has passed.</p>;
  const items = [{ label: "Days", value: c.days }, { label: "Hours", value: c.hours }, { label: "Minutes", value: c.minutes }, { label: "Seconds", value: c.seconds }];
  return (
    <div className="grid grid-cols-4 gap-3 text-center">
      {items.map((it) => (
        <div key={it.label} className="event-card py-4">
          <div className="text-3xl font-bold" style={{ color: "var(--event-heading)" }}>{String(it.value).padStart(2, "0")}</div>
          <div className="mt-1 text-xs uppercase tracking-wider" style={{ color: "var(--event-muted)" }}>{it.label}</div>
        </div>
      ))}
    </div>
  );
}

/* ---------- schedule ---------- */

function ScheduleBlock() {
  const { event } = useGuestOutletContext();
  const { data, isLoading } = useQuery({
    queryKey: ["guest-schedule-block", event.id],
    queryFn: async () => { const { data, error } = await supabase.from("event_schedules").select("*").eq("event_id", event.id).order("order_index", { ascending: true }); if (error) throw error; return (data ?? []) as EventSchedule[]; },
    enabled: !!event.id,
  });
  if (isLoading) return <div className="flex justify-center py-6"><div className="h-6 w-6 animate-spin rounded-full border-2 border-dash-primary border-t-transparent" /></div>;
  const items = data ?? [];
  if (items.length === 0) return <p className="guest-subtitle text-center">No schedule has been shared yet.</p>;
  return (
    <ol className="space-y-4">
      {items.map((s, i) => (
        <li key={s.id} className="event-card flex gap-4 animate-slideUpStagger" style={{ animationDelay: `${i * 60}ms` }}>
          <div className="flex-shrink-0 text-center" style={{ minWidth: "4rem" }}>
            {s.start_time && <div className="text-sm font-semibold" style={{ color: "var(--event-heading)" }}>{formatTime12(s.start_time)}</div>}
            {s.schedule_date && <div className="text-xs" style={{ color: "var(--event-muted)" }}>{formatDate(s.schedule_date, { month: "short", day: "numeric" })}</div>}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold" style={{ color: "var(--event-heading)" }}>{s.title}</h3>
            {s.venue && <p className="text-sm" style={{ color: "var(--event-muted)" }}>{s.venue}</p>}
            {s.description && <p className="mt-1 text-sm" style={{ color: "var(--event-text)" }}>{s.description}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}

/* ---------- venue ---------- */

function VenueBlock() {
  const { event } = useGuestOutletContext();
  const venue = event.venue;
  const address = event.address;
  const query = address || venue || "";
  if (!venue && !address) return <p className="guest-subtitle text-center">Venue details coming soon.</p>;
  return (
    <div className="event-card">
      {venue && <h3 className="mb-1 text-xl font-semibold" style={{ color: "var(--event-heading)" }}>{venue}</h3>}
      {address && <p className="mb-4 text-sm" style={{ color: "var(--event-text)" }}>{address}</p>}
      {query && (
        <div className="overflow-hidden" style={{ borderRadius: "var(--event-radius)" }}>
          <iframe title="Venue map" src={`https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=15&output=embed`} className="h-64 w-full" style={{ border: 0 }} loading="lazy" allowFullScreen />
        </div>
      )}
    </div>
  );
}

/* ---------- faq ---------- */

interface FaqItem { q?: string; a?: string }
function FaqBlock({ items }: { items?: FaqItem[] }) {
  const list = Array.isArray(items) ? items : [];
  if (list.length === 0) return <p className="guest-subtitle text-center">No questions have been added yet.</p>;
  return (
    <div className="space-y-3">
      {list.map((f, i) => (
        <details key={i} className="event-card group" style={{ cursor: "pointer" }}>
          <summary className="flex items-center justify-between font-semibold" style={{ color: "var(--event-heading)" }}>
            <span>{f.q || "Question"}</span>
            <span className="ml-2 transition-transform group-open:rotate-45" style={{ color: "var(--event-muted)" }}>+</span>
          </summary>
          {f.a && <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--event-text)" }}>{f.a}</p>}
        </details>
      ))}
    </div>
  );
}

/* ---------- rsvp-form ---------- */

function RsvpFormBlock() {
  const { event, slug, invitedSubEventIds } = useGuestOutletContext();
  const { data, isLoading } = useQuery({
    queryKey: ["rsvp-form-block", event.id, invitedSubEventIds],
    queryFn: async () => { if (invitedSubEventIds.length === 0) return []; const { data, error } = await supabase.from("sub_events").select("*").in("id", invitedSubEventIds).order("display_order", { ascending: true }); if (error) throw error; return (data ?? []) as SubEvent[]; },
    enabled: invitedSubEventIds.length > 0,
  });
  if (isLoading) return <div className="flex justify-center py-6"><div className="h-6 w-6 animate-spin rounded-full border-2 border-dash-primary border-t-transparent" /></div>;
  const events = data ?? [];
  if (events.length === 0) return <p className="guest-subtitle text-center">You haven't been invited to any events yet.</p>;
  return (
    <div className="space-y-4 text-center">
      <p className="guest-subtitle">You've been invited to {events.length} {events.length === 1 ? "event" : "events"}.</p>
      <Link to={`/e/${slug}/rsvp`} className="event-btn-primary inline-block">Go to RSVP</Link>
    </div>
  );
}

/* ---------- guest-list ---------- */

function GuestListBlock() {
  const { event } = useGuestOutletContext();
  const { data, isLoading } = useQuery({
    queryKey: ["guest-list-block", event.id],
    queryFn: async () => { const { data, error } = await supabase.from("event_rsvps").select("*").eq("event_id", event.id).eq("status", "attending"); if (error) throw error; return (data ?? []) as EventRsvp[]; },
    enabled: !!event.id,
  });
  if (isLoading) return <div className="flex justify-center py-6"><div className="h-6 w-6 animate-spin rounded-full border-2 border-dash-primary border-t-transparent" /></div>;
  const rsvps = data ?? [];
  if (rsvps.length === 0) return <p className="guest-subtitle text-center">No guests have confirmed yet.</p>;
  return (
    <div className="flex flex-wrap gap-2">
      {rsvps.map((r) => (
        <span key={r.id} className="event-card px-4 py-2 text-sm font-medium" style={{ color: "var(--event-heading)" }}>
          {r.guest_name}
        </span>
      ))}
    </div>
  );
}

/* ---------- map ---------- */

function MapBlock({ query }: { query?: string }) {
  if (!query) return <p className="guest-subtitle text-center">No location provided.</p>;
  return (
    <div className="overflow-hidden" style={{ borderRadius: "var(--event-radius)", border: "1px solid var(--event-border)" }}>
      <iframe title="Map" src={`https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=15&output=embed`} className="h-72 w-full" style={{ border: 0 }} loading="lazy" allowFullScreen />
    </div>
  );
}

/* ---------- main renderer ---------- */

export function BlockRenderer({ block }: { block: Block }) {
  const c = block.content ?? {};
  const { event } = useGuestOutletContext();

  switch (block.type) {
    case "heading": {
      const t = resolveTypography(c, "Heading");
      const lvl = num(c.level, 2);
      const Tag = (`h${Math.min(Math.max(lvl, 1), 6)}`) as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
      return <Tag className={cn("font-bold", alignClass(c.align))} style={{ color: "var(--event-heading)", ...t.style }}>{t.text}</Tag>;
    }
    case "paragraph": {
      const t = resolveTypography(c, "");
      return <p className={cn("leading-relaxed", alignClass(c.align))} style={{ color: "var(--event-text)", ...t.style }}>{t.text}</p>;
    }
    case "image":
      return c.src ? (
        <div className={alignClass(c.align)}>
          <img src={str(c.src)} alt={str(c.alt)} className="inline-block max-w-full" style={{ borderRadius: "var(--event-radius)" }} />
        </div>
      ) : null;
    case "spacer":
      return <div style={{ height: `${num(c.height, 40)}px` }} />;
    case "divider":
      return <hr style={{ borderColor: "var(--event-border)" }} />;
    case "gallery": {
      const imgs = strArr(c.images);
      if (imgs.length === 0) return null;
      return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {imgs.map((src, i) => (
            <img key={i} src={src} alt="" className="aspect-square w-full object-cover" style={{ borderRadius: "var(--event-radius)" }} />
          ))}
        </div>
      );
    }
    case "video": {
      const url = str(c.videoUrl);
      const embed = getYouTubeEmbed(url) || getVimeoEmbed(url);
      if (!embed) return <p className="guest-subtitle text-center">Video unavailable.</p>;
      return (
        <div className="overflow-hidden" style={{ borderRadius: "var(--event-radius)" }}>
          <iframe src={embed} className="aspect-video w-full" style={{ border: 0 }} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title="Video" />
        </div>
      );
    }
    case "button":
      return c.url ? (
        <div className={alignClass(c.align)}>
          <a href={str(c.url)} target="_blank" rel="noopener noreferrer" className="event-btn-primary inline-block">{str(c.label, "Click here")}</a>
        </div>
      ) : null;
    case "columns": {
      const cols = Array.isArray(c.columns) ? c.columns : [];
      return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cols.map((col: unknown, i: number) => {
            const items = Array.isArray((col as { items?: unknown[] })?.items) ? (col as { items: unknown[] }).items : [];
            return (
              <div key={i} className="event-card space-y-2">
                {items.map((item: unknown, j: number) => {
                  const t = resolveTypography(item, "");
                  return <p key={j} style={{ color: "var(--event-text)", ...t.style }}>{t.text}</p>;
                })}
              </div>
            );
          })}
        </div>
      );
    }
    case "list": {
      const items = Array.isArray(c.items) ? c.items : [];
      if (items.length === 0) return null;
      return (
        <ul className={cn("list-disc space-y-1 pl-6", alignClass(c.align))} style={{ color: "var(--event-text)" }}>
          {items.map((it: unknown, i: number) => <li key={i}>{typeof it === "string" ? it : resolveTypography(it, "").text}</li>)}
        </ul>
      );
    }
    case "quote": {
      const t = resolveTypography(c, "");
      return (
        <blockquote className="event-card border-l-4 pl-4 text-center" style={{ borderColor: "var(--event-primary)", color: "var(--event-text)", fontStyle: "italic", ...t.style }}>
          {t.text}
        </blockquote>
      );
    }
    case "countdown":
      return <CountdownBlock target={str(c.targetDate) || str(c.date) || (event.event_date ?? undefined)} />;
    case "map":
      return <MapBlock query={str(c.query) || str(c.location) || str(c.address) || undefined} />;
    case "rsvp-form":
      return <RsvpFormBlock />;
    case "guest-list":
      return <GuestListBlock />;
    case "schedule":
      return <ScheduleBlock />;
    case "venue":
      return <VenueBlock />;
    case "faq":
      return <FaqBlock items={c.items as FaqItem[] | undefined} />;
    default:
      return null;
  }
}
