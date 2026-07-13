import { useMemo } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent, type EventRsvp, type EventMessage, type EventGuest } from "../../lib/supabase";
import { Card, Badge, Skeleton, ErrorState, EmptyState } from "../../components/ui";
import {
  Users, CheckCircle, XCircle, Clock, MessageSquare, Loader2, Calendar,
} from "lucide-react";
import { getRsvpStatus, formatDeadline, formatDate } from "../../lib/utils";

export default function Analytics() {
  const { event } = useOutletContext<{ event: UserEvent | null }>();
  const { eventId } = useParams<{ eventId: string }>();

  const { data: guests, isLoading: guestsLoading, error: guestsError } = useQuery<EventGuest[], Error>({
    queryKey: ["guests-analytics", eventId],
    queryFn: async () => {
      const { data, error } = await supabase.from("event_guests").select("*").eq("event_id", eventId!);
      if (error) throw error;
      return data || [];
    },
    enabled: !!eventId,
  });

  const { data: rsvps, isLoading: rsvpsLoading, error: rsvpsError } = useQuery<EventRsvp[], Error>({
    queryKey: ["rsvps-analytics", eventId],
    queryFn: async () => {
      const { data, error } = await supabase.from("event_rsvps").select("*").eq("event_id", eventId!).order("submitted_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!eventId,
  });

  const { data: messages, isLoading: messagesLoading, error: messagesError } = useQuery<EventMessage[], Error>({
    queryKey: ["messages-analytics", eventId],
    queryFn: async () => {
      const { data, error } = await supabase.from("event_messages").select("*").eq("event_id", eventId!).order("created_at", { ascending: false }).limit(10);
      if (error) throw error;
      return data || [];
    },
    enabled: !!eventId,
  });

  const stats = useMemo(() => {
    const totalGuests = guests?.length || 0;
    const attending = rsvps?.filter((r) => r.status === "attending").length || 0;
    const declined = rsvps?.filter((r) => r.status === "declined").length || 0;
    const pending = rsvps?.filter((r) => r.status === "pending").length || 0;
    const totalRsvps = rsvps?.length || 0;
    const totalPlusOnes = rsvps?.reduce((sum, r) => sum + (r.plus_ones || 0), 0) || 0;
    const attendingPct = totalRsvps > 0 ? (attending / totalRsvps) * 100 : 0;
    const declinedPct = totalRsvps > 0 ? (declined / totalRsvps) * 100 : 0;
    const pendingPct = totalRsvps > 0 ? (pending / totalRsvps) * 100 : 0;
    return { totalGuests, attending, declined, pending, totalRsvps, totalPlusOnes, attendingPct, declinedPct, pendingPct };
  }, [guests, rsvps]);

  const deadline = event?.draft_rsvp_deadline || event?.rsvp_deadline || null;
  const rsvpStatus = getRsvpStatus(deadline);

  if (!event) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-slate-900">Analytics</h1>
        <p className="text-sm text-slate-500">Overview of your event engagement.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        {guestsLoading ? (
          <Skeleton className="h-24" />
        ) : (
          <Card className="p-4">
            <div className="flex items-center gap-2 text-slate-400 mb-1"><Users className="w-4 h-4" /><span className="text-xs">Guests</span></div>
            <div className="text-2xl font-bold text-slate-900">{stats.totalGuests}</div>
          </Card>
        )}
        <Card className="p-4">
          <div className="flex items-center gap-2 text-slate-400 mb-1"><CheckCircle className="w-4 h-4" /><span className="text-xs">Attending</span></div>
          <div className="text-2xl font-bold text-green-600">{stats.attending}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-slate-400 mb-1"><XCircle className="w-4 h-4" /><span className="text-xs">Declined</span></div>
          <div className="text-2xl font-bold text-red-600">{stats.declined}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-slate-400 mb-1"><Clock className="w-4 h-4" /><span className="text-xs">Pending</span></div>
          <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-slate-400 mb-1"><MessageSquare className="w-4 h-4" /><span className="text-xs">Messages</span></div>
          <div className="text-2xl font-bold text-slate-900">{messages?.length || 0}</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <Card className="p-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">RSVP Breakdown</h3>
          {rsvpsLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : (rsvpsError as any) ? (
            <ErrorState message={(rsvpsError as any).message || "Failed to load RSVPs"} />
          ) : stats.totalRsvps === 0 ? (
            <EmptyState title="No RSVPs yet" description="RSVP data will appear here once guests respond." />
          ) : (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-slate-600">Attending</span>
                  <span className="text-sm font-medium text-slate-900">{stats.attending} ({Math.round(stats.attendingPct)}%)</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${stats.attendingPct}%` }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-slate-600">Declined</span>
                  <span className="text-sm font-medium text-slate-900">{stats.declined} ({Math.round(stats.declinedPct)}%)</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500 rounded-full transition-all" style={{ width: `${stats.declinedPct}%` }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-slate-600">Pending</span>
                  <span className="text-sm font-medium text-slate-900">{stats.pending} ({Math.round(stats.pendingPct)}%)</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${stats.pendingPct}%` }} />
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100 text-sm text-slate-500">
                Total plus ones: <span className="font-medium text-slate-900">{stats.totalPlusOnes}</span>
              </div>
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">RSVP Deadline</h3>
          {deadline ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-slate-400" />
                <span className="text-sm font-medium text-slate-900">{formatDeadline(deadline)}</span>
              </div>
              <div>
                {rsvpStatus === "open" && <Badge variant="success">Open</Badge>}
                {rsvpStatus === "closing-soon" && <Badge variant="warning">Closing Soon</Badge>}
                {rsvpStatus === "closed" && <Badge variant="error">Closed</Badge>}
                {rsvpStatus === "no-deadline" && <Badge variant="default">No Deadline</Badge>}
              </div>
            </div>
          ) : (
            <EmptyState title="No deadline set" description="Set an RSVP deadline in settings to track closing status." />
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Recent Messages</h3>
          {messagesLoading ? (
            <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : (messagesError as any) ? (
            <ErrorState message={(messagesError as any).message || "Failed to load messages"} />
          ) : !messages || messages.length === 0 ? (
            <EmptyState icon={<MessageSquare className="w-8 h-8" />} title="No messages" description="Guest messages will appear here." />
          ) : (
            <div className="space-y-3">
              {messages.map((m) => (
                <div key={m.id} className="border-b border-slate-50 pb-3 last:border-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-900">{m.guest_name}</span>
                    <span className="text-xs text-slate-400">{formatDate(m.created_at)}</span>
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-2">{m.message}</p>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Recent RSVPs</h3>
          {rsvpsLoading ? (
            <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : (rsvpsError as any) ? (
            <ErrorState message={(rsvpsError as any).message || "Failed to load RSVPs"} />
          ) : !rsvps || rsvps.length === 0 ? (
            <EmptyState icon={<CheckCircle className="w-8 h-8" />} title="No RSVPs" description="RSVP responses will appear here." />
          ) : (
            <div className="space-y-3">
              {rsvps.slice(0, 10).map((r) => (
                <div key={r.id} className="flex items-center justify-between border-b border-slate-50 pb-3 last:border-0">
                  <div>
                    <span className="text-sm font-medium text-slate-900">{r.guest_name || "Unknown"}</span>
                    {r.plus_ones > 0 && <span className="text-xs text-slate-400 ml-2">+{r.plus_ones}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    {r.status === "attending" && <Badge variant="success">Attending</Badge>}
                    {r.status === "declined" && <Badge variant="error">Declined</Badge>}
                    {r.status === "pending" && <Badge variant="warning">Pending</Badge>}
                    <span className="text-xs text-slate-400">{formatDate(r.submitted_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
