import React, { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Outlet, useLocation, useNavigate, useParams, Link } from "react-router-dom";
import { Loader2, Check } from "lucide-react";
import { supabase, type UserEvent } from "../../lib/supabase";
import {
  Button,
  Badge,
  Toast,
  LoadingSpinner,
  ErrorState,
} from "../../components/ui";

const TABS = [
  { label: "Cover", path: "cover" },
  { label: "Login", path: "login" },
  { label: "Home", path: "home" },
  { label: "Theme", path: "theme" },
  { label: "Events", path: "events" },
  { label: "Guests", path: "guests" },
  { label: "Groups", path: "groups" },
  { label: "RSVP", path: "rsvp" },
  { label: "Timeline", path: "timeline" },
  { label: "Sharing", path: "sharing" },
  { label: "Stats", path: "analytics" },
  { label: "Settings", path: "settings" },
] as const;

export default function EventLayoutPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Auth check
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) navigate("/auth");
    });
  }, [navigate]);

  const { data: event, isLoading, error, refetch } = useQuery<UserEvent>({
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
      if (!event) throw new Error("No event data");

      const updateData: Record<string, unknown> = {
        name: event.draft_name,
        event_type: event.draft_event_type,
        event_date: event.draft_event_date,
        event_time: event.draft_event_time,
        venue: event.draft_venue,
        address: event.draft_address,
        cover_image: event.draft_cover_image,
        cover_config: event.draft_cover_config,
        login_config: event.draft_login_config,
        theme: event.draft_theme,
        content: event.draft_content,
        sharing_config: event.draft_sharing_config,
        slug: event.draft_slug,
        rsvp_deadline: event.draft_rsvp_deadline,
        is_published: true,
        published_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("user_events")
        .update(updateData)
        .eq("id", event.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      setToast({ message: "Event published successfully!", type: "success" });
    },
    onError: (err: Error) => {
      setToast({ message: err.message, type: "error" });
    },
  });

  // Determine active tab
  const currentPath = location.pathname.split("/").pop() || "cover";
  const activeTab = TABS.find((t) => t.path === currentPath)?.path || "cover";

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <ErrorState
          title="Event not found"
          message={error instanceof Error ? error.message : "This event may have been deleted."}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 py-3">
          {/* Top row: name + publish */}
          <div className="mb-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <Link to="/dashboard" className="text-sm text-gray-500 hover:text-gray-900 shrink-0">
                ← Dashboard
              </Link>
              <span className="text-gray-300 shrink-0">/</span>
              <h1 className="truncate text-base font-semibold text-gray-900">
                {event.draft_name || event.name || "Untitled Event"}
              </h1>
              <Badge variant={event.is_published ? "success" : "default"} className="shrink-0">
                {event.is_published ? "Published" : "Draft"}
              </Badge>
            </div>

            <Button
              size="sm"
              onClick={() => publishMutation.mutate()}
              disabled={publishMutation.isPending}
            >
              {publishMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Publishing…
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Publish
                </>
              )}
            </Button>
          </div>

          {/* Wrapping navigation tabs */}
          <nav className="flex flex-wrap gap-1">
            {TABS.map((tab) => (
              <Link
                key={tab.path}
                to={tab.path}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeTab === tab.path
                    ? "bg-gray-900 text-white"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1">
        <Outlet context={{ event }} />
      </main>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
