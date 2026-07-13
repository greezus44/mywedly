import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type CustomPage, type UserEvent } from "../../lib/supabase";
import { EventThemeProvider } from "../../lib/theme-context";
import { DEFAULT_THEME, type ThemeConfig } from "../../lib/theme";
import { RichTextContent } from "../../lib/sanitize";
import { getCountdown } from "../../lib/utils";

interface Block { id: string; type: string; data: Record<string, any> }

function BlockRenderer({ block }: { block: Block }) {
  const { type, data } = block;
  switch (type) {
    case "heading": {
      const Tag = (data.level || "h2") as keyof JSX.IntrinsicElements;
      return <Tag className="font-event text-event-heading">{data.text || ""}</Tag>;
    }
    case "paragraph":
      return <RichTextContent html={data.text || ""} />;
    case "image":
      return data.url ? <img src={data.url} alt="" className="w-full rounded-lg" /> : null;
    case "spacer":
      return <div style={{ height: data.height || 40 }} />;
    case "divider":
      return <hr className="border-event-border" />;
    case "gallery":
      return (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {(data.images || []).map((url: string, i: number) => (
            <img key={i} src={url} alt="" className="w-full h-40 object-cover rounded-lg" />
          ))}
        </div>
      );
    case "video":
      return data.url ? (
        <div className="aspect-video rounded-lg overflow-hidden">
          <iframe src={data.url} className="w-full h-full" title="Video" allowFullScreen />
        </div>
      ) : null;
    case "button":
      return data.url ? (
        <a href={data.url} target="_blank" rel="noopener noreferrer" className="event-btn-primary inline-block">
          {data.text || "Click"}
        </a>
      ) : null;
    case "columns":
      return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {(data.columns || []).map((col: any, i: number) => (
            <div key={i} className="space-y-2">
              {(col.blocks || []).map((b: Block) => <BlockRenderer key={b.id} block={b} />)}
            </div>
          ))}
        </div>
      );
    case "list":
      return (
        <ul className="list-disc pl-6 space-y-1 text-event-text">
          {(data.items || []).map((item: string, i: number) => <li key={i}>{item}</li>)}
        </ul>
      );
    case "quote":
      return (
        <blockquote className="border-l-4 border-event-border pl-4 italic text-event-muted">
          <p>{data.text || ""}</p>
          {data.author && <footer className="mt-1 text-sm not-italic">— {data.author}</footer>}
        </blockquote>
      );
    case "countdown": {
      const c = getCountdown(data.date);
      return c.isPast ? (
        <p className="text-event-muted">The date has passed.</p>
      ) : (
        <div className="flex justify-center gap-4">
          {[{ l: "Days", v: c.days }, { l: "Hours", v: c.hours }, { l: "Min", v: c.minutes }, { l: "Sec", v: c.seconds }].map((x) => (
            <div key={x.l} className="text-center">
              <div className="text-2xl font-bold text-event-primary">{x.v}</div>
              <div className="text-xs text-event-muted">{x.l}</div>
            </div>
          ))}
        </div>
      );
    }
    case "map":
      return data.url ? (
        <a href={data.url} target="_blank" rel="noopener noreferrer" className="text-event-primary hover:underline">
          {data.address || "View Map"}
        </a>
      ) : data.address ? <p className="text-event-text">{data.address}</p> : null;
    case "rsvp-form":
      return <p className="text-event-muted">RSVP form is available on the RSVP page.</p>;
    case "guest-list":
      return <p className="text-event-muted">Guest list is not publicly available.</p>;
    case "schedule":
      return <p className="text-event-muted">See the Events page for the full schedule.</p>;
    case "venue":
      return (
        <div className="event-card">
          {data.name && <p className="font-event text-lg text-event-heading">{data.name}</p>}
          {data.address && <p className="mt-1 text-event-text">{data.address}</p>}
        </div>
      );
    case "faq":
      return (
        <div className="event-card">
          <h3 className="font-event text-lg text-event-heading">{data.question || ""}</h3>
          <p className="mt-2 text-event-text">{data.answer || ""}</p>
        </div>
      );
    default:
      return null;
  }
}

export default function CustomPage() {
  const { slug, pageSlug } = useParams<{ slug: string; pageSlug: string }>();

  const { data: event } = useQuery({
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

  const { data: page, isLoading, error } = useQuery({
    queryKey: ["guest_custom_page", slug, pageSlug],
    enabled: !!slug && !!pageSlug,
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
  });

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-event-bg"><div className="animate-pulse text-event-muted">Loading…</div></div>;
  }

  if (error || !page) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-dash-bg px-4 text-center">
        <h1 className="text-2xl font-bold text-dash-text">This page could not be found or is no longer available.</h1>
        <Link to={slug ? `/e/${slug}/home` : "/"} className="mt-6 text-dash-primary hover:underline">Return home</Link>
      </div>
    );
  }

  const theme = (event?.theme ?? DEFAULT_THEME) as ThemeConfig;
  const blocks = (page.blocks as unknown as Block[]) || [];

  return (
    <EventThemeProvider initialTheme={theme}>
      <div className="min-h-screen mx-auto max-w-3xl px-4 py-12 space-y-6">
        <h1 className="font-event text-3xl text-event-heading text-center">{page.title}</h1>
        {blocks.length === 0 ? (
          <p className="text-center text-event-muted">No content yet.</p>
        ) : (
          blocks.map((block) => <BlockRenderer key={block.id} block={block} />)
        )}
      </div>
    </EventThemeProvider>
  );
}
