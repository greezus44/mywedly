import { useState, useEffect, type FormEvent } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase, type SubEvent } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Input";
import { DatePicker, TimePicker, Toggle } from "../../components/ui";
import {
  Modal,
  LoadingSpinner,
  ErrorState,
  EmptyState,
  Card,
  Badge,
} from "../../components/ui";
import { formatDate, formatTime12 } from "../../lib/utils";
import { InvitationManager } from "./invitation-manager";

async function fetchSubEvents(parentEventId: string): Promise<SubEvent[]> {
  const { data, error } = await supabase
    .from("sub_events")
    .select("*")
    .eq("parent_event_id", parentEventId)
    .order("display_order", { ascending: true });

  if (error) throw error;
  return (data ?? []) as SubEvent[];
}

export default function Events() {
  const { eventId } = useEventContext();
  const queryClient = useQueryClient();

  const {
    data: subEvents,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["sub_events", eventId],
    queryFn: () => fetchSubEvents(eventId),
  });

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<SubEvent | null>(null);
  const [name, setName] = useState("");
  const [date, setDate] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<string | null>(null);
  const [endTime, setEndTime] = useState<string | null>(null);
  const [venue, setVenue] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [dressCode, setDressCode] = useState("");
  const [rsvpEnabled, setRsvpEnabled] = useState(true);

  const resetForm = () => {
    setName("");
    setDate(null);
    setStartTime(null);
    setEndTime(null);
    setVenue("");
    setAddress("");
    setDescription("");
    setDressCode("");
    setRsvpEnabled(true);
    setEditing(null);
  };

  const openCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const openEdit = (sub: SubEvent) => {
    setEditing(sub);
    setName(sub.name);
    setDate(sub.date);
    setStartTime(sub.start_time ?? sub.time);
    setEndTime(sub.end_time);
    setVenue(sub.venue ?? "");
    setAddress(sub.address ?? "");
    setDescription(sub.description ?? "");
    setDressCode(sub.dress_code ?? "");
    setRsvpEnabled(sub.rsvp_enabled);
    setShowModal(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        parent_event_id: eventId,
        wedding_id: eventId,
        name,
        date,
        time: startTime,
        start_time: startTime,
        end_time: endTime,
        venue: venue || null,
        address: address || null,
        description: description || null,
        dress_code: dressCode || null,
        rsvp_enabled: rsvpEnabled,
        display_order: editing?.display_order ?? editing?.order_index ?? (subEvents?.length ?? 0),
        order_index: editing?.order_index ?? (subEvents?.length ?? 0),
      };

      if (editing) {
        const { error } = await supabase
          .from("sub_events")
          .update(payload)
          .eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("sub_events")
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub_events", eventId] });
      setShowModal(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("sub_events")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub_events", eventId] });
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    saveMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8">
        <ErrorState
          message={error instanceof Error ? error.message : "Failed to load events"}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-4 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-dash-text">Events</h1>
          <p className="mt-1 text-sm text-dash-muted">
            Create individual events within your celebration and manage guest invitations.
          </p>
        </div>
        <Button size="sm" onClick={openCreate}>
          + Add Event
        </Button>
      </div>

      {subEvents && subEvents.length === 0 ? (
        <EmptyState
          title="No events yet"
          description="Add events like Ceremony, Reception, or After Party to organize your celebration."
          action={<Button onClick={openCreate}>Add Event</Button>}
        />
      ) : (
        <div className="space-y-4">
          {subEvents?.map((sub) => (
            <Card key={sub.id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-dash-text">{sub.name}</h3>
                    {sub.rsvp_enabled ? (
                      <Badge variant="success">RSVP On</Badge>
                    ) : (
                      <Badge variant="default">RSVP Off</Badge>
                    )}
                  </div>
                  {sub.date && (
                    <p className="mt-1 text-sm text-dash-muted">
                      {formatDate(sub.date)}
                      {sub.start_time && ` at ${formatTime12(sub.start_time)}`}
                      {sub.end_time && ` – ${formatTime12(sub.end_time)}`}
                    </p>
                  )}
                  {sub.venue && (
                    <p className="mt-1 text-sm text-dash-text">{sub.venue}</p>
                  )}
                  {sub.address && (
                    <p className="text-sm text-dash-muted">{sub.address}</p>
                  )}
                  {sub.description && (
                    <p className="mt-2 text-sm text-dash-muted">{sub.description}</p>
                  )}
                  {sub.dress_code && (
                    <p className="mt-1 text-xs text-dash-muted">
                      Dress code: {sub.dress_code}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEdit(sub)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteMutation.mutate(sub.id)}
                    loading={deleteMutation.isPending}
                  >
                    Delete
                  </Button>
                </div>
              </div>

              {/* Invitation Manager */}
              <div className="mt-4 border-t border-dash-border pt-4">
                <InvitationManager subEventId={sub.id} subEventName={sub.name} />
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? "Edit Event" : "Add Event"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Event Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Ceremony"
            required
            autoFocus
          />
          <Textarea
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description"
            rows={2}
          />
          <DatePicker
            label="Date"
            value={date}
            onChange={setDate}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TimePicker
              label="Start Time"
              value={startTime}
              onChange={setStartTime}
            />
            <TimePicker
              label="End Time"
              value={endTime}
              onChange={setEndTime}
            />
          </div>
          <Input
            label="Venue"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            placeholder="e.g. St. Mary's Church"
          />
          <Input
            label="Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Full address"
          />
          <Input
            label="Dress Code"
            value={dressCode}
            onChange={(e) => setDressCode(e.target.value)}
            placeholder="e.g. Black tie"
          />
          <Toggle
            checked={rsvpEnabled}
            onChange={setRsvpEnabled}
            label="RSVP Enabled"
          />
          {saveMutation.isError && (
            <p className="text-sm text-dash-danger">
              {saveMutation.error instanceof Error
                ? saveMutation.error.message
                : "Failed to save"}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={saveMutation.isPending}>
              {saveMutation.isPending ? <LoadingSpinner size="sm" /> : "Save"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
