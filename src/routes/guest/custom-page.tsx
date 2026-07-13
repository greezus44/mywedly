import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type CustomPage, type UserEvent } from "../../lib/supabase";
import { EventThemeProvider } from "../../lib/theme-context";
import { DEFAULT_THEME, type ThemeConfig } from "../../lib/theme";
import { RichTextContent } from "../../lib/sanitize";
import { formatDate, formatTime12, getCountdown } from "../../lib/utils";

interface Block {
  id: string;
  type: string;
  data: Record<string, unknown>;
}

function parseTheme(event: UserEvent | null): ThemeConfig {
  if (!event) return DEFAULT_THEME;
  const raw = (event.theme ?? {}) as unknown as ThemeConfig;
  if (raw && typeof raw === "object" && "bg" in raw) return raw;
  return DEFAULT_THEME;
}

// --- Block Renderer ---

function BlockRenderer({ block }: { block: Block }) {
  const d = block.data;
  switch (block.type) {
    case "heading":
      return React.createElement(
        (d.level as string) || "h2",
        { className: "mt-4 mb-2 font-bold", style: { color: "var(--event-heading)" } },
        (d.text as string) ?? "",
      );
    case "paragraph":
      return <RichTextContent html={(d.text as string) ?? ""} className="my-2" />;
    case "image":
      return d.url ? (
        <img src={d.url as string} alt={(d.alt as string) || ""} className="my-4 w-full rounded-lg" style={{ borderRadius: "var(--event-radius)" }} />
      ) : (
        <div className="my-4 flex h-32 items-center justify-center rounded-lg border-2 border-dashed text-sm" style={{ borderColor: "var(--event-border)", color: "var(--event-muted)" }}>
          Image placeholder
        </div>
      );
    case "spacer":
      return <div style={{ height: (d.height as number) || 40 }} />;
    case "divider":
      return <hr className="my-4" style={{ borderColor: "var(--event-border)" }} />;
    case "gallery": {
      const images = (d.images as { url?: string; alt?: string }[]) ?? [];
      return images.length > 0 ? (
        <div className="my-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((img, i) => (
            <img key={i} src={img.url} alt={img.alt || ""} className="w-full rounded-lg" style={{ borderRadius: "var(--event-radius)" }} />
          ))}
        </div>
      ) : (
        <div className="my-4 flex h-32 items-center justify-center rounded-lg border-2 border-dashed text-sm" style={{ borderColor: "var(--event-border)", color: "var(--event-muted)" }}>
          Gallery placeholder
        </div>
      );
    }
    case "video":
      return d.url ? (
        <div className="my-4 aspect-video overflow-hidden rounded-lg" style={{ borderRadius: "var(--event-radius)" }}>
          <iframe src={d.url as string} className="h-full w-full" title="Video" allowFullScreen style={{ border: 0 }} />
        </div>
      ) : (
        <div className="my-4 flex h-32 items-center justify-center rounded-lg border-2 border-dashed text-sm" style={{ borderColor: "var(--event-border)", color: "var(--event-muted)" }}>
          Video placeholder
        </div>
      );
    case "button":
      return (
        <div className="my-4 text-center">
          <a href={(d.url as string) || "#"} className="event-btn-primary inline-block" target={d.url && d.url.toString().startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer">
            {(d.text as string) || "Button"}
          </a>
        </div>
      );
    case "columns": {
      const cols = (d.columns as { text?: string }[]) ?? [];
      return (
        <div className="my-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {cols.map((c, i) => (
            <div key={i} className="event-card">
              <RichTextContent html={c.text ?? ""} />
            </div>
          ))}
        </div>
      );
    }
    case "list": {
      const items = (d.items as string[]) ?? [];
      return (
        <ul className="my-4 list-disc pl-5 text-sm" style={{ color: "var(--event-text)" }}>
          {items.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
      );
    }
    case "quote":
      return (
        <blockquote className="my-4 border-l-4 pl-4 italic" style={{ borderColor: "var(--event-border)", color: "var(--event-muted)" }}>
          "{(d.text as string) ?? ""}"
          {d.author ? <footer className="mt-1 not-italic text-xs">— {d.author as string}</footer> : null}
        </blockquote>
      );
    case "countdown": {
      const target = (d.targetDate as string) || "";
      const cd = getCountdown(target);
      if (cd.isPast) return <p className="my-4 text-center text-sm" style={{ color: "var(--event-muted)" }}>This moment has passed.</p>;
      return (
        <div className="my-4 flex justify-center gap-3">
          {[{ l: "Days", v: cd.days }, { l: "Hrs", v: cd.hours }, { l: "Min", v: cd.minutes }, { l: "Sec", v: cd.seconds }].map((it) => (
            <div key={it.l} className="event-card text-center" style={{ minWidth: 64 }}>
              <div className="text-xl font-bold" style={{ color: "var(--event-primary)" }}>{it.v}</div>
              <div className="text-xs uppercase" style={{ color: "var(--event-muted)" }}>{it.l}</div>
            </div>
          ))}
        </div>
      );
    }
    case "map": {
      const addr = (d.address as string) || "";
      return addr ? (
        <div className="my-4 overflow-hidden event-card" style={{ padding: 0 }}>
          <iframe title="Map" src={`https://maps.google.com/maps?q=${encodeURIComponent(addr)}&output=embed`} className="w-full" style={{ height: 250, border: 0 }} loading="lazy" />
        </div>
      ) : (
        <div className="my-4 flex h-40 items-center justify-center rounded-lg border-2 border-dashed text-sm" style={{ borderColor: "var(--event-border)", color: "var(--event-muted)" }}>
          Map placeholder
        </div>
      );
    }
    case "rsvp-form":
      return (
        <div className="my-4 event-card text-center">
          <p className="text-sm" style={{ color: "var(--event-muted)" }}>
            Please visit the RSVP page to submit your response.
          </p>
        </div>
      );
    case "guest-list":
      return (
        <div className="my-4 event-card text-center">
          <p className="text-sm" style={{ color: "var(--event-muted)" }}>Guest list is not publicly visible.</p>
        </div>
      );
    case "schedule":
      return (
        <div className="my-4 event-card text-center">
          <p className="text-sm" style={{ color: "var(--event-muted)" }}>Schedule details will appear here.</p>
        </div>
      );
    case "venue": {
      const name = (d.name as string) || "";
      const addr = (d.address as string) || "";
      return (
        <div className="my-4 event-card">
          {name && <h4 className="font-semibold" style={{ color: "var(--event-heading)" }}>{name}</h4>}
          {addr && <p className="mt-1 text-sm" style={{ color: "var(--event-text)" }}>{addr}</p>}
        </div>
      );
    }
    case "faq": {
      const items = (d.items as { q?: string; a?: string }[]) ?? [];
      return (
        <div className="my-4 space-y-2">
          {items.map((item, i) => (
            <div key={i} className="event-card">
              <p className="font-medium" style={{ color: "var(--event-heading)" }}>{item.q ?? ""}</p>
              <p className="mt-1 text-sm" style={{ color: "var(--event-text)" }}>{item.a ?? ""}</p>
            </div>
          ))}
        </div>
      );
    }
    default:
      return null;
  }
}

