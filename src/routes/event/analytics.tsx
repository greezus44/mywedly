import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useOutletContext } from "react-router-dom";
import { Users, CheckCircle2, XCircle, Clock, BarChart3 } from "lucide-react";
import { supabase, type UserEvent } from "../../lib/supabase";
import {
  Card,
  EmptyState,
  ErrorState,
  LoadingSpinner,
} from "../../components/ui";

export default function AnalyticsPage() {
  const { event } = useOutletContext<{ event: UserEvent }>();

  const { data: stats, isLoading, error, refetch } = useQuery({
    queryKey: ["event-analytics", event.id],
    queryFn: async () => {
      // Get guest count
      const { count: guestCount, error: guestError } = await supabase
        .from("event_guests")
        .select("*", { count: "exact", head: true })
        .eq("event_id", event.id);

      if (guestError) throw guestError;

      // Get RSVPs
      const { data: rsvps, error: rsvpError } = await supabase
        .from("event_rsvps")
        .select("status")
        .eq("event_id", event.id);

      if (rsvpError) throw rsvpError;

      const rsvpList = rsvps || [];
      const attending = rsvpList.filter((r) => r.status === "attending").length;
      const declined = rsvpList.filter((r) => r.status === "declined").length;
      const pending = rsvpList.filter((r) => r.status === "pending").length;
      const totalRsvps = rsvpList.length;

      return {
        guestCount: guestCount || 0,
        attending,
        declined,
        pending,
        totalRsvps,
      };
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <ErrorState
          message={error instanceof Error ? error.message : "Failed to load analytics"}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const guestCount = stats?.guestCount || 0;
  const attending = stats?.attending || 0;
  const declined = stats?.declined || 0;
  const pending = stats?.pending || 0;
  const totalRsvps = stats?.totalRsvps || 0;

  const responseRate = guestCount > 0 ? Math.round((totalRsvps / guestCount) * 100) : 0;
  const attendingRate = totalRsvps > 0 ? Math.round((attending / totalRsvps) * 100) : 0;
  const declinedRate = totalRsvps > 0 ? Math.round((declined / totalRsvps) * 100) : 0;

  const statCards = [
    {
      label: "Total Guests",
      value: guestCount,
      icon: <Users className="h-5 w-5 text-gray-500" />,
    },
    {
      label: "Attending",
      value: attending,
      icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
    },
    {
      label: "Declined",
      value: declined,
      icon: <XCircle className="h-5 w-5 text-red-500" />,
    },
    {
      label: "Pending",
      value: pending,
      icon: <Clock className="h-5 w-5 text-amber-500" />,
    },
  ];

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Analytics</h1>
        <p className="mt-1 text-sm text-gray-500">
          Track guest engagement and RSVP responses
        </p>
      </div>

      {guestCount === 0 && totalRsvps === 0 ? (
        <Card>
          <EmptyState
            icon={<BarChart3 className="h-12 w-12" />}
            title="No data yet"
            description="Add guests and collect RSVPs to see analytics here."
          />
        </Card>
      ) : (
        <>
          {/* Stat cards */}
          <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            {statCards.map((stat, idx) => (
              <Card key={idx} className="p-4">
                <div className="flex items-center gap-2">
                  {stat.icon}
                  <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
                    {stat.label}
                  </span>
                </div>
                <p className="mt-2 text-2xl font-bold text-gray-900">{stat.value}</p>
              </Card>
            ))}
          </div>

          {/* Response rate bar */}
          <Card className="mb-6 p-5">
            <h3 className="text-sm font-semibold text-gray-700">Response Rate</h3>
            <p className="mt-1 text-xs text-gray-500">
              {totalRsvps} of {guestCount} guests have responded
            </p>
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                <span>Responses</span>
                <span>{responseRate}%</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-gray-900 transition-all"
                  style={{ width: `${responseRate}%` }}
                />
              </div>
            </div>
          </Card>

          {/* RSVP breakdown */}
          {totalRsvps > 0 && (
            <Card className="p-5">
              <h3 className="text-sm font-semibold text-gray-700">RSVP Breakdown</h3>
              <div className="mt-4 flex flex-col gap-4">
                {/* Attending */}
                <div>
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                      Attending
                    </span>
                    <span>{attending} ({attendingRate}%)</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-green-500 transition-all"
                      style={{ width: `${attendingRate}%` }}
                    />
                  </div>
                </div>

                {/* Declined */}
                <div>
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <XCircle className="h-3.5 w-3.5 text-red-500" />
                      Declined
                    </span>
                    <span>{declined} ({declinedRate}%)</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-red-500 transition-all"
                      style={{ width: `${declinedRate}%` }}
                    />
                  </div>
                </div>

                {/* Pending */}
                <div>
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-amber-500" />
                      Pending
                    </span>
                    <span>{pending}</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-amber-500 transition-all"
                      style={{ width: `${totalRsvps > 0 ? Math.round((pending / totalRsvps) * 100) : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
