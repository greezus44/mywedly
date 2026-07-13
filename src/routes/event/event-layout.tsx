import { useState } from "react";
import { NavLink, Outlet, useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  Image,
  LogIn,
  Home,
  Palette,
  Tag,
  Users,
  Mail,
  Clock,
  Share2,
  BarChart3,
  Settings,
  ArrowLeft,
  Rocket,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Card, Skeleton, ErrorState, Badge } from "../../components/ui";
import { supabase, type UserEvent } from "../../lib/supabase";
import { cn } from "../../lib/utils";

const TABS = [
  { to: "cover", label: "Cover", icon: Image },
  { to: "login", label: "Login", icon: LogIn },
  { to: "home", label: "Home", icon: Home },
  { to: "theme", label: "Theme", icon: Palette },
  { to: "branding", label: "Branding", icon: Tag },
  { to: "guests", label: "Guests", icon: Users },
  { to: "rsvp", label: "RSVP", icon: Mail },
  { to: "timeline", label: "Timeline", icon: Clock },
  { to: "sharing", label: "Sharing", icon: Share2 },
  { to: "analytics", label: "Analytics", icon: BarChart3 },
  { to: "settings", label: "Settings", icon: Settings },
] as const;

export default function EventLayout() {
  const { eventId } = useParams<{ eventId: string }>();
  const queryClient = useQueryClient();
  const [publishToast, setPublishToast] = useState<"success" | "error" | null>(null);

  const { data: event, isLoading, error, refetch } = useQuery({
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
    mutationFn: async (e: UserEvent) => {
      const { error } = await supabase
        .from("user_events")
        .update({
          name: e.draft_name || e.name,
          event_type: e.draft_event_type || e.event_type,
          event_date: e.draft_event_date,
          event_time: e.draft_event_time,
          venue: e.draft_venue,
          address: e.draft_address,
          cover_image: e.draft_cover_image,
          cover_config: e.draft_cover_config,
          login_config: e.draft_login_config,
          theme: e.draft_theme,
          logo_config: e.draft_logo_config,
          content: e.draft_content,
          sharing_config: e.draft_sharing_config,
          slug: e.draft_slug || e.slug,
          rsvp_deadline: e.draft_rsvp_deadline,
          is_published: true,
          published_at: new Date().toISOString(),
        })
        .eq("id", e.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      setPublishToast("success");
      setTimeout(() => setPublishToast(null), 3000);
    },
    onError: (err) => {
      setPublishToast("error");
      setTimeout(() => setPublishToast(null), 3000);
      console.error(err);
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center gap-3 mb-6">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <Skeleton className="h-6 w-48" />
          </div>
          <div className="flex gap-2 mb-8 overflow-hidden">
            {Array.from({ length: 11 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-24 rounded-lg" />
            ))}
          </div>
          <Card className="p-8">
            <Skeleton className="h-6 w-1/3 mb-4" />
            <Skeleton className="h-4 w-2/3 mb-2" />
            <Skeleton className="h-4 w-1/2 mb-6" />
            <Skeleton className="h-32 w-full" />
          </Card>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="p-0 max-w-md w-full">
          <ErrorState
            message={error instanceof Error ? error.message : "Event not found"}
            onRetry={() => refetch()}
          />
          <div className="px-5 pb-5 text-center">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">Back to dashboard</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3 min-w-0">
              <Link to="/dashboard" className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors flex-shrink-0">
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </Link>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-semibold text-slate-900 truncate">
                    {event.draft_name || event.name}
                  </h1>
                  {event.is_published ? (
                    <Badge variant="success">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Published
                    </Badge>
                  ) : (
                    <Badge variant="default">Draft</Badge>
                  )}
                  {event.is_archived && <Badge variant="warning">Archived</Badge>}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {event.draft_event_type || event.event_type}
                  {event.draft_event_date && ` · ${new Date(event.draft_event_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`}
                </p>
              </div>
            </div>
            <Button
              onClick={() => publishMutation.mutate(event)}
              loading={publishMutation.isPending}
              disabled={publishMutation.isPending}
              size="sm"
            >
              <Rocket className="w-4 h-4" />
              {event.is_published ? "Republish" : "Publish"}
            </Button>
          </div>

          <nav className="flex items-center gap-1 overflow-x-auto pb-px -mb-px">
            {TABS.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                    isActive
                      ? "border-slate-900 text-slate-900"
                      : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                  )
                }
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <Outlet context={{ event }} />
      </main>

      {publishToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
          <div className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg",
            publishToast === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
          )}>
            {publishToast === "success" ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-sm font-medium">Event published successfully</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Failed to publish event</span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
