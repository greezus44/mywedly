import { useOutletContext, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent, type EventGuest, type EventRsvp, type EventMessage } from "../../lib/supabase";
import { Card, Badge, Skeleton, ErrorState } from "../../components/ui";
import { Users, Mail, Check, X, Clock, MessageSquare, Calendar, MapPin, Eye, TrendingUp, UserPlus } from "lucide-react";
import { formatDate, getEventStatus } from "../../lib/utils";

interface OutletContext { event: UserEvent; }

export default function AnalyticsPage() {
  const { event } = useOutletContext<OutletContext>();
  const { eventId } = useParams();

  const { data: guests, isLoading: guestsLoading } = useQuery({
    queryKey: ["guests", eventId],
    queryFn: async () => {
      const { data, error } = await supabase.from("event_guests").select("*").eq("event_id", eventId);
      if (error) throw error;
      return data as EventGuest[];
    },
  });

  const { data: rsvps, isLoading: rsvpsLoading } = useQuery({
    queryKey: ["rsvps", eventId],
    queryFn: async () => {
      const { data, error } = await supabase.from("event_rsvps").select("*").eq("event_id", eventId);
      if (error) throw error;
      return data as EventRsvp[];
    },
  });

  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ["messages", eventId],
    queryFn: async () => {
      const { data, error } = await supabase.from("event_messages").select("*").eq("event_id", eventId).order("created_at", { ascending: false });
      if (error) throw error;
      return data as EventMessage[];
    },
  });

  const { data: subEvents } = useQuery({
    queryKey: ["sub_events", eventId],
    queryFn: async () => {
      const { data, error } = await supabase.from("sub_events").select("*").eq("parent_event_id", eventId);
      if (error) throw error;
      return data as { id: string; name: string }[];
    },
  });

  const isLoading = guestsLoading || rsvpsLoading || messagesLoading;

  if (isLoading) return <div className="p-8 space-y-6"><Skeleton className="h-32" /><Skeleton className="h-64" /></div>;

  const totalGuests = guests?.length || 0;
  const totalRsvps = rsvps?.length || 0;
  const attending = rsvps?.filter((r) => r.status === "attending").length || 0;
  const declined = rsvps?.filter((r) => r.status === "declined").length || 0;
  const pending = rsvps?.filter((r) => r.status === "pending").length || 0;
  const noResponse = totalGuests - totalRsvps;
  const plusOnes = rsvps?.reduce((sum, r) => sum + (r.plus_ones || 0), 0) || 0;
  const totalAttendees = attending + plusOnes;
  const responseRate = totalGuests > 0 ? Math.round((totalRsvps / totalGuests) * 100) : 0;
  const attendingRate = totalRsvps > 0 ? Math.round((attending / totalRsvps) * 100) : 0;

  const eventStatus = getEventStatus(event.draft_event_date || event.event_date);
  const statusVariant: "info" | "success" | "default" = eventStatus === "upcoming" ? "info" : eventStatus === "ongoing" ? "success" : "default";

  // Per sub-event RSVP breakdown
  const subEventStats = (subEvents || []).map((sub) => {
    const subRsvps = rsvps?.filter((r) => r.sub_event_id === sub.id) || [];
    return {
      name: sub.name,
      attending: subRsvps.filter((r) => r.status === "attending").length,
      declined: subRsvps.filter((r) => r.status === "declined").length,
      pending: subRsvps.filter((r) => r.status === "pending").length,
      total: subRsvps.length,
    };
  });

  const maxBar = Math.max(totalGuests, 1);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h2 className="font-heading text-2xl text-gray-900">Analytics</h2>
        <p className="text-sm text-gray-500 mt-1">Track guest engagement and RSVP statistics.</p>
      </div>

      {/* Event Summary */}
      <Card className="p-5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="font-heading text-lg text-gray-900">{event.draft_name || event.name}</h3>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <Badge variant={statusVariant}>{eventStatus}</Badge>
              {event.draft_event_date && <span className="text-sm text-gray-500">{formatDate(event.draft_event_date)}</span>}
              {event.draft_venue && <span className="text-sm text-gray-500 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{event.draft_venue}</span>}
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-heading text-gray-900">{responseRate}%</p>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Response Rate</p>
          </div>
        </div>
      </Card>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-gray-400 mb-1"><Users className="w-4 h-4" /></div>
          <p className="text-2xl font-heading text-gray-900">{totalGuests}</p>
          <p className="text-xs text-gray-500 uppercase tracking-wider">Total Guests</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-green-600 mb-1"><Check className="w-4 h-4" /></div>
          <p className="text-2xl font-heading text-gray-900">{attending}</p>
          <p className="text-xs text-gray-500 uppercase tracking-wider">Attending</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-red-600 mb-1"><X className="w-4 h-4" /></div>
          <p className="text-2xl font-heading text-gray-900">{declined}</p>
          <p className="text-xs text-gray-500 uppercase tracking-wider">Declined</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-amber-600 mb-1"><Clock className="w-4 h-4" /></div>
          <p className="text-2xl font-heading text-gray-900">{pending + noResponse}</p>
          <p className="text-xs text-gray-500 uppercase tracking-wider">No Response</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-blue-600 mb-1"><UserPlus className="w-4 h-4" /></div>
          <p className="text-2xl font-heading text-gray-900">{plusOnes}</p>
          <p className="text-xs text-gray-500 uppercase tracking-wider">Plus Ones</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-gray-400 mb-1"><TrendingUp className="w-4 h-4" /></div>
          <p className="text-2xl font-heading text-gray-900">{totalAttendees}</p>
          <p className="text-xs text-gray-500 uppercase tracking-wider">Total Attendees</p>
        </Card>
      </div>

      {/* RSVP Breakdown Chart */}
      <Card className="p-5">
        <h3 className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-4">RSVP Breakdown</h3>
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-green-700 flex items-center gap-1.5"><Check className="w-3.5 h-3.5" /> Attending</span>
              <span className="text-sm text-gray-600">{attending} ({totalRsvps > 0 ? attendingRate : 0}% of responses)</span>
            </div>
            <div className="h-6 bg-gray-100 rounded overflow-hidden">
              <div className="h-full bg-green-500 transition-all duration-500 rounded" style={{ width: `${(attending / maxBar) * 100}%` }} />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-red-700 flex items-center gap-1.5"><X className="w-3.5 h-3.5" /> Declined</span>
              <span className="text-sm text-gray-600">{declined}</span>
            </div>
            <div className="h-6 bg-gray-100 rounded overflow-hidden">
              <div className="h-full bg-red-500 transition-all duration-500 rounded" style={{ width: `${(declined / maxBar) * 100}%` }} />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-amber-700 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Pending</span>
              <span className="text-sm text-gray-600">{pending}</span>
            </div>
            <div className="h-6 bg-gray-100 rounded overflow-hidden">
              <div className="h-full bg-amber-500 transition-all duration-500 rounded" style={{ width: `${(pending / maxBar) * 100}%` }} />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-600 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> No Response</span>
              <span className="text-sm text-gray-600">{noResponse}</span>
            </div>
            <div className="h-6 bg-gray-100 rounded overflow-hidden">
              <div className="h-full bg-gray-400 transition-all duration-500 rounded" style={{ width: `${(noResponse / maxBar) * 100}%` }} />
            </div>
          </div>
        </div>
      </Card>

      {/* Sub-Event Breakdown */}
      {subEventStats.length > 0 && (
        <Card className="p-5">
          <h3 className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-4">Per-Event Breakdown</h3>
          <div className="space-y-4">
            {subEventStats.map((stat) => {
              const subMax = Math.max(stat.total, 1);
              return (
                <div key={stat.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900">{stat.name}</span>
                    <span className="text-sm text-gray-500">{stat.total} responses</span>
                  </div>
                  <div className="flex h-6 bg-gray-100 rounded overflow-hidden">
                    {stat.attending > 0 && <div className="bg-green-500 transition-all duration-500" style={{ width: `${(stat.attending / subMax) * 100}%` }} title={`${stat.attending} attending`} />}
                    {stat.declined > 0 && <div className="bg-red-500 transition-all duration-500" style={{ width: `${(stat.declined / subMax) * 100}%` }} title={`${stat.declined} declined`} />}
                    {stat.pending > 0 && <div className="bg-amber-500 transition-all duration-500" style={{ width: `${(stat.pending / subMax) * 100}%` }} title={`${stat.pending} pending`} />}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <span className="text-green-600">{stat.attending} attending</span>
                    <span className="text-red-600">{stat.declined} declined</span>
                    <span className="text-amber-600">{stat.pending} pending</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Messages */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-medium uppercase tracking-wider text-gray-500">Guest Messages</h3>
          <span className="text-sm text-gray-500">{messages?.length || 0} total</span>
        </div>
        {!messages || messages.length === 0 ? (
          <p className="text-sm text-gray-400">No messages yet.</p>
        ) : (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {(messages || []).slice(0, 10).map((msg) => (
              <div key={msg.id} className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-sm font-medium text-gray-900">{msg.guest_name}</span>
                  <span className="text-xs text-gray-400">{formatDate(msg.created_at)}</span>
                </div>
                <p className="text-sm text-gray-600">{msg.message}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
