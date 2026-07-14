import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase, type EventSchedule, type EventGuest } from "../../lib/supabase";
import { resolveTypography } from "../../lib/typography";
import { getCountdown, formatDate, formatTime12 } from "../../lib/utils";

/* ── Block shape ── */
type Blocks = Record<string, unknown>[];

/* ── Helpers ── */
function asStr(v: unknown, fb = ""): string {
  return typeof v === "string" ? v : fb;
}
function asNum(v: unknown, fb = 0): number {
  return typeof v === "number" && isFinite(v) ? v : fb;
}
function asStrArr(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}

/* ── Countdown ── */
const CountdownBlock: React.FC<{ target: string }> = ({ target }) => {
  const [count, setCount] = useState(() => getCountdown(target));
  useEffect(() => {
    const t = setInterval(() => setCount(getCountdown(target)), 1000);
    return () => clearInterval(t);
  }, [target]);
  if (count.isPast) {
    return <p className="guest-subtitle text-center">The moment has arrived.</p>;
  }
  const items = [
    { label: "Days", value: count.days },
    { label: "Hours", value: count.hours },
    { label: "Minutes", value: count.minutes },
    { label: "Seconds", value: count.seconds },
  ];
  return (
    <div className="flex justify-center gap-4 sm:gap-8">
      {items.map((it) => (
        <div key={it.label} className="text-center">
          <div className="text-3xl font-bold sm:text-5xl" style={{ color: "var(--event-heading)" }}>
            {String(it.value).padStart(2, "0")}
          </div>
          <div className="mt-1 text-xs uppercase tracking-widest" style={{ color: "var(--event-muted)" }}>
            {it.label}
          </div>
        </div>
      ))}
    </div>
  );
};

/* ── Schedule block ── */
const ScheduleBlock: React.FC<{ eventId: string }> = ({ eventId }) => {
  const { data, isLoading } = useQuery({
    queryKey: ["block-schedule", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_schedules")
        .select("*")
        .eq("event_id", eventId)
        .order("order_index", { ascending: true });
      if (error) throw error;
      return (data ?? []) as EventSchedule[];
    },
    enabled: !!eventId,
  });
  if (isLoading) {
    return <div className="h-6 w-6 mx-auto animate-spin rounded-full border-2 border-dash-primary border-t-transparent" />;
  }
  const items = data ?? [];
  if (items.length === 0) return null;
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {items.map((s) => (
        <div key={s.id} className="event-card flex gap-4">
          {s.cover_image && <img src={s.cover_image} alt={s.title} className="h-16 w-16 rounded-lg object-cover" />}
          <div className="flex-1">
            <h3 className="text-lg font-semibold" style={{ color: "var(--event-heading)" }}>{s.title}</h3>
            {(s.schedule_date || s.start_time) && (
              <p className="text-sm" style={{ color: "var(--event-muted)" }}>
                {s.schedule_date && formatDate(s.schedule_date)}{s.start_time && ` at ${formatTime12(s.start_time)}`}
              </p>
            )}
            {s.venue && <p className="text-sm" style={{ color: "var(--event-muted)" }}>{s.venue}</p>}
            {s.description && <p className="mt-1 text-sm" style={{ color: "var(--event-text)" }}>{s.description}</p>}
          </div>
        </div>
      ))}
    </div>
  );
};

