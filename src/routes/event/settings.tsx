import { useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { Input, Select } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Card, Modal, Badge } from "../../components/ui";

const EVENT_TYPES = [
  "Wedding",
  "Birthday",
  "Anniversary",
  "Engagement",
  "Bridal Shower",
  "Baby Shower",
  "Corporate Event",
  "Other",
];

export default function SettingsPage() {
  const { event, eventId } = useOutletContext<{ event: UserEvent; eventId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState(event.draft_name ?? event.name);
  const [eventType, setEventType] = useState(event.draft_event_type ?? event.event_type);
  const [eventDate, setEventDate] = useState(event.draft_event_date ?? event.event_date ?? "");
  const [eventTime, setEventTime] = useState(event.draft_event_time ?? event.event_time ?? "");
  const [venue, setVenue] = useState(event.draft_venue ?? event.venue ?? "");
  const [address, setAddress] = useState(event.draft_address ?? event.address ?? "");
  const [saved, setSaved] = useState(false);
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
        })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
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
    <div className="mx-auto max-w-2xl space-y-6 p-4">
      <div>
        <h2 className="text-lg font-semibold text-dash-text">Website Settings</h2>
        <p className="mt-1 text-sm text-dash-muted">
          Update your event details. Changes are saved as draft until you publish.
        </p>
      </div>

      {/* Event details */}
      <Card className="space-y-4 p-6">
        <Input
          label="Event Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Sarah & John's Wedding"
        />
        <Select label="Event Type" value={eventType} onChange={(e) => setEventType(e.target.value)}>
          {EVENT_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </Select>
        <div className="grid grid-cols-2 gap-3">
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
          placeholder="e.g. The Grand Ballroom"
        />
        <Input
          label="Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="123 Main Street, City, State"
        />

        <div className="flex items-center gap-2 pt-2">
          {saved && <span className="text-sm text-green-600">Saved!</span>}
          {saveMutation.isError && (
            <span className="text-sm text-red-600">
              {saveMutation.error instanceof Error ? saveMutation.error.message : "Save failed."}
            </span>
          )}
          <Button
            onClick={() => saveMutation.mutate()}
            loading={saveMutation.isPending}
            className="ml-auto"
          >
            Save Changes
          </Button>
        </div>
      </Card>

      {/* Publication status */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-dash-text">Publication Status</p>
            <p className="mt-0.5 text-xs text-dash-muted">
              {event.is_published
                ? `Published on ${new Date(event.published_at ?? event.updated_at).toLocaleDateString()}`
                : "This website is in draft mode."}
            </p>
          </div>
          {event.is_published ? (
            <Badge variant="success">Published</Badge>
          ) : (
            <Badge variant="warning">Draft</Badge>
          )}
        </div>
      </Card>

      {/* Danger zone */}
      <Card className="border-red-200 p-6">
        <h3 className="mb-2 text-sm font-semibold text-red-700">Danger Zone</h3>
        <p className="mb-4 text-sm text-dash-muted">
          Permanently delete this event website and all associated data. This action cannot be undone.
        </p>
        <Button variant="danger" onClick={() => setShowDelete(true)}>
          Delete Website
        </Button>
      </Card>

      {/* Delete confirmation modal */}
      <Modal open={showDelete} onClose={() => setShowDelete(false)} title="Delete Website">
        <div className="space-y-4">
          <p className="text-sm text-dash-text">
            Are you sure you want to delete <strong>{event.name}</strong>?
            This will permanently remove all data including guests, RSVPs, and pages.
          </p>
          <p className="text-sm text-dash-muted">
            Type <strong>{event.name}</strong> to confirm:
          </p>
          <Input
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            placeholder={event.name}
            autoFocus
          />
          {deleteMutation.isError && (
            <p className="text-sm text-red-600">
              {deleteMutation.error instanceof Error ? deleteMutation.error.message : "Delete failed."}
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
