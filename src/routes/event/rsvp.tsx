import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase, type EventRsvp } from "../../lib/supabase";
import { useOutletContext } from "./event-layout";
import {
  Card,
  LoadingSpinner,
  ErrorState,
  EmptyState,
  Badge,
} from "../../components/ui";
import { formatDateTime } from "../../lib/utils";

export default function Rsvp() {
  const { eventId } = useOutletContext();

  const { data: rsvps, isLoading, isError } = useQuery({
    queryKey: ["event_rsvps", eventId],
    enabled: !!eventId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_rsvps")
        .select("*")
        .eq("event_id", eventId)
        .order("submitted_at", { ascending: false });
      if (error) throw error;
      return data as EventRsvp[];
    },
  });

  const stats = useMemo(() => {
    const total = rsvps?.length ?? 0;
    const attending = rsvps?.filter((r) => r.status === "attending").length ?? 0;
    const notAttending = rsvps?.filter((r) => r.status === "not_attending").length ?? 0;
    const pending = rsvps?.filter((r) => r.status === "pending").length ?? 0;
    const totalPlusOnes = rsvps?.reduce((sum, r) => sum + (r.plus_ones ?? 0), 0) ?? 0;
    return { total, attending, notAttending, pending, totalPlusOnes };
  }, [rsvps]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return <ErrorState description="Failed to load RSVPs" />;
  }

  const statCards = [
    { label: "Total RSVPs", value: stats.total, variant: "info" as const },
    { label: "Attending", value: stats.attending, variant: "success" as const },
    { label: "Not Attending", value: stats.notAttending, variant: "danger" as const },
    { label: "Pending", value: stats.pending, variant: "warning" as const },
    { label: "Total Plus Ones", value: stats.totalPlusOnes, variant: "default" as const },
  ];

  return (
    <div className="mx-auto max-w-4xl">
      <h2 className="mb-6 text-lg font-semibold text-dash-text">RSVP Responses</h2>

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {statCards.map((stat) => (
          <Card key={stat.label} className="p-4">
            <p className="text-sm text-dash-muted">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold text-dash-text">{stat.value}</p>
          </Card>
        ))}
      </div>

      {/* RSVP list */}
      {!rsvps || rsvps.length === 0 ? (
        <EmptyState
          title="No RSVPs yet"
          description="RSVP responses will appear here once guests submit them."
          icon={<span className="text-4xl">✉️</span>}
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-dash-bg">
                <tr className="text-left text-dash-muted">
                  <th className="px-4 py-3">Guest</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Plus Ones</th>
                  <th className="px-4 py-3">Dietary</th>
                  <th className="px-4 py-3">Message</th>
                  <th className="px-4 py-3">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {rsvps.map((rsvp) => (
                  <tr key={rsvp.id} className="border-t border-dash-border">
                    <td className="px-4 py-3 font-medium text-dash-text">
                      {rsvp.guest_name}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          rsvp.status === "attending"
                            ? "success"
                            : rsvp.status === "not_attending"
                            ? "danger"
                            : "warning"
                        }
                      >
                        {rsvp.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-dash-muted">{rsvp.plus_ones}</td>
                    <td className="px-4 py-3 text-dash-muted">
                      {rsvp.dietary ? (
                        <span className="line-clamp-2 max-w-[150px]">
                          {rsvp.dietary}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-dash-muted">
                      {rsvp.message ? (
                        <span className="line-clamp-2 max-w-[200px]">
                          {rsvp.message}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-dash-muted">
                      {formatDateTime(rsvp.submitted_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
