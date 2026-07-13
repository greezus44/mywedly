import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  Mail,
  Check,
  X,
  Clock,
  Eye,
  TrendingUp,
} from "lucide-react";
import { supabase, type UserEvent, type EventGuest, type EventRsvp } from "../../lib/supabase";
import { cn } from "../../lib/utils";
import { Card, Badge, Skeleton, ErrorState } from "../../components/ui";

function AnalyticsPage() {
  const { eventId } = useParams<{ eventId: string }>();

  const { data: event, isLoading: eventLoading } = useQuery<UserEvent>({
    queryKey: ["event", eventId],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_events").select("*").eq("id", eventId!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!eventId,
  });

  const { data: guests, isLoading: guestsLoading } = useQuery<EventGuest[]>({
    queryKey: ["guests", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_guests")
        .select("*")
        .eq("event_id", eventId!);
      if (error) throw error;
      return data;
    },
    enabled: !!eventId,
  });

  const { data: rsvps, isLoading: rsvpsLoading } = useQuery<EventRsvp[]>({
    queryKey: ["rsvps", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_rsvps")
        .select("*")
        .eq("event_id", eventId!);
      if (error) throw error;
      return data;
    },
    enabled: !!eventId,
  });

  const stats = useMemo(() => {
    const totalGuests = guests?.length || 0;
    const rsvpsReceived = rsvps?.length || 0;
    const attending = (rsvps || []).filter((r) => r.status === "attending").length;
    const declined = (rsvps || []).filter((r) => r.status === "declined").length;
    const pending = totalGuests - rsvpsReceived;
    const responseRate = totalGuests > 0 ? Math.round((rsvpsReceived / totalGuests) * 100) : 0;
    return { totalGuests, rsvpsReceived, attending, declined, pending, responseRate };
  }, [guests, rsvps]);

  const isLoading = eventLoading || guestsLoading || rsvpsLoading;

  if (isLoading) {
    return (
      <div className="p-8">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!event) {
    return <ErrorState message="Failed to load analytics" />;
  }

  const maxBar = Math.max(stats.totalGuests, stats.rsvpsReceived, stats.attending, stats.declined, stats.pending, 1);

  const statCards = [
    { label: "Total Guests", value: stats.totalGuests, icon: Users, color: "text-onyx" },
    { label: "RSVPs Received", value: stats.rsvpsReceived, icon: Mail, color: "text-blue-600" },
    { label: "Attending", value: stats.attending, icon: Check, color: "text-green-700" },
    { label: "Declined", value: stats.declined, icon: X, color: "text-red-700" },
    { label: "Pending", value: stats.pending, icon: Clock, color: "text-amber-700" },
    { label: "Page Views", value: "—", icon: Eye, color: "text-onyx/40" },
  ];

  const barData = [
    { label: "Total Guests", value: stats.totalGuests, color: "bg-onyx" },
    { label: "RSVPs Received", value: stats.rsvpsReceived, color: "bg-blue-500" },
    { label: "Attending", value: stats.attending, color: "bg-green-600" },
    { label: "Declined", value: stats.declined, color: "bg-red-600" },
    { label: "Pending", value: stats.pending, color: "bg-amber-500" },
  ];

  return (
    <div>
      <div className="px-6 lg:px-8 py-6 border-b border-onyx/10">
        <h1 className="font-heading text-3xl text-onyx">Analytics</h1>
        <p className="mt-1 text-sm text-onyx/50">Overview of guests and RSVP responses</p>
      </div>

      <div className="p-6 lg:p-8 space-y-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {statCards.map(({ label, value, icon: Icon, color }) => (
            <Card key={label} className="p-4">
              <Icon className={cn("w-5 h-5 mb-2", color)} />
              <p className="font-heading text-2xl text-onyx">{value}</p>
              <p className="text-xs font-medium uppercase tracking-wider text-onyx/50 mt-1">{label}</p>
            </Card>
          ))}
        </div>

        {/* Response Rate */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-onyx/50" />
            <h2 className="font-heading text-xl text-onyx">Response Rate</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="h-3 bg-onyx/5 overflow-hidden">
                <div
                  className="h-full bg-onyx transition-all duration-500"
                  style={{ width: `${stats.responseRate}%` }}
                />
              </div>
            </div>
            <p className="font-heading text-2xl text-onyx w-16 text-right">{stats.responseRate}%</p>
          </div>
          <p className="mt-3 text-xs text-onyx/40">
            {stats.rsvpsReceived} of {stats.totalGuests} guests have responded
          </p>
        </Card>

        {/* Bar Chart */}
        <Card className="p-6">
          <h2 className="font-heading text-xl text-onyx mb-6">Breakdown</h2>
          <div className="space-y-5">
            {barData.map(({ label, value, color }) => (
              <div key={label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium uppercase tracking-wider text-onyx/60">{label}</span>
                  <span className="text-sm font-medium text-onyx">{value}</span>
                </div>
                <div className="h-6 bg-onyx/5 overflow-hidden">
                  <div
                    className={cn("h-full transition-all duration-500", color)}
                    style={{ width: `${(value / maxBar) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Attending vs Declined */}
        <Card className="p-6">
          <h2 className="font-heading text-xl text-onyx mb-4">Attending vs Declined</h2>
          {stats.rsvpsReceived > 0 ? (
            <div className="flex h-8 overflow-hidden">
              <div
                className="bg-green-600 flex items-center justify-center text-xs text-white font-medium"
                style={{ width: `${(stats.attending / stats.rsvpsReceived) * 100}%` }}
              >
                {stats.rsvpsReceived > 1 && `${Math.round((stats.attending / stats.rsvpsReceived) * 100)}%`}
              </div>
              <div
                className="bg-red-600 flex items-center justify-center text-xs text-white font-medium"
                style={{ width: `${(stats.declined / stats.rsvpsReceived) * 100}%` }}
              >
                {stats.rsvpsReceived > 1 && `${Math.round((stats.declined / stats.rsvpsReceived) * 100)}%`}
              </div>
            </div>
          ) : (
            <p className="text-sm text-onyx/40">No RSVPs received yet</p>
          )}
          <div className="flex gap-6 mt-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-green-600" />
              <span className="text-xs text-onyx/60">Attending ({stats.attending})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-red-600" />
              <span className="text-xs text-onyx/60">Declined ({stats.declined})</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default AnalyticsPage;
