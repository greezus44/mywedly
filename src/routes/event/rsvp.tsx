import React from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import type { UserEvent, EventRsvp } from "../../lib/supabase";
import { Card, Badge, LoadingSpinner, ErrorState, EmptyState } from "../../components/ui";
import { formatDateTime, cn } from "../../lib/utils";

export function RsvpPage() {
  const { event, eventId } = useOutletContext<{ event: UserEvent; eventId: string }>();

  const {
    data: rsvps,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["event-rsvps", eventId],
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return <ErrorState message="Failed to load RSVPs" onRetry={() => refetch()} />;
  }

  const total = rsvps?.length ?? 0;
  const attending = (rsvps ?? []).filter((r) => r.status === "attending").length;
  const declined = (rsvps ?? []).filter((r) => r.status === "declined").length;
  const pending = (rsvps ?? []).filter((r) => !r.status || r.status === "pending").length;
  const totalGuests = (rsvps ?? [])
    .filter((r) => r.status === "attending")
    .reduce((sum, r) => sum + (r.guest_count ?? 1), 0);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-dash-text">RSVP Responses</h2>
        <p className="mt-1 text-sm text-dash-muted">
          View and track RSVP submissions from your guests.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total RSVPs" value={total} color="text-dash-text" />
        <StatCard label="Attending" value={attending} color="text-green-600" />
        <StatCard label="Declined" value={declined} color="text-red-600" />
        <StatCard label="Total Guests" value={totalGuests} color="text-dash-primary" />
      </div>

      {/* RSVP List */}
      {rsvps && rsvps.length > 0 ? (
        <div className="space-y-3">
          {rsvps.map((rsvp) => (
            <Card key={rsvp.id} className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-base font-semibold text-dash-text">
                      {rsvp.guest_name || "Anonymous Guest"}
                    </h3>
                    <StatusBadge status={rsvp.status} />
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-dash-muted">
                    {rsvp.guest_count !== null && rsvp.guest_count !== undefined && (
                      <span>👥 {rsvp.guest_count} guest(s)</span>
                    )}
                    {rsvp.plus_ones !== null && rsvp.plus_ones !== undefined && (
                      <span>+{rsvp.plus_ones} plus one(s)</span>
                    )}
                    {rsvp.submitted_at && (
                      <span>📅 {formatDateTime(rsvp.submitted_at)}</span>
                    )}
                  </div>
                  {rsvp.dietary && (
                    <p className="text-sm text-dash-muted mt-2">
                      <span className="font-medium">Dietary:</span> {rsvp.dietary}
                    </p>
                  )}
                  {rsvp.dietary_notes && (
                    <p className="text-sm text-dash-muted mt-1">
                      <span className="font-medium">Dietary Notes:</span> {rsvp.dietary_notes}
                    </p>
                  )}
                  {rsvp.message && (
                    <div className="mt-3 rounded-lg border border-dash-border bg-dash-bg p-3">
                      <p className="text-sm text-dash-text italic">"{rsvp.message}"</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No RSVP responses yet"
          description="RSVP submissions from your guests will appear here."
        />
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <Card className="p-5">
      <div className={cn("text-2xl font-bold", color)}>{value}</div>
      <div className="text-sm text-dash-muted">{label}</div>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "attending":
      return <Badge variant="success">Attending</Badge>;
    case "declined":
      return <Badge variant="danger">Declined</Badge>;
    case "pending":
      return <Badge variant="warning">Pending</Badge>;
    default:
      return <Badge variant="default">{status || "Unknown"}</Badge>;
  }
}
