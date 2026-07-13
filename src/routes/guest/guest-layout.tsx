import { useParams, Outlet, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent, type SubEvent, type ScheduleItem } from "../../lib/supabase";
import { DEFAULT_THEME, themeToCssVars } from "../../lib/theme";
import { Loader2 } from "lucide-react";
import { type CSSProperties } from "react";

export interface GuestOutletContext {
  event: UserEvent;
  subEvents: SubEvent[];
  schedule: ScheduleItem[];
}

async function fetchEventBySlug(slug: string): Promise<UserEvent | null> {
  // 1. Try matching the slug directly on user_events
  const { data: bySlug, error: errSlug } = await supabase
    .from("user_events")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (errSlug) throw errSlug;
  if (bySlug) return bySlug as UserEvent;

  // 2. Fall back to the event_slug_redirects table
  const { data: redirect, error: errRedirect } = await supabase
    .from("event_slug_redirects")
    .select("event_id")
    .eq("slug", slug)
    .maybeSingle();
  if (errRedirect) throw errRedirect;
  if (!redirect) return null;

  const { data: byId, error: errId } = await supabase
    .from("user_events")
    .select("*")
    .eq("id", redirect.event_id)
    .maybeSingle();
  if (errId) throw errId;
  return (byId as UserEvent) || null;
}

export default function GuestLayout() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const { data: event, isLoading, isError } = useQuery({
    queryKey: ["guest-event", slug],
    queryFn: () => fetchEventBySlug(slug!),
    enabled: !!slug,
  });

  // Fetch sub-events for this event
  const { data: subEvents = [] } = useQuery({
    queryKey: ["guest-sub-events", event?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sub_events")
        .select("*")
        .eq("parent_event_id", event!.id)
        .order("order_index", { ascending: true });
      if (error) throw error;
      return (data as SubEvent[]) || [];
    },
    enabled: !!event?.id,
  });

  // Fetch schedule items for this event
  const { data: schedule = [] } = useQuery({
    queryKey: ["guest-schedule", event?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_schedule")
        .select("*")
        .eq("event_id", event!.id)
        .order("order_index", { ascending: true });
      if (error) throw error;
      return (data as ScheduleItem[]) || [];
    },
    enabled: !!event?.id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--color-text-muted)]" />
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-bg)] text-[var(--color-text)] p-8">
        <h1 className="font-heading text-3xl mb-3">Event not found</h1>
        <p className="text-sm text-[var(--color-text-muted)] mb-6">
          The invitation you're looking for doesn't exist or has been removed.
        </p>
        <button
          onClick={() => navigate("/")}
          className="px-6 py-2.5 bg-[var(--color-primary)] text-[var(--color-bg)] text-sm uppercase tracking-wider"
          style={{ borderRadius: "var(--radius)" }}
        >
          Go Home
        </button>
      </div>
    );
  }

  const theme = event.theme || DEFAULT_THEME;
  const cssVars = themeToCssVars(theme) as CSSProperties;

  return (
    <div style={cssVars} className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <Outlet context={{ event, subEvents, schedule } satisfies GuestOutletContext} />
    </div>
  );
}
