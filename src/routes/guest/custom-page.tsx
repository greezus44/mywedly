import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent, type CustomPage } from "../../lib/supabase";
import { EventThemeProvider } from "../../lib/theme-context";
import { DEFAULT_THEME, type ThemeConfig } from "../../lib/theme";
import { RichTextContent } from "../../lib/sanitize";
import { getCountdown } from "../../lib/utils";

type BlockType =
  | "heading" | "paragraph" | "image" | "spacer" | "divider" | "gallery"
  | "video" | "button" | "columns" | "list" | "quote" | "countdown"
  | "map" | "rsvp-form" | "guest-list" | "schedule" | "venue" | "faq";

interface Block {
  id: string;
  type: BlockType;
  data: Record<string, any>;
}

const cardStyle: React.CSSProperties = { backgroundColor: "var(--event-surface)", border: "1px solid var(--event-border)" };

function CountdownBlock({ date }: { date: string }) {
  const [countdown, setCountdown] = useState(getCountdown(date));
  useEffect(() => {
    if (countdown.isPast) return;
    const timer = setInterval(() => setCountdown(getCountdown(date)), 1000);
    return () => clearInterval(timer);
  }, [date, countdown.isPast]);
  if (countdown.isPast) return null;
  const items = [
    { label: "Days", value: countdown.days },
    { label: "Hours", value: countdown.hours },
    { label: "Min", value: countdown.minutes },
    { label: "Sec", value: countdown.seconds },
  ];
  return (
    <div className="my-6 flex justify-center gap-4">
      {items.map((item) => (
        <div key={item.label} className="text-center">
          <div className="text-2xl font-bold" style={{ color: "var(--event-primary)" }}>
            {String(item.value).padStart(2, "0")}
          </div>
          <div className="text-xs" style={{ color: "var(--event-muted)" }}>{item.label}</div>
        </div>
      ))}
    </div>
  );
}

function BlockRenderer({ block }: { block: Block }) {
  const d = block.data || {};
  switch (block.type) {
    case "heading":
      return <h2 className="font-event text-2xl md:text-3xl my-4" style={{ color: "var(--event-heading)" }}>{d.text || ""}</h2>;
    case "paragraph":
      return <RichTextContent html={d.html || ""} className="my-4" />;
    case "image":
      return d.url ? <div className="my-4"><img src={d.url} alt="" className="w-full rounded-lg" /></div> : null;
    case "spacer":
      return <div style={{ height: `${d.height || 40}px` }} />;
    case "divider":
      return <hr className="my-6" style={{ borderColor: "var(--event-border)" }} />;
    case "gallery": {
      const urls: string[] = d.urls || [];
      if (!urls.length) return null;
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 my-4">
          {urls.map((url, i) => <img key={i} src={url} alt="" className="w-full h-40 object-cover rounded-lg" />)}
        </div>
      );
    }
    case "video":
      return d.url ? (
        <div className="my-4 aspect-video rounded-lg overflow-hidden">
          <iframe src={d.url} className="w-full h-full" allowFullScreen title="Video" />
        </div>
      ) : null;
    case "button":
      return d.text && d.url ? (
        <div className="my-4 text-center">
          <a href={d.url} target="_blank" rel="noopener noreferrer" className="event-btn-primary inline-block">{d.text}</a>
        </div>
      ) : null;
    case "columns":
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
          <div style={{ color: "var(--event-text)" }}>{d.col1 || ""}</div>
          <div style={{ color: "var(--event-text)" }}>{d.col2 || ""}</div>
        </div>
      );
    case "list": {
      const items: string[] = d.items || [];
      if (!items.length) return null;
      return (
        <ul className="list-disc pl-6 my-4 space-y-1" style={{ color: "var(--event-text)" }}>
          {items.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
      );
    }
    case "quote":
      return (
        <blockquote className="my-4 pl-4 italic" style={{ borderLeft: "3px solid var(--event-border)", color: "var(--event-muted)" }}>
          <p>{d.text || ""}</p>
          {d.author && <cite className="block text-sm mt-1 not-italic" style={{ color: "var(--event-muted)" }}>— {d.author}</cite>}
        </blockquote>
      );
    case "countdown":
      return d.date ? <CountdownBlock date={d.date} /> : null;
    case "map":
      return d.url ? (
        <div className="my-4 aspect-video rounded-lg overflow-hidden">
          <iframe src={d.url} className="w-full h-full" loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Map" />
        </div>
      ) : null;
    case "venue":
      return (
        <div className="my-4 rounded-lg p-4" style={cardStyle}>
          {d.name && <h3 className="font-event text-lg mb-1" style={{ color: "var(--event-heading)" }}>{d.name}</h3>}
          {d.address && <p className="text-sm whitespace-pre-wrap" style={{ color: "var(--event-text)" }}>{d.address}</p>}
        </div>
      );
    case "faq":
      return (d.question || d.answer) ? (
        <div className="my-4 rounded-lg p-4" style={cardStyle}>
          <h3 className="font-event text-base font-semibold mb-1" style={{ color: "var(--event-heading)" }}>{d.question}</h3>
          <p className="text-sm" style={{ color: "var(--event-text)" }}>{d.answer}</p>
        </div>
      ) : null;
    case "rsvp-form":
      return (
        <div className="my-4 rounded-lg p-4 text-center" style={cardStyle}>
          <Link to="../rsvp" className="event-btn-primary inline-block">Go to RSVP</Link>
        </div>
      );
    case "guest-list":
    case "schedule":
      return (
        <div className="my-4 rounded-lg p-4 text-center text-sm" style={{ ...cardStyle, color: "var(--event-muted)" }}>
          This content is available on the invitation website.
        </div>
      );
    default:
      return null;
  }
}

