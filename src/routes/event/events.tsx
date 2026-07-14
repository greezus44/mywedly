import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type SubEvent } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import {
  Modal,
  Input,
  Textarea,
  DatePicker,
  TimePicker,
  LoadingSpinner,
  ErrorState,
  EmptyState,
  Card,
  Badge,
} from "../../components/ui";
import { InvitationManager } from "./invitation-manager";
import { formatDate, formatTime12 } from "../../lib/utils";

interface FormState {
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

const EMPTY_FORM: FormState = {
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

export default function EventsPage() {
  const { event, eventId } = useEventContext();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const {
    data: subEvents,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
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
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!form.name.trim()) throw new Error("Event name is required.");
      const maxOrder = subEvents?.reduce((max, s) => Math.max(max, s.display_order), -1) ?? -1;
      const { error } = await supabase.from("sub_events").insert({
        parent_event_id: eventId,
        wedding_id: eventId,
        name: form.name.trim(),
        date: form.date,
        start_time: form.start_time,
        end_time: form.end_time,
        venue: form.venue || null,
        address: form.address || null,
        description: form.description || null,
        dress_code: form.dress_code || null,
        rsvp_enabled: form.rsvp_enabled,
        rsvp_deadline: form.rsvp_deadline,
        order_index: maxOrder + 1,
        display_order: maxOrder + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-events", eventId] });
      setShowModal(false);
      setForm(EMPTY_FORM);
      setEditingId(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!form.name.trim()) throw new Error("Event name is required.");
      const { error } = await supabase
        .from("sub_events")
        .update({
          name: form.name.trim(),
          date: form.date,
          start_time: form.start_time,
          end_time: form.end_time,
          venue: form.venue || null,
          address: form.address || null,
          description: form.description || null,
          dress_code: form.dress_code || null,
          rsvp_enabled: form.rsvp_enabled,
          rsvp_deadline: form.rsvp_deadline,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-events", eventId] });
      setShowModal(false);
      setForm(EMPTY_FORM);
      setEditingId(null);
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

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowModal(true);
  };

  const openEdit = (sub: SubEvent) => {
    setForm({
      name: sub.name,
      date: sub.date,
      start_time: sub.start_time,
      end_time: sub.end_time,
      venue: sub.venue ?? "",
      address: sub.address ?? "",
      description: sub.description ?? "",
      dress_code: sub.dress_code ?? "",
      rsvp_enabled: sub.rsvp_enabled,
      rsvp_deadline: sub.rsvp_deadline,
    });
    setEditingId(sub.id);
    setShowModal(true);
  };

  const handleSubmit = () => {
    if (editingId) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const mutationError = (createMutation.error ?? updateMutation.error ?? deleteMutation.error) as Error | null;

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (isError) {
    return <ErrorState message={error?.message} onRetry={() => refetch()} />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-dash-text">Events</h1>
          <p className="text-sm text-dash-muted">
            Manage individual events within your {event.name} celebration.
          </p>
        </div>
        <Button onClick={openCreate}>+ Add Event</Button>
      </div>

      {mutationError && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-dash-danger">
          {mutationError.message}
        </p>
      )}

      {!subEvents || subEvents.length === 0 ? (
        <EmptyState
          title="No events yet"
          description="Add events like Ceremony, Reception, or Brunch to organize your celebration."
          icon={<span className="text-4xl">🎉</span>}
          action={<Button onClick={openCreate}>+ Add Event</Button>}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {subEvents.map((sub) => (
            <Card key={sub.id} className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-dash-text">{sub.name}</h3>
                    {sub.rsvp_enabled ? (
                      <Badge variant="success">RSVP Open</Badge>
                    ) : (
                      <Badge variant="default">RSVP Closed</Badge>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-3 text-sm text-dash-muted">
                    {sub.date && <span>{formatDate(sub.date)}</span>}
                    {sub.start_time && <span>{formatTime12(sub.start_time)}</span>}
                    {sub.end_time && <span>– {formatTime12(sub.end_time)}</span>}
                    {sub.venue && <span>• {sub.venue}</span>}
                  </div>
                  {sub.description && (
                    <p className="mt-2 text-sm text-dash-muted">{sub.description}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedId(expandedId === sub.id ? null : sub.id)}
                  >
                    {expandedId === sub.id ? "Hide Invitations" : "Manage Invitations"}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => openEdit(sub)}>
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    loading={deleteMutation.isPending}
                    onClick={() => {
                      if (confirm(`Delete "${sub.name}"? This will also remove its invitation assignments.`)) {
                        deleteMutation.mutate(sub.id);
                      }
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>

              {expandedId === sub.id && (
                <div className="mt-2 border-t border-dash-border pt-4">
                  <InvitationManager subEventId={sub.id} eventId={eventId} />
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingId ? "Edit Event" : "Add Event"}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button loading={isSaving} onClick={handleSubmit} disabled={!form.name.trim()}>
              {editingId ? "Update" : "Create"}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Input
              label="Event Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Ceremony"
            />
          </div>
          <DatePicker
            label="Date"
            value={form.date}
            onChange={(v) => setForm({ ...form, date: v })}
          />
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm text-dash-text">
              <input
                type="checkbox"
                checked={form.rsvp_enabled}
                onChange={(e) => setForm({ ...form, rsvp_enabled: e.target.checked })}
                className="h-4 w-4 rounded border-dash-border"
              />
              RSVP Enabled
            </label>
          </div>
          <TimePicker
            label="Start Time"
            value={form.start_time}
            onChange={(v) => setForm({ ...form, start_time: v })}
          />
          <TimePicker
            label="End Time"
            value={form.end_time}
            onChange={(v) => setForm({ ...form, end_time: v })}
          />
          <Input
            label="Venue"
            value={form.venue}
            onChange={(e) => setForm({ ...form, venue: e.target.value })}
            placeholder="e.g. Main Hall"
          />
          <Input
            label="Address"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="e.g. 123 Main St"
          />
          <Input
            label="Dress Code"
            value={form.dress_code}
            onChange={(e) => setForm({ ...form, dress_code: e.target.value })}
            placeholder="e.g. Black tie"
          />
          <div className="sm:col-span-2">
            <Textarea
              label="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Additional details about this event..."
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
