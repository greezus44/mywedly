import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type SubEvent } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, Select, Toggle, FormField, Modal, Card, Badge, EmptyState, LoadingSpinner, ErrorState } from "../../components/ui";
import { DateTimePicker } from "../../components/ui/DateTimePicker";
import { InvitationManager } from "./invitation-manager";
import { formatDate, formatTime12 } from "../../lib/utils";

interface SubEventFormData {
  name: string;
  date: string | null;
  start_time: string | null;
  end_time: string | null;
  venue: string;
  address: string;
  description: string;
  dress_code: string;
  rsvp_enabled: boolean;
  rsvp_deadline: string | null;
}

const emptyForm: SubEventFormData = {
  name: "",
  date: null,
  start_time: null,
  end_time: null,
  venue: "",
  address: "",
  description: "",
  dress_code: "",
  rsvp_enabled: true,
  rsvp_deadline: null,
};

export function EventsPage() {
  const { eventId } = useEventContext();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SubEventFormData>(emptyForm);
  const [managingId, setManagingId] = useState<string | null>(null);

  const {
    data: subEvents,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["sub-events", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sub_events")
        .select("*")
        .eq("parent_event_id", eventId!)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as SubEvent[];
    },
    enabled: !!eventId,
  });

  const createMutation = useMutation({
    mutationFn: async (formData: SubEventFormData) => {
      const nextOrder = subEvents?.length ?? 0;
      const { error } = await supabase
        .from("sub_events")
        .insert({
          parent_event_id: eventId,
          name: formData.name,
          date: formData.date,
          start_time: formData.start_time,
          end_time: formData.end_time,
          venue: formData.venue || null,
          address: formData.address || null,
          description: formData.description || null,
          dress_code: formData.dress_code || null,
          rsvp_enabled: formData.rsvp_enabled,
          rsvp_deadline: formData.rsvp_deadline,
          display_order: nextOrder,
          order_index: nextOrder,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-events", eventId] });
      setShowForm(false);
      setForm(emptyForm);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: SubEventFormData }) => {
      const { error } = await supabase
        .from("sub_events")
        .update({
          name: formData.name,
          date: formData.date,
          start_time: formData.start_time,
          end_time: formData.end_time,
          venue: formData.venue || null,
          address: formData.address || null,
          description: formData.description || null,
          dress_code: formData.dress_code || null,
          rsvp_enabled: formData.rsvp_enabled,
          rsvp_deadline: formData.rsvp_deadline,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-events", eventId] });
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
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

  const handleSubmit = () => {
    if (!form.name.trim()) return;
    if (editingId) {
      updateMutation.mutate({ id: editingId, formData: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const handleEdit = (se: SubEvent) => {
    setEditingId(se.id);
    setForm({
      name: se.name,
      date: se.date,
      start_time: se.start_time,
      end_time: se.end_time,
      venue: se.venue ?? "",
      address: se.address ?? "",
      description: se.description ?? "",
      dress_code: se.dress_code ?? "",
      rsvp_enabled: se.rsvp_enabled,
      rsvp_deadline: se.rsvp_deadline,
    });
    setShowForm(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (isError) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  // If managing invitations for a sub-event, show the InvitationManager
  if (managingId) {
    const subEvent = subEvents?.find((s) => s.id === managingId);
    if (subEvent) {
      return (
        <InvitationManager
          subEvent={subEvent}
          onBack={() => setManagingId(null)}
        />
      );
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-dash-text">Events</h2>
        <Button
          onClick={() => {
            setForm(emptyForm);
            setEditingId(null);
            setShowForm(true);
          }}
        >
          Add Event
        </Button>
      </div>

      {subEvents && subEvents.length === 0 ? (
        <EmptyState
          title="No events"
          description="Add events to your invitation website (e.g. Ceremony, Reception)."
          action={
            <Button
              onClick={() => {
                setForm(emptyForm);
                setEditingId(null);
                setShowForm(true);
              }}
            >
              Add Event
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {subEvents?.map((se) => (
            <Card key={se.id}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-dash-text">
                      {se.name}
                    </h3>
                    {se.rsvp_enabled && <Badge color="success">RSVP</Badge>}
                  </div>
                  {se.date && (
                    <p className="mt-1 text-sm text-dash-muted">
                      {formatDate(se.date)}
                      {se.start_time ? ` • ${formatTime12(se.start_time)}` : ""}
                      {se.end_time ? ` – ${formatTime12(se.end_time)}` : ""}
                    </p>
                  )}
                  {se.venue && (
                    <p className="mt-1 text-sm text-dash-muted">{se.venue}</p>
                  )}
                  {se.description && (
                    <p className="mt-2 text-sm text-dash-text">{se.description}</p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setManagingId(se.id)}
                  >
                    Invitations
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleEdit(se)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => deleteMutation.mutate(se.id)}
                    loading={deleteMutation.isPending}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingId(null);
        }}
        title={editingId ? "Edit Event" : "Add Event"}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Event Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Ceremony"
          />
          <DateTimePicker
            label="Date & Time"
            value={form.date}
            onChange={(v) => setForm({ ...form, date: v })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Time"
              type="time"
              value={form.start_time ?? ""}
              onChange={(e) => setForm({ ...form, start_time: e.target.value || null })}
            />
            <Input
              label="End Time"
              type="time"
              value={form.end_time ?? ""}
              onChange={(e) => setForm({ ...form, end_time: e.target.value || null })}
            />
          </div>
          <Input
            label="Venue"
            value={form.venue}
            onChange={(e) => setForm({ ...form, venue: e.target.value })}
          />
          <Textarea
            label="Address"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            rows={2}
          />
          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
          />
          <Input
            label="Dress Code"
            value={form.dress_code}
            onChange={(e) => setForm({ ...form, dress_code: e.target.value })}
          />
          <div className="flex items-center justify-between">
            <Toggle
              checked={form.rsvp_enabled}
              onChange={(v) => setForm({ ...form, rsvp_enabled: v })}
              label="RSVP Enabled"
            />
          </div>
          {form.rsvp_enabled && (
            <DateTimePicker
              label="RSVP Deadline"
              value={form.rsvp_deadline}
              onChange={(v) => setForm({ ...form, rsvp_deadline: v })}
            />
          )}
          {(createMutation.isError || updateMutation.isError) && (
            <p className="text-sm text-red-600">Failed to save</p>
          )}
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
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
