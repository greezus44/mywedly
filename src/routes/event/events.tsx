import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type SubEvent } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Input";
import { Card, Modal, LoadingSpinner, ErrorState, EmptyState, Badge } from "../../components/ui";
import { DatePicker, TimePicker } from "../../components/ui";
import { formatDate, formatTime12 } from "../../lib/utils";
import { InvitationManager } from "./invitation-manager";
import type { EventOutletContext } from "./event-layout";

interface SubEventForm {
  name: string;
  date: string | null;
  time: string | null;
  start_time: string | null;
  end_time: string | null;
  venue: string;
  address: string;
  description: string;
  dress_code: string;
  rsvp_enabled: boolean;
}

const EMPTY_FORM: SubEventForm = {
  name: "",
  date: null,
  time: null,
  start_time: null,
  end_time: null,
  venue: "",
  address: "",
  description: "",
  dress_code: "",
  rsvp_enabled: true,
};

export default function Events(): React.ReactElement {
  const { eventId } = useOutletContext<EventOutletContext>();
  const queryClient = useQueryClient();

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SubEventForm>(EMPTY_FORM);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: subEvents, isLoading, error } = useQuery({
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
      const maxOrder = subEvents?.length ?? 0;
      const { error } = await supabase.from("sub_events").insert({
        parent_event_id: eventId,
        wedding_id: eventId,
        name: form.name,
        date: form.date,
        time: form.start_time,
        start_time: form.start_time,
        end_time: form.end_time,
        venue: form.venue || null,
        address: form.address || null,
        description: form.description || null,
        dress_code: form.dress_code || null,
        rsvp_enabled: form.rsvp_enabled,
        order_index: maxOrder,
        display_order: maxOrder,
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
      if (!editingId) throw new Error("No event selected");
      const { error } = await supabase
        .from("sub_events")
        .update({
          name: form.name,
          date: form.date,
          time: form.start_time,
          start_time: form.start_time,
          end_time: form.end_time,
          venue: form.venue || null,
          address: form.address || null,
          description: form.description || null,
          dress_code: form.dress_code || null,
          rsvp_enabled: form.rsvp_enabled,
        })
        .eq("id", editingId);
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

  function handleEdit(sub: SubEvent): void {
    setEditingId(sub.id);
    setForm({
      name: sub.name,
      date: sub.date,
      time: sub.time,
      start_time: sub.start_time ?? sub.time,
      end_time: sub.end_time,
      venue: sub.venue ?? "",
      address: sub.address ?? "",
      description: sub.description ?? "",
      dress_code: sub.dress_code ?? "",
      rsvp_enabled: sub.rsvp_enabled,
    });
    setShowModal(true);
  }

  function handleAdd(): void {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const saveError = createMutation.error || updateMutation.error;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error.message} />;
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-dash-text">Events</h2>
          <p className="mt-1 text-sm text-dash-muted">
            Manage the individual events within your celebration
          </p>
        </div>
        <Button onClick={handleAdd}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Event
        </Button>
      </div>

      {subEvents && subEvents.length > 0 ? (
        <div className="space-y-3">
          {subEvents.map((sub) => (
            <div key={sub.id}>
              <Card className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-dash-text">{sub.name}</h3>
                    {sub.rsvp_enabled && <Badge variant="success">RSVP</Badge>}
                  </div>
                  {sub.date && (
                    <p className="text-sm text-dash-muted">{formatDate(sub.date)}</p>
                  )}
                  {(sub.start_time || sub.end_time) && (
                    <p className="text-sm text-dash-muted">
                      {sub.start_time ? formatTime12(sub.start_time) : ""}
                      {sub.start_time && sub.end_time ? " - " : ""}
                      {sub.end_time ? formatTime12(sub.end_time) : ""}
                    </p>
                  )}
                  {sub.venue && (
                    <p className="text-sm text-dash-muted mt-1">{sub.venue}</p>
                  )}
                  {sub.description && (
                    <p className="text-sm text-dash-muted mt-1">{sub.description}</p>
                  )}
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(sub)}>
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedId(expandedId === sub.id ? null : sub.id)}
                  >
                    {expandedId === sub.id ? "Hide" : "Invitations"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    loading={deleteMutation.isPending}
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
              {expandedId === sub.id && (
                <div className="mt-2 ml-4">
                  <InvitationManager subEventId={sub.id} subEventName={sub.name} eventId={eventId} />
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState
            icon={
              <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
            title="No events yet"
            description="Add events like Ceremony, Reception, or Pre-party to organize your celebration."
            action={<Button onClick={handleAdd}>Add Event</Button>}
          />
        </Card>
      )}

      {/* Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingId ? "Edit Event" : "Add Event"}
        size="lg"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (editingId) {
              updateMutation.mutate();
            } else {
              createMutation.mutate();
            }
          }}
          className="space-y-4"
        >
          <Input
            label="Event name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Ceremony, Reception, Pre-party"
            required
            autoFocus
          />
          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Additional details..."
            rows={2}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DatePicker
              label="Date"
              value={form.date}
              onChange={(v) => setForm({ ...form, date: v })}
            />
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.rsvp_enabled}
                  onChange={(e) => setForm({ ...form, rsvp_enabled: e.target.checked })}
                  className="h-4 w-4 text-dash-primary focus:ring-dash-primary"
                />
                <span className="text-sm text-dash-text">Enable RSVP for this event</span>
              </label>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TimePicker
              label="Start time"
              value={form.start_time}
              onChange={(v) => setForm({ ...form, start_time: v })}
            />
            <TimePicker
              label="End time"
              value={form.end_time}
              onChange={(v) => setForm({ ...form, end_time: v })}
            />
          </div>
          <Input
            label="Venue"
            value={form.venue}
            onChange={(e) => setForm({ ...form, venue: e.target.value })}
            placeholder="e.g. The Grand Ballroom"
          />
          <Input
            label="Address"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="e.g. 123 Main St, City, State"
          />
          <Input
            label="Dress code"
            value={form.dress_code}
            onChange={(e) => setForm({ ...form, dress_code: e.target.value })}
            placeholder="e.g. Black tie, Cocktail, Casual"
          />
          {saveError && (
            <div className="rounded-md border border-dash-danger/20 bg-dash-danger/5 px-4 py-3">
              <p className="text-sm text-dash-danger">
                {saveError instanceof Error ? saveError.message : "Failed to save"}
              </p>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={isSaving} disabled={isSaving}>
              {editingId ? "Update" : "Add"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
