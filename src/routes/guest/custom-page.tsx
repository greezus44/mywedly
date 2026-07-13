import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type CustomPage, type UserEvent, type SubEvent, type Json } from "../../lib/supabase";
import { EventThemeProvider } from "../../lib/theme-context";
import { DEFAULT_THEME, type ThemeConfig } from "../../lib/theme";
import { RichTextContent } from "../../lib/sanitize";
import { formatDate, formatTime12, getCountdown } from "../../lib/utils";

interface Block {
  id: string;
  type: string;
  data: Record<string, unknown>;
}

function parseTheme(theme: Json | null | undefined): ThemeConfig {
  if (theme && typeof theme === "object" && !Array.isArray(theme)) {
    return { ...DEFAULT_THEME, ...(theme as Partial<ThemeConfig>) };
  }
  return DEFAULT_THEME;
}

const COUNTDOWN_LABELS: Record<string, keyof ReturnType<typeof getCountdown>> = {
  Days: "days", Hours: "hours", Mins: "minutes", Secs: "seconds",
};
function CountdownBlock({ date }: { date: string }) {
  const [countdown, setCountdown] = useState(() => getCountdown(date));
  useEffect(() => {
    setCountdown(getCountdown(date));
    const id = setInterval(() => setCountdown(getCountdown(date)), 1000);
    return () => clearInterval(id);
  }, [date]);
  if (countdown.isPast) return <p className="opacity-70">This event has passed.</p>;
  return (
    <div className="flex justify-center gap-6 text-center">
      {Object.entries(COUNTDOWN_LABELS).map(([label, key]) => (
        <div key={label}>
          <div className="text-3xl font-bold">{countdown[key]}</div>
          <div className="text-xs uppercase tracking-wide opacity-70">{label}</div>
        </div>
      ))}
    </div>
  );
}

function MapBlock({ address, zoom }: { address: string; zoom?: number }) {
  if (!address) return null;
  const src = `https://maps.google.com/maps?q=${encodeURIComponent(address)}&z=${zoom ?? 15}&output=embed`;
  return <iframe title="Map" src={src} className="h-64 w-full rounded-lg border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />;
}

function BlockRenderer({ block }: { block: Block }) {
  const d = block.data;
  switch (block.type) {
    case "heading": {
      const level = (d.level as string) || "h2";
      const text = (d.text as string) || "";
      const Tag = (level === "h1" ? "h1" : level === "h3" ? "h3" : "h2") as keyof JSX.IntrinsicElements;
      return <Tag>{text}</Tag>;
    }
    case "paragraph":
      return <RichTextContent html={(d.text as string) || ""} />;
    case "image":
      return d.url ? <img src={d.url as string} alt={(d.alt as string) || ""} className="w-full rounded-lg" /> : null;
    case "spacer":
      return <div style={{ height: `${(d.height as number) || 32}px` }} />;
    case "divider":
      return <hr className="border-0 border-t opacity-30" style={{ borderColor: "var(--event-border)" }} />;
    case "gallery": {
      const images = Array.isArray(d.images) ? (d.images as string[]) : [];
      if (images.length === 0) return null;
      return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((url, i) => (
            <img key={i} src={url} alt="" className="aspect-square w-full rounded-lg object-cover" />
          ))}
        </div>
      );
    }
    case "video": {
      const url = (d.url as string) || "";
      if (!url) return null;
      const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
      const vm = url.match(/vimeo\.com\/(\d+)/);
      const embedUrl = yt ? `https://www.youtube.com/embed/${yt[1]}` : vm ? `https://player.vimeo.com/video/${vm[1]}` : null;
      if (embedUrl) {
        return (
          <div className="aspect-video w-full">
            <iframe src={embedUrl} className="h-full w-full rounded-lg border-0" allowFullScreen title="Video" />
          </div>
        );
      }
      return <a href={url} target="_blank" rel="noopener noreferrer" className="underline">{url}</a>;
    }
    case "button":
      return d.url ? (
        <a href={d.url as string} target="_blank" rel="noopener noreferrer" className="event-btn-primary inline-block">
          {(d.text as string) || "Click here"}
        </a>
      ) : null;
    case "columns": {
      const cols = Array.isArray(d.columns) ? (d.columns as { text: string }[]) : [];
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          {cols.map((col, i) => (
            <div key={i}><RichTextContent html={col.text || ""} /></div>
          ))}
        </div>
      );
    }
    case "list": {
      const items = Array.isArray(d.items) ? (d.items as string[]) : [];
      if (items.length === 0) return null;
      return (
        <ul className="list-disc space-y-1 pl-6">
          {items.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
      );
    }
    case "quote":
      return (
        <blockquote className="border-l-4 pl-4 italic opacity-80" style={{ borderColor: "var(--event-border)" }}>
          <RichTextContent html={(d.text as string) || ""} />
          {d.author ? <footer className="mt-2 text-sm not-italic">— {d.author as string}</footer> : null}
        </blockquote>
      );
    case "countdown":
      return d.date ? <CountdownBlock date={d.date as string} /> : null;
    case "map":
      return <MapBlock address={(d.address as string) || ""} zoom={d.zoom as number | undefined} />;
    case "faq": {
      const items = Array.isArray(d.items) ? (d.items as { question: string; answer: string }[]) : [];
      if (items.length === 0) return null;
      return (
        <div className="space-y-4">
          {items.map((item, i) => (
            <div key={i} className="event-card">
              <h3 className="font-semibold">{item.question}</h3>
              <p className="mt-1 text-sm opacity-80">{item.answer}</p>
            </div>
          ))}
        </div>
      );
    }
    case "rsvp-form":
      return (
        <div className="event-card text-center">
          <Link to="../rsvp" className="event-btn-primary inline-block">Go to RSVP</Link>
        </div>
      );
    case "guest-list":
      return <p className="opacity-70 text-sm">Guest list is not publicly available.</p>;
    case "schedule":
    case "venue":
      // These are handled by the parent with event data; render a placeholder
      return null;
    default:
      return null;
  }
}

