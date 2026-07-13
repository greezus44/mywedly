import { useQuery } from "@tanstack/react-query";
import { Users, MailCheck, Check, X, MessageSquare, Calendar, TrendingUp, Clock } from "lucide-react";
import { supabase, type Wedding, type Guest, type Rsvp, type GuestbookEntry, type WeddingEvent } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { Card, Badge, EmptyState, SectionTitle } from "../../components/ui/index";
import { Button } from "../../components/ui/Button";
import { formatDate } from "../../lib/utils";
import { cn } from "../../lib/utils";

export function OverviewPage() {
  const { data: wedding, isLoading: wLoading } = useQuery({
    queryKey: ["wedding"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { data, error } = await supabase.from("weddings").select("*").eq("created_by", user.user.id).single();
      if (error) throw error;
      return data as Wedding;
    },
  });

  const { data: stats, isLoading: sLoading } = useQuery({
    queryKey: ["overview-stats", wedding?.id],
    queryFn: async () => {
      if (!wedding) return null;
      const [guests, rsvps, messages, events] = await Promise.all([
        supabase.from("guests").select("*").eq("wedding_id", wedding.id),
        supabase.from("rsvps").select("*").eq("wedding_id", wedding.id),
        supabase.from("guestbook_entries").select("*").eq("wedding_id", wedding.id),
        supabase.from("events").select("*").eq("wedding_id", wedding.id),
      ]);
      const guestList = (guests.data || []) as Guest[];
      const rsvpList = (rsvps.data || []) as Rsvp[];
      const msgList = (messages.data || []) as GuestbookEntry[];
      const eventList = (events.data || []) as WeddingEvent[];
      return {
        totalGuests: guestList.length,
        pendingRsvps: rsvpList.filter((r) => r.status === "pending").length,
        accepted: rsvpList.filter((r) => r.status === "accepted").length,
        declined: rsvpList.filter((r) => r.status === "declined").length,
        messages: msgList.length,
        approvedMessages: msgList.filter((m) => m.is_approved).length,
        pendingMessages: msgList.filter((m) => !m.is_approved).length,
        events: eventList.length,
      };
    },
    enabled: !!wedding,
  });

  const { data: recentActivity } = useQuery({
    queryKey: ["recent-activity", wedding?.id],
    queryFn: async () => {
      if (!wedding) return [];
      const [rsvps, messages, guests] = await Promise.all([
        supabase.from("rsvps").select("*").eq("wedding_id", wedding.id).order("created_at", { ascending: false }).limit(5),
        supabase.from("guestbook_entries").select("*").eq("wedding_id", wedding.id).order("created_at", { ascending: false }).limit(5),
        supabase.from("guests").select("*").eq("wedding_id", wedding.id).order("created_at", { ascending: false }).limit(5),
      ]);
      const activities: { type: string; label: string; time: string }[] = [];
      (rsvps.data || []).forEach((r: Rsvp) => activities.push({ type: "rsvp", label: `${r.guest_name || "Guest"} ${r.status} RSVP`, time: r.created_at }));
      (messages.data || []).forEach((m: GuestbookEntry) => activities.push({ type: "message", label: `${m.author_name} sent a message`, time: m.created_at }));
      (guests.data || []).forEach((g: Guest) => activities.push({ type: "guest", label: `${g.full_name} was added`, time: g.created_at }));
      return activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 8);
    },
    enabled: !!wedding,
  });

  const loading = wLoading || sLoading;

  const statCards = [
    { label: "Total Guests", value: stats?.totalGuests ?? 0, icon: Users, color: "text-[var(--color-primary)]" },
    { label: "Pending RSVPs", value: stats?.pendingRsvps ?? 0, icon: Clock, color: "text-[var(--color-warning)]" },
    { label: "Accepted", value: stats?.accepted ?? 0, icon: Check, color: "text-[var(--color-success)]" },
    { label: "Declined", value: stats?.declined ?? 0, icon: X, color: "text-[var(--color-error)]" },
    { label: "Messages", value: stats?.messages ?? 0, icon: MessageSquare, color: "text-[var(--color-primary)]" },
    { label: "Events", value: stats?.events ?? 0, icon: Calendar, color: "text-[var(--color-primary)]" },
  ];

  return (
    <AdminLayout>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
          <div className="mb-8">
            <h1 className="font-heading text-3xl text-[var(--color-text)] mb-1">Dashboard</h1>
            <p className="font-ui text-sm text-[var(--color-text-muted)]">
              {wedding ? `${wedding.couple_name_one} & ${wedding.couple_name_two}` : "Welcome back"}
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="p-6 animate-pulse">
                  <div className="h-12 w-12 rounded-full bg-gray-100 mb-4" />
                  <div className="h-8 w-16 bg-gray-100 rounded mb-2" />
                  <div className="h-4 w-24 bg-gray-100 rounded" />
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              {statCards.map((stat) => {
                const Icon = stat.icon;
                return (
                  <Card key={stat.label} className="p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className={cn("p-3 rounded-full bg-[var(--color-primary)]/8", stat.color)}>
                        <Icon size={20} />
                      </div>
                      {wedding?.is_published && stat.label === "Total Guests" && (
                        <Badge variant="success">Live</Badge>
                      )}
                    </div>
                    <p className="font-heading text-3xl text-[var(--color-text)] mb-1">{stat.value}</p>
                    <p className="font-ui text-xs uppercase tracking-wider-luxe text-[var(--color-text-muted)]">{stat.label}</p>
                  </Card>
                );
              })}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={18} className="text-[var(--color-primary)]" />
                <h3 className="font-heading text-lg text-[var(--color-text)]">Recent Activity</h3>
              </div>
              {recentActivity && recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {recentActivity.map((activity, i) => (
                    <div key={i} className="flex items-center gap-3 py-2 border-b border-[var(--color-border)]/10 last:border-0">
                      <div className="w-2 h-2 rounded-full bg-[var(--color-primary)]" />
                      <div className="flex-1">
                        <p className="font-ui text-sm text-[var(--color-text)]">{activity.label}</p>
                        <p className="font-ui text-xs text-[var(--color-text-muted)]">
                          {new Date(activity.time).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={<MessageSquare size={32} />} title="No activity yet" description="Recent activity will appear here" />
              )}
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Calendar size={18} className="text-[var(--color-primary)]" />
                <h3 className="font-heading text-lg text-[var(--color-text)]">Wedding Details</h3>
              </div>
              {wedding ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-[var(--color-border)]/10">
                    <span className="font-ui text-xs uppercase tracking-wider-luxe text-[var(--color-text-muted)]">Date</span>
                    <span className="font-ui text-sm text-[var(--color-text)]">{formatDate(wedding.wedding_date) || "Not set"}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-[var(--color-border)]/10">
                    <span className="font-ui text-xs uppercase tracking-wider-luxe text-[var(--color-text-muted)]">Location</span>
                    <span className="font-ui text-sm text-[var(--color-text)]">{wedding.location || "Not set"}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-[var(--color-border)]/10">
                    <span className="font-ui text-xs uppercase tracking-wider-luxe text-[var(--color-text-muted)]">Hashtag</span>
                    <span className="font-ui text-sm text-[var(--color-text)]">{wedding.hashtag || "—"}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-[var(--color-border)]/10">
                    <span className="font-ui text-xs uppercase tracking-wider-luxe text-[var(--color-text-muted)]">RSVP Deadline</span>
                    <span className="font-ui text-sm text-[var(--color-text)]">{formatDate(wedding.rsvp_deadline) || "Not set"}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="font-ui text-xs uppercase tracking-wider-luxe text-[var(--color-text-muted)]">Status</span>
                    <Badge variant={wedding.is_published ? "success" : "default"}>
                      {wedding.is_published ? "Published" : "Draft"}
                    </Badge>
                  </div>
                </div>
              ) : (
                <p className="font-ui text-sm text-[var(--color-text-muted)]">Loading wedding details...</p>
              )}
            </Card>
          </div>

          {stats && stats.pendingMessages > 0 && (
            <Card className="p-6 mt-6 border-[var(--color-warning)]/30">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-heading text-lg text-[var(--color-text)] mb-1">{stats.pendingMessages} messages awaiting approval</h3>
                  <p className="font-ui text-sm text-[var(--color-text-muted)]">Review and approve guest messages from your guestbook</p>
                </div>
                <Button variant="primary" size="sm" onClick={() => (window.location.href = "/admin/messages")}>
                  Review Messages
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
