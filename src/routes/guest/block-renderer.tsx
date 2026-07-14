import type { UserEvent } from "../../lib/supabase";
import type { BlockContent } from "../event/block-types";
import { RichTextContent } from "../../lib/sanitize";
import { formatDateShort, formatTime12, getCountdown } from "../../lib/utils";

interface BlockRendererProps {
  block: BlockContent;
  event: UserEvent;
}

export function BlockRenderer({ block, event }: BlockRendererProps) {
  const d = block.data as Record<string, unknown>;

  switch (block.type) {
    case "heading": {
      const level = (d.level as number) ?? 2;
      const text = (d.text as string) ?? "";
      const Tag = `h${Math.min(6, Math.max(1, level))}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
      return (
        <Tag
          className="guest-title"
          style={{ fontFamily: "var(--event-font-heading)", color: "var(--event-heading)" }}
        >
          {text}
        </Tag>
      );
    }

    case "paragraph":
      return (
        <RichTextContent
          html={(d.html as string) ?? ""}
          className="rich-content"
        />
      );

    case "image": {
      const url = d.url as string | null;
      if (!url) return null;
      return (
        <figure className="w-full">
          <img
            src={url}
            alt={(d.alt as string) ?? ""}
            className="w-full rounded-lg object-cover"
          />
          {typeof d.caption === "string" && d.caption && (
            <figcaption className="mt-2 text-center text-sm" style={{ color: "var(--event-muted)" }}>
              {d.caption as string}
            </figcaption>
          )}
        </figure>
      );
    }

    case "spacer":
      return <div style={{ height: `${(d.height as number) ?? 40}px` }} />;

    case "divider":
      return (
        <hr
          style={{
            borderStyle: (d.style as string) ?? "solid",
            borderColor: "var(--event-border)",
          }}
        />
      );

    case "gallery": {
      const images = (d.images as string[]) ?? [];
      if (images.length === 0) return null;
      return (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {images.map((src, i) => (
            <img key={i} src={src} alt={`Gallery image ${i + 1}`} className="w-full rounded-lg object-cover aspect-square" />
          ))}
        </div>
      );
    }

    case "video": {
      const url = (d.url as string) ?? "";
      if (!url) return null;
      let embedUrl = url;
      if (url.includes("youtube.com/watch")) {
        const id = new URL(url).searchParams.get("v");
        if (id) embedUrl = `https://www.youtube.com/embed/${id}`;
      } else if (url.includes("youtu.be/")) {
        const id = url.split("youtu.be/")[1]?.split("?")[0];
        if (id) embedUrl = `https://www.youtube.com/embed/${id}`;
      } else if (url.includes("vimeo.com/")) {
        const id = url.split("vimeo.com/")[1]?.split("?")[0];
        if (id) embedUrl = `https://player.vimeo.com/video/${id}`;
      }
      return (
        <div className="relative aspect-video w-full overflow-hidden rounded-lg">
          <iframe
            src={embedUrl}
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    }

    case "button": {
      const label = (d.label as string) ?? "Click here";
      const href = (d.url as string) ?? "#";
      return (
        <div className="flex justify-center">
          <a href={href} target="_blank" rel="noopener noreferrer" className="event-btn-primary">
            {label}
          </a>
        </div>
      );
    }

    case "columns": {
      const columns = (d.columns as { html: string }[]) ?? [];
      return (
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns.length}, 1fr)` }}>
          {columns.map((col, i) => (
            <RichTextContent key={i} html={col.html ?? ""} className="rich-content" />
          ))}
        </div>
      );
    }

    case "list": {
      const items = (d.items as string[]) ?? [];
      const ordered = d.ordered as boolean;
      const Tag = ordered ? "ol" : "ul";
      return (
        <Tag className={`pl-5 space-y-1 ${ordered ? "list-decimal" : "list-disc"}`} style={{ color: "var(--event-text)" }}>
          {items.map((item, i) => (
            <li key={i} className="text-sm">{item}</li>
          ))}
        </Tag>
      );
    }

    case "quote":
      return (
        <blockquote
          className="border-l-4 pl-4 italic"
          style={{ borderColor: "var(--event-primary)", color: "var(--event-muted)" }}
        >
          <p className="text-base">"{d.text as string}"</p>
          {typeof d.attribution === "string" && d.attribution && (
            <footer className="mt-1 text-sm not-italic" style={{ color: "var(--event-text)" }}>
              — {d.attribution as string}
            </footer>
          )}
        </blockquote>
      );

    case "countdown": {
      const targetDate = (d.targetDate as string) ?? event.event_date;
      const countdown = getCountdown(targetDate);
      return (
        <div className="text-center py-6">
          <p className="text-3xl font-bold" style={{ color: "var(--event-heading)", fontFamily: "var(--event-font-heading)" }}>
            {countdown}
          </p>
          {targetDate && (
            <p className="text-sm mt-1" style={{ color: "var(--event-muted)" }}>
              {formatDateShort(targetDate)}
            </p>
          )}
        </div>
      );
    }

    case "map": {
      const address = (d.address as string) ?? "";
      if (!address) return null;
      const isEmbed = address.startsWith("http");
      return (
        <div className="w-full overflow-hidden rounded-lg" style={{ height: 300 }}>
          {isEmbed ? (
            <iframe src={address} className="w-full h-full" allowFullScreen />
          ) : (
            <iframe
              src={`https://maps.google.com/maps?q=${encodeURIComponent(address)}&output=embed`}
              className="w-full h-full"
              allowFullScreen
            />
          )}
        </div>
      );
    }

    case "rsvp-form":
      return (
        <div className="event-card text-center py-6">
          <p className="guest-title text-xl mb-2">RSVP</p>
          <p className="text-sm mb-4" style={{ color: "var(--event-muted)" }}>Use the RSVP section to respond.</p>
        </div>
      );

    case "guest-list":
      return (
        <div className="event-card text-center py-6">
          <p className="text-sm" style={{ color: "var(--event-muted)" }}>Guest list is managed by the host.</p>
        </div>
      );

    case "schedule":
      return (
        <div className="event-card">
          <p className="guest-title text-lg mb-2">Schedule</p>
          <p className="text-sm" style={{ color: "var(--event-muted)" }}>Event schedule will be displayed here.</p>
        </div>
      );

    case "venue": {
      const name = (d.name as string) ?? "";
      const address = (d.address as string) ?? "";
      return (
        <div className="event-card">
          {name && <p className="font-semibold mb-1" style={{ color: "var(--event-heading)", fontFamily: "var(--event-font-heading)" }}>{name}</p>}
          {address && <p className="text-sm" style={{ color: "var(--event-muted)" }}>{address}</p>}
          {address && (
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-sm underline"
              style={{ color: "var(--event-primary)" }}
            >
              View on map
            </a>
          )}
        </div>
      );
    }

    case "faq":
      return (
        <details className="rounded-lg border px-4 py-3" style={{ borderColor: "var(--event-border)" }}>
          <summary className="cursor-pointer font-medium text-sm" style={{ color: "var(--event-text)" }}>
            {(d.question as string) ?? "Question"}
          </summary>
          <p className="mt-2 text-sm" style={{ color: "var(--event-muted)" }}>
            {(d.answer as string) ?? ""}
          </p>
        </details>
      );

    default:
      return null;
  }
}