function NotFound({ message, linkTo, linkLabel, themed }: {
  message: string; linkTo: string; linkLabel: string; themed?: boolean;
}) {
  const inner = (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-lg mb-4" style={themed ? { color: "var(--event-text)" } : { color: "#374151" }}>{message}</p>
        <Link to={linkTo} className="underline" style={themed ? { color: "var(--event-primary)" } : { color: "#b45309" }}>{linkLabel}</Link>
      </div>
    </div>
  );
  return themed ? <EventThemeProvider initialTheme={DEFAULT_THEME}>{inner}</EventThemeProvider> : inner;
}

export default function GuestCustomPage() {
  const { slug, pageSlug } = useParams<{ slug: string; pageSlug: string }>();

  const { data: event, isLoading: eventLoading } = useQuery({
    queryKey: ["published_event", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_events").select("*").eq("slug", slug!).eq("is_published", true).maybeSingle();
      if (error) throw error;
      return data as UserEvent | null;
    },
    enabled: !!slug,
  });

  const { data: page, isLoading: pageLoading, error } = useQuery({
    queryKey: ["guest_custom_page", event?.id, pageSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_pages").select("*")
        .eq("slug", pageSlug!).eq("event_id", event!.id).eq("is_published", true).maybeSingle();
      if (error) throw error;
      return data as CustomPage | null;
    },
    enabled: !!event?.id && !!pageSlug,
  });

  const isLoading = eventLoading || pageLoading;
  const theme = (event?.theme || DEFAULT_THEME) as ThemeConfig;
  const blocks = (page?.blocks || []) as unknown as Block[];

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin h-8 w-8 border-2 border-amber-700 border-t-transparent rounded-full" />
    </div>
  );

  if (!event) return <NotFound message="This invitation website could not be found or is no longer available." linkTo="/" linkLabel="Back to Home" />;

  if (error || !page) return (
    <EventThemeProvider initialTheme={theme}>
      <NotFound message="This page could not be found or is no longer available." linkTo={`/e/${slug}/home`} linkLabel="Back to Home" themed />
    </EventThemeProvider>
  );

  return (
    <EventThemeProvider initialTheme={theme}>
      <div className="min-h-screen">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <h1 className="font-event text-3xl md:text-4xl text-center mb-8" style={{ color: "var(--event-heading)" }}>{page.title}</h1>
          {page.cover_image_url && <div className="mb-8 rounded-lg overflow-hidden"><img src={page.cover_image_url} alt="" className="w-full" /></div>}
          {page.inline_image_url && <div className="mb-8 rounded-lg overflow-hidden"><img src={page.inline_image_url} alt="" className="w-full" /></div>}
          {page.body && <RichTextContent html={page.body} className="mb-6" />}
          {blocks.length > 0 && (
            <div>{blocks.map((block) => <BlockRenderer key={block.id} block={block} />)}</div>
          )}
          <div className="mt-12 text-center">
            <Link to={`/e/${slug}/home`} className="text-sm underline" style={{ color: "var(--event-primary)" }}>← Back to Home</Link>
          </div>
        </div>
      </div>
    </EventThemeProvider>
  );
}
