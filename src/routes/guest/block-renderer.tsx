import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { resolveTypography } from "../../lib/typography";
import { RichTextContent } from "../../lib/sanitize";
import { supabase, type Json, type EventSchedule } from "../../lib/supabase";
import { formatDate, formatTime12, getCountdown, cn } from "../../lib/utils";

interface BlockContent {
  text?: string; html?: string; src?: string; url?: string; alt?: string;
  images?: string[]; align?: "left" | "center" | "right"; size?: "sm" | "md" | "lg";
  label?: string; link?: string; height?: number; columns?: Block[][]; items?: string[];
  quote?: string; author?: string; targetDate?: string; mapUrl?: string; address?: string;
  title?: string; venue?: string; faqs?: { question: string; answer: string }[];
}
export interface Block { id: string; type: string; content: BlockContent }
export interface BlockRendererProps { blocks: Block[]; eventId: string; slug: string }

export function BlockRenderer({ blocks, eventId, slug }: BlockRendererProps) {
  return <>{blocks.map((block) => <BlockView key={block.id} block={block} eventId={eventId} slug={slug} />)}</>;
}

function BlockView({ block, eventId, slug }: { block: Block; eventId: string; slug: string }) {
  const c = block.content;
  switch (block.type) {
    case "heading": {
      const { text, style } = resolveTypography(c.text, "");
      const sz = c.size === "sm" ? "text-xl" : c.size === "md" ? "text-2xl" : "text-3xl";
      const al = c.align === "left" ? "text-left" : c.align === "right" ? "text-right" : "text-center";
      return <Section><div className="mx-auto max-w-3xl"><h2 className={cn("guest-title", sz, al)} style={style}>{text}</h2></div></Section>;
    }
    case "paragraph": {
      const al = c.align === "left" ? "text-left" : c.align === "right" ? "text-right" : "text-center";
      return <Section><div className={cn("mx-auto max-w-3xl", al)}><RichTextContent html={c.html ?? ""} /></div></Section>;
    }
    case "image": {
      if (!c.src) return null;
      const al = c.align === "left" ? "ml-0 mr-auto" : c.align === "right" ? "ml-auto mr-0" : "mx-auto";
      return <Section><div className="mx-auto max-w-4xl"><img src={c.src} alt={c.alt ?? ""} className={cn("max-w-full rounded-lg", al)} style={{ borderRadius: "var(--event-radius)" }} /></div></Section>;
    }
    case "spacer": return <div style={{ height: `${c.height ?? 32}px` }} />;
    case "divider": return <Section><div className="mx-auto max-w-3xl"><hr style={{ borderColor: "var(--event-border)" }} /></div></Section>;
    case "gallery": {
      const imgs = c.images ?? [];
      if (imgs.length === 0) return null;
      return <Section><div className="mx-auto max-w-4xl"><div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{imgs.map((img, i) => <div key={i} className="overflow-hidden rounded-lg" style={{ borderRadius: "var(--event-radius)" }}><img src={img} alt="" className="aspect-square w-full object-cover transition-transform duration-300 hover:scale-105" /></div>)}</div></div></Section>;
    }
    case "video": {
      if (!c.url) return null;
      return <Section><div className="mx-auto max-w-4xl"><div className="overflow-hidden rounded-lg" style={{ borderRadius: "var(--event-radius)" }}><div className="relative w-full" style={{ paddingBottom: "56.25%" }}><iframe src={c.url} title="Video" className="absolute inset-0 h-full w-full" style={{ border: 0 }} allowFullScreen /></div></div></div></Section>;
    }
    case "button": {
      if (!c.label) return null;
      const al = c.align === "left" ? "justify-start" : c.align === "right" ? "justify-end" : "justify-center";
      return <Section><div className={cn("mx-auto flex max-w-3xl", al)}>{c.link ? <a href={c.link} target="_blank" rel="noopener noreferrer" className="event-btn-primary">{c.label}</a> : <button className="event-btn-primary">{c.label}</button>}</div></Section>;
    }
    case "columns": {
      const cols = c.columns ?? [];
      if (cols.length === 0) return null;
      return <Section><div className="mx-auto max-w-5xl"><div className={cn("grid gap-6", cols.length === 2 ? "sm:grid-cols-2" : cols.length === 3 ? "sm:grid-cols-3" : "grid-cols-1")}>{cols.map((col, i) => <div key={i}>{col.map((b) => <BlockView key={b.id} block={b} eventId={eventId} slug={slug} />)}</div>)}</div></div></Section>;
    }
    case "list": {
      const items = c.items ?? [];
      if (items.length === 0) return null;
      return <Section><div className="mx-auto max-w-3xl"><ul className="space-y-2">{items.map((item, i) => <li key={i} className="flex items-start gap-3" style={{ color: "var(--event-text)" }}><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: "var(--event-primary)" }} /><span>{item}</span></li>)}</ul></div></Section>;
    }
    case "quote": {
      const { text: quote, style } = resolveTypography(c.quote, "");
      return <Section><div className="mx-auto max-w-3xl text-center"><blockquote className="text-xl italic" style={{ color: "var(--event-muted)", ...style }}>"{quote}"</blockquote>{c.author && <p className="mt-3 text-sm font-medium" style={{ color: "var(--event-text)" }}>— {c.author}</p>}</div></Section>;
    }
    case "countdown": return <CountdownBlock targetDate={c.targetDate ?? ""} />;
    case "map": return <Section><div className="mx-auto max-w-4xl">{c.mapUrl && <div className="overflow-hidden rounded-lg" style={{ borderRadius: "var(--event-radius)" }}><div className="relative w-full" style={{ paddingBottom: "40%" }}><iframe src={c.mapUrl} title="Map" className="absolute inset-0 h-full w-full" style={{ border: 0 }} loading="lazy" /></div></div>}{c.address && <p className="mt-3 text-center text-sm" style={{ color: "var(--event-muted)" }}>{c.address}</p>}</div></Section>;
    case "rsvp-form": {
      const navigate = useNavigate();
      return <Section><div className="mx-auto max-w-md text-center"><p className="guest-subtitle mb-6 mx-auto">Let us know if you can make it.</p><button onClick={() => navigate(`/e/${slug}/rsvp`)} className="event-btn-primary">Go to RSVP</button></div></Section>;
    }
    case "guest-list": return <GuestListBlock eventId={eventId} />;
    case "schedule": return <ScheduleBlock eventId={eventId} />;
    case "venue": return <Section><div className="mx-auto max-w-3xl text-center">{c.title && <p className="guest-eyebrow">{c.title}</p>}{c.venue && <h3 className="text-xl font-semibold" style={{ color: "var(--event-heading)" }}>{c.venue}</h3>}{c.address && <p className="mt-1 text-sm" style={{ color: "var(--event-muted)" }}>{c.address}</p>}{c.mapUrl && <div className="mt-4 overflow-hidden rounded-lg" style={{ borderRadius: "var(--event-radius)" }}><div className="relative w-full" style={{ paddingBottom: "40%" }}><iframe src={c.mapUrl} title="Venue Map" className="absolute inset-0 h-full w-full" style={{ border: 0 }} loading="lazy" /></div></div>}</div></Section>;
    case "faq": return <FaqBlock faqs={c.faqs ?? []} />;
    default: return null;
  }
}

