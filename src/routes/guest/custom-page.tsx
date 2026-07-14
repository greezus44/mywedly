import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type CustomPage, type EventSchedule } from "../../lib/supabase";
import { useGuestOutletContext } from "./guest-layout";
import { RichTextContent } from "../../lib/sanitize";
import { LoadingSpinner } from "../../components/ui";
import { cn, formatDate, formatTime12, getCountdown } from "../../lib/utils";
import type { Block, BlockType } from "../event/block-types";

interface BlockRendererProps {
  block: Block;
  invitedSubEventIds: string[];
  eventId: string;
}

function BlockRenderer({ block, invitedSubEventIds, eventId }: BlockRendererProps): React.ReactElement | null {
  const d = block.data;
  switch (block.type as BlockType) {
    case "heading": {
      const level = (d.level as string) || "h2";
      const align = (d.align as string) || "center";
      const text = (d.text as string) || "";
      const Tag = (level === "h1" ? "h1" : level === "h3" ? "h3" : "h2") as keyof React.JSX.IntrinsicElements;
      return React.createElement(Tag, {
        className: "event-font",
        style: { textAlign: align as React.CSSProperties["textAlign"] },
        children: text || "Heading",
      });
    }
    case "paragraph":
      return <RichTextContent html={(d.html as string) || ""} />;
    case "image":
      return d.url ? (
        <img src={d.url as string} alt={(d.alt as string) || ""} className="w-full rounded-lg" />
      ) : (
        <div className="flex h-48 items-center justify-center rounded-lg border-2 border-dashed border-event-border text-event-muted">Image placeholder</div>
      );
    case "spacer":
      return <div style={{ height: Number(d.height) || 40 }} />;
    case "divider":
      return <hr className="border-event-border my-4" />;
    case "gallery": {
      const images = (d.images as { url: string; alt?: string }[]) || [];
      return images.length > 0 ? (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
          {images.map((img, i) => <img key={i} src={img.url} alt={img.alt ?? ""} className="w-full rounded-lg" />)}
        </div>
      ) : (
        <div className="flex h-32 items-center justify-center rounded-lg border-2 border-dashed border-event-border text-event-muted">Gallery placeholder</div>
      );
    }
    case "video":
      return d.url ? (
        <div className="aspect-video w-full overflow-hidden rounded-lg">
          <iframe src={d.url as string} title={(d.title as string) || "Video"} className="h-full w-full" allowFullScreen />
        </div>
      ) : (
        <div className="flex h-48 items-center justify-center rounded-lg border-2 border-dashed border-event-border text-event-muted">Video placeholder</div>
      );
    case "button":
      return (
        <div className="text-center">
          <button type="button" className={cn("event-btn-primary", d.style === "secondary" && "event-btn-secondary")} onClick={() => d.url && window.open(d.url as string, "_blank")}>
            {(d.text as string) || "Button"}
          </button>
        </div>
      );
    case "columns":
      return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div><RichTextContent html={(d.left as string) || ""} /></div>
          <div><RichTextContent html={(d.right as string) || ""} /></div>
        </div>
      );
    case "list": {
      const items = (d.items as string[]) || [];
      return d.ordered ? (
        <ol className="list-decimal pl-6 space-y-1">{items.map((item, i) => <li key={i}>{item}</li>)}</ol>
      ) : (
        <ul className="list-disc pl-6 space-y-1">{items.map((item, i) => <li key={i}>{item}</li>)}</ul>
      );
    }
    case "quote":
      return (
        <blockquote className="border-l-4 border-event-border pl-4 italic text-event-muted">
          "{(d.text as string) || "Quote"}"
          {(d.author as string) && <footer className="mt-2 text-sm not-italic">— {d.author as string}</footer>}
        </blockquote>
      );
    case "countdown": {
      const c = getCountdown(d.targetDate as string);
      return (
        <div className="text-center">
          {!c.isPast ? (
            <div className="flex items-center justify-center gap-6">
              {(["days", "hours", "minutes", "seconds"] as const).map((unit) => (
                <div key={unit} className="text-center">
                  <div className="text-4xl font-bold event-font">{c[unit]}</div>
                  <div className="mt-1 text-xs uppercase tracking-wider text-event-muted">{unit.charAt(0).toUpperCase() + unit.slice(1)}</div>
                </div>
              ))}
            </div>
          ) : <p className="text-event-muted">Countdown complete</p>}
        </div>
      );
    }
    case "map":
      return d.url ? (
        <div className="aspect-video w-full overflow-hidden rounded-lg">
          <iframe src={d.url as string} title="Map" className="h-full w-full" loading="lazy" />
        </div>
      ) : (
        <div className="flex h-48 items-center justify-center rounded-lg border-2 border-dashed border-event-border text-event-muted">Map placeholder</div>
      );
    case "rsvp-form":
      return (
        <div className="event-card mx-auto max-w-lg text-center">
          <h2 className="guest-title">{(d.heading as string) || "RSVP"}</h2>
          <p className="guest-subtitle mt-2">Will you be joining us?</p>
        </div>
      );
    case "guest-list":
      return <div className="text-center"><h2 className="guest-title">{(d.title as string) || "Guest List"}</h2></div>;
    case "schedule":
      return <ScheduleBlock invitedSubEventIds={invitedSubEventIds} eventId={eventId} title={(d.title as string) || "Schedule"} />;
    case "venue":
      return (
        <div className="event-info-card mx-auto max-w-2xl text-center">
          <p className="guest-eyebrow">Venue</p>
          <h3 className="guest-title">{(d.name as string) || "Venue"}</h3>
          {(d.address as string) && <p className="guest-subtitle mt-2">{d.address as string}</p>}
        </div>
      );
    case "faq": {
      const items = (d.items as { question: string; answer: string }[]) || [];
      return items.length > 0 ? (
        <div className="mx-auto max-w-2xl space-y-4">
          {items.map((item, i) => (
            <div key={i} className="event-card">
              <h3 className="text-sm font-semibold text-event-heading">{item.question}</h3>
              <p className="mt-2 text-sm text-event-text">{item.answer}</p>
            </div>
          ))}
        </div>
      ) : <p className="text-center text-event-muted">FAQ items will appear here</p>;
    }
    default:
      return null;
  }
}

