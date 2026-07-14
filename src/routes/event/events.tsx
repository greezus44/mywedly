import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type SubEvent } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { InvitationManager } from "./invitation-manager";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, Select } from "../../components/ui/Input";
import { DatePicker } from "../../components/ui/DatePicker";
import { TimePicker } from "../../components/ui/TimePicker";
import {
  Card,
  Modal,
  Badge,
  LoadingSpinner,
  ErrorState,
  EmptyState,
  Toggle,
} from "../../components/ui";
import { formatDateShort, to12Hour } from "../../lib/utils";

interface SubEventForm {
  name: string;
  date: string | null;
  time: string | null;
  venue: string;
  address: string;
  description: string;
  dress_code: string;
  rsvp_deadline: string | null;
  rsvp_enabled: boolean;
  order_index: number;
}

const EMPTY_FORM: SubEventForm = {
  name: "",
  date: null,
  time: null,
  venue: "",
  address: "",
  description: "",
  dress_code: "",
  rsvp_deadline: null,
  rsvp_enabled: true,
  order_index: 0,
};

export function EventsPage() {
  const { eventId } = useEventContext();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SubEventForm>(EMPTY_FORM);
  const [managingId, setManagingId] = useState<string | null>(null);

  const {
    data: subEvents,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["sub-events", eventId],
    queryFn: async () => {
      const { data, error: queryError } = await supabase
        .from("sub_events")
        .select("*")
        .eq("parent_event_id", eventId)
        .order("display_order", { ascending: true });
      if (queryError) throw queryError;
      return data as SubEvent[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (input: SubEventForm) => {
      const { error: createError } = await supabase.from("sub_events").insert({
        parent_event_id: eventId,
        name: input.name,
        date: input.date,
        start_time: input.time,
        venue: input.venue,
        address: input.address,
        description: input.description,
        dress_code: input.dress_code,
        rsvp_deadline: input.rsvp_deadline,
        rsvp_enabled: input.rsvp_enabled,
        order_index: input.order_index,
        display_order: input.order_index,
      });
      if (createError) throw createError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-events", eventId] });
      setShowForm(false);
      setForm(EMPTY_FORM);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (input: SubEventForm) => {
      const { error: updateError } = await supabase
        .from("sub_events")
        .update({
          name: input.name,
          date: input.date,
          start_time: input.time,
          venue: input.venue,
          address: input.address,
          description: input.description,
          dress_code: input.dress_code,
          rsvp_deadline: input.rsvp_deadline,
          rsvp_enabled: input.rsvp_enabled,
          order_index: input.order_index,
          display_order: input.order_index,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingId!);
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-events", eventId] });
      setShowForm(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error: deleteError } = await supabase.from("sub_events").delete().eq("id", id);
      if (deleteError) throw deleteError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-events", eventId] });
    },
  });

  const handleEdit = (sub: SubEvent) => {
    setEditingId(sub.id);
    setForm({
      name: sub.name,
      date: sub.date,
      time: sub.start_time,
      venue: sub.venue ?? "",
      address: sub.address ?? "",
      description: sub.description ?? "",
      dress_code: sub.dress_code ?? "",
      rsvp_deadline: sub.rsvp_deadline,
      rsvp_enabled: sub.rsvp_enabled,
      order_index: sub.display_order ?? sub.order_index,
    });
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, order_index: subEvents?.length ?? 0 });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate(form);
    } else {
      createMutation.mutate(form);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (isError) {
    return <ErrorState message={error instanceof Error ? error.message : "Failed to load"} onRetry={() => refetch()} />;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-dash-text">Events</h2>
          <p className="mt-1 text-sm text-dash-muted">
            Manage the individual events within your occasion (e.g., ceremony, reception).
          </p>
        </div>
        <Button onClick={handleAdd}>+ Add Event</Button>
      </div>

      {!subEvents || subEvents.length === 0 ? (
        <EmptyState
          title="No events yet"
          description="Add events to organize your occasion into individual parts."
          icon={<span className="text-4xl">🎉</span>}
          action={<Button onClick={handleAdd}>Add Event</Button>}
        />
      ) : (
        <div className="space-y-3">
          {subEvents.map((sub) => (
            <Card key={sub.id} hover>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-dash-text">{sub.name}</h3>
                    {sub.rsvp_enabled ? (
                      <Badge variant="success">RSVP On</Badge>
                    ) : (
                      <Badge variant="default">RSVP Off</Badge>
                    )}
                  </div>
                  {(sub.date || sub.start_time) && (
                    <p className="mt-1 text-sm text-dash-muted">
                      {sub.date && formatDateShort(sub.date)}
                      {sub.start_time && ` at ${to12Hour(sub.start_time)}`}
                    </p>
                  )}
                  {sub.venue && (
                    <p className="mt-1 text-sm text-dash-muted">📍 {sub.venue}</p>
                  )}
                  {sub.description && (
                    <p className="mt-2 text-sm text-dash-text">{sub.description}</p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Button size="sm" variant="ghost" onClick={() => handleEdit(sub)}>
                    Edit
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => setManagingId(sub.id)}>
                    Invitations
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    loading={deleteMutation.isPending}
                    onClick={() => {
                      if (confirm("Delete this event?")) {
                        deleteMutation.mutate(sub.id);
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

      {/* Form modal */}
      <Modal
        open={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingId(null);
          setForm(EMPTY_FORM);
        }}
        title={editingId ? "Edit Event" : "Add Event"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Event Name"
            type="text"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="Ceremony"
            required
          />
          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            placeholder="Brief description..."
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-dash-text">Date</label>
            <DatePicker
              value={form.date}
              onChange={(v) => setForm((p) => ({ ...p, date: v }))}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-dash-text">Time</label>
            <TimePicker
              value={form.time}
              onChange={(v) => setForm((p) => ({ ...p, time: v }))}
            />
          </div>
          <Input
            label="Venue"
            type="text"
            value={form.venue}
            onChange={(e) => setForm((p) => ({ ...p, venue: e.target.value }))}
            placeholder="Grand Ballroom"
          />
          <Input
            label="Address"
            type="text"
            value={form.address}
            onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
            placeholder="123 Main St"
          />
          <Input
            label="Dress Code"
            type="text"
            value={form.dress_code}
            onChange={(e) => setForm((p) => ({ ...p, dress_code: e.target.value }))}
            placeholder="Black Tie"
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-dash-text">
              RSVP Deadline
            </label>
            <DatePicker
              value={form.rsvp_deadline}
              onChange={(v) => setForm((p) => ({ ...p, rsvp_deadline: v }))}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-dash-text">
              Order Index
            </label>
            <Input
              type="number"
              value={form.order_index}
              onChange={(e) => setForm((p) => ({ ...p, order_index: Number(e.target.value) }))}
            />
          </div>
          <Toggle
            checked={form.rsvp_enabled}
            onChange={(v) => setForm((p) => ({ ...p, rsvp_enabled: v }))}
            label="RSVP Enabled"
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
                setForm(EMPTY_FORM);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>
              {editingId ? "Save" : "Add"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Invitation manager modal */}
      <Modal
        open={!!managingId}
        onClose={() => setManagingId(null)}
        title="Manage Invitations"
        size="lg"
      >
        {managingId && <InvitationManager subEventId={managingId} eventId={eventId} />}
      </Modal>
    </div>
  );
}
