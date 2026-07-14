import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent, type CustomPage, type Json } from "../../lib/supabase";
import { EventThemeProvider } from "../../lib/theme-context";
import { DEFAULT_THEME, jsonToTheme, type ThemeConfig } from "../../lib/theme";
import { RichTextContent } from "../../lib/sanitize";
import { cn, formatDate, formatTime12, getCountdown } from "../../lib/utils";

interface Block { id: string; type: string; [key: string]: any; }

export default function GuestCustomPage() {
  const { slug = "", pageSlug = "" } = useParams<{ slug: string; pageSlug: string }>();
  const navigate = useNavigate();

  const { data: event, isLoading: eventLoading } = useQuery({
    queryKey: ["guest-event", slug],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_events").select("*")
        .eq("slug", slug).eq("is_published", true).maybeSingle();
      if (error) throw error;
      return data as UserEvent | null;
    },
  });

  const { data: page, isLoading: pageLoading } = useQuery({
    queryKey: ["guest-custom-page", slug, pageSlug], enabled: !!event,
    queryFn: async () => {
      const { data, error } = await supabase.from("custom_pages").select("*")
        .eq("slug", pageSlug).eq("event_id", event!.id).eq("is_published", true).maybeSingle();
      if (error) throw error;
      return data as CustomPage | null;
    },
  });

  if (eventLoading || pageLoading) return <div className="flex min-h-screen items-center justify-center bg-dash-bg"><div className="animate-spin h-8 w-8 rounded-full border-2 border-dash-primary border-t-transparent" /></div>;
  if (!event) return <div className="flex min-h-screen items-center justify-center bg-dash-bg px-4 text-center"><p className="max-w-md text-dash-muted">This invitation website could not be found or is no longer available.</p></div>;
  if (!page) return <div className="flex min-h-screen items-center justify-center bg-dash-bg px-4 text-center"><p className="max-w-md text-dash-muted">This page could not be found.</p></div>;

  const theme: ThemeConfig = jsonToTheme(event.theme as Json | null) ?? DEFAULT_THEME;
  const blocks = (page.blocks as Block[]) ?? [];

  return (
    <EventThemeProvider initialTheme={theme}>
      <div className="event-themed min-h-screen">
        <header className="border-b border-event-border bg-event-surface/95">
          <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
            <button onClick={() => navigate(`/e/${slug}/home`)} className="text-sm text-event-muted hover:text-event-heading">← {event.name}</button>
            <span className="font-event text-base font-semibold text-event-heading">{page.title}</span>
          </div>
        </header>
        <main className="mx-auto max-w-3xl px-4 py-10">
          {blocks.length === 0 ? <p className="text-sm text-event-muted">No content yet.</p> : (
            <div className="space-y-6">{blocks.map((block) => <BlockRenderer key={block.id} block={block} event={event} />)}</div>
          )}
        </main>
      </div>
    </EventThemeProvider>
  );
}

