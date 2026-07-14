import { useState, useEffect, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, FormField, Card, Modal } from "../../components/ui";
import { DateTimePicker } from "../../components/ui/DateTimePicker";

export function SettingsPage() {
  const { event, eventId } = useEventContext();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [name, setName] = useState(event.draft_name ?? event.name);
  const [eventType, setEventType] = useState(event.draft_event_type ?? event.event_type ?? "");
  const [eventDate, setEventDate] = useState(event.draft_event_date ?? event.event_date);
  const [eventTime, setEventTime] = useState(event.draft_event_time ?? event.event_time);
  const [venue, setVenue] = useState(event.draft_venue ?? event.venue ?? "");
  const [address, setAddress] = useState(event.draft_address ?? event.address ?? "");
  const [rsvpDeadline, setRsvpDeadline] = useState<string | null>(event.draft_rsvp_deadline ?? event.rsvp_deadline);
  const [rsvpDeadlineTime, setRsvpDeadlineTime] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  useEffect(() => {
    setName(event.draft_name ?? event.name);
    setEventType(event.draft_event_type ?? event.event_type ?? "");
    setEventDate(event.draft_event_date ?? event.event_date);
    setEventTime(event.draft_event_time ?? event.event_time);
    setVenue(event.draft_venue ?? event.venue ?? "");
    setAddress(event.draft_address ?? event.address ?? "");
    setRsvpDeadline(event.draft_rsvp_deadline ?? event.rsvp_deadline);
  }, [event]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("user_events")
        .update({
          draft_name: name,
          draft_event_type: eventType || null,
          draft_event_date: eventDate,
          draft_event_time: eventTime,
          draft_venue: venue || null,
          draft_address: address || null,
          draft_rsvp_deadline: rsvpDeadline,
        })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 2000);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("user_events")
        .delete()
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-events"] });
      navigate("/dashboard");
    },
  });

  function handleSave(e: FormEvent) {
    e.preventDefault();
    saveMutation.mutate();
  }

  function handleDelete() {
    if (deleteConfirm !== event.name) return;
    deleteMutation.mutate();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-dash-text">Website Settings</h2>
        <p className="mt-1 text-sm text-dash-muted">
          Update your event details and configuration.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <Card>
          <h3 className="mb-4 text-sm font-semibold text-dash-text">Event Details</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Event Name" required>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </FormField>
            <FormField label="Event Type">
              <Input
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                placeholder="Wedding, Birthday, etc."
              />
            </FormField>
            <DateTimePicker
              label="Event Date & Time"
              date={eventDate}
              time={eventTime}
              onChange={(d, t) => {
                setEventDate(d);
                setEventTime(t);
              }}
            />
            <FormField label="RSVP Deadline">
              <DateTimePicker
                date={rsvpDeadline}
                time={rsvpDeadlineTime}
                onChange={(d, _t) => setRsvpDeadline(d)}
              />
            </FormField>
            <FormField label="Venue">
              <Input value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="Venue name" />
            </FormField>
            <FormField label="Address">
              <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Full address" />
            </FormField>
          </div>
        </Card>

        <div className="flex items-center gap-3">
          <Button type="submit" loading={saveMutation.isPending}>
            Save Changes
          </Button>
          {savedMsg && <span className="text-sm text-green-600">Saved!</span>}
          {saveMutation.isError && (
            <span className="text-sm text-dash-danger">
              {saveMutation.error instanceof Error ? saveMutation.error.message : "Save failed"}
            </span>
          )}
        </div>
      </form>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <h3 className="mb-2 text-sm font-semibold text-dash-danger">Danger Zone</h3>
        <p className="mb-4 text-sm text-dash-muted">
          Deleting this invitation website is permanent and cannot be undone. All guests,
          RSVPs, and custom pages will be removed.
        </p>
        <Button variant="danger" onClick={() => setShowDelete(true)}>
          Delete Website
        </Button>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal open={showDelete} onClose={() => setShowDelete(false)} title="Delete Website">
        <div className="space-y-4">
          <p className="text-sm text-dash-text">
            Are you sure you want to delete <strong>{event.name}</strong>? This action cannot be undone.
          </p>
          <FormField label={`Type "${event.name}" to confirm`}>
            <Input
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder={event.name}
            />
          </FormField>
          {deleteMutation.isError && (
            <p className="text-sm text-dash-danger">
              {deleteMutation.error instanceof Error ? deleteMutation.error.message : "Delete failed"}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowDelete(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={deleteMutation.isPending}
              disabled={deleteConfirm !== event.name}
              onClick={handleDelete}
            >
              Delete Permanently
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
