import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Globe, Eye } from "lucide-react";
import { supabase, type UserEvent } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { useToast } from "../../components/ui";

const TABS = [
  { to: "cover", label: "Cover" },
  { to: "login", label: "Login" },
  { to: "home", label: "Home" },
  { to: "theme", label: "Theme" },
  { to: "events", label: "Events" },
  { to: "guests", label: "Guests" },
  { to: "groups", label: "Groups" },
  { to: "rsvp", label: "RSVP" },
  { to: "timeline", label: "Timeline" },
  { to: "sharing", label: "Sharing" },
  { to: "stats", label: "Stats" },
  { to: "settings", label: "Settings" },
] as const;

export default function EventLayoutPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: event, isLoading, error } = useQuery({
    queryKey: ["event", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_events")
        .select("*")
        .eq("id", eventId!)
        .single();
      if (error) throw error;
      return data as UserEvent;
    },
    enabled: !!eventId,
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      if (!event) throw new Error("Event not loaded");
      const patch = {
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
        content: event.draft_content ?? event.content,
        sharing_config: event.draft_sharing_config ?? event.sharing_config,
        slug: event.draft_slug ?? event.slug,
        rsvp_deadline: event.draft_rsvp_deadline ?? event.rsvp_deadline,
        is_published: true,
        published_at: new Date().toISOString(),
      };
      const { error } = await supabase.from("user_events").update(patch).eq("id", event.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast("Event published successfully", "success");
    },
    onError: (err: Error) => toast(err.message, "error"),
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 gap-4">
        <p className="text-sm text-red-600">Failed to load event: {(error as Error)?.message || "not found"}</p>
        <Link to="/dashboard">
          <Button variant="secondary">Back to dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Sticky header */}
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex h-14 items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                aria-label="Back to dashboard"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <h1 className="truncate text-sm font-semibold text-gray-900">
                {event.draft_name || event.name || "Untitled event"}
              </h1>
              {event.is_published ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                  <Globe className="h-3 w-3" />
                  Published
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                  Draft
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {event.slug && (
                <a href={`/e/${event.slug}`} target="_blank" rel="noreferrer">
                  <Button size="sm" variant="ghost">
                    <Eye className="h-4 w-4" />
                    View
                  </Button>
                </a>
              )}
              <Button
                size="sm"
                onClick={() => publishMutation.mutate()}
                loading={publishMutation.isPending}
              >
                Publish
              </Button>
            </div>
          </div>

          {/* Wrapping navigation */}
          <nav className="flex flex-wrap gap-1 pb-2">
            {TABS.map((tab) => {
              const path = `/event/${eventId}/${tab.to}`;
              const active = location.pathname === path;
              return (
                <NavLink
                  key={tab.to}
                  to={tab.to}
                  className={() =>
                    `rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                      active
                        ? "bg-gray-900 text-white"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`
                  }
                >
                  {tab.label}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <Outlet context={{ event }} />
      </main>
    </div>
  );
}
