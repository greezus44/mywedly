import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase, type EventRsvp } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Card, LoadingSpinner, ErrorState, EmptyState, Badge } from "../../components/ui";
import { formatDate, formatTime12 } from "../../lib/utils";

const STATUS_CONFIG: Record<string, { label: string; variant: "success" | "danger" | "warning" | "default" }> = {
  attending: { label: "Attending", variant: "success" },
  declined: { label: "Declined", variant: "danger" },
  pending: { label: "Pending", variant: "warning" },
};

export const RsvpPage: React.FC = () => {
  const { eventId } = useEventContext();

  const { data: rsvps, isLoading, isError, refetch } = useQuery({
    queryKey: ["event-rsvps", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_rsvps")
        .select("*")
        .eq("event_id", eventId)
        .order("submitted_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as EventRsvp[];
    },
  });

  const stats = useMemo(() => {
    const list = rsvps ?? [];
    const attending = list.filter((r) => r.status === "attending");
    const declined = list.filter((r) => r.status === "declined");
    const pending = list.filter((r) => r.status === "pending" || !r.status);
    const totalGuests = attending.reduce((sum, r) => sum + (r.guest_count || 0), 0);
    return {
      total: list.length,
      attending: attending.length,
      declined: declined.length,
      pending: pending.length,
      totalGuests,
    };
  }, [rsvps]);

  if (isLoading) {
    return <LoadingSpinner size="md" label="Loading RSVPs..." />;
  }

  if (isError) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-dash-text">RSVP Responses</h2>
        <p className="text-sm text-dash-muted">View and track RSVP responses from your guests.</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <p className="text-sm text-dash-muted">Total Responses</p>
          <p className="mt-1 text-3xl font-bold text-dash-text">{stats.total}</p>
        </Card>
        <Card>
          <p className="text-sm text-dash-muted">Attending</p>
          <p className="mt-1 text-3xl font-bold text-green-600">{stats.attending}</p>
        </Card>
        <Card>
          <p className="text-sm text-dash-muted">Declined</p>
          <p className="mt-1 text-3xl font-bold text-red-600">{stats.declined}</p>
        </Card>
        <Card>
          <p className="text-sm text-dash-muted">Total Guests</p>
          <p className="mt-1 text-3xl font-bold text-dash-text">{stats.totalGuests}</p>
        </Card>
      </div>

      {/* RSVP List */}
      {(!rsvps || rsvps.length === 0) ? (
        <EmptyState
          title="No RSVP responses yet"
          description="RSVP responses from your guests will appear here."
        />
      ) : (
        <div className="space-y-3">
          {rsvps.map((rsvp) => {
            const statusCfg = STATUS_CONFIG[rsvp.status] ?? STATUS_CONFIG.pending;
            return (
              <Card key={rsvp.id}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-dash-text">
                        {rsvp.guest_name || "Unknown Guest"}
                      </h3>
                      <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-dash-muted">
                      {rsvp.guest_count > 0 && (
                        <span>{rsvp.guest_count} guest{rsvp.guest_count !== 1 ? "s" : ""}</span>
                      )}
                      {rsvp.plus_ones > 0 && (
                        <span>{rsvp.plus_ones} plus one{rsvp.plus_ones !== 1 ? "s" : ""}</span>
                      )}
                      {rsvp.submitted_at && (
                        <span>Submitted {formatDate(rsvp.submitted_at)}</span>
                      )}
                    </div>
                    {rsvp.dietary && (
                      <div>
                        <span className="text-xs font-medium uppercase text-dash-muted">Dietary:</span>
                        <span className="ml-1 text-sm text-dash-text">{rsvp.dietary}</span>
                      </div>
                    )}
                    {rsvp.dietary_notes && (
                      <div>
                        <span className="text-xs font-medium uppercase text-dash-muted">Dietary notes:</span>
                        <span className="ml-1 text-sm text-dash-text">{rsvp.dietary_notes}</span>
                      </div>
                    )}
                    {rsvp.message && (
                      <div className="rounded-md border border-dash-border bg-dash-bg px-3 py-2">
                        <span className="text-xs font-medium uppercase text-dash-muted">Message:</span>
                        <p className="mt-1 text-sm text-dash-text">{rsvp.message}</p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
