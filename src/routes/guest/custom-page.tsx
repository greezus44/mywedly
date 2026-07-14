import React from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  supabase,
  type UserEvent,
  type CustomPage,
  type Json,
} from "../../lib/supabase";
import { EventThemeProvider } from "../../lib/theme-context";
import { jsonToTheme } from "../../lib/theme";
import { RichTextContent } from "../../lib/sanitize";
import { getCountdown } from "../../lib/utils";

interface Block {
  id: string;
  type: string;
  data: Record<string, unknown>;
}

const Placeholder = ({ text }: { text: string }) => (
  <div className="flex h-32 items-center justify-center rounded-lg border border-event-border bg-event-surface-alt text-sm text-event-muted">
    {text}
  </div>
);

function BlockRenderer({ block }: { block: Block }) {
  const d = block.data;
  switch (block.type) {
    case "heading": {
      const level = (d.level as number) || 2;
      const Tag = `h${level}` as keyof React.JSX.IntrinsicElements;
      return <Tag className="text-event-heading font-bold">{(d.text as string) || ""}</Tag>;
    }
    case "paragraph":
      return <RichTextContent html={(d.text as string) || ""} />;
    case "image":
      return d.url ? (
        <img src={d.url as string} alt={(d.alt as string) || ""} className="w-full rounded-lg" />
      ) : (
        <Placeholder text="No image" />
      );
    case "spacer":
      return <div style={{ height: (d.height as number) || 32 }} />;
    case "divider":
      return <hr className="border-event-border" />;
    case "gallery": {
      const images = (d.images as string[]) || [];
      const cols = (d.columns as number) || 3;
      return images.length > 0 ? (
        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {images.map((url, i) => (
            <img key={i} src={url} alt="" className="aspect-square w-full rounded-lg object-cover" />
          ))}
        </div>
      ) : (
        <Placeholder text="No images in gallery" />
      );
    }
    case "video":
      return d.url ? (
        <div>
          <div className="aspect-video overflow-hidden rounded-lg">
            <iframe src={d.url as string} className="h-full w-full" title={(d.caption as string) || "Video"} allowFullScreen />
          </div>
          {(d.caption as string) && (
            <p className="mt-1 text-center text-sm text-event-muted">{d.caption as string}</p>
          )}
        </div>
      ) : (
        <Placeholder text="No video URL" />
      );
    case "button": {
      const style = (d.style as string) || "primary";
      return d.text && d.url ? (
        <a
          href={d.url as string}
          className={`inline-block rounded-md px-6 py-3 font-medium ${
            style === "primary" ? "bg-event-primary text-event-primary-fg" : "border border-event-border text-event-text"
          }`}
        >
          {d.text as string}
        </a>
      ) : (
        <div className="text-sm text-event-muted">Button (no link)</div>
      );
    }
    case "columns":
      return (
        <div className="grid grid-cols-2 gap-4">
          <div><RichTextContent html={(d.left as string) || ""} /></div>
          <div><RichTextContent html={(d.right as string) || ""} /></div>
        </div>
      );
    case "list": {
      const items = (d.items as string[]) || [];
      const ordered = d.ordered as boolean;
      if (items.length === 0) return <div className="text-sm text-event-muted">Empty list</div>;
      const Tag = ordered ? "ol" : "ul";
      const cls = ordered ? "list-decimal" : "list-disc";
      return (
        <Tag className={`list-inside ${cls} space-y-1 text-event-text`}>
          {items.map((item, i) => <li key={i}>{item}</li>)}
        </Tag>
      );
    }
    case "quote":
      return (
        <blockquote className="border-l-4 border-event-primary pl-4 italic text-event-text">
          <p>{(d.text as string) || ""}</p>
          {(d.author as string) && (
            <footer className="mt-2 text-sm text-event-muted">— {d.author as string}</footer>
          )}
        </blockquote>
      );
    case "countdown": {
      const target = d.targetDate as string;
      if (!target) return <div className="text-sm text-event-muted">No date set</div>;
      const cd = getCountdown(target);
      return cd.isPast ? (
        <p className="text-event-muted">Event has passed</p>
      ) : (
        <div className="flex justify-center gap-4">
          {(["days", "hours", "minutes", "seconds"] as const).map((unit) => (
            <div key={unit} className="text-center">
              <div className="text-3xl font-bold text-event-heading">{cd[unit]}</div>
              <div className="text-xs uppercase text-event-muted">{unit}</div>
            </div>
          ))}
        </div>
      );
    }
    case "map":
      return d.address ? (
        <div className="overflow-hidden rounded-lg">
          <iframe
            src={`https://maps.google.com/maps?q=${encodeURIComponent(d.address as string)}&z=${d.zoom || 15}&output=embed`}
            className="h-64 w-full" title="Map"
          />
        </div>
      ) : (
        <Placeholder text="No address" />
      );
    case "rsvp-form":
      return <Placeholder text="RSVP form will appear here on the guest page" />;
    case "guest-list":
      return <Placeholder text="Guest list will appear here on the guest page" />;
    case "schedule":
      return <Placeholder text="Schedule will appear here on the guest page" />;
    case "venue":
      return (
        <div className="rounded-lg border border-event-border p-4">
          {(d.name as string) && <h3 className="text-lg font-semibold text-event-heading">{d.name as string}</h3>}
          {(d.address as string) && <p className="text-sm text-event-muted">{d.address as string}</p>}
        </div>
      );
    case "faq": {
      const items = (d.items as { question: string; answer: string }[]) || [];
      return items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="rounded-lg border border-event-border p-3">
              <h4 className="font-semibold text-event-heading">{item.question}</h4>
              <p className="mt-1 text-sm text-event-text">{item.answer}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-event-muted">No FAQ items</div>
      );
    }
    default:
      return null;
  }
}

export default function CustomPageView() {
  const { slug, pageSlug } = useParams<{ slug: string; pageSlug: string }>();

  const { data: event, isLoading: eventLoading, isError: eventError } = useQuery({
    queryKey: ["guest_event", slug],
    enabled: !!slug,
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
  });

  const { data: page, isLoading: pageLoading, isError: pageError } = useQuery({
    queryKey: ["guest_custom_page", slug, pageSlug],
    enabled: !!event && !!pageSlug,
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
  });

  if (eventLoading || pageLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dash-bg">
        <div className="animate-pulse text-dash-muted">Loading…</div>
      </div>
    );
  }

  if (eventError || !event || pageError || !page) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-dash-bg px-4 text-center">
        <p className="max-w-md text-lg text-dash-text">
          This invitation website could not be found or is no longer available.
        </p>
        <Link to="/" className="text-sm font-medium text-dash-primary hover:underline">
          ← Back to home
        </Link>
      </div>
    );
  }

  const theme = jsonToTheme(event.theme as Json | null);
  const blocks = (page.blocks as Block[] | null) ?? [];

  return (
    <EventThemeProvider initialTheme={theme}>
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="mb-6 text-center text-3xl font-bold text-event-heading">
          {page.title}
        </h1>
        {blocks.length > 0 ? (
          <div className="flex flex-col gap-6">
            {blocks.map((block) => <BlockRenderer key={block.id} block={block} />)}
          </div>
        ) : (
          <RichTextContent html={page.body || ""} />
        )}
      </div>
    </EventThemeProvider>
  );
}
