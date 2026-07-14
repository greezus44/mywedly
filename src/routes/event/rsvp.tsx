import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent, type EventRsvp } from "../../lib/supabase";
import { Card, Badge, LoadingSpinner, ErrorState, EmptyState } from "../../components/ui";
import { formatDate, cn } from "../../lib/utils";

const STATUS_VARIANTS: Record<string, "success" | "danger" | "warning" | "default"> = {
  attending: "success",
  declined: "danger",
  pending: "warning",
};

export function RsvpPage() {
  const { event, eventId } = useOutletContext<{ event: UserEvent; eventId: string }>();
  const [filter, setFilter] = useState<string>("all");

  const { data: rsvps, isLoading, isError } = useQuery({
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
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-20">
        <ErrorState message="Failed to load RSVP responses" />
      </div>
    );
  }

  const allRsvps = rsvps ?? [];
  const filtered =
    filter === "all"
      ? allRsvps
      : allRsvps.filter((r) => (r.status || "pending") === filter);

  const attending = allRsvps.filter((r) => r.status === "attending").length;
  const declined = allRsvps.filter((r) => r.status === "declined").length;
  const pending = allRsvps.filter(
    (r) => !r.status || r.status === "pending",
  ).length;
  const totalPlusOnes = allRsvps.reduce((sum, r) => sum + (r.plus_ones ?? 0), 0);
  const totalGuests = attending + totalPlusOnes;

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-dash-text">RSVP Responses</h2>
        <p className="text-sm text-dash-muted mt-1">
          View and manage guest RSVP responses.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="text-center">
          <div className="text-3xl font-bold text-green-600">{attending}</div>
          <div className="text-sm text-dash-muted mt-1">Attending</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-bold text-red-600">{declined}</div>
          <div className="text-sm text-dash-muted mt-1">Declined</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-bold text-amber-600">{pending}</div>
          <div className="text-sm text-dash-muted mt-1">Pending</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-bold text-dash-primary">{totalGuests}</div>
          <div className="text-sm text-dash-muted mt-1">Total Guests</div>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {[
          { key: "all", label: "All", count: allRsvps.length },
          { key: "attending", label: "Attending", count: attending },
          { key: "declined", label: "Declined", count: declined },
          { key: "pending", label: "Pending", count: pending },
        ].map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={cn(
              "px-3 py-1.5 text-sm rounded-md border transition-colors",
              filter === f.key
                ? "bg-dash-primary text-dash-primary-fg border-transparent"
                : "bg-dash-surface text-dash-text border-dash-border hover:bg-dash-bg",
            )}
          >
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {/* RSVP List */}
      {filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((rsvp) => (
            <Card key={rsvp.id}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-dash-text">
                      {rsvp.guest_name}
                    </h3>
                    <Badge variant={STATUS_VARIANTS[rsvp.status || "pending"] ?? "default"}>
                      {rsvp.status || "pending"}
                    </Badge>
                    {rsvp.plus_ones > 0 && (
                      <Badge>+{rsvp.plus_ones} guest{rsvp.plus_ones > 1 ? "s" : ""}</Badge>
                    )}
                  </div>
                  {rsvp.dietary && (
                    <p className="text-sm text-dash-muted mb-1">
                      <strong>Dietary:</strong> {rsvp.dietary}
                    </p>
                  )}
                  {rsvp.message && (
                    <p className="text-sm text-dash-muted mb-1">
                      <strong>Message:</strong> {rsvp.message}
                    </p>
                  )}
                  <p className="text-xs text-dash-muted mt-2">
                    {rsvp.submitted_at
                      ? `Responded on ${formatDate(rsvp.submitted_at.slice(0, 10))}`
                      : "No response date"}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState
            title="No RSVP responses"
            description="RSVP responses from your guests will appear here."
            icon={<span className="text-4xl">📝</span>}
          />
        </Card>
      )}
    </div>
  );
}
