import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type SubEvent, type GuestGroup, type EventGuest } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import {
  Input,
  Textarea,
  Card,
  Modal,
  LoadingSpinner,
  ErrorState,
  EmptyState,
  Badge,
  Toggle,
} from "../../components/ui";
import { DatePicker, TimePicker } from "../../components/ui";
import { formatDate, formatTime12, cn } from "../../lib/utils";
import { InvitationManager } from "./invitation-manager";
import type { EventOutletContext } from "./event-layout";

interface SubEventForm {
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

const EMPTY_FORM: SubEventForm = {
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

export default function Events() {
  const { eventId } = useOutletContext<EventOutletContext>();
  const queryClient = useQueryClient();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SubEventForm>(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Fetch sub-events
  const { data: subEvents, isLoading, error, refetch } = useQuery({
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

  // Fetch groups for InvitationManager
  const { data: groups } = useQuery({
    queryKey: ["guest-groups", eventId],
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

  // Fetch guests for InvitationManager
  const { data: guests } = useQuery({
    queryKey: ["event-guests", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_guests")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as EventGuest[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const displayOrder = subEvents?.length ?? 0;
      const { error } = await supabase
        .from("sub_events")
        .insert({
          parent_event_id: eventId,
          wedding_id: eventId,
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
          display_order: displayOrder,
          order_index: displayOrder,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-events", eventId] });
      setModalOpen(false);
      setForm(EMPTY_FORM);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingId) return;
      const { error } = await supabase
        .from("sub_events")
        .update({
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
        })
        .eq("id", editingId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-events", eventId] });
      setModalOpen(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!deleteId) return;
      const { error } = await supabase
        .from("sub_events")
        .delete()
        .eq("id", deleteId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-events", eventId] });
      setDeleteId(null);
    },
  });

  const handleAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
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
    setModalOpen(true);
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
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <ErrorState
          title="Failed to load events"
          message={error.message}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl space-y-6 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-dash-text">Events</h2>
            <p className="mt-1 text-sm text-dash-muted">
              Manage individual events within your celebration
            </p>
          </div>
          <Button onClick={handleAdd}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Event
          </Button>
        </div>

        {/* Sub-events list */}
        {subEvents && subEvents.length > 0 ? (
          <div className="space-y-3">
            {subEvents.map((se, idx) => (
              <Card key={se.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-dash-primary/10 text-dash-primary">
                      <span className="text-xs font-bold">{idx + 1}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-dash-text">
                          {se.name}
                        </h3>
                        {se.rsvp_enabled ? (
                          <Badge variant="success">RSVP</Badge>
                        ) : (
                          <Badge>No RSVP</Badge>
                        )}
                      </div>
                      {se.date && (
                        <p className="mt-1 text-sm text-dash-muted">
                          {formatDate(se.date)}
                          {se.start_time && ` · ${formatTime12(se.start_time)}`}
                          {se.end_time && ` – ${formatTime12(se.end_time)}`}
                        </p>
                      )}
                      {se.venue && (
                        <p className="mt-1 text-sm text-dash-muted">
                          📍 {se.venue}
                        </p>
                      )}
                      {se.description && (
                        <p className="mt-2 text-sm text-dash-text">
                          {se.description}
                        </p>
                      )}
                      {se.dress_code && (
                        <p className="mt-1 text-xs text-dash-muted">
                          Dress code: {se.dress_code}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(se)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeleteId(se.id)}
                    >
                      <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.107 48.107 0 013.478-.397m7.5 0v-.916c0-1.616-1.314-2.9-2.94-2.9H10.5c-1.626 0-2.94 1.284-2.94 2.9v.916" />
                      </svg>
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No events yet"
            description="Add individual events like Ceremony, Reception, or Mehndi to organize your celebration."
            icon={
              <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
            }
            action={<Button onClick={handleAdd}>Add First Event</Button>}
          />
        )}

        {/* Invitation Manager */}
        {subEvents && subEvents.length > 0 && (
          <div className="pt-4">
            <InvitationManager
              eventId={eventId}
              subEvents={subEvents}
              groups={groups ?? []}
              guests={guests ?? []}
            />
          </div>
        )}
      </div>

      {/* Add/Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit Event" : "Add Event"}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              loading={createMutation.isPending || updateMutation.isPending}
              disabled={!form.name.trim()}
            >
              {editingId ? "Update" : "Add"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Event Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Ceremony, Reception"
          />
          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Optional description"
            rows={2}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DatePicker
              label="Date"
              value={form.date}
              onChange={(v) => setForm({ ...form, date: v })}
            />
            <div className="grid grid-cols-2 gap-2">
              <TimePicker
                label="Start"
                value={form.start_time}
                onChange={(v) => setForm({ ...form, start_time: v })}
              />
              <TimePicker
                label="End"
                value={form.end_time}
                onChange={(v) => setForm({ ...form, end_time: v })}
              />
            </div>
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
            placeholder="e.g. 123 Main St, City"
          />
          <Input
            label="Dress Code"
            value={form.dress_code}
            onChange={(e) => setForm({ ...form, dress_code: e.target.value })}
            placeholder="e.g. Black tie"
          />
          <Toggle
            checked={form.rsvp_enabled}
            onChange={(v) => setForm({ ...form, rsvp_enabled: v })}
            label="Enable RSVP for this event"
          />
        </div>
      </Modal>

      {/* Delete confirmation */}
      <Modal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete Event"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => deleteMutation.mutate()}
              loading={deleteMutation.isPending}
            >
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-dash-text">
          Are you sure you want to delete this event? This will also remove all
          associated invitation assignments.
        </p>
      </Modal>
    </div>
  );
}
