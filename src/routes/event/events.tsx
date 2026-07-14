import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type SubEvent, type GuestGroup } from "../../lib/supabase";
import { useOutletContext } from "./event-layout";
import { InvitationManager } from "./invitation-manager";
import { Button } from "../../components/ui/Button";
import {
  Card,
  Modal,
  Input,
  Textarea,
  Toggle,
  LoadingSpinner,
  ErrorState,
  EmptyState,
  Badge,
} from "../../components/ui";
import { DatePicker, TimePicker } from "../../components/ui";
import { formatDate, formatTime12 } from "../../lib/utils";

interface SubEventForm {
  name: string;
  date: string | null;
  time: string | null;
  venue: string;
  address: string;
  description: string;
  dress_code: string;
  rsvp_enabled: boolean;
  rsvp_deadline: string | null;
}

const EMPTY_FORM: SubEventForm = {
  name: "",
  date: null,
  time: null,
  venue: "",
  address: "",
  description: "",
  dress_code: "",
  rsvp_enabled: true,
  rsvp_deadline: null,
};

export default function Events() {
  const { eventId } = useOutletContext();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SubEventForm>(EMPTY_FORM);
  const [managingSubEvent, setManagingSubEvent] = useState<SubEvent | null>(null);

  const { data: subEvents, isLoading, isError } = useQuery({
    queryKey: ["sub_events", eventId],
    enabled: !!eventId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sub_events")
        .select("*")
        .eq("parent_event_id", eventId)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as SubEvent[];
    },
  });

  const { data: groups } = useQuery({
    queryKey: ["guest_groups", eventId],
    enabled: !!eventId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guest_groups")
        .select("*")
        .eq("event_id", eventId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as GuestGroup[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const maxOrder = subEvents?.reduce((max, s) => Math.max(max, s.display_order), 0) ?? 0;
      const { data, error } = await supabase
        .from("sub_events")
        .insert({
          parent_event_id: eventId,
          wedding_id: eventId,
          name: form.name,
          date: form.date,
          time: form.time,
          start_time: form.time,
          venue: form.venue || null,
          address: form.address || null,
          description: form.description || null,
          dress_code: form.dress_code || null,
          rsvp_enabled: form.rsvp_enabled,
          rsvp_deadline: form.rsvp_deadline,
          display_order: maxOrder + 1,
          order_index: maxOrder,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub_events", eventId] });
      setShowModal(false);
      setForm(EMPTY_FORM);
      setEditingId(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingId) throw new Error("No event selected");
      const { data, error } = await supabase
        .from("sub_events")
        .update({
          name: form.name,
          date: form.date,
          time: form.time,
          start_time: form.time,
          venue: form.venue || null,
          address: form.address || null,
          description: form.description || null,
          dress_code: form.dress_code || null,
          rsvp_enabled: form.rsvp_enabled,
          rsvp_deadline: form.rsvp_deadline,
        })
        .eq("id", editingId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub_events", eventId] });
      setShowModal(false);
      setForm(EMPTY_FORM);
      setEditingId(null);
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

  const handleAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const handleEdit = (subEvent: SubEvent) => {
    setEditingId(subEvent.id);
    setForm({
      name: subEvent.name,
      date: subEvent.date,
      time: subEvent.start_time ?? subEvent.time ?? null,
      venue: subEvent.venue ?? "",
      address: subEvent.address ?? "",
      description: subEvent.description ?? "",
      dress_code: subEvent.dress_code ?? "",
      rsvp_enabled: subEvent.rsvp_enabled,
      rsvp_deadline: subEvent.rsvp_deadline,
    });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    if (editingId) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return <ErrorState description="Failed to load events" />;
  }

  if (managingSubEvent) {
    return (
      <InvitationManager
        subEvent={managingSubEvent}
        groups={groups ?? []}
        eventId={eventId}
        onBack={() => setManagingSubEvent(null)}
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-dash-text">Events</h2>
          <p className="mt-1 text-sm text-dash-muted">
            Manage individual events within your celebration
          </p>
        </div>
        <Button onClick={handleAdd}>Add Event</Button>
      </div>

      {!subEvents || subEvents.length === 0 ? (
        <EmptyState
          title="No events yet"
          description="Add events like Ceremony, Reception, etc. to organize your celebration."
          icon={<span className="text-4xl">🎉</span>}
          action={<Button onClick={handleAdd}>Add Event</Button>}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {subEvents.map((subEvent) => (
            <Card key={subEvent.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-dash-text">
                      {subEvent.name}
                    </h3>
                    {subEvent.rsvp_enabled ? (
                      <Badge variant="success">RSVP Open</Badge>
                    ) : (
                      <Badge variant="default">RSVP Closed</Badge>
                    )}
                  </div>
                  {subEvent.description && (
                    <p className="mt-1 text-sm text-dash-muted">
                      {subEvent.description}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-3 text-sm text-dash-muted">
                    {subEvent.date && <span>{formatDate(subEvent.date)}</span>}
                    {subEvent.start_time && (
                      <span>{formatTime12(subEvent.start_time)}</span>
                    )}
                    {subEvent.venue && <span>📍 {subEvent.venue}</span>}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setManagingSubEvent(subEvent)}
                  >
                    Manage Invitations
                  </Button>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(subEvent)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMutation.mutate(subEvent.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingId ? "Edit Event" : "Add Event"}
        size="lg"
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Event Name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Ceremony"
            autoFocus
          />
          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
            placeholder="Details about this event..."
          />
          <div className="grid grid-cols-2 gap-3">
            <DatePicker
              label="Date"
              value={form.date}
              onChange={(date) => setForm((f) => ({ ...f, date: date }))}
            />
            <TimePicker
              label="Time"
              value={form.time}
              onChange={(time) => setForm((f) => ({ ...f, time: time }))}
            />
          </div>
          <Input
            label="Venue"
            value={form.venue}
            onChange={(e) => setForm((f) => ({ ...f, venue: e.target.value }))}
            placeholder="e.g. Main Hall"
          />
          <Input
            label="Address"
            value={form.address}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            placeholder="e.g. 123 Main St"
          />
          <Input
            label="Dress Code"
            value={form.dress_code}
            onChange={(e) =>
              setForm((f) => ({ ...f, dress_code: e.target.value }))
            }
            placeholder="e.g. Black tie"
          />
          <div className="rounded-md border border-dash-border p-3">
            <Toggle
              checked={form.rsvp_enabled}
              onChange={(checked) =>
                setForm((f) => ({ ...f, rsvp_enabled: checked }))
              }
              label="RSVP enabled for this event"
            />
          </div>
          {(createMutation.isError || updateMutation.isError) && (
            <p className="text-sm text-dash-danger">
              {createMutation.error?.message || updateMutation.error?.message}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              loading={createMutation.isPending || updateMutation.isPending}
              disabled={!form.name.trim()}
            >
              {editingId ? "Update" : "Add"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
