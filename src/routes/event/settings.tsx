import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Textarea } from "../../components/ui/Input";
import { Select } from "../../components/ui/Input";
import { DatePicker } from "../../components/ui/DatePicker";
import { TimePicker } from "../../components/ui/TimePicker";
import { Card, Modal, LoadingSpinner } from "../../components/ui";
import { formatDate } from "../../lib/utils";

export function SettingsPage() {
  const { event, eventId } = useEventContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showDelete, setShowDelete] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [name, setName] = useState(event.draft_name ?? event.name ?? "");
  const [eventType, setEventType] = useState(event.draft_event_type ?? event.event_type ?? "Wedding");
  const [eventDate, setEventDate] = useState(event.draft_event_date ?? event.event_date ?? "");
  const [eventTime, setEventTime] = useState(event.draft_event_time ?? event.event_time ?? "");
  const [venue, setVenue] = useState(event.draft_venue ?? event.venue ?? "");
  const [address, setAddress] = useState(event.draft_address ?? event.address ?? "");
  const [rsvpDeadline, setRsvpDeadline] = useState(event.draft_rsvp_deadline ?? event.rsvp_deadline ?? "");

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("user_events")
        .update({
          draft_name: name,
          draft_event_type: eventType,
          draft_event_date: eventDate || null,
          draft_event_time: eventTime || null,
          draft_venue: venue || null,
          draft_address: address || null,
          draft_rsvp_deadline: rsvpDeadline || null,
        })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
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
    onError: (err: Error) => {
      setDeleteError(err.message);
    },
  });

  const handleDelete = () => {
    setDeleteError(null);
    if (deleteConfirm !== event.name) {
      setDeleteError(`Please type "${event.name}" to confirm deletion.`);
      return;
    }
    deleteMutation.mutate();
  };

  const EVENT_TYPES = ["Wedding", "Birthday", "Anniversary", "Engagement", "Corporate", "Other"];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-dash-text">Website Settings</h2>

      <Card className="p-4 space-y-4">
        <h3 className="text-sm font-semibold text-dash-text">Event Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Event name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Jane & John's Wedding"
          />
          <Select label="Event type" value={eventType} onChange={(e) => setEventType(e.target.value)}>
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </Select>
          <DatePicker
            label="Event date"
            value={eventDate}
            onChange={setEventDate}
          />
          <TimePicker
            label="Event time"
            value={eventTime}
            onChange={setEventTime}
          />
          <Input
            label="Venue"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            placeholder="e.g. Grand Hotel"
          />
          <Input
            label="Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. 123 Main St, City"
          />
          <div className="md:col-span-2">
            <DatePicker
              label="RSVP deadline"
              value={rsvpDeadline}
              onChange={setRsvpDeadline}
            />
          </div>
        </div>
        <div className="flex items-center gap-3 pt-2">
          <Button
            onClick={() => updateMutation.mutate()}
            loading={updateMutation.isPending}
          >
            Save Changes
          </Button>
          {updateMutation.isSuccess && (
            <span className="text-sm text-green-600">Saved!</span>
          )}
          {updateMutation.isError && (
            <span className="text-sm text-dash-danger">
              {updateMutation.error instanceof Error ? updateMutation.error.message : "Save failed"}
            </span>
          )}
        </div>
      </Card>

      <Card className="p-4 space-y-3 border-dash-danger/30">
        <h3 className="text-sm font-semibold text-dash-danger">Danger Zone</h3>
        <p className="text-sm text-dash-muted">
          Deleting this website will permanently remove all data including guests, RSVPs, and custom pages.
          This cannot be undone.
        </p>
        <Button variant="danger" onClick={() => setShowDelete(true)}>
          Delete Website
        </Button>
      </Card>

      <Modal open={showDelete} onClose={() => setShowDelete(false)} title="Delete Website">
        <div className="space-y-4">
          <p className="text-sm text-dash-text">
            Are you sure you want to delete <strong>{event.name}</strong>? This action cannot be undone.
          </p>
          <p className="text-sm text-dash-muted">
            Type <strong className="text-dash-text">{event.name}</strong> to confirm:
          </p>
          <Input
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            placeholder={event.name}
            autoFocus
          />
          {deleteError && <p className="text-sm text-dash-danger">{deleteError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowDelete(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              loading={deleteMutation.isPending}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
