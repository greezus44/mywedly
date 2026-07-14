import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type SubEvent } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Input";
import { Card, Modal, EmptyState, LoadingSpinner, ErrorState, Badge, Toggle } from "../../components/ui";
import { DatePicker } from "../../components/ui/DatePicker";
import { TimePicker } from "../../components/ui/TimePicker";
import { InvitationManager } from "./invitation-manager";
import { formatDate, formatTime12 } from "../../lib/utils";

export function EventsPage() {
  const { event, eventId } = useOutletContext<{ event: UserEvent; eventId: string }>();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<SubEvent | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [date, setDate] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<string | null>(null);
  const [endTime, setEndTime] = useState<string | null>(null);
  const [venue, setVenue] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [dressCode, setDressCode] = useState("");
  const [rsvpEnabled, setRsvpEnabled] = useState(true);

  const { data: subEvents, isLoading, isError } = useQuery({
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
      const maxOrder = subEvents ? Math.max(...subEvents.map((s) => s.display_order), 0) : 0;
      const { error } = await supabase.from("sub_events").insert({
        parent_event_id: eventId,
        name,
        date,
        start_time: startTime,
        end_time: endTime,
        venue: venue || null,
        address: address || null,
        description: description || null,
        dress_code: dressCode || null,
        rsvp_enabled: rsvpEnabled,
        display_order: maxOrder + 1,
        order_index: maxOrder + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-events", eventId] });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingItem) return;
      const { error } = await supabase
        .from("sub_events")
        .update({
          name,
          date,
          start_time: startTime,
          end_time: endTime,
          venue: venue || null,
          address: address || null,
          description: description || null,
          dress_code: dressCode || null,
          rsvp_enabled: rsvpEnabled,
        })
        .eq("id", editingItem.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-events", eventId] });
      resetForm();
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

  function resetForm() {
    setShowForm(false);
    setEditingItem(null);
    setName("");
    setDate(null);
    setStartTime(null);
    setEndTime(null);
    setVenue("");
    setAddress("");
    setDescription("");
    setDressCode("");
    setRsvpEnabled(true);
  }

  function openEdit(item: SubEvent) {
    setEditingItem(item);
    setName(item.name);
    setDate(item.date);
    setStartTime(item.start_time);
    setEndTime(item.end_time);
    setVenue(item.venue ?? "");
    setAddress(item.address ?? "");
    setDescription(item.description ?? "");
    setDressCode(item.dress_code ?? "");
    setRsvpEnabled(item.rsvp_enabled);
    setShowForm(true);
  }

  function handleSave() {
    if (editingItem) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-20">
        <ErrorState message="Failed to load events" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-dash-text">Events</h2>
          <p className="text-sm text-dash-muted mt-1">
            Add individual events within your celebration (ceremony, reception, etc.).
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          Add Event
        </Button>
      </div>

      {subEvents && subEvents.length > 0 ? (
        <div className="space-y-3">
          {subEvents.map((item) => (
            <Card key={item.id}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-dash-text">{item.name}</h3>
                    {item.rsvp_enabled ? (
                      <Badge variant="success">RSVP</Badge>
                    ) : (
                      <Badge>No RSVP</Badge>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-sm text-dash-muted mb-2">{item.description}</p>
                  )}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-dash-muted">
                    {item.date && <span>{formatDate(item.date)}</span>}
                    {item.start_time && <span>{formatTime12(item.start_time)}</span>}
                    {item.venue && <span>{item.venue}</span>}
                    {item.dress_code && <span>Dress: {item.dress_code}</span>}
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      setExpandedId(expandedId === item.id ? null : item.id)
                    }
                  >
                    {expandedId === item.id ? "Hide" : "Invitations"}
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => openEdit(item)}>
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => deleteMutation.mutate(item.id)}
                    loading={deleteMutation.isPending}
                  >
                    Delete
                  </Button>
                </div>
              </div>
              {expandedId === item.id && (
                <div className="mt-4 pt-4 border-t border-dash-border">
                  <InvitationManager
                    subEventId={item.id}
                    parentEventId={eventId}
                  />
                </div>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState
            title="No events yet"
            description="Add events like Ceremony, Reception, or Dinner to your celebration."
            icon={<span className="text-4xl">🎉</span>}
            action={<Button onClick={() => setShowForm(true)}>Add Event</Button>}
          />
        </Card>
      )}

      {/* Form Modal */}
      <Modal
        open={showForm}
        onClose={resetForm}
        title={editingItem ? "Edit Event" : "Add Event"}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Event Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Ceremony"
            autoFocus
          />
          <Textarea
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description"
          />
          <div>
            <label className="block text-sm font-medium text-dash-text mb-1.5">
              Date
            </label>
            <DatePicker value={date} onChange={setDate} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dash-text mb-1.5">
                Start Time
              </label>
              <TimePicker value={startTime} onChange={setStartTime} />
            </div>
            <div>
              <label className="block text-sm font-medium text-dash-text mb-1.5">
                End Time
              </label>
              <TimePicker value={endTime} onChange={setEndTime} />
            </div>
          </div>
          <Input
            label="Venue"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            placeholder="e.g. Main Hall"
          />
          <Input
            label="Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Venue address"
          />
          <Input
            label="Dress Code"
            value={dressCode}
            onChange={(e) => setDressCode(e.target.value)}
            placeholder="e.g. Black Tie"
          />
          <Toggle
            checked={rsvpEnabled}
            onChange={setRsvpEnabled}
            label="Enable RSVP for this event"
          />
          {(createMutation.isError || updateMutation.isError) && (
            <p className="text-sm text-dash-danger">Failed to save event</p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={resetForm}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              loading={createMutation.isPending || updateMutation.isPending}
              disabled={!name.trim()}
            >
              {editingItem ? "Save" : "Add"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