export default function GuestCustomPage() {
  const { slug, pageSlug } = useParams<{ slug: string; pageSlug: string }>();

  const { data: event, isLoading: eventLoading, isError: eventError } = useQuery({
    queryKey: ["user_events", "slug", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_events")
        .select("*")
        .eq("slug", slug!)
        .eq("is_published", true)
        .maybeSingle();
      if (error) throw error;
      return data as UserEvent | null;
    },
    enabled: !!slug,
  });

  const { data: page, isLoading: pageLoading, isError: pageError } = useQuery({
    queryKey: ["custom_pages", "slug", event?.id, pageSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_pages")
        .select("*")
        .eq("event_id", event!.id)
        .eq("slug", pageSlug!)
        .eq("is_published", true)
        .maybeSingle();
      if (error) throw error;
      return data as CustomPage | null;
    },
    enabled: !!event && !!pageSlug,
  });

  // Load sub-events for schedule/venue blocks
  const { data: subEvents } = useQuery({
    queryKey: ["sub_events", event?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sub_events")
        .select("*")
        .eq("parent_event_id", event!.id)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as SubEvent[];
    },
    enabled: !!event,
  });

  if (eventLoading || pageLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse opacity-70">Loading…</div>
      </div>
    );
  }

  if (eventError || !event) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="text-2xl font-bold">Invitation not found</h1>
        <p className="max-w-md opacity-80">
          This invitation website could not be found or is no longer available.
        </p>
        <Link to="/" className="underline">Go to homepage</Link>
      </div>
    );
  }

  if (pageError || !page) {
    return (
      <EventThemeProvider theme={parseTheme(event.theme)}>
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
          <h1 className="text-2xl font-bold">Page not found</h1>
          <Link to={`/e/${slug}/home`} className="underline">Back to home</Link>
        </div>
      </EventThemeProvider>
    );
  }

  const blocks = Array.isArray(page.blocks) ? (page.blocks as unknown as Block[]) : [];
  const theme = parseTheme(event.theme);

  return (
    <EventThemeProvider theme={theme}>
      <div className="mx-auto max-w-3xl px-4 py-8">
        {page.cover_image_url && (
          <img src={page.cover_image_url} alt={page.title} className="mb-6 w-full rounded-xl object-cover" />
        )}
        <h1 className="mb-6 text-3xl font-bold">{page.title}</h1>
        {page.body && <RichTextContent html={page.body} className="mb-6" />}
        <div className="space-y-6">
          {blocks.map((block) => {
            // Inject event data for schedule/venue blocks
            if (block.type === "schedule" || block.type === "venue") {
              const events = subEvents ?? [];
              if (block.type === "venue") {
                return (
                  <div key={block.id} className="event-card space-y-2">
                    {event.venue && <p className="font-semibold">{event.venue}</p>}
                    {event.address && <p className="whitespace-pre-line text-sm opacity-80">{event.address}</p>}
                  </div>
                );
              }
              return (
                <div key={block.id} className="space-y-3">
                  {events.map((ev) => (
                    <div key={ev.id} className="event-card space-y-1">
                      <h3 className="font-semibold">{ev.name}</h3>
                      {ev.date && <p className="text-sm">{formatDate(ev.date)}</p>}
                      {ev.time && <p className="text-sm opacity-70">{formatTime12(ev.time)}</p>}
                      {ev.venue && <p className="text-sm font-medium">{ev.venue}</p>}
                    </div>
                  ))}
                </div>
              );
            }
            return <BlockRenderer key={block.id} block={block} />;
          })}
        </div>
      </div>
    </EventThemeProvider>
  );
}
