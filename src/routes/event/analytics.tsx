import { useMemo } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent, type EventGuest, type EventRsvp, type EventMessage } from "../../lib/supabase";
import { Card, Badge, Skeleton, ErrorState, EmptyState } from "../../components/ui";
import { Users, Check, X, Clock, MessageSquare, CalendarClock, TrendingUp } from "lucide-react";
import { getRsvpStatus, formatDeadline, formatDate } from "../../lib/utils";

export default function AnalyticsPage() {
  const { event } = useOutletContext<{ event: UserEvent | null }>();
  const { eventId } = useParams<{ eventId: string }>();

  const { data: guests, isLoading: guestsLoading } = useQuery<EventGuest[]>({
    queryKey: ["guests", eventId],
    queryFn: async () => {
      if (!eventId) return [];
      const { data, error } = await supabase.from("event_guests").select("*").eq("event_id", eventId);
      if (error) throw error;
      return (data || []) as EventGuest[];
    },
    enabled: !!eventId,
  });

  const { data: rsvps, isLoading: rsvpsLoading } = useQuery<EventRsvp[]>({
    queryKey: ["rsvps", eventId],
    queryFn: async () => {
      if (!eventId) return [];
      const { data, error } = await supabase.from("event_rsvps").select("*").eq("event_id", eventId).order("submitted_at", { ascending: false });
      if (error) throw error;
      return (data || []) as EventRsvp[];
    },
    enabled: !!eventId,
  });

  const { data: messages, isLoading: messagesLoading } = useQuery<EventMessage[]>({
    queryKey: ["messages", eventId],
    queryFn: async () => {
      if (!eventId) return [];
      const { data, error } = await supabase.from("event_messages").select("*").eq("event_id", eventId).order("created_at", { ascending: false }).limit(10);
      if (error) throw error;
      return (data || []) as EventMessage[];
    },
    enabled: !!eventId,
  });

  const stats = useMemo(() => {
    const total = guests?.length || 0;
    const attending = guests?.filter((g) => g.rsvp_status === "attending").length || 0;
    const declined = guests?.filter((g) => g.rsvp_status === "declined").length || 0;
    const pending = guests?.filter((g) => g.rsvp_status === "pending").length || 0;
    const messageCount = messages?.length || 0;
    return { total, attending, declined, pending, messageCount };
  }, [guests, messages]);

  const rsvpBreakdown = useMemo(() => {
    const total = stats.total || 1;
    return {
      attendingPct: (stats.attending / total) * 100,
      declinedPct: (stats.declined / total) * 100,
      pendingPct: (stats.pending / total) * 100,
    };
  }, [stats]);

  const deadlineStatus = getRsvpStatus(event?.draft_rsvp_deadline || event?.rsvp_deadline || null);

  if (!event) return <div className="p-6"><Skeleton className="h-8 w-48 mb-4" /><Skeleton className="h-96 w-full" /></div>;

  const isLoading = guestsLoading || rsvpsLoading || messagesLoading;

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold text-slate-900 mb-6">Analytics</h1>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <StatCard icon={<Users className="w-5 h-5" />} label="Total Guests" value={stats.total} color="text-slate-900" bg="bg-slate-50" loading={guestsLoading} />
        <StatCard icon={<Check className="w-5 h-5" />} label="Attending" value={stats.attending} color="text-green-700" bg="bg-green-50" loading={guestsLoading} />
        <StatCard icon={<X className="w-5 h-5" />} label="Declined" value={stats.declined} color="text-red-700" bg="bg-red-50" loading={guestsLoading} />
        <StatCard icon={<Clock className="w-5 h-5" />} label="Pending" value={stats.pending} color="text-amber-700" bg="bg-amber-50" loading={guestsLoading} />
        <StatCard icon={<MessageSquare className="w-5 h-5" />} label="Messages" value={stats.messageCount} color="text-blue-700" bg="bg-blue-50" loading={messagesLoading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-900">RSVP Breakdown</h2>
          </div>
          {isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : stats.total === 0 ? (
            <EmptyState title="No data yet" description="Guest RSVPs will show here." />
          ) : (
            <div className="space-y-4">
              <ProgressBar label="Attending" value={stats.attending} pct={rsvpBreakdown.attendingPct} color="bg-green-500" />
              <ProgressBar label="Declined" value={stats.declined} pct={rsvpBreakdown.declinedPct} color="bg-red-500" />
              <ProgressBar label="Pending" value={stats.pending} pct={rsvpBreakdown.pendingPct} color="bg-amber-500" />
            </div>
          )}
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <CalendarClock className="w-5 h-5 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-900">RSVP Deadline</h2>
          </div>
          <div className="space-y-3">
            <div>
              <div className="text-sm text-slate-500">Deadline</div>
              <div className="text-lg font-medium text-slate-900">{formatDeadline(event?.draft_rsvp_deadline || event?.rsvp_deadline || null) || "No deadline set"}</div>
            </div>
            <div>
              <div className="text-sm text-slate-500">Status</div>
              <Badge variant={deadlineStatus === "open" ? "success" : deadlineStatus === "closing-soon" ? "warning" : deadlineStatus === "closed" ? "error" : "default"}>
                {deadlineStatus.replace("-", " ")}
              </Badge>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">Recent RSVPs</h2>
          {rsvpsLoading ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : !rsvps || rsvps.length === 0 ? (
            <EmptyState icon={<MessageSquare className="w-10 h-10" />} title="No RSVPs yet" />
          ) : (
            <div className="space-y-2">
              {rsvps.slice(0, 5).map((r) => (
                <div key={r.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <div>
                    <div className="text-sm font-medium text-slate-900">{r.guest_name}</div>
                    <div className="text-xs text-slate-500">{formatDate(r.submitted_at)}</div>
                  </div>
                  <Badge variant={r.status === "attending" ? "success" : r.status === "declined" ? "error" : "warning"}>{r.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">Recent Messages</h2>
          {messagesLoading ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : !messages || messages.length === 0 ? (
            <EmptyState icon={<MessageSquare className="w-10 h-10" />} title="No messages yet" />
          ) : (
            <div className="space-y-2">
              {messages.slice(0, 5).map((m) => (
                <div key={m.id} className="py-2 border-b border-slate-50 last:border-0">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-slate-900">{m.guest_name}</div>
                    <div className="text-xs text-slate-500">{formatDate(m.created_at)}</div>
                  </div>
                  <p className="text-sm text-slate-600 mt-1 line-clamp-2">{m.message}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color, bg, loading }: { icon: React.ReactNode; label: string; value: number; color: string; bg: string; loading: boolean }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${bg} ${color}`}>{icon}</div>
        <div>
          {loading ? <Skeleton className="h-7 w-12" /> : <div className="text-2xl font-bold text-slate-900">{value}</div>}
          <div className="text-xs text-slate-500">{label}</div>
        </div>
      </div>
    </Card>
  );
}

function ProgressBar({ label, value, pct, color }: { label: string; value: number; pct: number; color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-slate-700">{label}</span>
        <span className="text-sm font-medium text-slate-900">{value} ({pct.toFixed(0)}%)</span>
      </div>
      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
