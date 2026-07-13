import { useState } from "react";
import { Link, Outlet, useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Image as ImageIcon,
  LogIn,
  Home,
  Palette,
  Sparkles,
  Users,
  CalendarCheck,
  Clock,
  Share2,
  BarChart3,
  Settings,
  Eye,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { supabase, type UserEvent } from "../../lib/supabase";
import { cn } from "../../lib/utils";
import { Button } from "../../components/ui/Button";
import { Toast } from "../../components/ui";

async function fetchEvent(eventId: string): Promise<UserEvent | null> {
  const { data, error } = await supabase
    .from("user_events")
    .select("*")
    .eq("id", eventId)
    .maybeSingle();
  if (error) throw error;
  return (data as UserEvent | null) ?? null;
}

async function updateEventPublished(
  eventId: string,
  isPublished: boolean
): Promise<UserEvent> {
  const { data, error } = await supabase
    .from("user_events")
    .update({ is_published: isPublished, published_at: isPublished ? new Date().toISOString() : null })
    .eq("id", eventId)
    .select()
    .single();
  if (error) throw error;
  return data as UserEvent;
}

interface TabConfig {
  to: string;
  label: string;
  icon: typeof ImageIcon;
}

const TABS: TabConfig[] = [
  { to: "cover", label: "Cover", icon: ImageIcon },
  { to: "login", label: "Login", icon: LogIn },
  { to: "home", label: "Home", icon: Home },
  { to: "theme", label: "Theme", icon: Palette },
  { to: "branding", label: "Branding", icon: Sparkles },
  { to: "guests", label: "Guests", icon: Users },
  { to: "rsvp", label: "RSVP", icon: CalendarCheck },
  { to: "timeline", label: "Timeline", icon: Clock },
  { to: "sharing", label: "Sharing", icon: Share2 },
  { to: "analytics", label: "Analytics", icon: BarChart3 },
  { to: "settings", label: "Settings", icon: Settings },
];

export default function EventLayoutPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const {
    data: event,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["event", eventId],
    queryFn: () => fetchEvent(eventId!),
    enabled: !!eventId,
  });

  const publishMutation = useMutation({
    mutationFn: (isPublished: boolean) => updateEventPublished(eventId!, isPublished),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      queryClient.invalidateQueries({ queryKey: ["user-events"] });
      setToast({
        message: updated.is_published ? "Event published." : "Event unpublished.",
        type: "success",
      });
    },
    onError: (err) => {
      const message =
        err instanceof Error ? err.message : "Failed to update event.";
      setToast({ message, type: "error" });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <Loader2 className="w-8 h-8 animate-spin text-onyx/40" />
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-cream px-6 text-center">
        <p className="font-heading text-3xl text-onyx">Event Not Found</p>
        <p className="text-sm text-onyx/50 max-w-sm">
          We could not locate this event. It may have been removed or the link is
          incorrect.
        </p>
        <Button variant="secondary" onClick={() => navigate("/dashboard")} className="mt-4">
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const livePath = event.slug ? `/${event.slug}` : `/${event.id}`;

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-onyx/10">
        <div className="px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <Link
              to="/dashboard"
              className="text-xs uppercase tracking-wider text-onyx/40 hover:text-onyx transition-colors flex-shrink-0"
            >
              ← Dashboard
            </Link>
            <div className="hidden sm:block w-px h-6 bg-onyx/10" />
            <div className="min-w-0">
              <h1 className="font-heading text-xl text-onyx leading-tight truncate">
                {event.name}
              </h1>
            </div>
            {event.is_published ? (
              <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-green-700 bg-green-50 px-2 py-0.5">
                <span className="w-1.5 h-1.5 bg-green-600" /> Live
              </span>
            ) : (
              <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-onyx/40 bg-onyx/5 px-2 py-0.5">
                Draft
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Link to={livePath} target="_blank" rel="noreferrer">
              <Button variant="ghost" size="sm">
                <ExternalLink className="w-3.5 h-3.5" /> View Live
              </Button>
            </Link>
            <Button
              variant={event.is_published ? "secondary" : "primary"}
              size="sm"
              onClick={() => publishMutation.mutate(!event.is_published)}
              disabled={publishMutation.isPending}
            >
              {publishMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : event.is_published ? (
                "Unpublish"
              ) : (
                "Publish"
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Body: sidebar + content */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        <aside className="w-56 flex-shrink-0 bg-white border-r border-onyx/10 sticky top-16 self-start h-[calc(100vh-4rem)] overflow-y-auto hidden md:block">
          <nav className="py-4">
            <p className="px-6 mb-2 text-[10px] uppercase tracking-widest text-onyx/30">
              Editor
            </p>
            <ul>
              {TABS.map((tab) => {
                const fullPath = `/event/${eventId}/${tab.to}`;
                return (
                  <li key={tab.to}>
                    <Link
                      to={fullPath}
                      className={cn(
                        "flex items-center gap-3 px-6 py-2.5 text-sm transition-colors border-l-2",
                        "text-onyx/60 hover:text-onyx hover:bg-onyx/[0.03] border-transparent"
                      )}
                    >
                      <tab.icon className="w-4 h-4 flex-shrink-0" strokeWidth={1.5} />
                      <span className="uppercase tracking-wider text-xs">
                        {tab.label}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>

        {/* Mobile tab scroller */}
        <div className="md:hidden border-b border-onyx/10 bg-white overflow-x-auto">
          <div className="flex">
            {TABS.map((tab) => {
              const fullPath = `/event/${eventId}/${tab.to}`;
              return (
                <Link
                  key={tab.to}
                  to={fullPath}
                  className="flex items-center gap-2 px-4 py-3 text-xs uppercase tracking-wider text-onyx/60 hover:text-onyx whitespace-nowrap border-b-2 border-transparent"
                >
                  <tab.icon className="w-3.5 h-3.5" strokeWidth={1.5} />
                  {tab.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Main content */}
        <main className="flex-1 min-w-0 bg-cream">
          <Outlet context={{ event }} />
        </main>
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