/* ── Guest list block ── */
const GuestListBlock: React.FC<{ eventId: string }> = ({ eventId }) => {
  const { data, isLoading } = useQuery({
    queryKey: ["block-guest-list", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_guests")
        .select("id, name, group_name, side")
        .eq("event_id", eventId)
        .order("name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Pick<EventGuest, "id" | "name" | "group_name" | "side">[];
    },
    enabled: !!eventId,
  });
  if (isLoading) {
    return <div className="h-6 w-6 mx-auto animate-spin rounded-full border-2 border-dash-primary border-t-transparent" />;
  }
  const guests = data ?? [];
  if (guests.length === 0) return null;
  return (
    <div className="mx-auto max-w-2xl">
      <ul className="grid gap-2 sm:grid-cols-2">
        {guests.map((g) => (
          <li key={g.id} className="event-card py-3 text-sm font-medium" style={{ color: "var(--event-text)" }}>
            {g.name}
            {g.group_name && <span className="ml-2 text-xs" style={{ color: "var(--event-muted)" }}>· {g.group_name}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
};

/* ── FAQ block ── */
const FaqBlock: React.FC<{ items: { q: string; a: string }[] }> = ({ items }) => {
  const [open, setOpen] = useState<number | null>(0);
  if (items.length === 0) return null;
  return (
    <div className="mx-auto max-w-2xl space-y-3">
      {items.map((it, i) => (
        <div key={i} className="event-card">
          <button onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-center justify-between text-left">
            <span className="font-semibold" style={{ color: "var(--event-heading)" }}>{it.q}</span>
            <span className="ml-4 text-xl" style={{ color: "var(--event-muted)" }}>{open === i ? "−" : "+"}</span>
          </button>
          {open === i && <p className="mt-3 text-sm animate-fadeIn" style={{ color: "var(--event-text)" }}>{it.a}</p>}
        </div>
      ))}
    </div>
  );
};

/* ── Single block renderer ── */
function renderBlock(block: Record<string, unknown>, eventId: string): React.ReactNode {
  const type = typeof block.type === "string" ? block.type : "";
  const c = (block.content ?? {}) as Record<string, unknown>;
  switch (type) {
    case "heading": {
      const { text, style } = resolveTypography(c.text);
      const level = Math.min(Math.max(asNum(c.level, 2), 1), 6);
      const Tag = `h${level}` as keyof React.JSX.IntrinsicElements;
      return <Tag style={{ textAlign: asStr(c.align) as React.CSSProperties["textAlign"], ...style }}>{text}</Tag>;
    }
    case "paragraph": {
      const { text, style } = resolveTypography(c.text);
      return <p style={{ textAlign: asStr(c.align) as React.CSSProperties["textAlign"], ...style }}>{text}</p>;
    }
    case "image": {
      const src = asStr(c.src);
      if (!src) return null;
      return <img src={src} alt={asStr(c.alt)} className="mx-auto rounded-2xl" style={{ width: asStr(c.width, "100%"), maxWidth: "100%" }} />;
    }
    case "spacer":
      return <div style={{ height: asNum(c.height, 40) }} />;
    case "divider":
      return <hr style={{ borderColor: "var(--event-border)" }} />;
    case "gallery": {
      const imgs = asStrArr(c.images);
      if (imgs.length === 0) return null;
      return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {imgs.map((src, i) => <img key={i} src={src} alt="" className="aspect-square w-full rounded-xl object-cover" />)}
        </div>
      );
    }
    case "video": {
      const src = asStr(c.src);
      if (!src) return null;
      return (
        <div className="aspect-video overflow-hidden rounded-2xl">
          <iframe src={src} className="h-full w-full" title="Video" allowFullScreen />
        </div>
      );
    }
    case "button": {
      const { text, style } = resolveTypography(c.text);
      const href = asStr(c.href, "#");
      const cls = asStr(c.variant) === "secondary" ? "event-btn-secondary" : "event-btn-primary";
      return (
        <div className="text-center">
          <a href={href} target="_blank" rel="noopener noreferrer" className={cls} style={style}>{text}</a>
        </div>
      );
    }
    case "columns": {
      const cols = asStrArr(c.items);
      return (
        <div className="grid gap-6 sm:grid-cols-2">
          {cols.map((col, i) => {
            const { text, style } = resolveTypography(col);
            return <div key={i} style={style}>{text}</div>;
          })}
        </div>
      );
    }
    case "list": {
      const items = asStrArr(c.items);
      return (
        <ul className="mx-auto max-w-2xl list-inside list-disc space-y-1" style={{ color: "var(--event-text)" }}>
          {items.map((it, i) => <li key={i}>{it}</li>)}
        </ul>
      );
    }
    case "quote": {
      const { text, style } = resolveTypography(c.text);
      const caption = asStr(c.caption);
      return (
        <blockquote className="mx-auto max-w-2xl border-l-4 pl-6 italic" style={{ borderColor: "var(--event-primary)", color: "var(--event-muted)", ...style }}>
          "{text}"
          {caption && <footer className="mt-2 text-sm not-italic">— {caption}</footer>}
        </blockquote>
      );
    }
    case "countdown":
      return <CountdownBlock target={asStr(c.target || c.date)} />;
    case "map": {
      const addr = asStr(c.address || c.location);
      const src = `https://maps.google.com/maps?q=${encodeURIComponent(addr)}&output=embed`;
      return (
        <div className="mx-auto max-w-2xl overflow-hidden rounded-2xl" style={{ border: "1px solid var(--event-border)" }}>
          <iframe src={src} className="h-64 w-full" loading="lazy" title="Map" />
        </div>
      );
    }
    case "rsvp-form":
      return <p className="text-center guest-subtitle">RSVP form available on the RSVP page.</p>;
    case "guest-list":
      return <GuestListBlock eventId={eventId} />;
    case "schedule":
      return <ScheduleBlock eventId={eventId} />;
    case "venue": {
      const name = asStr(c.name || c.venue);
      const addr = asStr(c.address);
      return (
        <div className="mx-auto max-w-2xl event-card text-center">
          {name && <h3 className="text-xl font-semibold" style={{ color: "var(--event-heading)" }}>{name}</h3>}
          {addr && <p className="mt-1 text-sm" style={{ color: "var(--event-muted)" }}>{addr}</p>}
        </div>
      );
    }
    case "faq": {
      const raw = c.items;
      const items = Array.isArray(raw)
        ? raw.map((r) => {
            if (r && typeof r === "object" && !Array.isArray(r)) {
              const o = r as Record<string, unknown>;
              return { q: asStr(o.q || o.question), a: asStr(o.a || o.answer) };
            }
            return { q: "", a: "" };
          }).filter((r) => r.q)
        : [];
      return <FaqBlock items={items} />;
    }
    default:
      return null;
  }
}

/* ── Main exported component ── */
export function BlockRenderer({ blocks, eventId }: { blocks: Blocks; eventId?: string }) {
  const ctxEventId = React.useContext(EventIdContext);
  const effectiveEventId = eventId ?? ctxEventId;
  return (
    <div className="space-y-8">
      {blocks.map((block, i) => (
        <div key={typeof block.id === "string" ? block.id : `block-${i}`} className="guest-section-tight">
          <div className="mx-auto max-w-3xl">{renderBlock(block, effectiveEventId)}</div>
        </div>
      ))}
    </div>
  );
}

/* Context so schedule/guest-list blocks can fetch data */
const EventIdContext = React.createContext<string>("");
export function BlockEventIdProvider({ eventId, children }: { eventId: string; children: React.ReactNode }) {
  return <EventIdContext.Provider value={eventId}>{children}</EventIdContext.Provider>;
}
