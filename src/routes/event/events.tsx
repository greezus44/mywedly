import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type SubEvent } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Input, Card, Modal, EmptyState, LoadingSpinner, ErrorState, Badge } from "../../components/ui";
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
  display_order: number;
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
  display_order: 0,
};

export function EventsPage() {
  const { eventId } = useEventContext();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SubEventForm>(EMPTY_FORM);

  const { data: subEvents, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["sub-events", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sub_events")
        .select("*")
        .eq("parent_event_id", eventId)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as SubEvent[];
    },
    enabled: !!eventId,
  });

  const createMutation = useMutation({
    mutationFn: async (input: SubEventForm) => {
      const { error } = await supabase
        .from("sub_events")
        .insert({
          parent_event_id: eventId,
          name: input.name,
          date: input.date,
          time: input.time,
          start_time: input.time,
          venue: input.venue || null,
          address: input.address || null,
          description: input.description || null,
          dress_code: input.dress_code || null,
          rsvp_enabled: input.rsvp_enabled,
          display_order: input.display_order,
          order_index: input.display_order,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-events", eventId] });
      setShowModal(false);
      setForm(EMPTY_FORM);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: SubEventForm }) => {
      const { error } = await supabase
        .from("sub_events")
        .update({
          name: input.name,
          date: input.date,
          time: input.time,
          start_time: input.time,
          venue: input.venue || null,
          address: input.address || null,
          description: input.description || null,
          dress_code: input.dress_code || null,
          rsvp_enabled: input.rsvp_enabled,
          display_order: input.display_order,
          order_index: input.display_order,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-events", eventId] });
      setShowModal(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
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

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, display_order: subEvents?.length ?? 0 });
    setShowModal(true);
  };

  const openEdit = (sub: SubEvent) => {
    setEditingId(sub.id);
    setForm({
      name: sub.name,
      date: sub.date,
      time: sub.time ?? sub.start_time,
      venue: sub.venue ?? "",
      address: sub.address ?? "",
      description: sub.description ?? "",
      dress_code: sub.dress_code ?? "",
      rsvp_enabled: sub.rsvp_enabled,
      display_order: sub.display_order,
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, input: form });
    } else {
      createMutation.mutate(form);
    }
  };

  function update<K extends keyof SubEventForm>(key: K, val: SubEventForm[K]) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner />
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        title="Failed to load events"
        message={error instanceof Error ? error.message : "An unexpected error occurred."}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-dash-text">Events</h2>
          <p className="text-sm text-dash-muted">Manage individual Events within your celebration.</p>
        </div>
        <Button onClick={openAdd}>Add Event</Button>
      </div>

      {!subEvents || subEvents.length === 0 ? (
        <EmptyState
          title="No Events yet"
          description="Add Events like Ceremony, Reception, or After Party to organise your celebration."
          action={<Button onClick={openAdd}>Add Event</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {subEvents.map((sub) => (
            <Card key={sub.id}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-dash-text">{sub.name}</h3>
                  {sub.date && (
                    <p className="mt-1 text-sm text-dash-muted">
                      {formatDate(sub.date)}
                      {sub.time && ` · ${formatTime12(sub.time)}`}
                    </p>
                  )}
                  {sub.venue && <p className="text-sm text-dash-muted">{sub.venue}</p>}
                  {sub.description && <p className="mt-2 text-sm text-dash-text">{sub.description}</p>}
                  <div className="mt-2 flex gap-2">
                    {sub.rsvp_enabled ? (
                      <Badge variant="success">RSVP Enabled</Badge>
                    ) : (
                      <Badge variant="default">RSVP Disabled</Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(sub)}>Edit</Button>
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
            </Card>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editingId ? "Edit Event" : "Add Event"} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Event Name"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="e.g. Ceremony"
            required
            autoFocus
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Date"
              type="date"
              value={form.date ?? ""}
              onChange={(e) => update("date", e.target.value || null)}
            />
            <Input
              label="Time"
              type="time"
              value={form.time ?? ""}
              onChange={(e) => update("time", e.target.value || null)}
            />
          </div>
          <Input
            label="Venue"
            value={form.venue}
            onChange={(e) => update("venue", e.target.value)}
            placeholder="e.g. St. Mary's Church"
          />
          <Input
            label="Address"
            value={form.address}
            onChange={(e) => update("address", e.target.value)}
            placeholder="e.g. 123 Main Street"
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-dash-text">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              rows={3}
              placeholder="Optional description"
              className="w-full rounded-md border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text focus:border-dash-primary focus:outline-none focus:ring-1 focus:ring-dash-primary"
            />
          </div>
          <Input
            label="Dress Code"
            value={form.dress_code}
            onChange={(e) => update("dress_code", e.target.value)}
            placeholder="e.g. Black tie"
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="rsvp_enabled"
              checked={form.rsvp_enabled}
              onChange={(e) => update("rsvp_enabled", e.target.checked)}
              className="h-4 w-4 rounded border-dash-border text-dash-primary focus:ring-dash-primary"
            />
            <label htmlFor="rsvp_enabled" className="text-sm text-dash-text">Enable RSVP for this Event</label>
          </div>
          <Input
            label="Display Order"
            type="number"
            value={form.display_order}
            onChange={(e) => update("display_order", parseInt(e.target.value, 10) || 0)}
          />
          {(createMutation.isError || updateMutation.isError) && (
            <p className="text-sm text-dash-danger">
              {createMutation.error instanceof Error || updateMutation.error instanceof Error
                ? (createMutation.error ?? updateMutation.error)?.message
                : "Failed to save"}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>
              {editingId ? "Update" : "Add"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
