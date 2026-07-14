import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type SubEvent } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Input";
import {
  Card,
  Modal,
  LoadingSpinner,
  ErrorState,
  EmptyState,
  Badge,
} from "../../components/ui";
import { DateTimePicker } from "../../components/ui/DateTimePicker";
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

export function EventsPage() {
  const { eventId } = useEventContext();
  const queryClient = useQueryClient();

  const { data: subEvents, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["sub-events", eventId],
    queryFn: () => fetchSubEvents(eventId),
  });

  const [showEdit, setShowEdit] = useState(false);
  const [editing, setEditing] = useState<SubEvent | null>(null);
  const [managing, setManaging] = useState<SubEvent | null>(null);
  const [name, setName] = useState("");
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [venue, setVenue] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [dressCode, setDressCode] = useState("");
  const [rsvpEnabled, setRsvpEnabled] = useState(true);
  const [saveError, setSaveError] = useState<string | null>(null);

  const resetForm = () => {
    setName("");
    setDate(null);
    setTime(null);
    setVenue("");
    setAddress("");
    setDescription("");
    setDressCode("");
    setRsvpEnabled(true);
    setEditing(null);
    setSaveError(null);
  };

  const openCreate = () => {
    resetForm();
    setShowEdit(true);
  };

  const openEdit = (sub: SubEvent) => {
    setEditing(sub);
    setName(sub.name);
    setDate(sub.date);
    setTime(sub.start_time);
    setVenue(sub.venue ?? "");
    setAddress(sub.address ?? "");
    setDescription(sub.description ?? "");
    setDressCode(sub.dress_code ?? "");
    setRsvpEnabled(sub.rsvp_enabled);
    setSaveError(null);
    setShowEdit(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error("Event name is required");
      if (editing) {
        const { error } = await supabase
          .from("sub_events")
          .update({
            name: name.trim(),
            date,
            start_time: time,
            venue: venue || null,
            address: address || null,
            description: description || null,
            dress_code: dressCode || null,
            rsvp_enabled: rsvpEnabled,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editing.id);
        if (error) throw error;
      } else {
        const maxOrder = subEvents?.reduce((max, s) => Math.max(max, s.display_order), 0) ?? 0;
        const { error } = await supabase
          .from("sub_events")
          .insert({
            parent_event_id: eventId,
            name: name.trim(),
            date,
            start_time: time,
            venue: venue || null,
            address: address || null,
            description: description || null,
            dress_code: dressCode || null,
            rsvp_enabled: rsvpEnabled,
            order_index: maxOrder,
            display_order: maxOrder + 1,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-events", eventId] });
      setShowEdit(false);
      resetForm();
    },
    onError: (err: Error) => {
      setSaveError(err.message);
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
      queryClient.invalidateQueries({ queryKey: ["sub-events", eventId] });
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
      <ErrorState
        message={error instanceof Error ? error.message : "Failed to load events"}
        onRetry={() => refetch()}
      />
    );
  }

  // If managing invitations for a sub-event, show the InvitationManager
  if (managing) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-dash-text">Manage Invitations</h1>
            <p className="mt-1 text-sm text-dash-muted">{managing.name}</p>
          </div>
          <Button variant="secondary" onClick={() => setManaging(null)}>
            ← Back to Events
          </Button>
        </div>
        <InvitationManager subEvent={managing} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-dash-text">Events</h1>
          <p className="mt-1 text-sm text-dash-muted">
            Create individual events within your celebration (e.g. Ceremony, Reception)
          </p>
        </div>
        <Button onClick={openCreate}>Add Event</Button>
      </div>

      {!subEvents || subEvents.length === 0 ? (
        <EmptyState
          icon={<span className="text-4xl">🎉</span>}
          title="No events yet"
          description="Add events like Ceremony, Reception, or Dinner to organise your celebration."
          action={<Button onClick={openCreate}>Add Event</Button>}
        />
      ) : (
        <div className="space-y-3">
          {subEvents.map((sub) => (
            <Card key={sub.id} className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-dash-text">{sub.name}</h3>
                  {sub.rsvp_enabled && <Badge color="primary">RSVP</Badge>}
                </div>
                {sub.description && (
                  <p className="mt-1 text-sm text-dash-muted">{sub.description}</p>
                )}
                <div className="mt-2 flex flex-wrap gap-4 text-sm text-dash-muted">
                  {sub.date && <span>📅 {formatDate(sub.date)}</span>}
                  {sub.start_time && <span>🕒 {formatTime12(sub.start_time)}</span>}
                  {sub.venue && <span>📍 {sub.venue}</span>}
                  {sub.dress_code && <span>👔 {sub.dress_code}</span>}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setManaging(sub)}>
                  Invitations
                </Button>
                <Button variant="ghost" size="sm" onClick={() => openEdit(sub)}>
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (confirm(`Delete "${sub.name}"?`)) {
                      deleteMutation.mutate(sub.id);
                    }
                  }}
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      <Modal
        open={showEdit}
        onClose={() => setShowEdit(false)}
        title={editing ? "Edit Event" : "Add Event"}
        className="max-w-xl"
      >
        <div className="space-y-4">
          <Input
            label="Event Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Ceremony"
            required
          />
          <Textarea
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Additional details about this event…"
            rows={2}
          />
          <DateTimePicker
            label="Date & Time"
            value={{ date, time }}
            onChange={({ date: d, time: t }) => {
              setDate(d);
              setTime(t);
            }}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
              placeholder="e.g. 123 Main St"
            />
          </div>
          <Input
            label="Dress Code"
            value={dressCode}
            onChange={(e) => setDressCode(e.target.value)}
            placeholder="e.g. Black Tie"
          />
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={rsvpEnabled}
              onChange={(e) => setRsvpEnabled(e.target.checked)}
              className="h-4 w-4 rounded border-dash-border"
            />
            <span className="text-sm text-dash-text">Enable RSVP for this event</span>
          </label>
          {saveError && <p className="text-sm text-dash-danger">{saveError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowEdit(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => saveMutation.mutate()}
              loading={saveMutation.isPending}
              disabled={!name.trim()}
            >
              {editing ? "Save" : "Add"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
