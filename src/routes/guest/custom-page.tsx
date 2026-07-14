import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type CustomPage, type UserEvent, type SubEvent } from "../../lib/supabase";
import { EventThemeProvider } from "../../lib/theme-context";
import { jsonToTheme, type ThemeConfig } from "../../lib/theme";
import { RichTextContent } from "../../lib/sanitize";
import { formatDate, formatTime12, getCountdown } from "../../lib/utils";
import { resolveGuestInvitations, getInvitedSubEventIds } from "../../lib/invitations";
import { useGuestAuth } from "../../lib/guest-auth";
import { useState, useEffect } from "react";

interface Block {
  id: string;
  type: string;
  data: Record<string, unknown>;
}

export default function GuestCustomPage() {
  const { slug, pageSlug } = useParams<{ slug: string; pageSlug: string }>();
  const { guestId } = useGuestAuth();

  const { data: event, isLoading: eventLoading } = useQuery({
    queryKey: ["published-event", slug],
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
  });

  const { data: page, isLoading: pageLoading } = useQuery({
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

  // Resolve invited sub-events for blocks that need them (schedule, guest-list, etc.)
  const { data: invitedSubEventIds } = useQuery({
    queryKey: ["guest-invited-sub-events", event?.id, guestId],
    queryFn: async () => {
      const invitations = await resolveGuestInvitations(supabase, guestId!, event!.id);
      return getInvitedSubEventIds(invitations);
    },
    enabled: !!event?.id && !!guestId,
  });

  const { data: subEvents } = useQuery({
    queryKey: ["guest-page-sub-events", event?.id, invitedSubEventIds],
    queryFn: async () => {
      if (!invitedSubEventIds || invitedSubEventIds.length === 0) return [];
      const { data, error } = await supabase
        .from("sub_events")
        .select("*")
        .in("id", invitedSubEventIds)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as SubEvent[];
    },
    enabled: !!event?.id && !!invitedSubEventIds && invitedSubEventIds.length > 0,
  });

  if (eventLoading || pageLoading) {
    return <div className="flex min-h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-dash-primary border-t-transparent" /></div>;
  }

  if (!event) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
        <h1 className="text-2xl font-bold">Invitation Not Found</h1>
        <Link to="/" className="text-dash-primary hover:underline">Return home</Link>
      </div>
    );
  }

  if (!page) {
    return (
      <EventThemeProvider initialTheme={jsonToTheme(event.theme)}>
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
          <h1 className="text-2xl font-bold">Page Not Found</h1>
          <Link to={`/e/${slug}/home`} className="text-event-primary hover:underline">Return to home</Link>
        </div>
      </EventThemeProvider>
    );
  }

  const theme = jsonToTheme(event.theme);
  const blocks = (page.blocks ?? []) as unknown as Block[];

  return (
    <EventThemeProvider initialTheme={theme}>
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="mb-6 text-3xl font-bold">{page.title}</h1>
        {page.cover_image_url && (
          <img src={page.cover_image_url} alt={page.title} className="mb-6 w-full rounded-lg" />
        )}
        {page.body && <RichTextContent html={page.body} />}
        {blocks.length > 0 && (
          <div className="mt-6 space-y-6">
            {blocks.map((block) => (
              <BlockRenderer key={block.id} block={block} event={event} subEvents={subEvents ?? []} />
            ))}
          </div>
        )}
      </div>
    </EventThemeProvider>
  );
}

