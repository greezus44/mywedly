import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type SubEvent } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Input";
import { Card, Modal, LoadingSpinner, ErrorState, EmptyState, Badge, Toggle, FormField } from "../../components/ui";
import { DatePicker } from "../../components/ui/DatePicker";
import { TimePicker } from "../../components/ui/TimePicker";
import { formatDate, formatTime12 } from "../../lib/utils";
import { InvitationManager } from "./invitation-manager";

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

const EMPTY_FORM: SubEventFormData = {
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

export const EventsPage: React.FC = () => {
  const { eventId } = useEventContext();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SubEventFormData>(EMPTY_FORM);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: subEvents, isLoading, isError, refetch } = useQuery({
    queryKey: ["sub-events", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sub_events")
        .select("*")
        .eq("parent_event_id", eventId)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as SubEvent[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const orderIndex = editingId
        ? (subEvents?.find((s) => s.id === editingId)?.display_order ?? subEvents?.length ?? 0)
        : (subEvents?.length ?? 0);
      const payload = {
        parent_event_id: eventId,
        name: form.name,
        date: form.date,
        start_time: form.start_time,
        end_time: form.end_time,
        venue: form.venue || null,
        address: form.address || null,
        description: form.description || null,
        dress_code: form.dress_code || null,
        rsvp_enabled: form.rsvp_enabled,
        rsvp_deadline: form.rsvp_deadline,
        order_index: orderIndex,
        display_order: orderIndex,
      };
      if (editingId) {
        const { error } = await supabase
          .from("sub_events")
          .update(payload)
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("sub_events")
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-events", eventId] });
      setModalOpen(false);
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
      queryClient.invalidateQueries({ queryKey: ["sub-events", eventId] });
    },
  });

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setModalOpen(true);
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
    setModalOpen(true);
  };

  if (isLoading) {
    return <LoadingSpinner size="md" label="Loading events..." />;
  }

  if (isError) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-dash-text">Events</h2>
          <p className="text-sm text-dash-muted">Create and manage individual events within your celebration.</p>
        </div>
        <Button onClick={openCreate}>Add Event</Button>
      </div>

      {(!subEvents || subEvents.length === 0) && (
        <EmptyState
          title="No events yet"
          description="Add events like Ceremony, Reception, or Rehearsal Dinner."
          action={<Button onClick={openCreate}>Add Event</Button>}
        />
      )}

      {subEvents && subEvents.length > 0 && (
        <div className="space-y-3">
          {subEvents.map((sub) => (
            <Card key={sub.id}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-dash-text">{sub.name}</h3>
                    {sub.rsvp_enabled && <Badge variant="success">RSVP</Badge>}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-dash-muted">
                    {sub.date && <span>{formatDate(sub.date)}</span>}
                    {sub.start_time && <span>{formatTime12(sub.start_time)}</span>}
                    {sub.venue && <span>{sub.venue}</span>}
                  </div>
                  {sub.description && (
                    <p className="mt-2 text-sm text-dash-muted">{sub.description}</p>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedId(expandedId === sub.id ? null : sub.id)}
                  >
                    {expandedId === sub.id ? "Hide" : "Invitations"}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => openEdit(sub)}>Edit</Button>
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
              </div>
              {expandedId === sub.id && (
                <div className="mt-4 border-t border-dash-border pt-4">
                  <InvitationManager subEvent={sub} />
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit Event" : "Add Event"}
        size="lg"
      >
        <div className="space-y-4">
          <FormField label="Event name" required>
            <Input
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Ceremony"
              autoFocus
            />
          </FormField>
          <FormField label="Description">
            <Textarea
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Join us for the ceremony..."
            />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-3">
            <FormField label="Date">
              <DatePicker
                value={form.date}
                onChange={(v) => setForm((prev) => ({ ...prev, date: v }))}
              />
            </FormField>
            <FormField label="Start time">
              <TimePicker
                value={form.start_time}
                onChange={(v) => setForm((prev) => ({ ...prev, start_time: v }))}
              />
            </FormField>
            <FormField label="End time">
              <TimePicker
                value={form.end_time}
                onChange={(v) => setForm((prev) => ({ ...prev, end_time: v }))}
              />
            </FormField>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Venue">
              <Input
                value={form.venue}
                onChange={(e) => setForm((prev) => ({ ...prev, venue: e.target.value }))}
                placeholder="Grand Ballroom"
              />
            </FormField>
            <FormField label="Dress code">
              <Input
                value={form.dress_code}
                onChange={(e) => setForm((prev) => ({ ...prev, dress_code: e.target.value }))}
                placeholder="Black tie optional"
              />
            </FormField>
          </div>
          <FormField label="Address">
            <Input
              value={form.address}
              onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
              placeholder="123 Main St"
            />
          </FormField>
          <div className="flex items-center justify-between rounded-md border border-dash-border bg-dash-bg px-3 py-2">
            <div>
              <p className="text-sm font-medium text-dash-text">RSVP Enabled</p>
              <p className="text-xs text-dash-muted">Allow guests to RSVP to this event</p>
            </div>
            <Toggle
              checked={form.rsvp_enabled}
              onChange={(checked) => setForm((prev) => ({ ...prev, rsvp_enabled: checked }))}
            />
          </div>
          {form.rsvp_enabled && (
            <FormField label="RSVP deadline">
              <DatePicker
                value={form.rsvp_deadline}
                onChange={(v) => setForm((prev) => ({ ...prev, rsvp_deadline: v }))}
              />
            </FormField>
          )}
          {saveMutation.isError && (
            <p className="text-sm text-dash-danger">
              {saveMutation.error instanceof Error ? saveMutation.error.message : "Save failed"}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending} disabled={saveMutation.isPending || !form.name.trim()}>
              {editingId ? "Update" : "Add"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
