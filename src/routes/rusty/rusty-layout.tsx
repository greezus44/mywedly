import { useParams, Outlet, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent, type SubEvent, type ScheduleItem } from "../../lib/supabase";
import { RUSTY_THEME, themeToCssVars } from "../../lib/theme";
import { Loader2 } from "lucide-react";
import { type CSSProperties } from "react";

export type Lang = "en" | "id";

export interface RustyOutletContext {
  event: UserEvent;
  subEvents: SubEvent[];
  schedule: ScheduleItem[];
  lang: Lang;
  setLang: (lang: Lang) => void;
}

async function fetchEventBySlug(slug: string): Promise<UserEvent | null> {
  const { data: bySlug, error: errSlug } = await supabase
    .from("user_events")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (errSlug) throw errSlug;
  if (bySlug) return bySlug as UserEvent;

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

export default function RustyLayout() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const { data: event, isLoading, isError } = useQuery({
    queryKey: ["rusty-event", slug],
    queryFn: () => fetchEventBySlug(slug!),
    enabled: !!slug,
  });

  const { data: subEvents = [] } = useQuery({
    queryKey: ["rusty-sub-events", event?.id],
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

  const { data: schedule = [] } = useQuery({
    queryKey: ["rusty-schedule", event?.id],
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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: RUSTY_THEME.bgColor || "#F5ECD7" }}>
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: RUSTY_THEME.primaryColor || "#B8962E" }} />
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center p-8"
        style={{ backgroundColor: RUSTY_THEME.bgColor || "#F5ECD7", color: RUSTY_THEME.textColor || "#3D3528" }}
      >
        <h1 className="font-heading text-3xl mb-3">Invitation Not Found</h1>
        <p className="text-sm mb-6 opacity-70">The invitation you're looking for doesn't exist or has been removed.</p>
        <button
          onClick={() => navigate("/")}
          className="px-6 py-2.5 text-sm uppercase tracking-wider"
          style={{
            backgroundColor: RUSTY_THEME.primaryColor || "#B8962E",
            color: RUSTY_THEME.bgColor || "#F5ECD7",
            borderRadius: 2,
          }}
        >
          Go Home
        </button>
      </div>
    );
  }

  const cssVars = themeToCssVars(RUSTY_THEME) as CSSProperties;
  const lang: Lang = "en";

  return (
    <div style={cssVars} className="min-h-screen" >
      <Outlet context={{ event, subEvents, schedule, lang, setLang: () => {} } satisfies RustyOutletContext} />
    </div>
  );
}