function ScheduleBlock({ invitedSubEventIds, eventId, title }: { invitedSubEventIds: string[]; eventId: string; title: string }): React.ReactElement {
  const { data: schedules } = useQuery({
    queryKey: ["page-schedules", eventId, invitedSubEventIds],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_schedules")
        .select("*")
        .eq("event_id", eventId)
        .order("order_index", { ascending: true });
      if (error) throw error;
      return (data ?? []) as EventSchedule[];
    },
  });
  const visible = (schedules ?? []).filter(
    (s) => !s.sub_event_id || invitedSubEventIds.length === 0 || invitedSubEventIds.includes(s.sub_event_id),
  );
  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="guest-title text-center">{title}</h2>
      <div className="mt-6 space-y-4">
        {visible.map((s) => (
          <div key={s.id} className="event-card">
            <h3 className="font-semibold text-event-heading">{s.title}</h3>
            {s.schedule_date && <p className="mt-1 text-sm text-event-muted">{formatDate(s.schedule_date)} {s.start_time && `• ${formatTime12(s.start_time)}`}</p>}
            {s.venue && <p className="mt-1 text-sm text-event-muted">{s.venue}</p>}
            {s.description && <p className="mt-2 text-sm text-event-text">{s.description}</p>}
          </div>
        ))}
        {visible.length === 0 && <p className="text-center text-event-muted">No schedule items available.</p>}
      </div>
    </div>
  );
}

export default function CustomPageRenderer(): React.ReactElement {
  const { event, invitedSubEventIds } = useGuestOutletContext();
  const { pageSlug } = useParams<{ pageSlug: string }>();
  const navigate = useNavigate();

  const { data: page, isLoading, error } = useQuery({
    queryKey: ["guest-custom-page", event.id, pageSlug],
    enabled: !!pageSlug,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_pages")
        .select("*")
        .eq("event_id", event.id)
        .eq("slug", pageSlug!)
        .eq("is_published", true)
        .maybeSingle();
      if (error) throw error;
      return data as CustomPage | null;
    },
  });

  if (isLoading) {
    return <div className="flex min-h-[50vh] items-center justify-center"><LoadingSpinner className="h-8 w-8" /></div>;
  }

  if (error || !page) {
    return (
      <div className="guest-section text-center">
        <p className="guest-eyebrow">Page Not Found</p>
        <h2 className="guest-title">This page could not be found</h2>
        <button onClick={() => navigate(-1)} className="event-btn-primary mt-6">Go Back</button>
      </div>
    );
  }

  const rawBlocks = page.blocks as unknown;
  const blockList: Block[] = Array.isArray(rawBlocks) ? (rawBlocks as Block[]) : [];

  return (
    <div>
      {page.cover_image_url && (
        <div className="relative h-64 overflow-hidden">
          <img src={page.cover_image_url} alt={page.title} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-black/30" />
        </div>
      )}

      <section className="guest-section">
        <div className="mx-auto max-w-3xl">
          <div className="text-center animate-fadeIn">
            <p className="guest-eyebrow">{page.nav_label || "Page"}</p>
            <h1 className="guest-title">{page.title}</h1>
          </div>

          {page.inline_image_url && (
            <div className="mt-8 animate-slideUp">
              <img src={page.inline_image_url} alt={page.title} className="w-full rounded-lg" />
            </div>
          )}

          {page.body && blockList.length === 0 && (
            <div className="mt-8 animate-slideUp"><RichTextContent html={page.body} /></div>
          )}

          {blockList.length > 0 && (
            <div className="mt-8 space-y-8">
              {blockList.map((block) => (
                <div key={block.id} className="animate-slideUp">
                  <BlockRenderer block={block} invitedSubEventIds={invitedSubEventIds} eventId={event.id} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
