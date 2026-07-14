import React, { useEffect } from "react";
import { useParams, Outlet, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { SiteHeader } from "../../components/site/SiteHeader";
import { EventThemeProvider, useEventTheme } from "../../lib/theme-context";
import { jsonToTheme, themeToEventCssVars } from "../../lib/theme";

export function EventLayout() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: event, isLoading } = useQuery({
    queryKey: ["event", eventId],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_events").select("*").eq("id", eventId!).single();
      if (error) throw error;
      return data as UserEvent;
    },
    enabled: !!eventId,
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      if (!event) throw new Error("No event");
      const updates: Record<string, unknown> = {
        is_published: true,
        published_at: new Date().toISOString(),
        name: event.draft_name ?? event.name,
        event_type: event.draft_event_type ?? event.event_type,
        event_date: event.draft_event_date ?? event.event_date,
        event_time: event.draft_event_time ?? event.event_time,
        venue: event.draft_venue ?? event.venue,
        address: event.draft_address ?? event.address,
        cover_image: event.draft_cover_image ?? event.cover_image,
        cover_config: event.draft_cover_config ?? event.cover_config,
        login_config: event.draft_login_config ?? event.login_config,
        theme: event.draft_theme ?? event.theme,
        logo_config: event.draft_logo_config ?? event.logo_config,
        content: event.draft_content ?? event.content,
        sharing_config: event.draft_sharing_config ?? event.sharing_config,
        slug: event.draft_slug ?? event.slug,
        rsvp_deadline: event.draft_rsvp_deadline ?? event.rsvp_deadline,
      };
      const { error } = await supabase.from("user_events").update(updates).eq("id", event.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["event", eventId] });
    },
  });

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading…</div>;
  if (!event) return <div className="min-h-screen flex items-center justify-center">Event not found</div>;

  return (
    <EventThemeProvider themeJson={event.draft_theme ?? event.theme}>
      <EventLayoutInner eventId={event.id} event={event} onPublish={() => publishMutation.mutate()} publishing={publishMutation.isPending} />
    </EventThemeProvider>
  );
}

function EventLayoutInner({ eventId, event, onPublish, publishing }: { eventId: string; event: UserEvent; onPublish: () => void; publishing: boolean }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader eventId={eventId} />
      <div className="flex">
        <main className="flex-1 p-6 max-w-6xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
      <PublishBar event={event} onPublish={onPublish} publishing={publishing} />
    </div>
  );
}

function PublishBar({ event, onPublish, publishing }: { event: UserEvent; onPublish: () => void; publishing: boolean }) {
  const [show, setShow] = React.useState(false);
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 flex items-center justify-between z-20">
      <div className="text-sm text-gray-600">
        {event.is_published ? "Published" : "Not published"} — changes are saved as draft
      </div>
      <button
        onClick={() => { setShow(true); onPublish(); }}
        disabled={publishing}
        className="px-4 py-2 bg-[var(--event-primary,#8B7355)] text-white rounded-lg text-sm disabled:opacity-50"
      >
        {publishing ? "Publishing…" : "Publish"}
      </button>
    </div>
  );
}
