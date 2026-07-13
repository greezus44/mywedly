import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Globe, Loader2 } from "lucide-react";
import { supabase, type UserEvent } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Skeleton, ErrorState, Toast, type ToastType } from "../../components/ui";

async function fetchEvent(eventId: string): Promise<UserEvent> {
  const { data, error } = await supabase
    .from("user_events")
    .select("*")
    .eq("id", eventId)
    .single();
  if (error) throw error;
  return data as UserEvent;
}

async function publishEvent(eventId: string): Promise<UserEvent> {
  // First fetch the event to get draft values
  const { data: event, error: fetchError } = await supabase
    .from("user_events")
    .select("*")
    .eq("id", eventId)
    .single();
  if (fetchError) throw fetchError;
  const ev = event as UserEvent;

  // Copy draft_* fields to published fields
  const { data, error } = await supabase
    .from("user_events")
    .update({
      name: ev.draft_name ?? ev.name,
      event_type: ev.draft_event_type ?? ev.event_type,
      event_date: ev.draft_event_date ?? ev.event_date,
      event_time: ev.draft_event_time ?? ev.event_time,
      venue: ev.draft_venue ?? ev.venue,
      address: ev.draft_address ?? ev.address,
      cover_image: ev.draft_cover_image ?? ev.cover_image,
      cover_config: ev.draft_cover_config ?? ev.cover_config,
      login_config: ev.draft_login_config ?? ev.login_config,
      theme: ev.draft_theme ?? ev.theme,
      content: ev.draft_content ?? ev.content,
      sharing_config: ev.draft_sharing_config ?? ev.sharing_config,
      slug: ev.draft_slug ?? ev.slug,
      rsvp_deadline: ev.draft_rsvp_deadline ?? ev.rsvp_deadline,
      is_published: true,
      published_at: new Date().toISOString(),
    })
    .eq("id", eventId)
    .select()
    .single();
  if (error) throw error;
  return data as UserEvent;
}

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
  { label: "Stats", path: "stats" },
  { label: "Settings", path: "settings" },
];

export default function EventLayoutPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const { data: event, isLoading, error, refetch } = useQuery({
    queryKey: ["event", eventId],
    queryFn: () => fetchEvent(eventId!),
    enabled: !!eventId,
  });

  const publishMutation = useMutation({
    mutationFn: () => publishEvent(eventId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      setToast({ message: "Event published!", type: "success" });
    },
    onError: (err: Error) => {
      setToast({ message: err.message, type: "error" });
    },
  });

  // Determine active tab from URL
  const pathSegments = location.pathname.split("/");
  const activeTab = pathSegments[pathSegments.length - 1] || "cover";

  if (isLoading) {
    return (
      <div className="flex h-screen flex-col bg-gray-50">
        <div className="border-b border-gray-200 bg-white px-4 py-4">
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="flex-1 p-6">
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <ErrorState
          message={error instanceof Error ? error.message : "Event not found"}
          onRetry={() => {
            refetch();
            navigate("/dashboard");
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      {/* Sticky header */}
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="text-gray-400 transition-colors hover:text-gray-700"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="font-heading text-lg font-bold text-gray-900">
                {event.draft_name ?? event.name}
              </h1>
              {event.is_published && (
                <span className="text-xs text-green-600">Published</span>
              )}
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => publishMutation.mutate()}
            disabled={publishMutation.isPending}
          >
            {publishMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Publishing...
              </>
            ) : (
              <>
                <Globe className="h-4 w-4" /> Publish
              </>
            )}
          </Button>
        </div>

        {/* Wrapping navigation */}
        <nav className="flex flex-wrap gap-1 px-4 pb-3">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.path;
            return (
              <Link
                key={tab.path}
                to={tab.path}
                className={`rounded-full px-3 py-1.5 text-xs font-medium uppercase tracking-wider transition-colors ${
                  isActive
                    ? "bg-gray-900 text-white"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <Outlet context={{ event }} />
      </div>

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
