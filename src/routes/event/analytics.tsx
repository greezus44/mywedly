import { useMemo } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent, type EventRsvp, type EventMessage } from "../../lib/supabase";
import { getRsvpStatus, formatDeadline, formatDate, formatTime } from "../../lib/utils";
import { Card, Skeleton, ErrorState, EmptyState, Badge } from "../../components/ui";
import { Users, CheckCircle, XCircle, HelpCircle, MessageSquare, Clock, TrendingUp } from "lucide-react";

export default function AnalyticsPage() {
  const { event } = useOutletContext<{ event: UserEvent | null }>();
  const { eventId } = useParams<{ eventId: string }>();

  const { data: rsvps, isLoading: rsvpLoading, isError: rsvpError } = useQuery({
    queryKey: ["rsvps", eventId],
    queryFn: async () => {
      if (!eventId) return [];
      const { data, error } = await supabase.from("event_rsvps").select("*").eq("event_id", eventId).order("submitted_at", { ascending: false });
      if (error) throw error;
      return data as EventRsvp[];
    },
    enabled: !!eventId,
  });

  const { data: messages, isLoading: msgLoading, isError: msgError } = useQuery({
    queryKey: ["messages", eventId],
    queryFn: async () => {
      if (!eventId) return [];
      const { data, error } = await supabase.from("event_messages").select("*").eq("event_id", eventId).order("created_at", { ascending: false }).limit(10);
      if (error) throw error;
      return data as EventMessage[];
    },
    enabled: !!eventId,
  });

  const { data: guestCount } = useQuery({
    queryKey: ["guestCount", eventId],
    queryFn: async () => {
      if (!eventId) return 0;
      const { count, error } = await supabase.from("event_guests").select("*", { count: "exact", head: true }).eq("event_id", eventId);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!eventId,
  });

  const stats = useMemo(() => {
    if (!rsvps) return { attending: 0, declined: 0, pending: 0, total: 0 };
    return {
      attending: rsvps.filter((r) => r.status === "attending").length,
      declined: rsvps.filter((r) => r.status === "declined").length,
      pending: rsvps.filter((r) => r.status === "pending").length,
      total: rsvps.length,
    };
  }, [rsvps]);

  const rsvpDeadlineStatus = getRsvpStatus(event?.draft_rsvp_deadline || event?.rsvp_deadline || null);
  const totalRsvp = stats.total || 1;

  if (!event) {
    return (
      <div className="p-6">
        <Skeleton className="h-8 w-48 mb-4" />
        <div className="grid grid-cols-5 gap-4 mb-6">
          {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const statCards = [
    { label: "Total Guests", value: guestCount ?? 0, icon: Users, color: "text-slate-900" },
    { label: "Attending", value: stats.attending, icon: CheckCircle, color: "text-green-600" },
    { label: "Declined", value: stats.declined, icon: XCircle, color: "text-red-600" },
    { label: "Pending", value: stats.pending, icon: HelpCircle, color: "text-amber-600" },
    { label: "Messages", value: messages?.length || 0, icon: MessageSquare, color: "text-blue-600" },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900">Analytics</h1>
        <p className="text-sm text-slate-500">Overview of your event engagement</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {statCards.map((s) => (
          <Card key={s.label} className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <s.icon className={`w-4 h-4 ${s.color}`} />
              <span className="text-xs font-medium text-slate-500">{s.label}</span>
            </div>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="p-6">
          <h2 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4" /> RSVP Breakdown</h2>
          {rsvpLoading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => <Skeleton key={i} className="h-8 w-full" />)}
            </div>
          ) : rsvpError ? (
            <ErrorState message="Failed to load RSVP data" />
          ) : stats.total === 0 ? (
            <EmptyState title="No RSVPs yet" description="RSVP data will appear here once guests respond" />
          ) : (
            <div className="space-y-4">
              {[
                { label: "Attending", value: stats.attending, color: "bg-green-500", textColor: "text-green-600" },
                { label: "Declined", value: stats.declined, color: "bg-red-500", textColor: "text-red-600" },
                { label: "Pending", value: stats.pending, color: "bg-amber-500", textColor: "text-amber-600" },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-700">{item.label}</span>
                    <span className={`text-sm font-semibold ${item.textColor}`}>{item.value} ({Math.round((item.value / totalRsvp) * 100)}%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${item.color} rounded-full transition-all duration-500`} style={{ width: `${(item.value / totalRsvp) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2"><Clock className="w-4 h-4" /> RSVP Deadline</h2>
          {rsvpDeadlineStatus === "no-deadline" ? (
            <EmptyState title="No deadline set" description="Set an RSVP deadline in settings to track urgency" />
          ) : (
            <div className="space-y-3">
              <div>
                <span className="text-sm text-slate-500">Status</span>
                <div className="mt-1">
                  <Badge variant={rsvpDeadlineStatus === "closed" ? "error" : rsvpDeadlineStatus === "closing-soon" ? "warning" : "success"}>
                    {rsvpDeadlineStatus === "closed" ? "Closed" : rsvpDeadlineStatus === "closing-soon" ? "Closing Soon" : "Open"}
                  </Badge>
                </div>
              </div>
              <div>
                <span className="text-sm text-slate-500">Deadline</span>
                <p className="text-sm font-medium text-slate-900 mt-1">{formatDeadline(event.draft_rsvp_deadline || event.rsvp_deadline || null)}</p>
              </div>
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">Recent Messages</h2>
          {msgLoading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : msgError ? (
            <ErrorState message="Failed to load messages" />
          ) : !messages || messages.length === 0 ? (
            <EmptyState icon={<MessageSquare className="w-10 h-10" />} title="No messages" description="Guest messages will appear here" />
          ) : (
            <div className="space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-900">{msg.guest_name}</span>
                    <span className="text-xs text-slate-400">{formatDate(msg.created_at)}</span>
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-2">{msg.message}</p>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">Recent RSVPs</h2>
          {rsvpLoading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : rsvpError ? (
            <ErrorState message="Failed to load RSVPs" />
          ) : !rsvps || rsvps.length === 0 ? (
            <EmptyState title="No RSVPs yet" description="RSVP responses will appear here" />
          ) : (
            <div className="space-y-3">
              {rsvps.slice(0, 10).map((rsvp) => (
                <div key={rsvp.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <div>
                    <span className="text-sm font-medium text-slate-900">{rsvp.guest_name}</span>
                    <p className="text-xs text-slate-400">{formatDate(rsvp.submitted_at)} {formatTime(rsvp.submitted_at.split("T")[1] || null)}</p>
                  </div>
                  <Badge variant={rsvp.status === "attending" ? "success" : rsvp.status === "declined" ? "error" : "warning"}>
                    {rsvp.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
