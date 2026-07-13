import { useParams, Outlet, useOutletContext, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent, type SubEvent, type ScheduleItem } from "../../lib/supabase";
import { DEFAULT_THEME, themeToCssVars } from "../../lib/theme";
import { useGuestAuth } from "../../lib/guest-auth";
import { Loader2 } from "lucide-react";

export interface GuestContext {
  event: UserEvent;
  subEvents: SubEvent[];
  schedule: ScheduleItem[];
}

export function useGuestContext(): GuestContext {
  return useOutletContext<GuestContext>();
}

export default function GuestLayout() {
  const { slug } = useParams<{ slug: string }>();
  const { eventId, isAuthenticated } = useGuestAuth();

  const { data: event, isLoading: eventLoading, isError: eventError } = useQuery({
    queryKey: ["guest-event", slug],
    queryFn: async () => {
      if (!slug) return null;
      // Try direct slug lookup on user_events
      const { data: direct, error: directError } = await supabase
        .from("user_events")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (directError) throw directError;
      if (direct) return direct as UserEvent;
      // Try redirect table
      const { data: redirect, error: redirectError } = await supabase
        .from("event_slug_redirects")
        .select("event_id")
        .eq("slug", slug)
        .maybeSingle();
      if (redirectError) throw redirectError;
      if (!redirect) return null;
      const { data: redirected, error: redirectedError } = await supabase
        .from("user_events")
        .select("*")
        .eq("id", redirect.event_id)
        .maybeSingle();
      if (redirectedError) throw redirectedError;
      return (redirected as UserEvent) || null;
    },
    enabled: !!slug,
  });

  const { data: subEvents = [] } = useQuery({
    queryKey: ["guest-sub-events", event?.id],
    queryFn: async () => {
      if (!event) return [];
      const { data, error } = await supabase
        .from("sub_events")
        .select("*")
        .eq("parent_event_id", event.id)
        .order("order_index", { ascending: true });
      if (error) throw error;
      return (data as SubEvent[]) || [];
    },
    enabled: !!event,
  });

  const { data: schedule = [] } = useQuery({
    queryKey: ["guest-schedule", event?.id],
    queryFn: async () => {
      if (!event) return [];
      const { data, error } = await supabase
        .from("schedule_items")
        .select("*")
        .eq("event_id", event.id)
        .order("order_index", { ascending: true });
      if (error) throw error;
      return (data as ScheduleItem[]) || [];
    },
    enabled: !!event,
  });

  if (eventLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-text-muted)]" />
      </div>
    );
  }

  if (eventError || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <h1 className="font-heading text-3xl text-gray-900 mb-3">Event not found</h1>
          <p className="text-sm text-gray-500">The event you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  const theme = event.theme || DEFAULT_THEME;
  const cssVars = themeToCssVars(theme) as React.CSSProperties;

  return (
    <div style={cssVars} className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] font-[var(--font-body)]">
      <Outlet context={{ event, subEvents, schedule } satisfies GuestContext} />
    </div>
  );
}
