import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  CalendarDays,
  MessageSquare,
  TrendingUp,
  ArrowRight,
  Heart,
  type LucideIcon,
} from "lucide-react";
import { supabase, type Wedding, type GuestbookEntry, type WeddingEvent } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { Card, Badge, EmptyState } from "../../components/ui/index";
import { formatDate, cn } from "../../lib/utils";
import { useLang } from "../../lib/lang-context";

interface Stats {
  totalGuests: number;
  pendingRsvps: number;
  acceptedRsvps: number;
  declinedRsvps: number;
  upcomingEvents: number;
  recentMessages: GuestbookEntry[];
  events: WeddingEvent[];
}

export function OverviewPage() {
  const { lang } = useLang();
  const [toast, setToast] = useState<string | null>(null);

  const { data: wedding, isLoading: weddingLoading } = useQuery({
    queryKey: ["wedding"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("weddings")
        .select("*")
        .eq("created_by", user.user.id)
        .single();
      if (error) throw error;
      return data as Wedding;
    },
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["overview-stats", wedding?.id],
    queryFn: async (): Promise<Stats> => {
      if (!wedding) throw new Error("No wedding");
      const wedId = wedding.id;

      const [guestsRes, rsvpsRes, eventsRes, messagesRes] = await Promise.all([
        supabase.from("guests").select("id, rsvp_status").eq("wedding_id", wedId),
        supabase.from("rsvps").select("id, status").eq("wedding_id", wedId),
        supabase.from("events").select("*").eq("wedding_id", wedId).order("starts_at", { ascending: true }),
        supabase
          .from("guestbook_entries")
          .select("*")
          .eq("wedding_id", wedId)
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      const totalGuests = guestsRes.data?.length ?? 0;
      const rsvpStatuses = (rsvpsRes.data ?? []).map((r) => r.status);
      const pendingRsvps = rsvpStatuses.filter((s) => s === "pending").length;
      const acceptedRsvps = rsvpStatuses.filter((s) => s === "accepted").length;
      const declinedRsvps = rsvpStatuses.filter((s) => s === "declined").length;

      const now = new Date();
      const events = (eventsRes.data ?? []) as WeddingEvent[];
      const upcomingEvents = events.filter((e) => e.starts_at && new Date(e.starts_at) >= now).length;

      const recentMessages = (messagesRes.data ?? []) as GuestbookEntry[];

      return {
        totalGuests,
        pendingRsvps,
        acceptedRsvps,
        declinedRsvps,
        upcomingEvents,
        recentMessages,
        events,
      };
    },
    enabled: !!wedding,
  });

  const isLoading = weddingLoading || statsLoading;

  const statCards: { label: string; value: number | string; icon: LucideIcon; color: string; link: string }[] = [
    { label: "Total Guests", value: stats?.totalGuests ?? 0, icon: Users, color: "text-[var(--color-primary)]", link: "/admin/guests" },
    { label: "Pending RSVPs", value: stats?.pendingRsvps ?? 0, icon: Clock, color: "text-[var(--color-warning)]", link: "/admin/rsvps" },
    { label: "Accepted", value: stats?.acceptedRsvps ?? 0, icon: CheckCircle2, color: "text-[var(--color-success)]", link: "/admin/rsvps" },
    { label: "Declined", value: stats?.declinedRsvps ?? 0, icon: XCircle, color: "text-[var(--color-error)]", link: "/admin/rsvps" },
    { label: "Upcoming Events", value: stats?.upcomingEvents ?? 0, icon: CalendarDays, color: "text-[var(--color-primary)]", link: "/admin/events" },
    { label: "Messages", value: stats?.recentMessages.length ?? 0, icon: MessageSquare, color: "text-[var(--color-accent)]", link: "/admin/messages" },
  ];

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <Heart className="animate-pulse mx-auto mb-4 text-[var(--color-primary)]" size={32} />
            <p className="font-ui text-sm text-[var(--color-text-muted)]">Loading dashboard...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-6 md:p-8">
          {/* Header */}
          <div className="mb-8">
            <p className="font-ui text-xs uppercase tracking-wider-luxe text-[var(--color-primary)] mb-2">Dashboard</p>
            <h1 className="font-heading text-3xl md:text-4xl text-[var(--color-text)]">
              {wedding ? `${wedding.couple_name_one} & ${wedding.couple_name_two}` : "Wedding Dashboard"}
            </h1>
            {wedding?.wedding_date && (
              <p className="font-ui text-sm text-[var(--color-text-muted)] mt-2">
                {formatDate(wedding.wedding_date, lang)}
              </p>
            )}
            <div className="mt-3 flex items-center gap-3">
              {wedding?.is_published ? (
                <Badge variant="success">Published</Badge>
              ) : (
                <Badge variant="warning">Draft</Badge>
              )}
              <Link
                to="/admin/settings"
                className="font-ui text-xs text-[var(--color-primary)] hover:underline"
              >
                Manage settings →
              </Link>
            </div>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {statCards.map((card) => {
              const Icon = card.icon;
              return (
                <Link key={card.label} to={card.link}>
                  <Card className="p-5 hover:shadow-md transition-shadow cursor-pointer group h-full">
                    <div className="flex items-start justify-between mb-3">
                      <div className={cn("p-2.5 rounded-lg bg-[var(--color-bg-light)]", card.color)}>
                        <Icon size={20} />
                      </div>
                      <ArrowRight
                        size={16}
                        className="text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                    </div>
                    <p className="font-heading text-3xl text-[var(--color-text)] mb-1">{card.value}</p>
                    <p className="font-ui text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
                      {card.label}
                    </p>
                  </Card>
                </Link>
              );
            })}
          </div>

          {/* Two-column: Upcoming Events + Recent Messages */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upcoming Events */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading text-xl text-[var(--color-text)]">Upcoming Events</h2>
                <Link to="/admin/events" className="font-ui text-xs text-[var(--color-primary)] hover:underline">
                  View all
                </Link>
              </div>
              {stats && stats.events.length > 0 ? (
                <div className="space-y-3">
                  {stats.events
                    .filter((e) => e.starts_at && new Date(e.starts_at) >= new Date())
                    .slice(0, 4)
                    .map((event) => (
                      <div
                        key={event.id}
                        className="flex items-center gap-4 p-3 rounded-lg border border-[var(--color-border)]/15 hover:bg-[var(--color-bg-light)] transition-colors"
                      >
                        <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-[var(--color-primary)]/10 flex flex-col items-center justify-center">
                          <span className="font-heading text-lg text-[var(--color-primary)] leading-none">
                            {event.starts_at ? new Date(event.starts_at).getDate() : "—"}
                          </span>
                          <span className="font-ui text-xs text-[var(--color-primary)] uppercase">
                            {event.starts_at
                              ? new Date(event.starts_at).toLocaleDateString("en-US", { month: "short" })
                              : ""}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-heading text-sm text-[var(--color-text)] truncate">{event.name}</p>
                          <p className="font-ui text-xs text-[var(--color-text-muted)]">
                            {event.venue_name || "No venue set"}
                          </p>
                        </div>
                        <Badge>{event.kind}</Badge>
                      </div>
                    ))}
                </div>
              ) : (
                <EmptyState
                  icon={<CalendarDays size={28} />}
                  title="No upcoming events"
                  description="Create events to share with your guests."
                />
              )}
            </Card>

            {/* Recent Messages */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading text-xl text-[var(--color-text)]">Recent Messages</h2>
                <Link to="/admin/messages" className="font-ui text-xs text-[var(--color-primary)] hover:underline">
                  View all
                </Link>
              </div>
              {stats && stats.recentMessages.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className="p-3 rounded-lg border border-[var(--color-border)]/15 hover:bg-[var(--color-bg-light)] transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-ui text-sm font-medium text-[var(--color-text)]">{msg.author_name}</p>
                        {msg.is_approved ? (
                          <Badge variant="success">Approved</Badge>
                        ) : (
                          <Badge variant="warning">Pending</Badge>
                        )}
                      </div>
                      <p className="font-body text-sm text-[var(--color-text-muted)] line-clamp-2">
                        {msg.message}
                      </p>
                      <p className="font-ui text-xs text-[var(--color-text-muted)] mt-1">
                        {formatDate(msg.created_at, lang)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<MessageSquare size={28} />}
                  title="No messages yet"
                  description="Guest messages will appear here once submitted."
                />
              )}
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="mt-8">
            <h2 className="font-heading text-xl text-[var(--color-text)] mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Edit Cover", link: "/admin/cover", icon: Heart },
                { label: "Customize Theme", link: "/admin/theme", icon: TrendingUp },
                { label: "Add Event", link: "/admin/events", icon: CalendarDays },
                { label: "Add Guest", link: "/admin/guests", icon: Users },
              ].map((action) => {
                const Icon = action.icon;
                return (
                  <Link key={action.label} to={action.link}>
                    <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer group flex items-center gap-3">
                      <Icon size={18} className="text-[var(--color-primary)]" />
                      <span className="font-ui text-xs uppercase tracking-wider text-[var(--color-text)]">
                        {action.label}
                      </span>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-lg shadow-lg bg-[var(--color-success)] text-white font-ui text-sm">
          {toast}
        </div>
      )}
    </AdminLayout>
  );
}
