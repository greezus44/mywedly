import { useState, type FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type SubEvent } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, Select, FormField, Card, Modal, LoadingSpinner, ErrorState, EmptyState, Badge } from "../../components/ui";
import { DateTimePicker } from "../../components/ui/DateTimePicker";
import { formatDate, formatTime12 } from "../../lib/utils";
import { InvitationManager } from "./invitation-manager";

interface SubEventFormData {
  name: string;
  date: string | null;
  time: string | null;
  venue: string | null;
  address: string | null;
  description: string | null;
  dress_code: string | null;
  rsvp_deadline: string | null;
  rsvp_enabled: boolean;
  display_order: number;
  start_time: string | null;
  end_time: string | null;
}

const emptyForm: SubEventFormData = {
  name: "",
  date: null,
  time: null,
  venue: null,
  address: null,
  description: null,
  dress_code: null,
  rsvp_deadline: null,
  rsvp_enabled: true,
  display_order: 0,
  start_time: null,
  end_time: null,
};

export function EventsPage() {
  const { eventId } = useEventContext();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SubEventFormData>(emptyForm);

  const { data: subEvents, isLoading, isError, error } = useQuery({
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
    mutationFn: async (data: SubEventFormData) => {
      const { error } = await supabase
        .from("sub_events")
        .insert({
          parent_event_id: eventId,
          name: data.name,
          date: data.date,
          time: data.time,
          venue: data.venue,
          address: data.address,
          description: data.description,
          dress_code: data.dress_code,
          rsvp_deadline: data.rsvp_deadline,
          rsvp_enabled: data.rsvp_enabled,
          display_order: data.display_order,
          start_time: data.start_time,
          end_time: data.end_time,
          order_index: data.display_order,
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
    mutationFn: async ({ id, data }: { id: string; data: SubEventFormData }) => {
      const { error } = await supabase
        .from("sub_events")
        .update({
          name: data.name,
          date: data.date,
          time: data.time,
          venue: data.venue,
          address: data.address,
          description: data.description,
          dress_code: data.dress_code,
          rsvp_deadline: data.rsvp_deadline,
          rsvp_enabled: data.rsvp_enabled,
          display_order: data.display_order,
          start_time: data.start_time,
          end_time: data.end_time,
          order_index: data.display_order,
          updated_at: new Date().toISOString(),
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

  function openCreate() {
    setForm({ ...emptyForm, display_order: subEvents?.length ?? 0 });
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(se: SubEvent) {
    setForm({
      name: se.name,
      date: se.date,
      time: se.time,
      venue: se.venue,
      address: se.address,
      description: se.description,
      dress_code: se.dress_code,
      rsvp_deadline: se.rsvp_deadline,
      rsvp_enabled: se.rsvp_enabled,
      display_order: se.display_order,
      start_time: se.start_time,
      end_time: se.end_time,
    });
    setEditingId(se.id);
    setShowForm(true);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: form });
    } else {
      createMutation.mutate(form);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (isError) {
    return <ErrorState message={error instanceof Error ? error.message : "Failed to load events"} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-dash-text">Events</h2>
          <p className="mt-1 text-sm text-dash-muted">Manage individual events within your celebration</p>
        </div>
        <Button onClick={openCreate}>Add Event</Button>
      </div>

      {subEvents && subEvents.length === 0 ? (
        <EmptyState
          title="No events yet"
          description="Add events like Ceremony, Reception, or Mehndi to organize your celebration."
          action={<Button onClick={openCreate}>Add Event</Button>}
        />
      ) : (
        <div className="space-y-3">
          {subEvents?.map((se) => (
            <Card key={se.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-dash-text">{se.name}</h3>
                    {se.rsvp_enabled ? (
                      <Badge variant="success">RSVP On</Badge>
                    ) : (
                      <Badge variant="default">RSVP Off</Badge>
                    )}
                  </div>
                  {se.date && (
                    <p className="mt-2 text-sm text-dash-muted">
                      {formatDate(se.date)}
                      {se.time && ` · ${formatTime12(se.time)}`}
                    </p>
                  )}
                  {se.venue && <p className="mt-1 text-sm text-dash-muted">{se.venue}</p>}
                  {se.description && <p className="mt-2 text-sm text-dash-text">{se.description}</p>}
                  {se.dress_code && (
                    <p className="mt-1 text-xs text-dash-muted">Dress code: {se.dress_code}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => openEdit(se)}>
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    loading={deleteMutation.isPending}
                    onClick={() => {
                      if (confirm(`Delete event "${se.name}"?`)) {
                        deleteMutation.mutate(se.id);
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

      {/* Invitation Manager */}
      {subEvents && subEvents.length > 0 && (
        <Card className="p-4">
          <InvitationManager eventId={eventId} subEvents={subEvents} />
        </Card>
      )}

      {/* Form Modal */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editingId ? "Edit Event" : "Add Event"}
        className="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Event Name" required>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              placeholder="e.g. Ceremony"
            />
          </FormField>

          <DateTimePicker
            label="Date & Time"
            date={form.date}
            time={form.time}
            onChange={(d, t) => setForm({ ...form, date: d, time: t })}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Venue">
              <Input
                value={form.venue ?? ""}
                onChange={(e) => setForm({ ...form, venue: e.target.value || null })}
                placeholder="Venue name"
              />
            </FormField>
            <FormField label="Address">
              <Input
                value={form.address ?? ""}
                onChange={(e) => setForm({ ...form, address: e.target.value || null })}
                placeholder="Full address"
              />
            </FormField>
          </div>

          <FormField label="Description">
            <Textarea
              value={form.description ?? ""}
              onChange={(e) => setForm({ ...form, description: e.target.value || null })}
              rows={3}
              placeholder="Event description..."
            />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Dress Code">
              <Input
                value={form.dress_code ?? ""}
                onChange={(e) => setForm({ ...form, dress_code: e.target.value || null })}
                placeholder="e.g. Black tie"
              />
            </FormField>
            <FormField label="RSVP Deadline">
              <Input
                type="date"
                value={form.rsvp_deadline ?? ""}
                onChange={(e) => setForm({ ...form, rsvp_deadline: e.target.value || null })}
              />
            </FormField>
          </div>

          <label className="flex items-center gap-2 text-sm text-dash-text">
            <input
              type="checkbox"
              checked={form.rsvp_enabled}
              onChange={(e) => setForm({ ...form, rsvp_enabled: e.target.checked })}
              className="rounded"
            />
            Enable RSVP for this event
          </label>

          <FormField label="Display Order">
            <Input
              type="number"
              value={form.display_order}
              onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })}
            />
          </FormField>

          {createMutation.isError && (
            <p className="text-sm text-dash-danger">
              {createMutation.error instanceof Error ? createMutation.error.message : "Failed to create"}
            </p>
          )}
          {updateMutation.isError && (
            <p className="text-sm text-dash-danger">
              {updateMutation.error instanceof Error ? updateMutation.error.message : "Failed to update"}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              loading={createMutation.isPending || updateMutation.isPending}
            >
              {editingId ? "Update" : "Add"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
