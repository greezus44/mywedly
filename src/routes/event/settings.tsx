import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, Select, Card, Modal, DatePicker, TimePicker } from "../../components/ui";
import { slugify } from "../../lib/theme";

export function SettingsPage() {
  const { event, eventId } = useEventContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [eventType, setEventType] = useState("other");
  const [eventDate, setEventDate] = useState<string | null>(null);
  const [eventTime, setEventTime] = useState<string | null>(null);
  const [venue, setVenue] = useState("");
  const [address, setAddress] = useState("");
  const [rsvpDeadline, setRsvpDeadline] = useState<string | null>(null);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  useEffect(() => {
    setName(event.draft_name ?? event.name);
    setEventType(event.draft_event_type ?? event.event_type);
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
          draft_event_type: eventType,
          draft_event_date: eventDate,
          draft_event_time: eventTime,
          draft_venue: venue,
          draft_address: address,
          draft_rsvp_deadline: rsvpDeadline,
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
      navigate("/dashboard");
    },
  });

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-bold text-dash-text">Website Settings</h2>
        <p className="text-sm text-dash-muted">
          Manage your invitation website details
        </p>
      </div>

      {/* General settings */}
      <Card className="p-5 space-y-4">
        <h3 className="text-sm font-semibold text-dash-text">Event Details</h3>
        <Input
          label="Event name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Event name"
        />
        <Select
          label="Event type"
          value={eventType}
          onChange={(e) => setEventType(e.target.value)}
        >
          <option value="wedding">Wedding</option>
          <option value="birthday">Birthday</option>
          <option value="engagement">Engagement</option>
          <option value="anniversary">Anniversary</option>
          <option value="baby_shower">Baby Shower</option>
          <option value="corporate">Corporate</option>
          <option value="other">Other</option>
        </Select>
        <div className="grid grid-cols-2 gap-3">
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
        </div>
        <Input
          label="Venue"
          type="text"
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
        <DatePicker
          label="RSVP deadline"
          value={rsvpDeadline ? rsvpDeadline.split("T")[0] : null}
          onChange={(d) => setRsvpDeadline(d ? new Date(d).toISOString() : null)}
        />

        <div className="flex items-center justify-between pt-2 border-t border-dash-border">
          {saveMutation.isError && (
            <p className="text-sm text-dash-danger">
              {saveMutation.error instanceof Error ? saveMutation.error.message : "Save failed"}
            </p>
          )}
          {saveMutation.isSuccess && (
            <p className="text-sm text-green-600">Saved!</p>
          )}
          <Button
            onClick={() => saveMutation.mutate()}
            loading={saveMutation.isPending}
            className="ml-auto"
          >
            Save changes
          </Button>
        </div>
      </Card>

      {/* Danger zone */}
      <Card className="p-5 border-dash-danger/20">
        <h3 className="text-sm font-semibold text-dash-danger mb-2">Danger Zone</h3>
        <p className="text-sm text-dash-muted mb-4">
          Once you delete this website, all data including guests, RSVPs, and
          custom pages will be permanently removed.
        </p>
        <Button variant="danger" onClick={() => setShowDelete(true)}>
          Delete website
        </Button>
      </Card>

      {/* Delete confirmation modal */}
      <Modal
        open={showDelete}
        onClose={() => {
          setShowDelete(false);
          setDeleteConfirm("");
        }}
        title="Delete Website"
      >
        <div className="space-y-4">
          <p className="text-sm text-dash-text">
            Are you sure you want to delete{" "}
            <strong>{event.name}</strong>? This action cannot be undone.
          </p>
          <p className="text-sm text-dash-muted">
            Type <strong>{event.name}</strong> to confirm:
          </p>
          <Input
            type="text"
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            placeholder={event.name}
            autoFocus
          />
          {deleteMutation.isError && (
            <p className="text-sm text-dash-danger">
              {deleteMutation.error instanceof Error ? deleteMutation.error.message : "Delete failed"}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setShowDelete(false);
                setDeleteConfirm("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              loading={deleteMutation.isPending}
              disabled={deleteConfirm !== event.name}
            >
              Delete forever
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