function Section({ children }: { children: React.ReactNode }) {
  return <div className="guest-section-tight">{children}</div>;
}

function CountdownBlock({ targetDate }: { targetDate: string }) {
  const [countdown, setCountdown] = useState(() => getCountdown(targetDate));
  useEffect(() => {
    const interval = setInterval(() => setCountdown(getCountdown(targetDate)), 1000);
    return () => clearInterval(interval);
  }, [targetDate]);
  if (countdown.isPast) return <Section><div className="text-center"><p className="guest-subtitle mx-auto">The countdown has ended.</p></div></Section>;
  const units = [{ label: "Days", value: countdown.days }, { label: "Hours", value: countdown.hours }, { label: "Minutes", value: countdown.minutes }, { label: "Seconds", value: countdown.seconds }];
  return <Section><div className="mx-auto flex max-w-2xl justify-center gap-6 sm:gap-10">{units.map((u) => <div key={u.label} className="flex flex-col items-center"><span className="text-3xl font-bold sm:text-4xl" style={{ color: "var(--event-primary)" }}>{String(u.value).padStart(2, "0")}</span><span className="mt-1 text-xs uppercase tracking-wider" style={{ color: "var(--event-muted)" }}>{u.label}</span></div>)}</div></Section>;
}

function GuestListBlock({ eventId }: { eventId: string }) {
  const { data: guests, isLoading } = useQuery({
    queryKey: ["block-guest-list", eventId],
    queryFn: async () => {
      const { data, error } = await supabase.from("event_guests").select("name, rsvp_status").eq("event_id", eventId).order("name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as { name: string; rsvp_status: string | null }[];
    },
    enabled: !!eventId,
  });
  if (isLoading) return <Section><div className="text-center"><div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-dash-primary border-t-transparent" /></div></Section>;
  const attending = (guests ?? []).filter((g) => g.rsvp_status === "attending");
  if (attending.length === 0) return <Section><div className="text-center"><p className="guest-subtitle mx-auto">No confirmed guests yet.</p></div></Section>;
  return <Section><div className="mx-auto max-w-3xl"><div className="flex flex-wrap gap-2">{attending.map((g, i) => <span key={i} className="rounded-full px-3 py-1 text-sm" style={{ backgroundColor: "var(--event-surface-alt)", color: "var(--event-text)", border: "1px solid var(--event-border)" }}>{g.name}</span>)}</div></div></Section>;
}

function ScheduleBlock({ eventId }: { eventId: string }) {
  const { data: schedule, isLoading } = useQuery({
    queryKey: ["block-schedule", eventId],
    queryFn: async () => {
      const { data, error } = await supabase.from("event_schedules").select("*").eq("event_id", eventId).order("order_index", { ascending: true });
      if (error) throw error;
      return (data ?? []) as EventSchedule[];
    },
    enabled: !!eventId,
  });
  if (isLoading) return <Section><div className="text-center"><div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-dash-primary border-t-transparent" /></div></Section>;
  const items = schedule ?? [];
  if (items.length === 0) return null;
  return <Section><div className="mx-auto max-w-3xl space-y-4">{items.map((item, i) => <div key={item.id} className="flex items-start gap-4 animate-slideUpStagger" style={{ animationDelay: `${i * 60}ms` }}><div className="w-24 shrink-0 text-right">{item.start_time && <p className="text-sm font-semibold" style={{ color: "var(--event-primary)" }}>{formatTime12(item.start_time)}</p>}{item.schedule_date && <p className="text-xs" style={{ color: "var(--event-muted)" }}>{formatDate(item.schedule_date)}</p>}</div><div className="flex-1 border-l pl-4" style={{ borderColor: "var(--event-border)" }}><h3 className="font-semibold" style={{ color: "var(--event-heading)" }}>{item.title}</h3>{item.venue && <p className="text-sm" style={{ color: "var(--event-muted)" }}>{item.venue}</p>}{item.description && <p className="mt-1 text-sm" style={{ color: "var(--event-text)" }}>{item.description}</p>}</div></div>)}</div></Section>;
}

function FaqBlock({ faqs }: { faqs: { question: string; answer: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);
  if (faqs.length === 0) return null;
  return <Section><div className="mx-auto max-w-3xl space-y-3">{faqs.map((faq, i) => <div key={i} className="event-card" style={{ padding: "1.25rem" }}><button onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-center justify-between text-left"><span className="font-semibold" style={{ color: "var(--event-heading)" }}>{faq.question}</span><span className="ml-4 text-lg" style={{ color: "var(--event-muted)" }}>{open === i ? "−" : "+"}</span></button>{open === i && <p className="mt-3 text-sm animate-fadeIn" style={{ color: "var(--event-text)" }}>{faq.answer}</p>}</div>)}</div></Section>;
}

export function jsonToBlocks(json: Json | null | undefined): Block[] {
  if (!json || !Array.isArray(json)) return [];
  return (json as unknown[]).map((item) => {
    const obj = item as Record<string, unknown>;
    return { id: (obj.id as string) ?? `block-${Math.random()}`, type: (obj.type as string) ?? "paragraph", content: (obj.content as BlockContent) ?? {} };
  });
}