function BlockRenderer({ block, event }: { block: Block; event: UserEvent }) {
  switch (block.type) {
    case "heading": {
      const level = Math.min(Math.max(Number(block.level ?? 2), 1), 6);
      const Tag = `h${level}` as keyof JSX.IntrinsicElements;
      return <Tag className="text-event-heading font-semibold">{block.text}</Tag>;
    }
    case "paragraph": return <RichTextContent html={block.text ?? ""} />;
    case "image": return block.url ? <img src={block.url} alt={block.alt ?? ""} className="w-full rounded-lg border border-event-border" /> : null;
    case "spacer": return <div style={{ height: `${block.height ?? 40}px` }} />;
    case "divider": return <hr className="border-event-border" />;
    case "gallery": return (
      <div className={cn("grid gap-2")} style={{ gridTemplateColumns: `repeat(${block.columns ?? 3}, minmax(0, 1fr))` }}>
        {(block.images ?? []).filter((u: string) => !!u).map((url: string, i: number) => (
          <img key={i} src={url} alt="" className="aspect-square w-full rounded-lg border border-event-border object-cover" />
        ))}
      </div>
    );
    case "video": {
      const url = block.url ?? "";
      const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
      const embed = m ? `https://www.youtube.com/embed/${m[1]}` : url;
      return url ? <div className="aspect-video w-full overflow-hidden rounded-lg border border-event-border"><iframe src={embed} className="h-full w-full" allowFullScreen /></div> : null;
    }
    case "button": return block.url ? (
      <a href={block.url} target="_blank" rel="noopener noreferrer" className="event-btn-primary inline-block">{block.text ?? "Click here"}</a>
    ) : null;
    case "columns": return (
      <div className="grid gap-4 sm:grid-cols-2">
        {(block.columns ?? []).map((col: string, i: number) => <RichTextContent key={i} html={col ?? ""} />)}
      </div>
    );
    case "list": {
      const items = block.items ?? [];
      return block.ordered ? (
        <ol className="list-decimal space-y-1 pl-6 text-event-text">{items.map((item: string, i: number) => <li key={i}>{item}</li>)}</ol>
      ) : (
        <ul className="list-disc space-y-1 pl-6 text-event-text">{items.map((item: string, i: number) => <li key={i}>{item}</li>)}</ul>
      );
    }
    case "quote": return (
      <blockquote className="border-l-4 border-event-border pl-4 italic text-event-muted">
        <p>{block.text}</p>{block.author && <footer className="mt-1 text-sm not-italic">— {block.author}</footer>}
      </blockquote>
    );
    case "countdown": {
      const c = getCountdown(block.targetDate);
      if (c.isPast) return <p className="text-event-muted">This moment has arrived.</p>;
      return (
        <div className="event-card flex justify-center gap-6 text-center">
          {(["days", "hours", "minutes", "seconds"] as const).map((u) => (
            <div key={u} className="flex flex-col items-center">
              <span className="text-2xl font-bold text-event-heading">{c[u].toString().padStart(2, "0")}</span>
              <span className="text-xs uppercase text-event-muted">{u}</span>
            </div>
          ))}
        </div>
      );
    }
    case "map": {
      const addr = block.address ?? event.address ?? "";
      const link = addr ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}` : null;
      return (
        <div className="event-card space-y-2">
          {block.heading && <h3 className="text-lg font-semibold text-event-heading">{block.heading}</h3>}
          {addr && <p className="text-event-text">{addr}</p>}
          {link && <a href={link} target="_blank" rel="noopener noreferrer" className="event-btn-secondary inline-block">📍 View on map</a>}
        </div>
      );
    }
    case "schedule": return (
      <div className="event-card">
        {block.heading && <h3 className="mb-3 text-lg font-semibold text-event-heading">{block.heading}</h3>}
        <ScheduleBlock eventId={event.id} />
      </div>
    );
    case "venue": return (
      <div className="event-card">
        {block.heading && <h3 className="mb-3 text-lg font-semibold text-event-heading">{block.heading}</h3>}
        {event.venue && <p className="text-event-text">{event.venue}</p>}
        {event.address && <p className="text-event-text">{event.address}</p>}
      </div>
    );
    case "faq": return (
      <div className="space-y-3">
        {(block.items ?? []).map((item: { question: string; answer: string }, i: number) => (
          <div key={i} className="event-card">
            <h3 className="font-semibold text-event-heading">{item.question}</h3>
            <p className="mt-1 text-event-text">{item.answer}</p>
          </div>
        ))}
      </div>
    );
    case "rsvp-form":
    case "guest-list": return (
      <div className="event-card text-center">
        {block.heading && <h3 className="mb-2 text-lg font-semibold text-event-heading">{block.heading}</h3>}
        <a href={`#/e/${event.slug ?? ""}/rsvp`} className="event-btn-primary inline-block">Go to RSVP</a>
      </div>
    );
    default: return null;
  }
}

function ScheduleBlock({ eventId }: { eventId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["guest-schedule", eventId],
    queryFn: async () => {
      const { data, error } = await supabase.from("event_schedule").select("*")
        .eq("event_id", eventId).order("order_index", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
  if (isLoading) return <div className="flex justify-center py-4"><div className="animate-spin h-5 w-5 rounded-full border-2 border-event-primary border-t-transparent" /></div>;
  if (!data || data.length === 0) return <p className="text-sm text-event-muted">No schedule items.</p>;
  return (
    <div className="space-y-2">
      {data.map((item) => (
        <div key={item.id} className="border-l-2 border-event-border pl-3">
          <p className="font-medium text-event-heading">{item.title}</p>
          <p className="text-xs text-event-muted">
            {formatDate(item.schedule_date)}{item.start_time && ` · ${formatTime12(item.start_time)}`}{item.venue && ` · ${item.venue}`}
          </p>
          {item.description && <p className="mt-1 text-sm text-event-text">{item.description}</p>}
        </div>
      ))}
    </div>
  );
}
