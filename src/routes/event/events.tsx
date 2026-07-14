import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type SubEvent } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Textarea } from "../../components/ui/Input";
import { DatePicker } from "../../components/ui/DatePicker";
import { TimePicker } from "../../components/ui/TimePicker";
import { Toggle } from "../../components/ui";
import {
  Card,
  Modal,
  LoadingSpinner,
  ErrorState,
  EmptyState,
  Badge,
} from "../../components/ui";
import { InvitationManager } from "./invitation-manager";
import { formatDate, to12Hour } from "../../lib/utils";

export function EventsPage() {
  const { eventId } = useEventContext();
  const queryClient = useQueryClient();
  const [showEdit, setShowEdit] = useState(false);
  const [editing, setEditing] = useState<SubEvent | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: subEvents, isLoading, isError, error } = useQuery({
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

  const handleAdd = () => {
    setEditing(null);
    setShowEdit(true);
  };

  const handleEdit = (se: SubEvent) => {
    setEditing(se);
    setShowEdit(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (isError) {
    return <ErrorState title="Failed to load Events" description={error instanceof Error ? error.message : undefined} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-dash-text">Events</h2>
          <p className="text-sm text-dash-muted mt-1">
            Create individual Events within your celebration (e.g. Ceremony, Reception).
          </p>
        </div>
        <Button onClick={handleAdd}>Add Event</Button>
      </div>

      {subEvents && subEvents.length === 0 ? (
        <EmptyState
          title="No Events yet"
          description="Add Events to your celebration — each can have its own details and guest invitations."
          action={<Button onClick={handleAdd}>Add Event</Button>}
        />
      ) : (
        <div className="space-y-3">
          {subEvents?.map((se) => (
            <div key={se.id}>
              <Card className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base font-semibold text-dash-text">{se.name}</h3>
                      {se.rsvp_enabled && <Badge className="bg-green-100 text-green-700 border-green-200">RSVP</Badge>}
                    </div>
                    {se.description && (
                      <p className="text-sm text-dash-muted mb-2">{se.description}</p>
                    )}
                    <div className="flex flex-wrap gap-4 text-sm text-dash-muted">
                      {se.date && <span>📅 {formatDate(se.date)}</span>}
                      {se.start_time && <span>🕒 {to12Hour(se.start_time)}</span>}
                      {se.venue && <span>📍 {se.venue}</span>}
                      {se.dress_code && <span>👔 {se.dress_code}</span>}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(se)}>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setExpandedId(expandedId === se.id ? null : se.id)}
                    >
                      {expandedId === se.id ? "Hide" : "Invitations"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-dash-danger"
                      loading={deleteMutation.isPending}
                      onClick={() => {
                        if (confirm(`Delete "${se.name}"?`)) {
                          deleteMutation.mutate(se.id);
                        }
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
              {expandedId === se.id && (
                <div className="mt-2 ml-4">
                  <InvitationManager subEvent={se} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showEdit && (
        <SubEventEditor
          eventId={eventId}
          subEvent={editing}
          orderIndex={subEvents?.length ?? 0}
          onClose={() => setShowEdit(false)}
        />
      )}
    </div>
  );
}

function SubEventEditor({
  eventId,
  subEvent,
  orderIndex,
  onClose,
}: {
  eventId: string;
  subEvent: SubEvent | null;
  orderIndex: number;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(subEvent?.name ?? "");
  const [description, setDescription] = useState(subEvent?.description ?? "");
  const [date, setDate] = useState(subEvent?.date ?? "");
  const [startTime, setStartTime] = useState(subEvent?.start_time ?? subEvent?.time ?? "");
  const [endTime, setEndTime] = useState(subEvent?.end_time ?? "");
  const [venue, setVenue] = useState(subEvent?.venue ?? "");
  const [address, setAddress] = useState(subEvent?.address ?? "");
  const [dressCode, setDressCode] = useState(subEvent?.dress_code ?? "");
  const [rsvpEnabled, setRsvpEnabled] = useState(subEvent?.rsvp_enabled ?? true);
  const [rsvpDeadline, setRsvpDeadline] = useState(subEvent?.rsvp_deadline ?? "");

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        parent_event_id: eventId,
        name,
        description: description || null,
        date: date || null,
        start_time: startTime || null,
        end_time: endTime || null,
        venue: venue || null,
        address: address || null,
        dress_code: dressCode || null,
        rsvp_enabled: rsvpEnabled,
        rsvp_deadline: rsvpDeadline || null,
        display_order: subEvent?.display_order ?? orderIndex,
        order_index: subEvent?.order_index ?? orderIndex,
      };
      if (subEvent) {
        const { error } = await supabase
          .from("sub_events")
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq("id", subEvent.id);
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
      onClose();
    },
  });

  return (
    <Modal open onClose={onClose} title={subEvent ? "Edit Event" : "Add Event"} size="lg">
      <div className="space-y-4">
        <Input
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Ceremony"
          required
        />
        <Textarea
          label="Description"
          value={description ?? ""}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Additional details..."
        />
        <div className="grid grid-cols-2 gap-4">
          <DatePicker label="Date" value={date} onChange={setDate} />
          <div className="flex items-center pt-6">
            <Toggle
              label="RSVP enabled"
              checked={rsvpEnabled}
              onChange={setRsvpEnabled}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <TimePicker label="Start time" value={startTime} onChange={setStartTime} />
          <TimePicker label="End time" value={endTime} onChange={setEndTime} />
        </div>
        <Input
          label="Venue"
          value={venue ?? ""}
          onChange={(e) => setVenue(e.target.value)}
          placeholder="e.g. Main Hall"
        />
        <Input
          label="Address"
          value={address ?? ""}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="e.g. 123 Main St"
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Dress code"
            value={dressCode ?? ""}
            onChange={(e) => setDressCode(e.target.value)}
            placeholder="e.g. Black tie"
          />
          <DatePicker
            label="RSVP deadline"
            value={rsvpDeadline ?? ""}
            onChange={setRsvpDeadline}
          />
        </div>
        {saveMutation.isError && (
          <p className="text-sm text-dash-danger">
            {saveMutation.error instanceof Error ? saveMutation.error.message : "Save failed"}
          </p>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => saveMutation.mutate()}
            loading={saveMutation.isPending}
            disabled={!name.trim()}
          >
            {subEvent ? "Update" : "Add"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
