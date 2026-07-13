import { useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Users, Check, X, BarChart3 } from "lucide-react";
import { supabase, type UserEvent } from "../../lib/supabase";
import { Card, Skeleton, ErrorState } from "../../components/ui";

async function fetchStats(eventId: string) {
  const [{ data: guests, error: gErr }, { data: rsvps, error: rErr }] =
    await Promise.all([
      supabase.from("event_guests").select("*").eq("event_id", eventId),
      supabase.from("event_rsvps").select("*").eq("event_id", eventId),
    ]);
  if (gErr) throw gErr;
  if (rErr) throw rErr;
  return {
    guests: guests ?? [],
    rsvps: rsvps ?? [],
  };
}

export default function AnalyticsPage() {
  const { event } = useOutletContext<{ event: UserEvent }>();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["analytics", event.id],
    queryFn: () => fetchStats(event.id),
  });

  const totalGuests = data?.guests.length ?? 0;
  const totalRsvps = data?.rsvps.length ?? 0;
  const attending = data?.rsvps.filter((r) => r.status === "attending").length ?? 0;
  const declined = data?.rsvps.filter((r) => r.status === "declined").length ?? 0;
  const pending = data?.rsvps.filter((r) => r.status === "pending").length ?? 0;

  const responseRate = totalGuests > 0
    ? Math.round((totalRsvps / totalGuests) * 100)
    : 0;

  const attendingPct = totalRsvps > 0 ? Math.round((attending / totalRsvps) * 100) : 0;
  const declinedPct = totalRsvps > 0 ? Math.round((declined / totalRsvps) * 100) : 0;
  const pendingPct = totalRsvps > 0 ? Math.round((pending / totalRsvps) * 100) : 0;

  if (isLoading) {
    return (
      <div className="h-full overflow-y-auto p-4">
        <div className="mx-auto max-w-4xl space-y-6 p-4">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-40" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <ErrorState
          message={error instanceof Error ? error.message : "Failed to load analytics"}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const stats = [
    { label: "Total Guests", value: totalGuests, icon: Users, color: "text-gray-900", bg: "bg-gray-50" },
    { label: "RSVPs Received", value: totalRsvps, icon: BarChart3, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Attending", value: attending, icon: Check, color: "text-green-600", bg: "bg-green-50" },
    { label: "Declined", value: declined, icon: X, color: "text-red-600", bg: "bg-red-50" },
  ];

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="mx-auto max-w-4xl space-y-6 p-4">
        <div>
          <h2 className="font-heading text-xl font-bold text-gray-900">
            Statistics
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Overview of your event's guest engagement.
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="p-4">
              <div className={`mb-2 inline-flex rounded-lg ${stat.bg} p-2`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-500">{stat.label}</p>
            </Card>
          ))}
        </div>

        {/* Response rate */}
        <Card className="space-y-4 p-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
            Response Rate
          </h3>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              {totalRsvps} of {totalGuests} guests responded
            </span>
            <span className="font-bold text-gray-900">{responseRate}%</span>
          </div>
          <div className="h-4 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-gray-900 transition-all duration-500"
              style={{ width: `${responseRate}%` }}
            />
          </div>
        </Card>

        {/* RSVP breakdown */}
        {totalRsvps > 0 && (
          <Card className="space-y-4 p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
              RSVP Breakdown
            </h3>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-green-600">Attending</span>
                  <span className="font-medium text-gray-900">
                    {attending} ({attendingPct}%)
                  </span>
                </div>
                <div className="mt-1 h-3 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-green-500 transition-all duration-500"
                    style={{ width: `${attendingPct}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-red-600">Declined</span>
                  <span className="font-medium text-gray-900">
                    {declined} ({declinedPct}%)
                  </span>
                </div>
                <div className="mt-1 h-3 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-red-500 transition-all duration-500"
                    style={{ width: `${declinedPct}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-amber-600">Pending</span>
                  <span className="font-medium text-gray-900">
                    {pending} ({pendingPct}%)
                  </span>
                </div>
                <div className="mt-1 h-3 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-amber-500 transition-all duration-500"
                    style={{ width: `${pendingPct}%` }}
                  />
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
