import { useMemo } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, UserEvent, EventGuest, EventRsvp, EventMessage } from "../../lib/supabase";
import { Card, Badge, Skeleton, ErrorState, EmptyState } from "../../components/ui/index";
import { cn, formatDate, formatTime, getRsvpStatus, formatDeadline } from "../../lib/utils";
import { Users, Check, X, Clock, MessageSquare, Calendar, TrendingUp } from "lucide-react";

export default function AnalyticsPage() {
  const { event } = useOutletContext<{ event: UserEvent | null }>();
  const { eventId } = useParams<{ eventId: string }>();

  const { data: guests, isLoading: guestsLoading, isError: guestsError, refetch: refetchGuests } = useQuery<EventGuest[]>({
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
    const totalGuests = guests?.length || 0;
    const attending = guests?.filter((g) => g.rsvp_status === "attending").length || 0;
    const declined = guests?.filter((g) => g.rsvp_status === "declined").length || 0;
    const pending = guests?.filter((g) => !g.rsvp_status || g.rsvp_status === "pending").length || 0;
    const totalRsvps = rsvps?.length || 0;
    const messagesCount = messages?.length || 0;
    return { totalGuests, attending, declined, pending, totalRsvps, messagesCount };
  }, [guests, rsvps, messages]);

  const rsvpBreakdown = useMemo(() => {
    const total = stats.totalRsvps || stats.totalGuests || 1;
    return {
      attending: { count: stats.attending, pct: (stats.attending / total) * 100 },
      declined: { count: stats.declined, pct: (stats.declined / total) * 100 },
      pending: { count: stats.pending, pct: (stats.pending / total) * 100 },
    };
  }, [stats]);

  const rsvpStatus = getRsvpStatus(event?.rsvp_deadline || event?.draft_rsvp_deadline || null);

  if (!event) {
    return (
      <div className="flex items-center justify-center py-16">
        <Skeleton className="w-full h-32" />
      </div>
    );
  }

  if (guestsError) {
    return <ErrorState message="Failed to load analytics" onRetry={() => refetchGuests()} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Analytics</h1>
        <p className="text-sm text-gray-500 mt-0.5">Overview of your event performance</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard icon={<Users className="w-4 h-4" />} label="Total Guests" value={stats.totalGuests} />
        <StatCard icon={<Check className="w-4 h-4" />} label="Attending" value={stats.attending} color="text-green-600" />
        <StatCard icon={<X className="w-4 h-4" />} label="Declined" value={stats.declined} color="text-red-600" />
        <StatCard icon={<Clock className="w-4 h-4" />} label="Pending" value={stats.pending} color="text-yellow-600" />
        <StatCard icon={<MessageSquare className="w-4 h-4" />} label="Messages" value={stats.messagesCount} color="text-blue-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-gray-400" />
            <h2 className="text-base font-semibold text-gray-900">RSVP Breakdown</h2>
          </div>
          {guestsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
            </div>
          ) : stats.totalGuests === 0 ? (
            <EmptyState title="No data yet" description="Add guests to see RSVP breakdown" />
          ) : (
            <div className="space-y-4">
              <BreakdownBar label="Attending" count={rsvpBreakdown.attending.count} pct={rsvpBreakdown.attending.pct} color="bg-green-500" />
              <BreakdownBar label="Declined" count={rsvpBreakdown.declined.count} pct={rsvpBreakdown.declined.pct} color="bg-red-500" />
              <BreakdownBar label="Pending" count={rsvpBreakdown.pending.count} pct={rsvpBreakdown.pending.pct} color="bg-yellow-500" />
            </div>
          )}
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-gray-400" />
            <h2 className="text-base font-semibold text-gray-900">RSVP Deadline</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Status</span>
              {rsvpStatus === "open" && <Badge variant="success">Open</Badge>}
              {rsvpStatus === "closing-soon" && <Badge variant="warning">Closing Soon</Badge>}
              {rsvpStatus === "closed" && <Badge variant="error">Closed</Badge>}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Deadline</span>
              <span className="text-sm font-medium text-gray-900">
                {event.rsvp_deadline || event.draft_rsvp_deadline
                  ? formatDeadline(event.rsvp_deadline || event.draft_rsvp_deadline || null)
                  : "No deadline set"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total RSVPs</span>
              <span className="text-sm font-medium text-gray-900">{stats.totalRsvps}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Response Rate</span>
              <span className="text-sm font-medium text-gray-900">
                {stats.totalGuests > 0 ? Math.round(((stats.attending + stats.declined) / stats.totalGuests) * 100) : 0}%
              </span>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Recent Messages</h2>
          {messagesLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : !messages || messages.length === 0 ? (
            <EmptyState icon={<MessageSquare className="w-10 h-10" />} title="No messages yet" description="Guest messages will appear here" />
          ) : (
            <div className="space-y-3">
              {messages.slice(0, 5).map((m) => (
                <div key={m.id} className="border border-gray-100 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900">{m.guest_name}</span>
                    <span className="text-xs text-gray-400">{formatDate(m.created_at)}</span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">{m.message}</p>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Recent RSVPs</h2>
          {rsvpsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : !rsvps || rsvps.length === 0 ? (
            <EmptyState icon={<Calendar className="w-10 h-10" />} title="No RSVPs yet" description="RSVP responses will appear here" />
          ) : (
            <div className="space-y-3">
              {rsvps.slice(0, 5).map((r) => (
                <div key={r.id} className="border border-gray-100 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900">{r.guest_name}</span>
                    {r.status === "attending" && <Badge variant="success">Attending</Badge>}
                    {r.status === "declined" && <Badge variant="error">Declined</Badge>}
                    {(r.status === "maybe") && <Badge variant="warning">Pending</Badge>}
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>{r.plus_ones > 0 ? `+${r.plus_ones} guest${r.plus_ones > 1 ? "s" : ""}` : "Solo"}</span>
                    <span>{r.submitted_at ? formatDate(r.submitted_at) : ""}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {stats.totalGuests > 0 && (
        <Card className="p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Total Invited</p>
              <p className="text-lg font-bold text-gray-900">{stats.totalGuests}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Confirmed Attending</p>
              <p className="text-lg font-bold text-green-600">{stats.attending}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Total Plus Ones</p>
              <p className="text-lg font-bold text-gray-900">
                {guests?.reduce((sum, g) => sum + (g.plus_ones || 0), 0) || 0}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Total Expected</p>
              <p className="text-lg font-bold text-gray-900">
                {stats.attending + (guests?.reduce((sum, g) => sum + (g.plus_ones || 0), 0) || 0)}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color?: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-gray-400 mb-2">{icon}<span className="text-xs font-medium text-gray-500">{label}</span></div>
      <p className={cn("text-2xl font-bold", color || "text-gray-900")}>{value}</p>
    </Card>
  );
}

function BreakdownBar({ label, count, pct, color }: { label: string; count: number; pct: number; color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm text-gray-500">{count} ({Math.round(pct)}%)</span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-500", color)} style={{ width: `${Math.max(pct, 0)}%` }} />
      </div>
    </div>
  );
}
