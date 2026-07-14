import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import type { UserEvent, SubEvent } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, Select } from "../../components/ui/Input";
import {
  Card,
  Modal,
  LoadingSpinner,
  ErrorState,
  EmptyState,
  Badge,
  Toggle,
} from "../../components/ui";
import { DatePicker } from "../../components/ui/DatePicker";
import { TimePicker } from "../../components/ui/TimePicker";
import { InvitationManager } from "./invitation-manager";
import { formatDate, formatTime12 } from "../../lib/utils";

export function EventsPage() {
  const { event, eventId } = useOutletContext<{ event: UserEvent; eventId: string }>();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [venue, setVenue] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [dressCode, setDressCode] = useState("");
  const [rsvpEnabled, setRsvpEnabled] = useState(true);
  const [rsvpDeadline, setRsvpDeadline] = useState("");

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
        .eq("parent_event_id", eventId)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as SubEvent[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const maxOrder = subEvents ? Math.max(...subEvents.map((s) => s.display_order), -1) : -1;
      const { error } = await supabase.from("sub_events").insert({
        parent_event_id: eventId,
        name,
        date: date || null,
        start_time: startTime || null,
        end_time: endTime || null,
        venue: venue || null,
        address: address || null,
        description: description || null,
        dress_code: dressCode || null,
        rsvp_enabled: rsvpEnabled,
        rsvp_deadline: rsvpDeadline || null,
        display_order: maxOrder + 1,
        order_index: maxOrder + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-events", eventId] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingId) throw new Error("No event selected");
      const { error } = await supabase
        .from("sub_events")
        .update({
          name,
          date: date || null,
          start_time: startTime || null,
          end_time: endTime || null,
          venue: venue || null,
          address: address || null,
          description: description || null,
          dress_code: dressCode || null,
          rsvp_enabled: rsvpEnabled,
          rsvp_deadline: rsvpDeadline || null,
        })
        .eq("id", editingId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-events", eventId] });
      closeModal();
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
    setEditingId(null);
    setName("");
    setDate(event.draft_event_date || event.event_date || "");
    setStartTime("");
    setEndTime("");
    setVenue("");
    setAddress("");
    setDescription("");
    setDressCode("");
    setRsvpEnabled(true);
    setRsvpDeadline("");
    setModalOpen(true);
  };

  const openEdit = (se: SubEvent) => {
    setEditingId(se.id);
    setName(se.name);
    setDate(se.date || "");
    setStartTime(se.start_time || "");
    setEndTime(se.end_time || "");
    setVenue(se.venue || "");
    setAddress(se.address || "");
    setDescription(se.description || "");
    setDressCode(se.dress_code || "");
    setRsvpEnabled(se.rsvp_enabled);
    setRsvpDeadline(se.rsvp_deadline || "");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
  };

  const handleSave = () => {
    if (editingId) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return <ErrorState message="Failed to load events" onRetry={() => refetch()} />;
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-dash-text">Events</h2>
          <p className="mt-1 text-sm text-dash-muted">
            Manage individual events within your celebration (ceremony, reception, etc.).
          </p>
        </div>
        <Button onClick={openCreate}>Add Event</Button>
      </div>

      {subEvents && subEvents.length > 0 ? (
        <>
          <div className="space-y-4 mb-8">
            {subEvents.map((se) => (
              <Card key={se.id} className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base font-semibold text-dash-text">{se.name}</h3>
                      {se.rsvp_enabled && <Badge variant="primary">RSVP Enabled</Badge>}
                    </div>
                    {se.description && (
                      <p className="text-sm text-dash-muted mb-2">{se.description}</p>
                    )}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-dash-muted">
                      {se.date && <span>📅 {formatDate(se.date)}</span>}
                      {se.start_time && <span>⏰ {formatTime12(se.start_time)}</span>}
                      {se.end_time && <span>– {formatTime12(se.end_time)}</span>}
                      {se.venue && <span>📍 {se.venue}</span>}
                      {se.dress_code && <span>👔 {se.dress_code}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(se)}>
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
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

          {/* Invitation Manager */}
          <InvitationManager eventId={eventId} subEvents={subEvents} />
        </>
      ) : (
        <>
          <EmptyState
            title="No events yet"
            description="Add events like Ceremony, Reception, Dinner, etc. to your celebration."
            action={<Button onClick={openCreate}>Add Event</Button>}
          />
          <div className="mt-8">
            <InvitationManager eventId={eventId} subEvents={[]} />
          </div>
        </>
      )}

      {/* Modal */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingId ? "Edit Event" : "Add Event"}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              loading={createMutation.isPending || updateMutation.isPending}
            >
              {editingId ? "Save" : "Add"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Event Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Ceremony"
          />
          <Textarea
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description"
            rows={2}
          />
          <div className="grid grid-cols-2 gap-3">
            <DatePicker label="Date" value={date} onChange={(v) => setDate(v ?? "")} />
            <Input
              label="RSVP Deadline"
              type="date"
              value={rsvpDeadline}
              onChange={(e) => setRsvpDeadline(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <TimePicker label="Start Time" value={startTime} onChange={(v) => setStartTime(v ?? "")} />
            <TimePicker label="End Time" value={endTime} onChange={(v) => setEndTime(v ?? "")} />
          </div>
          <Input
            label="Venue"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            placeholder="Venue name"
          />
          <Textarea
            label="Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Full address"
            rows={2}
          />
          <Input
            label="Dress Code"
            value={dressCode}
            onChange={(e) => setDressCode(e.target.value)}
            placeholder="e.g., Black tie"
          />
          <div className="flex items-center gap-3">
            <Toggle
              checked={rsvpEnabled}
              onChange={setRsvpEnabled}
              label="Enable RSVP for this event"
            />
          </div>
          {(createMutation.isError || updateMutation.isError) && (
            <p className="text-sm text-dash-danger">
              {createMutation.error?.message || updateMutation.error?.message || "Save failed"}
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}
