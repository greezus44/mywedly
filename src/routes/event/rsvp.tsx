import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type EventRsvp, type EventGuest, type SubEvent } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, Select } from "../../components/ui/Input";
import { Card, LoadingSpinner, ErrorState, EmptyState, Badge, Modal } from "../../components/ui";
import { isRsvpClosed, formatDate } from "../../lib/utils";

export function RsvpPage() {
  const { event, eventId } = useEventContext();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<EventRsvp | null>(null);
  const [status, setStatus] = useState<EventRsvp["status"]>("pending");
  const [plusOne, setPlusOne] = useState(false);
  const [plusOneNames, setPlusOneNames] = useState("");
  const [dietaryNotes, setDietaryNotes] = useState("");
  const [message, setMessage] = useState("");
  const [guestFilter, setGuestFilter] = useState("");

  const rsvpClosed = isRsvpClosed(event.draft_rsvp_deadline);

  const { data: rsvps, isLoading, isError, refetch } = useQuery({
    queryKey: ["rsvps", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_rsvps")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as EventRsvp[];
    },
  });

  const { data: guests } = useQuery({
    queryKey: ["guests-for-rsvp", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_guests")
        .select("*")
        .eq("event_id", eventId);
      if (error) throw error;
      return data as EventGuest[];
    },
  });

  const { data: subEvents } = useQuery({
    queryKey: ["sub-events-for-rsvp", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sub_events")
        .select("*")
        .eq("event_id", eventId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as SubEvent[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editing) return;
      const { error } = await supabase
        .from("event_rsvps")
        .update({
          status,
          plus_one: plusOne,
          plus_one_names: plusOneNames ? plusOneNames.split(",").map((n) => n.trim()) : [],
          dietary_notes: dietaryNotes || null,
          message: message || null,
        })
        .eq("id", editing.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rsvps", eventId] });
      setEditing(null);
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

  function startEdit(rsvp: EventRsvp) {
    setEditing(rsvp);
    setStatus(rsvp.status);
    setPlusOne(rsvp.plus_one);
    setPlusOneNames(rsvp.plus_one_names.join(", "));
    setDietaryNotes(rsvp.dietary_notes ?? "");
    setMessage(rsvp.message ?? "");
  }

  function getGuestName(guestId: string): string {
    return guests?.find((g) => g.id === guestId)?.name ?? "Unknown";
  }

  function getSubEventName(subEventId: string | null): string {
    if (!subEventId) return "All Events";
    return subEvents?.find((se) => se.id === subEventId)?.name ?? "Unknown Event";
  }

  const filteredRsvps = rsvps?.filter((r) =>
    getGuestName(r.guest_id).toLowerCase().includes(guestFilter.toLowerCase())
  ) ?? [];

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return <ErrorState message="Failed to load RSVPs." onRetry={() => refetch()} />;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dash-text">RSVP</h1>
        <p className="mt-1 text-sm text-dash-muted">
          Track and manage guest RSVP responses.
        </p>
        {rsvpClosed && (
          <p className="mt-2 text-sm text-dash-danger">
            RSVP deadline has passed ({formatDate(event.draft_rsvp_deadline)}).
          </p>
        )}
      </div>

      <Input
        type="text"
        placeholder="Search by guest name…"
        value={guestFilter}
        onChange={(e) => setGuestFilter(e.target.value)}
      />

      {filteredRsvps.length > 0 ? (
        <div className="space-y-3">
          {filteredRsvps.map((rsvp) => (
            <Card key={rsvp.id}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-dash-text">
                      {getGuestName(rsvp.guest_id)}
                    </h3>
                    <Badge
                      variant={
                        rsvp.status === "attending"
                          ? "success"
                          : rsvp.status === "not_attending"
                          ? "danger"
                          : "warning"
                      }
                    >
                      {rsvp.status === "attending"
                        ? "Attending"
                        : rsvp.status === "not_attending"
                        ? "Not Attending"
                        : "Pending"}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-dash-muted">
                    Event: {getSubEventName(rsvp.sub_event_id)}
                  </p>
                  {rsvp.plus_one && (
                    <p className="mt-1 text-sm text-dash-muted">
                      +1: {rsvp.plus_one_names.join(", ") || "Yes"}
                    </p>
                  )}
                  {rsvp.dietary_notes && (
                    <p className="mt-1 text-sm text-dash-muted">
                      Dietary: {rsvp.dietary_notes}
                    </p>
                  )}
                  {rsvp.message && (
                    <p className="mt-1 text-sm text-dash-muted italic">
                      "{rsvp.message}"
                    </p>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => startEdit(rsvp)}>
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (window.confirm("Delete this RSVP?")) {
                        deleteMutation.mutate(rsvp.id);
                      }
                    }}
                  >
                    ✕
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No RSVPs yet"
          description={guestFilter ? "No RSVPs match your search." : "RSVP responses from guests will appear here."}
        />
      )}

      {/* Edit Modal */}
      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title="Edit RSVP"
      >
        {editing && (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-dash-text">
                Guest: {getGuestName(editing.guest_id)}
              </p>
              <p className="text-sm text-dash-muted">
                Event: {getSubEventName(editing.sub_event_id)}
              </p>
            </div>
            <Select
              label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value as EventRsvp["status"])}
            >
              <option value="attending">Attending</option>
              <option value="not_attending">Not Attending</option>
              <option value="pending">Pending</option>
            </Select>
            <label className="flex items-center gap-2 text-sm text-dash-text">
              <input
                type="checkbox"
                checked={plusOne}
                onChange={(e) => setPlusOne(e.target.checked)}
                className="rounded"
              />
              Plus one allowed
            </label>
            {plusOne && (
              <Input
                label="Plus one names (comma separated)"
                type="text"
                value={plusOneNames}
                onChange={(e) => setPlusOneNames(e.target.value)}
                placeholder="John Doe"
              />
            )}
            <Textarea
              label="Dietary notes"
              value={dietaryNotes}
              onChange={(e) => setDietaryNotes(e.target.value)}
              placeholder="Allergies, preferences…"
            />
            <Textarea
              label="Message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Guest message…"
            />
            <div className="flex gap-2">
              <Button
                onClick={() => updateMutation.mutate()}
                loading={updateMutation.isPending}
                disabled={updateMutation.isPending}
              >
                Save
              </Button>
              <Button variant="secondary" onClick={() => setEditing(null)}>
                Cancel
              </Button>
            </div>
            {updateMutation.isError && (
              <p className="text-sm text-dash-danger">
                {updateMutation.error instanceof Error ? updateMutation.error.message : "Save failed."}
              </p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
