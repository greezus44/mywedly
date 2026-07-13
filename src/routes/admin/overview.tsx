import { useQuery } from "@tanstack/react-query";
import { supabase, type Wedding } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { Card, Badge } from "../../components/ui/index";
import { formatDate } from "../../lib/utils";
import { Calendar, Users, Mail, CheckCircle2, MessageSquare, Heart, TrendingUp, Clock } from "lucide-react";

export function OverviewPage() {
  const { data: wedding, isLoading: weddingLoading, error: weddingError } = useQuery({
    queryKey: ["wedding"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { data, error } = await supabase.from("weddings").select("*").eq("created_by", user.user.id).single();
      if (error) throw error;
      return data as Wedding;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["overview-stats", wedding?.id],
    queryFn: async () => {
      if (!wedding) return null;
      const [guestsRes, eventsRes, messagesRes, rsvpsRes] = await Promise.all([
        supabase.from("guests").select("*", { count: "exact", head: true }).eq("wedding_id", wedding.id),
        supabase.from("events").select("*", { count: "exact", head: true }).eq("wedding_id", wedding.id),
        supabase.from("guestbook_entries").select("*", { count: "exact", head: true }).eq("wedding_id", wedding.id),
        supabase.from("rsvps").select("*", { count: "exact", head: true }).eq("wedding_id", wedding.id),
      ]);
      const [acceptedRes, pendingRes] = await Promise.all([
        supabase.from("rsvps").select("*", { count: "exact", head: true }).eq("wedding_id", wedding.id).eq("status", "accepted"),
        supabase.from("rsvps").select("*", { count: "exact", head: true }).eq("wedding_id", wedding.id).eq("status", "pending"),
      ]);
      return {
        guests: guestsRes.count || 0,
        events: eventsRes.count || 0,
        messages: messagesRes.count || 0,
        rsvps: rsvpsRes.count || 0,
        accepted: acceptedRes.count || 0,
        pending: pendingRes.count || 0,
      };
    },
    enabled: !!wedding,
  });

  if (weddingLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full p-8">
          <div className="font-ui text-sm text-gray-400">Loading dashboard...</div>
        </div>
      </AdminLayout>
    );
  }

  if (weddingError || !wedding) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full p-8">
          <div className="text-center">
            <p className="font-ui text-sm text-red-500 mb-2">Unable to load wedding data</p>
            <p className="font-ui text-xs text-gray-400">{(weddingError as Error)?.message || "Please try again"}</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const countdown = wedding.wedding_date ? Math.max(0, Math.ceil((new Date(wedding.wedding_date).getTime() - Date.now()) / 86400000)) : null;
  const rsvpRate = stats && stats.guests > 0 ? Math.round((stats.rsvps / stats.guests) * 100) : 0;

  const statCards = [
    { label: "Total Guests", value: stats?.guests ?? 0, icon: Users, accent: "text-[var(--color-primary)]" },
    { label: "Events", value: stats?.events ?? 0, icon: Calendar, accent: "text-[var(--color-primary)]" },
    { label: "RSVPs Received", value: stats?.rsvps ?? 0, icon: CheckCircle2, accent: "text-[var(--color-success)]" },
    { label: "Accepted", value: stats?.accepted ?? 0, icon: TrendingUp, accent: "text-[var(--color-success)]" },
    { label: "Messages", value: stats?.messages ?? 0, icon: MessageSquare, accent: "text-[var(--color-primary)]" },
    { label: "Days to Wedding", value: countdown ?? "—", icon: Clock, accent: "text-[var(--color-primary)]" },
  ];

  return (
    <AdminLayout>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-6 md:p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <Heart size={16} className="text-[var(--color-primary)]" />
              <span className="font-ui text-xs uppercase tracking-wider-luxe text-[var(--color-text-muted)]">Dashboard</span>
            </div>
            <h1 className="font-heading text-3xl md:text-4xl text-[var(--color-text)] mb-1">
              {wedding.couple_name_one} & {wedding.couple_name_two}
            </h1>
            <p className="font-ui text-sm text-[var(--color-text-muted)]">
              {wedding.wedding_date ? formatDate(wedding.wedding_date) : "Date not set"}
              {wedding.location && ` · ${wedding.location}`}
            </p>
          </div>

          {/* Status bar */}
          <div className="flex items-center gap-3 mb-8 flex-wrap">
            <Badge variant={wedding.is_published ? "success" : "warning"}>
              {wedding.is_published ? "Published" : "Draft"}
            </Badge>
            {countdown !== null && countdown > 0 && (
              <Badge variant="default">{countdown} days to go</Badge>
            )}
            {stats && stats.pending > 0 && (
              <Badge variant="warning">{stats.pending} pending RSVPs</Badge>
            )}
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {statCards.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.label} className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 bg-[var(--color-primary)]/8 rounded-lg">
                      <Icon size={20} className={stat.accent} />
                    </div>
                  </div>
                  <div className="font-heading text-3xl text-[var(--color-text)] mb-1">{stat.value}</div>
                  <div className="font-ui text-xs uppercase tracking-wider-luxe text-[var(--color-text-muted)]">{stat.label}</div>
                </Card>
              );
            })}
          </div>

          {/* Quick info */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="p-6">
              <h3 className="font-heading text-lg text-[var(--color-text)] mb-4">Wedding Details</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Calendar size={16} className="text-[var(--color-primary)]" />
                  <span className="font-ui text-sm text-[var(--color-text)]">
                    {wedding.wedding_date ? formatDate(wedding.wedding_date) : "Not set"}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail size={16} className="text-[var(--color-primary)]" />
                  <span className="font-ui text-sm text-[var(--color-text)]">{wedding.location || "Location not set"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Heart size={16} className="text-[var(--color-primary)]" />
                  <span className="font-ui text-sm text-[var(--color-text)]">
                    {wedding.hashtag || `#${wedding.couple_name_one}${wedding.couple_name_two}`}
                  </span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-heading text-lg text-[var(--color-text)] mb-4">RSVP Summary</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-ui text-sm text-[var(--color-text-muted)]">Response Rate</span>
                  <span className="font-heading text-xl text-[var(--color-primary)]">{rsvpRate}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-[var(--color-primary)] h-full rounded-full transition-all" style={{ width: `${rsvpRate}%` }} />
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="font-ui text-sm text-[var(--color-text-muted)]">Accepted</span>
                  <span className="font-ui text-sm text-[var(--color-success)] font-medium">{stats?.accepted ?? 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-ui text-sm text-[var(--color-text-muted)]">Pending</span>
                  <span className="font-ui text-sm text-[var(--color-warning)] font-medium">{stats?.pending ?? 0}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
