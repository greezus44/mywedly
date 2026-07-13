import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase, type Wedding, type Guest, type Rsvp, type GuestbookEntry } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { Card, Badge, EmptyState } from "../../components/ui/index";
import { Button } from "../../components/ui/Button";
import { formatDate, cn } from "../../lib/utils";
import { Users, Mail, CheckCircle, XCircle, MessageSquare, Calendar, Clock, TrendingUp, RefreshCw } from "lucide-react";

export function OverviewPage() {
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<string | null>(null);

  const weddingQuery = useQuery({
    queryKey: ["wedding"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { data, error } = await supabase.from("weddings").select("*").eq("created_by", user.user.id).single();
      if (error) throw error;
      return data as Wedding;
    },
  });

  const wedding = weddingQuery.data;

  const statsQuery = useQuery({
    queryKey: ["overview-stats", wedding?.id],
    queryFn: async () => {
      if (!wedding) return null;
      const [guestsRes, rsvpsRes, messagesRes] = await Promise.all([
        supabase.from("guests").select("*", { count: "exact", head: false }).eq("wedding_id", wedding.id),
        supabase.from("rsvps").select("*", { count: "exact", head: false }).eq("wedding_id", wedding.id),
        supabase.from("guestbook_entries").select("*", { count: "exact", head: false }).eq("wedding_id", wedding.id),
      ]);
      const guests = (guestsRes.data || []) as Guest[];
      const rsvps = (rsvpsRes.data || []) as Rsvp[];
      const messages = (messagesRes.data || []) as GuestbookEntry[];
      return {
        totalGuests: guests.length,
        pendingRsvps: rsvps.filter((r) => r.status === "pending").length,
        accepted: rsvps.filter((r) => r.status === "accepted").length,
        declined: rsvps.filter((r) => r.status === "declined").length,
        totalRsvps: rsvps.length,
        messages: messages.length,
        pendingMessages: messages.filter((m) => !m.is_approved).length,
      };
    },
    enabled: !!wedding,
  });

  const recentActivityQuery = useQuery({
    queryKey: ["recent-activity", wedding?.id],
    queryFn: async () => {
      if (!wedding) return [];
      const [rsvpsRes, messagesRes] = await Promise.all([
        supabase.from("rsvps").select("*").eq("wedding_id", wedding.id).order("created_at", { ascending: false }).limit(5),
        supabase.from("guestbook_entries").select("*").eq("wedding_id", wedding.id).order("created_at", { ascending: false }).limit(5),
      ]);
      const rsvps = (rsvpsRes.data || []) as Rsvp[];
      const messages = (messagesRes.data || []) as GuestbookEntry[];
      const activity = [
        ...rsvps.map((r) => ({ type: "rsvp" as const, id: r.id, name: r.guest_name || "Unknown Guest", detail: r.status, created_at: r.created_at })),
        ...messages.map((m) => ({ type: "message" as const, id: m.id, name: m.author_name, detail: m.message.slice(0, 60), created_at: m.created_at })),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 8);
      return activity;
    },
    enabled: !!wedding,
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["overview-stats"] });
    queryClient.invalidateQueries({ queryKey: ["recent-activity"] });
    setToast("Dashboard refreshed");
    setTimeout(() => setToast(null), 2500);
  };

  if (weddingQuery.isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full p-20">
          <RefreshCw size={24} className="animate-spin text-[var(--color-primary)]" />
        </div>
      </AdminLayout>
    );
  }

  if (weddingQuery.isError || !wedding) {
    return (
      <AdminLayout>
        <div className="p-8">
          <EmptyState icon={<XCircle size={32} />} title="Unable to load dashboard" description="Please try again later." />
        </div>
      </AdminLayout>
    );
  }

  const stats = statsQuery.data;
  const activity = recentActivityQuery.data || [];

  const statCards = [
    { label: "Total Guests", value: stats?.totalGuests ?? "—", icon: Users, color: "text-[var(--color-primary)]" },
    { label: "Pending RSVPs", value: stats?.pendingRsvps ?? "—", icon: Clock, color: "text-[var(--color-warning)]" },
    { label: "Accepted", value: stats?.accepted ?? "—", icon: CheckCircle, color: "text-[var(--color-success)]" },
    { label: "Declined", value: stats?.declined ?? "—", icon: XCircle, color: "text-[var(--color-error)]" },
    { label: "Messages", value: stats?.messages ?? "—", icon: MessageSquare, color: "text-[var(--color-primary)]" },
    { label: "RSVP Rate", value: stats && stats.totalRsvps > 0 ? `${Math.round((stats.accepted / stats.totalRsvps) * 100)}%` : "—", icon: TrendingUp, color: "text-[var(--color-success)]" },
  ];

  return (
    <AdminLayout>
      <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-[var(--color-bg)]">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <div>
              <h1 className="font-heading text-3xl text-[var(--color-text)] mb-1">Dashboard</h1>
              <p className="font-ui text-sm text-[var(--color-text-muted)]">
                {wedding.couple_name_one} & {wedding.couple_name_two}
                {wedding.wedding_date && ` · ${formatDate(wedding.wedding_date)}`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {wedding.is_published ? (
                <Badge variant="success">Published</Badge>
              ) : (
                <Badge variant="warning">Draft</Badge>
              )}
              <Button variant="ghost" size="sm" onClick={handleRefresh}>
                <RefreshCw size={14} className={statsQuery.isFetching ? "animate-spin" : ""} />
              </Button>
            </div>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {statCards.map((card) => {
              const Icon = card.icon;
              return (
                <Card key={card.label} className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <Icon size={20} className={card.color} />
                  </div>
                  <div className="font-heading text-3xl text-[var(--color-text)] mb-1">{card.value}</div>
                  <div className="font-ui text-xs uppercase tracking-wider text-[var(--color-text-muted)]">{card.label}</div>
                </Card>
              );
            })}
          </div>

          {/* Wedding Info + Recent Activity */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Wedding Info */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Calendar size={18} className="text-[var(--color-primary)]" />
                <h3 className="font-heading text-lg text-[var(--color-text)]">Wedding Details</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="font-ui text-xs uppercase tracking-wider text-[var(--color-text-muted)] mb-1">Date</p>
                  <p className="font-body text-sm text-[var(--color-text)]">{wedding.wedding_date ? formatDate(wedding.wedding_date) : "Not set"}</p>
                </div>
                <div>
                  <p className="font-ui text-xs uppercase tracking-wider text-[var(--color-text-muted)] mb-1">Location</p>
                  <p className="font-body text-sm text-[var(--color-text)]">{wedding.location || "Not set"}</p>
                </div>
                <div>
                  <p className="font-ui text-xs uppercase tracking-wider text-[var(--color-text-muted)] mb-1">Hashtag</p>
                  <p className="font-body text-sm text-[var(--color-text)]">{wedding.hashtag || "Not set"}</p>
                </div>
                <div>
                  <p className="font-ui text-xs uppercase tracking-wider text-[var(--color-text-muted)] mb-1">RSVP Deadline</p>
                  <p className="font-body text-sm text-[var(--color-text)]">{wedding.rsvp_deadline ? formatDate(wedding.rsvp_deadline) : "Not set"}</p>
                </div>
              </div>
            </Card>

            {/* Recent Activity */}
            <Card className="p-6 lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading text-lg text-[var(--color-text)]">Recent Activity</h3>
                {stats && stats.pendingMessages > 0 && (
                  <Badge variant="warning">{stats.pendingMessages} pending</Badge>
                )}
              </div>
              {activity.length === 0 ? (
                <EmptyState title="No activity yet" description="RSVPs and messages will appear here." />
              ) : (
                <div className="space-y-3">
                  {activity.map((item) => (
                    <div key={`${item.type}-${item.id}`} className="flex items-start gap-3 py-2 border-b border-[var(--color-border)]/10 last:border-0">
                      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0", item.type === "rsvp" ? "bg-[var(--color-primary)]/10" : "bg-[var(--color-accent)]/10")}>
                        {item.type === "rsvp" ? <Mail size={14} className="text-[var(--color-primary)]" /> : <MessageSquare size={14} className="text-[var(--color-accent)]" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-ui text-sm text-[var(--color-text)] truncate">{item.name}</p>
                        <p className="font-ui text-xs text-[var(--color-text-muted)] truncate">
                          {item.type === "rsvp" ? `RSVP: ${item.detail}` : item.detail}
                        </p>
                      </div>
                      <span className="font-ui text-xs text-[var(--color-text-muted)] flex-shrink-0">
                        {new Date(item.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Pending Messages Alert */}
          {stats && stats.pendingMessages > 0 && (
            <Card className="p-5 mt-6 border-[var(--color-warning)]/30">
              <div className="flex items-center gap-3">
                <MessageSquare size={20} className="text-[var(--color-warning)]" />
                <div className="flex-1">
                  <p className="font-ui text-sm text-[var(--color-text)]">
                    You have {stats.pendingMessages} message{stats.pendingMessages > 1 ? "s" : ""} awaiting approval.
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => (window.location.href = "/admin/messages")}>
                  Review
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-fade-in-up">
          <div className="px-5 py-3 rounded-lg shadow-lg font-ui text-sm bg-[var(--color-success)] text-white">
            {toast}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
