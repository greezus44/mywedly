import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Input";
import { DatePicker } from "../../components/ui/DatePicker";
import { TimePicker } from "../../components/ui/TimePicker";
import { Card, Modal, Badge } from "../../components/ui";

export function SettingsPage() {
  const { event, eventId } = useEventContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState(event.draft_name ?? event.name ?? "");
  const [eventType, setEventType] = useState(event.draft_event_type ?? event.event_type ?? "");
  const [eventDate, setEventDate] = useState(event.draft_event_date ?? event.event_date ?? null);
  const [eventTime, setEventTime] = useState(event.draft_event_time ?? event.event_time ?? null);
  const [venue, setVenue] = useState(event.draft_venue ?? event.venue ?? "");
  const [address, setAddress] = useState(event.draft_address ?? event.address ?? "");
  const [rsvpDeadline, setRsvpDeadline] = useState(
    event.draft_rsvp_deadline ?? event.rsvp_deadline ?? null
  );
  const [showDelete, setShowDelete] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  useEffect(() => {
    setName(event.draft_name ?? event.name ?? "");
    setEventType(event.draft_event_type ?? event.event_type ?? "");
    setEventDate(event.draft_event_date ?? event.event_date ?? null);
    setEventTime(event.draft_event_time ?? event.event_time ?? null);
    setVenue(event.draft_venue ?? event.venue ?? "");
    setAddress(event.draft_address ?? event.address ?? "");
    setRsvpDeadline(event.draft_rsvp_deadline ?? event.rsvp_deadline ?? null);
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
      const { error } = await supabase.from("user_events").delete().eq("id", eventId);
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
        <h2 className="text-xl font-semibold text-dash-text">Website Settings</h2>
        <p className="mt-1 text-sm text-dash-muted">
          Update your invitation website details. Changes are saved to draft and go live when you publish.
        </p>
      </div>

      {/* Basic info */}
      <Card>
        <h3 className="text-sm font-medium text-dash-text">Event Details</h3>
        <div className="mt-4 space-y-4">
          <Input
            label="Event Name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John & Jane's Wedding"
          />
          <Input
            label="Event Type"
            type="text"
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            placeholder="Wedding, Birthday, etc."
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-dash-text">
              Event Date
            </label>
            <DatePicker value={eventDate} onChange={setEventDate} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-dash-text">
              Event Time
            </label>
            <TimePicker value={eventTime} onChange={setEventTime} />
          </div>
          <Input
            label="Venue"
            type="text"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            placeholder="Grand Ballroom"
          />
          <Textarea
            label="Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="123 Main St, City, State"
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-dash-text">
              RSVP Deadline
            </label>
            <DatePicker value={rsvpDeadline} onChange={setRsvpDeadline} />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>
            Save Changes
          </Button>
          {saveMutation.isError && (
            <p className="text-sm text-dash-danger">
              {saveMutation.error instanceof Error ? saveMutation.error.message : "Save failed"}
            </p>
          )}
          {saveMutation.isSuccess && (
            <p className="text-sm text-green-600">Saved successfully!</p>
          )}
        </div>
      </Card>

      {/* Publish info */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-dash-text">Publish Status</h3>
            <p className="mt-1 text-sm text-dash-muted">
              {event.is_published
                ? `Published on ${event.published_at ? new Date(event.published_at).toLocaleDateString() : "N/A"}`
                : "Not published yet"}
            </p>
          </div>
          {event.is_published ? (
            <Badge variant="success">Published</Badge>
          ) : (
            <Badge variant="default">Draft</Badge>
          )}
        </div>
      </Card>

      {/* Danger zone */}
      <Card className="border-dash-danger/30">
        <h3 className="text-sm font-medium text-dash-danger">Danger Zone</h3>
        <p className="mt-1 text-sm text-dash-muted">
          Deleting this website will permanently remove all data, including guests, RSVPs, and pages.
        </p>
        <Button
          variant="danger"
          className="mt-4"
          onClick={() => setShowDelete(true)}
        >
          Delete Website
        </Button>
      </Card>

      {/* Delete confirmation modal */}
      <Modal open={showDelete} onClose={() => setShowDelete(false)} title="Delete Website">
        <div className="space-y-4">
          <p className="text-sm text-dash-text">
            Are you sure you want to delete <strong>{event.draft_name || event.name}</strong>?
            This action cannot be undone.
          </p>
          <p className="text-sm text-dash-muted">
            Type the event name to confirm: <strong>{event.draft_name || event.name}</strong>
          </p>
          <Input
            type="text"
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            placeholder={event.draft_name || event.name}
          />
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
              disabled={deleteConfirm !== (event.draft_name || event.name)}
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
