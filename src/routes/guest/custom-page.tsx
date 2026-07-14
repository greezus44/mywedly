import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent, type CustomPage, type Json } from "../../lib/supabase";
import { RichTextContent } from "../../lib/sanitize";
import { LoadingSpinner } from "../../components/ui";
import { formatDate, formatTime12, getCountdown } from "../../lib/utils";

interface Block {
  id: string;
  type: string;
  data: Record<string, unknown>;
}

function jsonToBlocks(json: Json | null | undefined): Block[] {
  if (!json || !Array.isArray(json)) return [];
  return json as unknown as Block[];
}

function BlockRenderer({ block }: { block: Block }) {
  switch (block.type) {
    case "heading": {
      const level = (block.data.level as string) ?? "h2";
      const text = (block.data.text as string) ?? "";
      const Tag = level as "h1" | "h2" | "h3";
      return <Tag className="font-bold text-event-heading">{text}</Tag>;
    }
    case "paragraph":
      return (
        <RichTextContent
          html={(block.data.text as string) ?? ""}
          className="text-event-text"
        />
      );
    case "image": {
      const url = block.data.url as string;
      const alt = (block.data.alt as string) ?? "";
      return url ? (
        <img src={url} alt={alt} className="max-w-full rounded-lg" />
      ) : null;
    }
    case "spacer":
      return <div style={{ height: (block.data.height as number) ?? 40 }} />;
    case "divider":
      return <hr className="border-event-border" />;
    case "gallery": {
      const images = (block.data.images as string[]) ?? [];
      return images.length > 0 ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {images.map((img, i) => (
            <img
              key={i}
              src={img}
              alt={`Gallery ${i + 1}`}
              className="h-24 w-full rounded-md object-cover"
            />
          ))}
        </div>
      ) : null;
    }
    case "video": {
      const url = block.data.url as string;
      return url ? (
        <div className="aspect-video overflow-hidden rounded-lg">
          <iframe src={url} className="h-full w-full" title="Video" allowFullScreen />
        </div>
      ) : null;
    }
    case "button": {
      const text = (block.data.text as string) ?? "Button";
      const url = (block.data.url as string) ?? "#";
      return (
        <a href={url} className="event-btn-primary inline-block">
          {text}
        </a>
      );
    }
    case "columns": {
      const columns = (block.data.columns as { text: string }[]) ?? [];
      return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {columns.map((col, i) => (
            <div key={i} className="text-sm text-event-text">{col.text}</div>
          ))}
        </div>
      );
    }
    case "list": {
      const items = (block.data.items as string[]) ?? [];
      return (
        <ul className="list-disc pl-5 text-sm text-event-text">
          {items.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
      );
    }
    case "quote": {
      const text = (block.data.text as string) ?? "";
      const author = (block.data.author as string) ?? "";
      return (
        <blockquote className="border-l-4 border-event-primary pl-4 italic text-event-text">
          <p>{text}</p>
          {author && <p className="mt-1 text-sm text-event-muted">— {author}</p>}
        </blockquote>
      );
    }
    case "countdown": {
      const target = block.data.target as string;
      const cd = target ? getCountdown(target) : null;
      if (!cd || cd.done) return null;
      return (
        <div className="flex items-center justify-center gap-4 rounded-lg bg-event-surface-alt p-6">
          {(["days", "hours", "minutes", "seconds"] as const).map((unit) => (
            <div key={unit} className="flex flex-col items-center">
              <span className="text-3xl font-bold text-event-primary">
                {String(cd[unit]).padStart(2, "0")}
              </span>
              <span className="text-xs uppercase text-event-muted">{unit}</span>
            </div>
          ))}
        </div>
      );
    }
    case "map": {
      const address = (block.data.address as string) ?? "";
      return address ? (
        <div className="overflow-hidden rounded-lg">
          <iframe
            src={`https://maps.google.com/maps?q=${encodeURIComponent(address)}&z=14&output=embed`}
            className="h-64 w-full"
            title="Map"
          />
        </div>
      ) : null;
    }
    case "rsvp-form":
      return (
        <div className="event-card text-center text-event-muted">
          Please visit the RSVP page to submit your response.
        </div>
      );
    case "guest-list":
      return (
        <div className="event-card text-center text-event-muted">
          Guest list is not publicly available.
        </div>
      );
    case "schedule":
      return (
        <div className="event-card text-center text-event-muted">
          Schedule details will be announced soon.
        </div>
      );
    case "venue": {
      const name = (block.data.name as string) ?? "";
      const address = (block.data.address as string) ?? "";
      return (
        <div className="event-card">
          {name && <h4 className="font-semibold text-event-heading">{name}</h4>}
          {address && <p className="text-sm text-event-muted">{address}</p>}
        </div>
      );
    }
    case "faq": {
      const items = (block.data.items as { question: string; answer: string }[]) ?? [];
      return (
        <div className="flex flex-col gap-3">
          {items.map((item, i) => (
            <div key={i} className="event-card">
              <p className="font-medium text-event-heading">{item.question}</p>
              <p className="mt-1 text-sm text-event-muted">{item.answer}</p>
            </div>
          ))}
        </div>
      );
    }
    default:
      return null;
  }
}

export default function CustomPage() {
  const { slug, pageSlug } = useParams<{ slug: string; pageSlug: string }>();

  const { data: event, isLoading: eventLoading } = useQuery({
    queryKey: ["public-event", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_events")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();
      if (error) throw error;
      return data as UserEvent | null;
    },
    enabled: !!slug,
  });

  const { data: page, isLoading: pageLoading, isError } = useQuery({
    queryKey: ["guest-custom-page", event?.id, pageSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_pages")
        .select("*")
        .eq("event_id", event!.id)
        .eq("slug", pageSlug)
        .eq("is_published", true)
        .maybeSingle();
      if (error) throw error;
      return data as CustomPage | null;
    },
    enabled: !!event?.id && !!pageSlug,
  });

  if (eventLoading || pageLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (isError || !page) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <h1 className="text-2xl font-semibold text-event-heading">
          This page could not be found.
        </h1>
        <Link to={`/e/${slug}/home`} className="text-event-primary underline">
          Back to home
        </Link>
      </div>
    );
  }

  const blocks = jsonToBlocks(page.blocks);

  return (
    <div className="flex flex-col gap-6">
      {page.cover_image_url && (
        <img
          src={page.cover_image_url}
          alt={page.title}
          className="max-h-64 w-full rounded-lg object-cover"
        />
      )}
      <header className="text-center">
        <h1
          className="text-3xl font-bold text-event-heading"
          style={{ fontFamily: "var(--event-font-heading)" }}
        >
          {page.title}
        </h1>
      </header>
      {blocks.length > 0 ? (
        <div className="flex flex-col gap-4">
          {blocks.map((block) => (
            <BlockRenderer key={block.id} block={block} />
          ))}
        </div>
      ) : page.body ? (
        <RichTextContent html={page.body} className="text-event-text" />
      ) : (
        <p className="text-center text-event-muted">No content yet.</p>
      )}
    </div>
  );
}
