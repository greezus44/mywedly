import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Card, Input, Select, Modal, Badge } from "../../components/ui";

export function SettingsPage() {
  const { event, eventId } = useEventContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState(event.draft_name);
  const [eventType, setEventType] = useState(event.draft_event_type);
  const [eventDate, setEventDate] = useState(event.draft_event_date ?? "");
  const [eventTime, setEventTime] = useState(event.draft_event_time ?? "");
  const [venue, setVenue] = useState(event.draft_venue ?? "");
  const [address, setAddress] = useState(event.draft_address ?? "");
  const [rsvpDeadline, setRsvpDeadline] = useState(event.draft_rsvp_deadline ?? "");
  const [showDelete, setShowDelete] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const saveMutation = useMutation({
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
          updated_at: new Date().toISOString(),
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
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-dash-text">Website Settings</h2>
        <p className="mt-1 text-sm text-dash-muted">
          Update your event details and manage your invitation website.
        </p>
      </div>

      {/* Event Details */}
      <Card>
        <h3 className="text-sm font-medium text-dash-text mb-4">Event Details</h3>
        <div className="space-y-4">
          <Input
            label="Event Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane & John's Wedding"
          />
          <Select
            label="Event Type"
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
          >
            <option value="wedding">Wedding</option>
            <option value="birthday">Birthday</option>
            <option value="engagement">Engagement</option>
            <option value="anniversary">Anniversary</option>
            <option value="other">Other</option>
          </Select>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Event Date"
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
            />
            <Input
              label="Event Time"
              type="time"
              value={eventTime}
              onChange={(e) => setEventTime(e.target.value)}
            />
          </div>
          <Input
            label="Venue"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            placeholder="The Grand Ballroom"
          />
          <Input
            label="Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="123 Main Street, City"
          />
          <Input
            label="RSVP Deadline"
            type="datetime-local"
            value={rsvpDeadline}
            onChange={(e) => setRsvpDeadline(e.target.value)}
          />
        </div>
      </Card>

      {/* Save */}
      <div className="space-y-2">
        {saveMutation.isError && (
          <p className="text-sm text-dash-danger">
            Error: {(saveMutation.error as Error)?.message}
          </p>
        )}
        {saveMutation.isSuccess && (
          <p className="text-sm text-green-600">Settings saved successfully!</p>
        )}
        <Button
          onClick={() => saveMutation.mutate()}
          loading={saveMutation.isPending}
        >
          Save Settings
        </Button>
      </div>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <h3 className="text-sm font-medium text-dash-danger mb-2">Danger Zone</h3>
        <p className="text-sm text-dash-muted mb-4">
          Permanently delete this invitation website and all associated data. This action cannot be undone.
        </p>
        <Button variant="danger" onClick={() => setShowDelete(true)}>
          Delete Website
        </Button>
      </Card>

      {/* Delete Modal */}
      <Modal open={showDelete} onClose={() => setShowDelete(false)} title="Delete Website">
        <div className="space-y-4">
          <p className="text-sm text-dash-muted">
            Are you sure you want to delete <strong className="text-dash-text">{event.draft_name}</strong>?
            This will permanently remove all event data, guests, RSVPs, and custom pages.
          </p>
          <p className="text-sm text-dash-muted">
            Type <strong className="text-dash-text">DELETE</strong> to confirm:
          </p>
          <Input
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            placeholder="DELETE"
          />
          {deleteMutation.isError && (
            <p className="text-sm text-dash-danger">
              Error: {(deleteMutation.error as Error)?.message}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowDelete(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={deleteMutation.isPending}
              disabled={deleteConfirm !== "DELETE"}
              onClick={() => deleteMutation.mutate()}
            >
              Delete Permanently
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
