import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type EventRsvp } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Card, Badge, LoadingSpinner, ErrorState, EmptyState, Modal, Textarea } from "../../components/ui";
import { formatDateTime } from "../../lib/utils";
import { RsvpBadge } from "./guest-form";
import type { EventContextValue } from "./event-layout";

const STATUS_LABELS: Record<string, string> = {
  attending: "Attending",
  declined: "Declined",
  pending: "Pending",
  no_response: "No Response",
  maybe: "Maybe",
};

export function RsvpPage() {
  const { eventId } = useOutletContext<EventContextValue>();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<string>("all");
  const [selectedRsvp, setSelectedRsvp] = useState<EventRsvp | null>(null);

  const { data: rsvps, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["rsvps", eventId],
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

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("event_rsvps")
        .update({ status, responded_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rsvps", eventId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("event_rsvps")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rsvps", eventId] });
    },
  });

  const filtered = filter === "all"
    ? rsvps
    : rsvps?.filter((r) => r.status === filter);

  const counts = {
    total: rsvps?.length ?? 0,
    attending: rsvps?.filter((r) => r.status === "attending").length ?? 0,
    declined: rsvps?.filter((r) => r.status === "declined").length ?? 0,
    pending: rsvps?.filter((r) => r.status === "pending" || r.status === "no_response").length ?? 0,
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState message={error?.message ?? "Failed to load RSVPs"} onRetry={refetch} />
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-dash-text">RSVP Responses</h2>
        <p className="text-sm text-dash-muted">View and manage guest RSVP responses.</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs text-dash-muted">Total</p>
          <p className="mt-1 text-2xl font-bold text-dash-text">{counts.total}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-dash-muted">Attending</p>
          <p className="mt-1 text-2xl font-bold text-green-600">{counts.attending}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-dash-muted">Declined</p>
          <p className="mt-1 text-2xl font-bold text-red-600">{counts.declined}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-dash-muted">Pending</p>
          <p className="mt-1 text-2xl font-bold text-amber-600">{counts.pending}</p>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {["all", "attending", "declined", "pending"].map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              filter === f
                ? "bg-dash-primary text-dash-primary-fg"
                : "bg-dash-surface text-dash-muted hover:text-dash-text"
            }`}
          >
            {f === "all" ? "All" : STATUS_LABELS[f] ?? f}
          </button>
        ))}
      </div>

      {/* List */}
      {!filtered || filtered.length === 0 ? (
        <EmptyState
          title="No RSVP responses"
          description="RSVP responses from guests will appear here."
          icon={<span className="text-4xl">📝</span>}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((rsvp) => (
            <Card key={rsvp.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-dash-text">
                      {rsvp.guest_name}
                    </h3>
                    <RsvpBadge status={rsvp.status} />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-4 text-xs text-dash-muted">
                    {rsvp.plus_ones > 0 && (
                      <span>+{rsvp.plus_ones} guest{rsvp.plus_ones > 1 ? "s" : ""}</span>
                    )}
                    {rsvp.dietary && <span>🍽️ {rsvp.dietary}</span>}
                    {rsvp.dietary_notes && <span>📝 {rsvp.dietary_notes}</span>}
                    {rsvp.submitted_at && (
                      <span>📅 {formatDateTime(rsvp.submitted_at)}</span>
                    )}
                  </div>
                  {rsvp.message && (
                    <p className="mt-2 rounded-md bg-dash-bg px-3 py-2 text-sm italic text-dash-text">
                      "{rsvp.message}"
                    </p>
                  )}
                  {rsvp.plus_one_names && rsvp.plus_one_names.length > 0 && (
                    <p className="mt-1 text-xs text-dash-muted">
                      Plus ones: {rsvp.plus_one_names.join(", ")}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <Button variant="ghost" size="sm" onClick={() => setSelectedRsvp(rsvp)}>
                    Details
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    loading={deleteMutation.isPending}
                    onClick={() => {
                      if (confirm("Delete this RSVP?")) {
                        deleteMutation.mutate(rsvp.id);
                      }
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Details Modal */}
      <Modal
        open={!!selectedRsvp}
        onClose={() => setSelectedRsvp(null)}
        title="RSVP Details"
        size="lg"
      >
        {selectedRsvp && (
          <div className="space-y-4">
            <div>
              <span className="text-sm font-medium text-dash-text">Guest: </span>
              <span className="text-sm text-dash-text">{selectedRsvp.guest_name}</span>
            </div>
            <div>
              <span className="text-sm font-medium text-dash-text">Status: </span>
              <RsvpBadge status={selectedRsvp.status} />
            </div>
            <div>
              <span className="text-sm font-medium text-dash-text">Plus Ones: </span>
              <span className="text-sm text-dash-text">{selectedRsvp.plus_ones}</span>
            </div>
            {selectedRsvp.plus_one_names && selectedRsvp.plus_one_names.length > 0 && (
              <div>
                <span className="text-sm font-medium text-dash-text">Plus One Names: </span>
                <span className="text-sm text-dash-text">{selectedRsvp.plus_one_names.join(", ")}</span>
              </div>
            )}
            {selectedRsvp.dietary && (
              <div>
                <span className="text-sm font-medium text-dash-text">Dietary: </span>
                <span className="text-sm text-dash-text">{selectedRsvp.dietary}</span>
              </div>
            )}
            {selectedRsvp.dietary_notes && (
              <div>
                <span className="text-sm font-medium text-dash-text">Dietary Notes: </span>
                <span className="text-sm text-dash-text">{selectedRsvp.dietary_notes}</span>
              </div>
            )}
            {selectedRsvp.message && (
              <div>
                <span className="text-sm font-medium text-dash-text">Message: </span>
                <p className="mt-1 rounded-md bg-dash-bg px-3 py-2 text-sm text-dash-text">
                  {selectedRsvp.message}
                </p>
              </div>
            )}
            <div>
              <span className="text-sm font-medium text-dash-text">Submitted: </span>
              <span className="text-sm text-dash-muted">{formatDateTime(selectedRsvp.submitted_at)}</span>
            </div>
            <div className="border-t border-dash-border pt-3">
              <label className="mb-1.5 block text-sm font-medium text-dash-text">Update Status</label>
              <div className="flex gap-2">
                {["attending", "declined", "pending"].map((s) => (
                  <Button
                    key={s}
                    variant={selectedRsvp.status === s ? "primary" : "secondary"}
                    size="sm"
                    loading={updateStatusMutation.isPending}
                    onClick={() => {
                      updateStatusMutation.mutate({ id: selectedRsvp.id, status: s });
                      setSelectedRsvp({ ...selectedRsvp, status: s });
                    }}
                  >
                    {STATUS_LABELS[s]}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default RsvpPage;
