import { type ReactNode } from "react";
import { cn, getCountdown } from "../../lib/utils";
import { resolveTypography } from "../../lib/typography";
import type { ThemeConfig } from "../../lib/theme";

// Block shape (loosely typed — fields may be string or typography object)
type AnyBlock = Record<string, unknown> & { id: string; type: string };

interface BlockRendererProps {
  block: AnyBlock;
  theme: ThemeConfig;
}

export function BlockRenderer({ block, theme }: BlockRendererProps): ReactNode {
  const primary = theme.primary;
  const heading = theme.heading;
  const text = theme.text;
  const muted = theme.muted;
  const border = theme.border;
  const surface = theme.surface;

  switch (block.type) {
    case "heading": {
      const r = resolveTypography(block.text, "");
      const level = (block.level as number) || 2;
      const align = (block.align as string) || "left";
      const size = level === 1 ? "2.5rem" : level === 2 ? "2rem" : "1.5rem";
      const Tag = `h${Math.min(Math.max(level, 1), 6)}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
      return (
        <Tag className={cn("font-bold", align === "center" && "text-center", align === "right" && "text-right")} style={{ ...r.style, color: heading, fontFamily: theme.fontHeading, fontSize: `calc(${size} * var(--event-font-scale, 1))` }}>
          {r.text}
        </Tag>
      );
    }

    case "paragraph": {
      const r = resolveTypography(block.text, "");
      const align = (block.align as string) || "left";
      return <p className={cn("leading-relaxed", align === "center" && "text-center", align === "right" && "text-right")} style={{ ...r.style, color: text }}>{r.text}</p>;
    }

    case "image": {
      const src = (block.src as string) || "";
      if (!src) return null;
      const width = (block.width as string) || "medium";
      const maxW = width === "small" ? "24rem" : width === "full" ? "100%" : "40rem";
      return (
        <div className="mx-auto" style={{ maxWidth: maxW }}>
          <img
            src={src}
            alt={(block.alt as string) || ""}
            className={cn("w-full h-auto", !!block.rounded && "rounded-lg")}
            style={{ borderRadius: block.rounded ? theme.radius : undefined }}
          />
        </div>
      );
    }

    case "spacer": {
      const h = (block.height as string) || "md";
      const px = h === "sm" ? "1rem" : h === "lg" ? "4rem" : h === "xl" ? "6rem" : "2rem";
      return <div style={{ height: px }} />;
    }

    case "divider": {
      const style = (block.style as string) || "solid";
      return (
        <hr
          className="my-4 border-t"
          style={{
            borderColor: border,
            borderStyle: style === "dashed" ? "dashed" : style === "dotted" ? "dotted" : "solid",
          }}
        />
      );
    }

    case "gallery": {
      const images = (block.images as { src?: string; alt?: string }[]) || [];
      if (images.length === 0) return null;
      const cols = (block.columns as number) || 2;
      const gridCols = { 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-4" }[cols as 2 | 3 | 4] || "grid-cols-2";
      return (
        <div className={cn("grid gap-3", gridCols)}>
          {images.map((img, i) => (
            <img
              key={i}
              src={img.src || ""}
              alt={img.alt || ""}
              className="h-40 w-full object-cover"
              style={{ borderRadius: theme.radius }}
            />
          ))}
        </div>
      );
    }

    case "video": {
      const url = (block.url as string) || "";
      if (!url) return null;
      const isYoutube = url.includes("youtube.com") || url.includes("youtu.be");
      const isVimeo = url.includes("vimeo.com");
      if (isYoutube || isVimeo) {
        let embedUrl = url;
        if (isYoutube) {
          const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
          if (m) embedUrl = `https://www.youtube.com/embed/${m[1]}`;
        }
        return (
          <div className="aspect-video w-full" style={{ borderRadius: theme.radius, overflow: "hidden" }}>
            <iframe src={embedUrl} className="h-full w-full" allowFullScreen title="Video" />
          </div>
        );
      }
      return <video src={url} controls autoPlay={!!block.autoplay} className="w-full" style={{ borderRadius: theme.radius }} />;
    }

    case "button": {
      const labelR = resolveTypography(block.label, "");
      const url = (block.url as string) || "#";
      const variant = (block.variant as string) || "primary";
      const align = (block.align as string) || "left";
      return (
        <div className={cn(align === "center" && "text-center", align === "right" && "text-right")}>
          <a
            href={url}
            className="inline-block px-6 py-3 text-sm font-semibold transition-all"
            style={
              variant === "primary"
                ? { backgroundColor: primary, color: theme.primaryFg, borderRadius: theme.radius }
                : { border: `1px solid ${primary}`, color: primary, borderRadius: theme.radius }
            }
          >
            {labelR.text}
          </a>
        </div>
      );
    }

    case "columns": {
      const items = (block.items as unknown[]) || [];
      const count = (block.count as number) || 2;
      const gridCols = count === 3 ? "grid-cols-3" : "grid-cols-2";
      return (
        <div className={cn("grid gap-6", gridCols)}>
          {items.map((item, i) => {
            const r = resolveTypography(item, "");
            return (
              <div key={i} style={{ ...r.style, color: text, lineHeight: 1.7 }}>
                {r.text}
              </div>
            );
          })}
        </div>
      );
    }

    case "list": {
      const items = (block.items as unknown[]) || [];
      const ordered = !!block.ordered;
      const ListTag = ordered ? "ol" : "ul";
      return (
        <ListTag className={cn("space-y-2 pl-6", ordered ? "list-decimal" : "list-disc")}>
          {items.map((item, i) => {
            const r = resolveTypography(item, "");
            return (
              <li key={i} style={{ ...r.style, color: text, lineHeight: 1.7 }}>
                {r.text}
              </li>
            );
          })}
        </ListTag>
      );
    }

    case "quote": {
      const textR = resolveTypography(block.text, "");
      const authorR = resolveTypography(block.author, "");
      const align = (block.align as string) || "left";
      return (
        <blockquote
          className={cn("border-l-4 pl-4 italic", align === "center" && "text-center", align === "right" && "text-right")}
          style={{ borderColor: primary }}
        >
          <p className="text-lg" style={{ ...textR.style, color: text }}>{textR.text}</p>
          {authorR.text && (
            <footer className="mt-2 text-sm" style={{ ...authorR.style, color: muted }}>— {authorR.text}</footer>
          )}
        </blockquote>
      );
    }

    case "countdown": {
      const cd = getCountdown((block.targetDate as string) || "");
      const labelR = resolveTypography(block.label, "");
      const items = [["Days", cd.days], ["Hours", cd.hours], ["Minutes", cd.minutes], ["Seconds", cd.seconds]] as const;
      return (
        <div className="text-center">
          {labelR.text && <p className="mb-4 text-lg font-medium" style={{ ...labelR.style, color: heading }}>{labelR.text}</p>}
          <div className="flex justify-center gap-4">
            {items.map(([label, value]) => (
              <div key={label} className="rounded-lg p-4" style={{ backgroundColor: surface }}>
                <div className="text-3xl font-bold" style={{ color: primary }}>{String(value).padStart(2, "0")}</div>
                <div className="text-xs uppercase tracking-wide" style={{ color: muted }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    case "map": {
      const embedUrl = (block.embedUrl as string) || "";
      const height = (block.height as number) || 300;
      if (!embedUrl) return null;
      return (
        <iframe
          src={embedUrl}
          className="w-full"
          style={{ height, border: "none", borderRadius: theme.radius }}
          loading="lazy"
          title="Map"
        />
      );
    }

    case "rsvp-form": {
      const headingR = resolveTypography(block.heading, "RSVP");
      const bodyR = resolveTypography(block.body, "");
      return (
        <div className="text-center">
          <h3 className="mb-2 text-2xl font-bold" style={{ ...headingR.style, color: heading, fontFamily: theme.fontHeading }}>{headingR.text}</h3>
          {bodyR.text && <p className="mb-6 text-sm" style={{ ...bodyR.style, color: muted }}>{bodyR.text}</p>}
          <div className="mx-auto max-w-sm rounded-md border p-3 text-sm" style={{ borderColor: border, color: muted }}>
            Visit the RSVP page to submit your response.
          </div>
        </div>
      );
    }

    case "guest-list": {
      const headingR = resolveTypography(block.heading, "Guests");
      return (
        <div>
          <h3 className="mb-4 text-center text-2xl font-bold" style={{ ...headingR.style, color: heading, fontFamily: theme.fontHeading }}>{headingR.text}</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            <div className="rounded-md border p-3 text-center text-sm" style={{ borderColor: border, color: muted }}>Guest list is private.</div>
          </div>
        </div>
      );
    }

    case "schedule": {
      const headingR = resolveTypography(block.heading, "Schedule");
      return (
        <div>
          <h3 className="mb-4 text-center text-2xl font-bold" style={{ ...headingR.style, color: heading, fontFamily: theme.fontHeading }}>{headingR.text}</h3>
          <div className="mx-auto max-w-md space-y-2">
            <div className="flex justify-between rounded-md border p-3 text-sm" style={{ borderColor: border, color: text }}>
              <span>Schedule details will appear here.</span>
            </div>
          </div>
        </div>
      );
    }

    case "venue": {
      const nameR = resolveTypography(block.name, "");
      const addrR = resolveTypography(block.address, "");
      const mapUrl = (block.mapUrl as string) || "";
      return (
        <div className="text-center">
          {nameR.text && <h3 className="mb-1 text-2xl font-bold" style={{ ...nameR.style, color: heading, fontFamily: theme.fontHeading }}>{nameR.text}</h3>}
          {addrR.text && <p className="text-sm" style={{ ...addrR.style, color: muted }}>{addrR.text}</p>}
          {mapUrl && <iframe src={mapUrl} className="mt-4 w-full" style={{ height: 250, border: "none", borderRadius: theme.radius }} loading="lazy" title="Venue map" />}
        </div>
      );
    }

    case "faq": {
      const items = (block.items as { question?: unknown; answer?: unknown }[]) || [];
      return (
        <div className="space-y-4">
          {items.map((item, i) => {
            const qR = resolveTypography(item.question, "");
            const aR = resolveTypography(item.answer, "");
            return (
              <div key={i} className="rounded-lg border p-4" style={{ borderColor: border }}>
                <h4 className="mb-1 font-semibold" style={{ ...qR.style, color: heading }}>{qR.text}</h4>
                <p className="text-sm" style={{ ...aR.style, color: text }}>{aR.text}</p>
              </div>
            );
          })}
        </div>
      );
    }

    default:
      return null;
  }
}

