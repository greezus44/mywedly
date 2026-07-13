import { useParams, Outlet, useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent, type SubEvent, type ScheduleItem } from "../../lib/supabase";
import { RUSTY_THEME, themeToCssVars } from "../../lib/theme";
import { Loader2 } from "lucide-react";

export type Lang = "en" | "id";

export interface RustyContext {
  event: UserEvent;
  subEvents: SubEvent[];
  schedule: ScheduleItem[];
  lang: Lang;
}

export function useRustyContext(): RustyContext {
  return useOutletContext<RustyContext>();
}

export default function RustyLayout() {
  const { slug } = useParams<{ slug: string }>();

  const { data: event, isLoading: eventLoading, isError: eventError } = useQuery({
    queryKey: ["rusty-event", slug],
    queryFn: async () => {
      if (!slug) return null;
      const { data: direct, error: directError } = await supabase
        .from("user_events")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (directError) throw directError;
      if (direct) return direct as UserEvent;
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
    queryKey: ["rusty-sub-events", event?.id],
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
    queryKey: ["rusty-schedule", event?.id],
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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: RUSTY_THEME.bgColor! }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: RUSTY_THEME.accentColor! }} />
      </div>
    );
  }

  if (eventError || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: RUSTY_THEME.bgColor! }}>
        <div className="text-center">
          <h1 className="font-serif text-3xl mb-3" style={{ color: RUSTY_THEME.textColor! }}>Event not found</h1>
          <p className="text-sm" style={{ color: RUSTY_THEME.textMutedColor! }}>The event you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const cssVars = themeToCssVars(RUSTY_THEME) as React.CSSProperties;

  return (
    <div style={{ ...cssVars, backgroundColor: RUSTY_THEME.bgColor!, color: RUSTY_THEME.textColor! }} className="min-h-screen font-[var(--font-body)]">
      <Outlet context={{ event, subEvents, schedule, lang: "en" as Lang } satisfies RustyContext} />
    </div>
  );
}