function BlockRenderer({ block, event, subEvents }: { block: Block; event: UserEvent; subEvents: SubEvent[] }) {
  const data = block.data;
  switch (block.type) {
    case "heading": {
      const level = (data.level as string) || "h2";
      const text = (data.text as string) || "";
      const Tag = level as "h1" | "h2" | "h3";
      return <Tag className="font-bold">{String(text)}</Tag>;
    }
    case "paragraph":
      return <RichTextContent html={(data.text as string) || ""} />;
    case "image":
      return (
        <figure>
          {(data.url as string) && <img src={data.url as string} alt={(data.alt as string) || ""} className="w-full rounded-lg" />}
          {(data.caption as string) && <figcaption className="mt-2 text-center text-sm opacity-70">{String(data.caption)}</figcaption>}
        </figure>
      );
    case "spacer":
      return <div style={{ height: (data.height as number) || 40 }} />;
    case "divider":
      return <hr className="border-event-border" />;
    case "video":
      return (
        <div>
          {(data.url as string) && <iframe src={data.url as string} className="aspect-video w-full rounded-lg" allowFullScreen />}
          {(data.caption as string) && <p className="mt-2 text-center text-sm opacity-70">{String(data.caption)}</p>}
        </div>
      );
    case "button":
      return (
        <a href={(data.url as string) || "#"} target="_blank" rel="noopener noreferrer" className="event-btn-primary inline-block">
          {String(data.text)}
        </a>
      );
    case "columns":
      return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div><RichTextContent html={(data.left as string) || ""} /></div>
          <div><RichTextContent html={(data.right as string) || ""} /></div>
        </div>
      );
    case "list":
      return (
        <ul className="list-disc space-y-1 pl-6">
          {(data.items as string[] | undefined)?.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
      );
    case "quote":
      return (
        <blockquote className="border-l-4 border-event-border pl-4 italic opacity-80">
          <p>{String(data.text)}</p>
          {(data.author as string) && <footer className="mt-2 text-sm">— {String(data.author)}</footer>}
        </blockquote>
      );
    case "countdown": {
      const target = data.targetDate as string;
      const [cd, setCd] = useState(getCountdown(target));
      useEffect(() => {
        if (!target) return;
        const t = setInterval(() => setCd(getCountdown(target)), 1000);
        return () => clearInterval(t);
      }, [target]);
      if (!cd) return null;
      return (
        <div className="event-card text-center">
          <div className="flex justify-center gap-4 text-2xl font-bold">
            {cd.days > 0 && <span>{cd.days}d</span>}
            <span>{cd.hours}h</span>
            <span>{cd.minutes}m</span>
            <span>{cd.seconds}s</span>
          </div>
        </div>
      );
    }
    case "map":
      return (
        <div className="overflow-hidden rounded-lg border border-event-border">
          <iframe
            title="Map"
            src={`https://maps.google.com/maps?q=${encodeURIComponent((data.address as string) || event.address || "")}&output=embed`}
            className="h-64 w-full"
            loading="lazy"
          />
        </div>
      );
    case "schedule":
      return (
        <div className="space-y-3">
          {subEvents.map((sub) => (
            <div key={sub.id} className="rounded-lg border border-event-border p-4">
              <h3 className="font-semibold">{sub.name}</h3>
              {sub.date && <p className="text-sm opacity-70">{formatDate(sub.date)}</p>}
              {sub.time && <p className="text-sm opacity-70">{formatTime12(sub.time)}</p>}
              {sub.venue && <p className="text-sm opacity-70">{sub.venue}</p>}
            </div>
          ))}
        </div>
      );
    case "venue":
      return (
        <div className="event-card">
          {(data.name as string) && <p className="text-lg font-semibold">{String(data.name)}</p>}
          {(data.address as string) && <p className="text-sm opacity-70">{String(data.address)}</p>}
        </div>
      );
    case "faq":
      return (
        <div className="space-y-2">
          {(data.items as string[] | undefined)?.map((item, i) => (
            <div key={i} className="rounded-lg border border-event-border p-3 text-sm">{item}</div>
          ))}
        </div>
      );
    case "gallery": {
      const images = (data.images as string[] | undefined) ?? [];
      if (images.length === 0) return null;
      return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((url, i) => (
            <img key={i} src={url} alt="" className="aspect-square w-full rounded-lg object-cover" />
          ))}
        </div>
      );
    }
    case "rsvp-form":
    case "guest-list":
      return null;
    default:
      return null;
  }
}
