import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type EventRsvp } from "../../lib/supabase";
import { formatDateShort, formatTime12 } from "../../lib/utils";
import { Button } from "../../components/ui/Button";
import {
  Card,
  LoadingSpinner,
  ErrorState,
  EmptyState,
  Badge,
  IconButton,
  Modal,
} from "../../components/ui";
import { useState } from "react";

export default function Rsvp() {
  const { eventId } = useOutletContext<{ event: UserEvent; eventId: string }>();
  const queryClient = useQueryClient();
  const [selectedRsvp, setSelectedRsvp] = useState<EventRsvp | null>(null);

  const { data: rsvps, isLoading, isError } = useQuery({
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
    enabled: !!eventId,
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

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (isError) {
    return <ErrorState title="Failed to load RSVPs" />;
  }

  const total = rsvps?.length ?? 0;
  const attending = rsvps?.filter((r) => r.status === "attending").length ?? 0;
  const declined = rsvps?.filter((r) => r.status === "declined").length ?? 0;
  const pending = rsvps?.filter((r) => r.status === "pending").length ?? 0;
  const totalPlusOnes =
    rsvps?.reduce((sum, r) => sum + (r.plus_ones || 0), 0) ?? 0;

  const stats = [
    { label: "Total RSVPs", value: total, variant: "info" as const },
    { label: "Attending", value: attending, variant: "success" as const },
    { label: "Declined", value: declined, variant: "danger" as const },
    { label: "Pending", value: pending, variant: "warning" as const },
    { label: "Plus Ones", value: totalPlusOnes, variant: "default" as const },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">RSVP Responses</h2>
        <p className="text-sm text-muted">
          View and manage RSVP submissions from your guests.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <div className="flex flex-col">
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <Badge variant={stat.variant} className="mt-1 w-fit">
                {stat.label}
              </Badge>
            </div>
          </Card>
        ))}
      </div>

      {/* RSVP list */}
      {rsvps && rsvps.length > 0 ? (
        <Card>
          <div className="flex flex-col gap-2">
            {rsvps.map((rsvp) => (
              <div
                key={rsvp.id}
                className="flex items-center justify-between rounded-md border border-border bg-surface-alt px-3 py-3"
              >
                <div className="flex flex-1 flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">
                      {rsvp.guest_name}
                    </span>
                    <Badge
                      variant={
                        rsvp.status === "attending"
                          ? "success"
                          : rsvp.status === "declined"
                          ? "danger"
                          : "warning"
                      }
                    >
                      {rsvp.status}
                    </Badge>
                    {rsvp.plus_ones > 0 && (
                      <span className="text-xs text-muted">
                        +{rsvp.plus_ones} guest{rsvp.plus_ones > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  {rsvp.dietary && (
                    <p className="text-xs text-muted">
                      🍽 Dietary: {rsvp.dietary}
                    </p>
                  )}
                  {rsvp.message && (
                    <p className="text-xs text-muted">💬 {rsvp.message}</p>
                  )}
                  <span className="text-xs text-muted">
                    {formatDateShort(rsvp.submitted_at)}{" "}
                    {formatTime12(
                      rsvp.submitted_at.split("T")[1]?.slice(0, 5) ?? null
                    )}
                  </span>
                </div>
                <div className="flex gap-1">
                  <IconButton
                    onClick={() => setSelectedRsvp(rsvp)}
                    title="View details"
                  >
                    👁
                  </IconButton>
                  <IconButton
                    onClick={() => deleteMutation.mutate(rsvp.id)}
                    title="Delete"
                    className="hover:text-danger"
                  >
                    🗑
                  </IconButton>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <EmptyState
          title="No RSVPs yet"
          description="RSVP responses from your guests will appear here."
        />
      )}

      {/* Detail modal */}
      <Modal
        open={!!selectedRsvp}
        onClose={() => setSelectedRsvp(null)}
        title="RSVP Details"
        size="md"
      >
        {selectedRsvp && (
          <div className="flex flex-col gap-3">
            <div>
              <span className="text-xs text-muted">Guest</span>
              <p className="font-medium text-foreground">{selectedRsvp.guest_name}</p>
            </div>
            <div>
              <span className="text-xs text-muted">Status</span>
              <p>
                <Badge
                  variant={
                    selectedRsvp.status === "attending"
                      ? "success"
                      : selectedRsvp.status === "declined"
                      ? "danger"
                      : "warning"
                  }
                >
                  {selectedRsvp.status}
                </Badge>
              </p>
            </div>
            <div>
              <span className="text-xs text-muted">Plus Ones</span>
              <p className="text-sm text-foreground">{selectedRsvp.plus_ones}</p>
            </div>
            {selectedRsvp.dietary && (
              <div>
                <span className="text-xs text-muted">Dietary Requirements</span>
                <p className="text-sm text-foreground">{selectedRsvp.dietary}</p>
              </div>
            )}
            {selectedRsvp.message && (
              <div>
                <span className="text-xs text-muted">Message</span>
                <p className="text-sm text-foreground">{selectedRsvp.message}</p>
              </div>
            )}
            <div>
              <span className="text-xs text-muted">Submitted</span>
              <p className="text-sm text-foreground">
                {formatDateShort(selectedRsvp.submitted_at)}{" "}
                {formatTime12(
                  selectedRsvp.submitted_at.split("T")[1]?.slice(0, 5) ?? null
                )}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
