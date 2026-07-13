import React from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent, type EventRsvp } from "../../lib/supabase";
import { Card, EmptyState, LoadingSpinner, ErrorState, Badge } from "../../components/ui";
import { formatDate } from "../../lib/utils";

const STATUS_VARIANTS: Record<string, "success" | "danger" | "warning" | "default"> = {
  attending: "success",
  declined: "danger",
  pending: "warning",
};

export default function Rsvp() {
  const { event } = useOutletContext<{ event: UserEvent }>();

  const { data: rsvps, isLoading, isError, refetch } = useQuery({
    queryKey: ["rsvps", event.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_rsvps")
        .select("*")
        .eq("event_id", event.id)
        .order("submitted_at", { ascending: false });
      if (error) throw error;
      return data as EventRsvp[];
    },
  });

  const stats = {
    total: rsvps?.length ?? 0,
    attending: rsvps?.filter((r) => r.status === "attending").length ?? 0,
    declined: rsvps?.filter((r) => r.status === "declined").length ?? 0,
    pending: rsvps?.filter((r) => r.status === "pending").length ?? 0,
    totalGuests: rsvps?.reduce((sum, r) => sum + (r.plus_ones + 1), 0) ?? 0,
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <h2 className="text-lg font-semibold text-dash-text">RSVP Responses</h2>
        <p className="mt-1 text-sm text-dash-muted">View and track guest RSVP submissions.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs font-medium uppercase text-dash-muted">Total Responses</p>
          <p className="mt-1 text-2xl font-bold text-dash-text">{stats.total}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium uppercase text-dash-muted">Attending</p>
          <p className="mt-1 text-2xl font-bold text-green-600">{stats.attending}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium uppercase text-dash-muted">Declined</p>
          <p className="mt-1 text-2xl font-bold text-red-600">{stats.declined}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium uppercase text-dash-muted">Total Guests</p>
          <p className="mt-1 text-2xl font-bold text-dash-text">{stats.totalGuests}</p>
        </Card>
      </div>

      {/* RSVP List */}
      {isLoading ? (
        <div className="flex justify-center py-12"><LoadingSpinner /></div>
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !rsvps || rsvps.length === 0 ? (
        <EmptyState
          title="No RSVP responses yet"
          description="Guest RSVP submissions will appear here."
        />
      ) : (
        <div className="space-y-3">
          {rsvps.map((rsvp) => (
            <Card key={rsvp.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-dash-text">{rsvp.guest_name}</h3>
                    <Badge variant={STATUS_VARIANTS[rsvp.status] ?? "default"}>
                      {rsvp.status}
                    </Badge>
                  </div>
                  <div className="mt-1 text-sm text-dash-muted">
                    {rsvp.plus_ones > 0 && <span>+{rsvp.plus_ones} guests</span>}
                    {" • "}
                    Submitted {formatDate(rsvp.submitted_at)}
                  </div>
                  {rsvp.dietary && (
                    <p className="mt-2 text-sm text-dash-text">
                      <span className="text-dash-muted">Dietary:</span> {rsvp.dietary}
                    </p>
                  )}
                  {rsvp.message && (
                    <p className="mt-1 text-sm text-dash-text">
                      <span className="text-dash-muted">Message:</span> {rsvp.message}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