// --- Main Component ---

export default function CustomPage() {
  const { slug, pageSlug } = useParams<{ slug: string; pageSlug: string }>();

  const { data: event, isLoading: eventLoading } = useQuery({
    queryKey: ["guest-event", slug],
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

  const { data: page, isLoading: pageLoading, isError, refetch } = useQuery({
    queryKey: ["guest-custom-page", slug, pageSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_pages")
        .select("*")
        .eq("slug", pageSlug!)
        .eq("is_published", true)
        .maybeSingle();
      if (error) throw error;
      return data as CustomPage | null;
    },
    enabled: !!pageSlug,
  });

  if (eventLoading || pageLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="animate-pulse text-gray-400">Loading…</div>
      </div>
    );
  }

  if (isError || !event || !page) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 px-6 text-center">
        <p className="text-lg text-gray-600">
          This invitation website could not be found or is no longer available.
        </p>
        <Link to="/" className="text-sm font-semibold text-blue-600 hover:underline">
          Go to homepage
        </Link>
      </div>
    );
  }

  const theme = parseTheme(event);
  const blocks = (page.blocks as unknown as Block[]) ?? [];

  return (
    <EventThemeProvider initialTheme={theme}>
      <div className="min-h-screen px-4 py-8">
        <div className="mx-auto max-w-2xl">
          <Link to={`/e/${slug}/home`} className="text-sm hover:underline" style={{ color: "var(--event-muted)" }}>
            ← Back
          </Link>
          <h1 className="mt-4 text-center text-3xl font-bold" style={{ fontFamily: "var(--event-font-heading)", color: "var(--event-heading)" }}>
            {page.title}
          </h1>
          {page.cover_image_url && (
            <img src={page.cover_image_url} alt={page.title} className="mt-4 w-full rounded-lg" style={{ borderRadius: "var(--event-radius)" }} />
          )}
          <div className="mt-4">
            {blocks.length > 0 ? (
              blocks.map((block) => <BlockRenderer key={block.id} block={block} />)
            ) : (
              <p className="text-center text-sm" style={{ color: "var(--event-muted)" }}>
                No content yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </EventThemeProvider>
  );
}
