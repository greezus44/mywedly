import { useMemo } from "react";
import { useOutletContext, useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, UserEvent } from "../../lib/supabase";
import { Badge, ErrorState, Skeleton } from "../../components/ui/index";
import { Users, Check, X, Clock, MessageSquare, TrendingUp } from "lucide-react";

type Ctx = { event: UserEvent | null };

export default function Analytics() {
  const { event } = useOutletContext<Ctx>();
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

  const { data: guests = [], isLoading: guestsLoading, isError: guestsError, refetch: refetchGuests } = useQuery({
    queryKey: ["guests", eventId],
    queryFn: async () => {
      const { data, error } = await supabase.from("event_guests").select("*").eq("event_id", eventId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!eventId,
    staleTime: 30000,
  });

  const { data: rsvps = [], isLoading: rsvpsLoading, isError: rsvpsError, refetch: refetchRsvps } = useQuery({
    queryKey: ["rsvps", eventId],
    queryFn: async () => {
      const { data, error } = await supabase.from("event_rsvps").select("*").eq("event_id", eventId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!eventId,
    staleTime: 30000,
  });

  const { data: messages = [], isLoading: messagesLoading, isError: messagesError, refetch: refetchMessages } = useQuery({
    queryKey: ["messages", eventId],
    queryFn: async () => {
      const { data, error } = await supabase.from("event_messages").select("*").eq("event_id", eventId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!eventId,
    staleTime: 30000,
  });

  const stats = useMemo(() => {
    const total = guests.length;
    const attending = guests.filter(g => g.rsvp_status === "attending").length;
    const declined = guests.filter(g => g.rsvp_status === "declined").length;
    const pending = guests.filter(g => !g.rsvp_status || g.rsvp_status === "pending").length;
    const rsvpAttending = rsvps.filter(r => r.status === "attending").length;
    const rsvpDeclined = rsvps.filter(r => r.status === "declined").length;
    const rsvpMaybe = rsvps.filter(r => r.status === "maybe").length;
    return {
      total, attending, declined, pending,
      messages: messages.length,
      rsvpAttending, rsvpDeclined, rsvpMaybe,
      rsvpTotal: rsvps.length,
      attendanceRate: total > 0 ? Math.round((attending / total) * 100) : 0,
    };
  }, [guests, rsvps, messages]);

  if (!event) return <ErrorState message="Could not load event data" onRetry={() => navigate("/dashboard")} />;

  const isLoading = guestsLoading || rsvpsLoading || messagesLoading;
  const isError = guestsError || rsvpsError || messagesError;
  const retry = () => { refetchGuests(); refetchRsvps(); refetchMessages(); };

  if (isError) return <ErrorState message="Failed to load analytics" onRetry={retry} />;

  const cards = [
    { label: "Total Guests", value: stats.total, icon: <Users className="w-5 h-5" />, color: "text-gray-900" },
    { label: "Attending", value: stats.attending, icon: <Check className="w-5 h-5" />, color: "text-green-600" },
    { label: "Declined", value: stats.declined, icon: <X className="w-5 h-5" />, color: "text-red-600" },
    { label: "Pending", value: stats.pending, icon: <Clock className="w-5 h-5" />, color: "text-gray-500" },
    { label: "Messages", value: stats.messages, icon: <MessageSquare className="w-5 h-5" />, color: "text-blue-600" },
    { label: "Attendance Rate", value: `${stats.attendanceRate}%`, icon: <TrendingUp className="w-5 h-5" />, color: "text-gray-900" },
  ];

  const breakdown = [
    { label: "Attending", count: stats.rsvpAttending, color: "bg-green-500" },
    { label: "Maybe", count: stats.rsvpMaybe, color: "bg-yellow-500" },
    { label: "Declined", count: stats.rsvpDeclined, color: "bg-red-500" },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-500">Overview of your event</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {cards.map(card => (
              <div key={card.label} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500">{card.label}</span>
                  <span className={card.color}>{card.icon}</span>
                </div>
                <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
              </div>
            ))}
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900">RSVP Breakdown</h3>
              <Badge variant="info">{stats.rsvpTotal} responses</Badge>
            </div>
            {stats.rsvpTotal === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">No RSVP responses yet</p>
            ) : (
              <div className="space-y-4">
                {breakdown.map(item => {
                  const pct = stats.rsvpTotal > 0 ? (item.count / stats.rsvpTotal) * 100 : 0;
                  return (
                    <div key={item.label}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium text-gray-700">{item.label}</span>
                        <span className="text-sm text-gray-500">{item.count} ({Math.round(pct)}%)</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full ${item.color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Guest Summary</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-500">Invited</p>
                <p className="text-lg font-bold text-gray-900">{stats.total}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Responded</p>
                <p className="text-lg font-bold text-gray-900">{stats.attending + stats.declined}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Awaiting Reply</p>
                <p className="text-lg font-bold text-gray-900">{stats.pending}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Plus Ones (RSVP)</p>
                <p className="text-lg font-bold text-gray-900">{rsvps.reduce((sum, r) => sum + (r.plus_ones || 0), 0)}</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
