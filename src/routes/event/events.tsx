import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type SubEvent } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Card, Input, Textarea, Select, Modal, Badge, Toggle, EmptyState, LoadingSpinner, ErrorState } from "../../components/ui";
import { InvitationManager } from "./invitation-manager";
import { formatDate, formatTime12 } from "../../lib/utils";

interface SubEventFormData {
  name: string;
  date: string;
  time: string;
  venue: string;
  address: string;
  description: string;
  dress_code: string;
  rsvp_enabled: boolean;
  rsvp_deadline: string;
  start_time: string;
  end_time: string;
}

const emptyForm: SubEventFormData = {
  name: "",
  date: "",
  time: "",
  venue: "",
  address: "",
  description: "",
  dress_code: "",
  rsvp_enabled: true,
  rsvp_deadline: "",
  start_time: "",
  end_time: "",
};

export function EventsPage() {
  const { eventId } = useEventContext();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SubEventFormData>(emptyForm);
  const [managingId, setManagingId] = useState<string | null>(null);

  const { data: subEvents, isLoading, isError, refetch } = useQuery({
    queryKey: ["sub-events", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sub_events")
        .select("*")
        .eq("parent_event_id", eventId!)
        .order("order_index", { ascending: true });
      if (error) throw error;
      return (data ?? []) as SubEvent[];
    },
    enabled: !!eventId,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const maxOrder = subEvents?.length ?? 0;
      const { error } = await supabase.from("sub_events").insert({
        parent_event_id: eventId,
        name: form.name,
        date: form.date || null,
        time: form.time || null,
        venue: form.venue || null,
        address: form.address || null,
        description: form.description || null,
        dress_code: form.dress_code || null,
        rsvp_enabled: form.rsvp_enabled,
        rsvp_deadline: form.rsvp_deadline || null,
        start_time: form.start_time || null,
        end_time: form.end_time || null,
        order_index: maxOrder,
        display_order: maxOrder,
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
    mutationFn: async () => {
      const { error } = await supabase
        .from("sub_events")
        .update({
          name: form.name,
          date: form.date || null,
          time: form.time || null,
          venue: form.venue || null,
          address: form.address || null,
          description: form.description || null,
          dress_code: form.dress_code || null,
          rsvp_enabled: form.rsvp_enabled,
          rsvp_deadline: form.rsvp_deadline || null,
          start_time: form.start_time || null,
          end_time: form.end_time || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingId!);
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
      const { error } = await supabase.from("sub_events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-events", eventId] });
    },
  });

  const openEdit = (subEvent: SubEvent) => {
    setEditingId(subEvent.id);
    setForm({
      name: subEvent.name,
      date: subEvent.date ?? "",
      time: subEvent.time ?? "",
      venue: subEvent.venue ?? "",
      address: subEvent.address ?? "",
      description: subEvent.description ?? "",
      dress_code: subEvent.dress_code ?? "",
      rsvp_enabled: subEvent.rsvp_enabled,
      rsvp_deadline: subEvent.rsvp_deadline ?? "",
      start_time: subEvent.start_time ?? "",
      end_time: subEvent.end_time ?? "",
    });
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (editingId) updateMutation.mutate();
    else createMutation.mutate();
  };

  const managingSubEvent = subEvents?.find((se) => se.id === managingId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size={32} />
      </div>
    );
  }

  if (isError) {
    return <ErrorState message="Failed to load events." onRetry={() => refetch()} />;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-dash-text">Events</h2>
          <p className="mt-1 text-sm text-dash-muted">
            Create individual events within your celebration (e.g. Ceremony, Reception).
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingId(null);
            setForm(emptyForm);
            setShowForm(true);
          }}
        >
          Add Event
        </Button>
      </div>

      {subEvents && subEvents.length === 0 ? (
        <EmptyState
          title="No events yet"
          description="Add events like Ceremony, Reception, or Mehndi to organize your celebration."
          icon={<div className="text-4xl">🎉</div>}
          action={<Button onClick={() => setShowForm(true)}>Add First Event</Button>}
        />
      ) : (
        <div className="space-y-4">
          {subEvents?.map((subEvent) => (
            <Card key={subEvent.id}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-dash-text">{subEvent.name}</h3>
                    {subEvent.rsvp_enabled ? (
                      <Badge variant="success">RSVP Enabled</Badge>
                    ) : (
                      <Badge variant="default">RSVP Disabled</Badge>
                    )}
                  </div>
                  {subEvent.date && (
                    <p className="mt-1 text-sm text-dash-muted">
                      {formatDate(subEvent.date)}
                      {subEvent.start_time && ` · ${formatTime12(subEvent.start_time)}`}
                      {subEvent.end_time && ` – ${formatTime12(subEvent.end_time)}`}
                    </p>
                  )}
                  {subEvent.venue && (
                    <p className="mt-1 text-sm text-dash-muted">📍 {subEvent.venue}</p>
                  )}
                  {subEvent.description && (
                    <p className="mt-2 text-sm text-dash-text">{subEvent.description}</p>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <Button variant="ghost" size="sm" onClick={() => setManagingId(subEvent.id)}>
                    Invitations
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => openEdit(subEvent)}>
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm(`Delete "${subEvent.name}"?`)) {
                        deleteMutation.mutate(subEvent.id);
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

      {/* Form Modal */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editingId ? "Edit Event" : "Add Event"}
        className="max-w-2xl"
      >
        <div className="space-y-4">
          <Input
            label="Event Name"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="e.g. Ceremony"
          />
          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Brief description of this event..."
          />
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Date"
              type="date"
              value={form.date}
              onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
            />
            <Input
              label="Start Time"
              type="time"
              value={form.start_time}
              onChange={(e) => setForm((prev) => ({ ...prev, start_time: e.target.value }))}
            />
            <Input
              label="End Time"
              type="time"
              value={form.end_time}
              onChange={(e) => setForm((prev) => ({ ...prev, end_time: e.target.value }))}
            />
          </div>
          <Input
            label="Venue"
            value={form.venue}
            onChange={(e) => setForm((prev) => ({ ...prev, venue: e.target.value }))}
            placeholder="The Grand Ballroom"
          />
          <Input
            label="Address"
            value={form.address}
            onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
            placeholder="123 Main Street, City"
          />
          <Input
            label="Dress Code"
            value={form.dress_code}
            onChange={(e) => setForm((prev) => ({ ...prev, dress_code: e.target.value }))}
            placeholder="Black Tie / Cocktail / Casual"
          />
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-dash-text">Enable RSVP for this event</span>
            <Toggle
              checked={form.rsvp_enabled}
              onChange={(v) => setForm((prev) => ({ ...prev, rsvp_enabled: v }))}
            />
          </div>
          {form.rsvp_enabled && (
            <Input
              label="RSVP Deadline"
              type="datetime-local"
              value={form.rsvp_deadline}
              onChange={(e) => setForm((prev) => ({ ...prev, rsvp_deadline: e.target.value }))}
            />
          )}
          {(createMutation.isError || updateMutation.isError) && (
            <p className="text-sm text-dash-danger">
              Error: {((createMutation.error || updateMutation.error) as Error)?.message}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowForm(false)}>
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

      {/* Invitation Manager Modal */}
      <Modal
        open={!!managingId}
        onClose={() => setManagingId(null)}
        title={`Invitations — ${managingSubEvent?.name ?? ""}`}
        className="max-w-2xl"
      >
        {managingSubEvent && (
          <InvitationManager subEvent={managingSubEvent} eventId={eventId} />
        )}
      </Modal>
    </div>
  );
}
