import { useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type Json } from "../../lib/supabase";
import { Button, Input, Textarea, Card, Modal, Toggle } from "../../components/ui";
import { slugify } from "../../lib/theme";
import { formatDateShort } from "../../lib/utils";

export function SettingsPage() {
  const { event, eventId } = useOutletContext<{ event: UserEvent; eventId: string }>();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [name, setName] = useState(event.draft_name ?? event.name);
  const [eventType, setEventType] = useState(event.draft_event_type ?? event.event_type ?? "");
  const [eventDate, setEventDate] = useState(event.draft_event_date ?? event.event_date ?? "");
  const [eventTime, setEventTime] = useState(event.draft_event_time ?? event.event_time ?? "");
  const [venue, setVenue] = useState(event.draft_venue ?? event.venue ?? "");
  const [address, setAddress] = useState(event.draft_address ?? event.address ?? "");
  const [rsvpDeadline, setRsvpDeadline] = useState(event.draft_rsvp_deadline ?? event.rsvp_deadline ?? "");
  const [saved, setSaved] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("user_events")
        .update({
          draft_name: name.trim() || event.name,
          draft_event_type: eventType || null,
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
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("user_events")
        .update({ is_archived: !event.is_archived })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      setShowArchive(false);
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

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <h2 className="text-lg font-semibold text-dash-text">Settings</h2>

      {/* Event details */}
      <Card>
        <h3 className="font-semibold text-dash-text mb-4">Event Details</h3>
        <div className="space-y-4">
          <Input
            label="Event Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Sarah & James's Wedding"
          />
          <Input
            label="Event Type"
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            placeholder="e.g. Wedding, Engagement Party"
          />
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
            placeholder="e.g. The Grand Ballroom"
          />
          <Textarea
            label="Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Full address"
            rows={3}
          />
          <Input
            label="RSVP Deadline"
            type="date"
            value={rsvpDeadline}
            onChange={(e) => setRsvpDeadline(e.target.value)}
          />
          <Button
            onClick={() => saveMutation.mutate()}
            loading={saveMutation.isPending}
            className="w-full"
          >
            {saved ? "Saved!" : "Save changes"}
          </Button>
          {saveMutation.isError && (
            <p className="text-sm text-red-500">{(saveMutation.error as Error)?.message}</p>
          )}
        </div>
      </Card>

      {/* Danger zone */}
      <Card className="border-red-200">
        <h3 className="font-semibold text-red-700 mb-4">Danger Zone</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-dash-text">
                {event.is_archived ? "Unarchive event" : "Archive event"}
              </p>
              <p className="text-xs text-dash-muted">
                {event.is_archived
                  ? "Restore this event to your active events."
                  : "Hide this event from your dashboard without deleting it."}
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowArchive(true)}
            >
              {event.is_archived ? "Unarchive" : "Archive"}
            </Button>
          </div>
          <div className="flex items-center justify-between border-t border-dash-border pt-3">
            <div>
              <p className="text-sm font-medium text-dash-text">Delete event</p>
              <p className="text-xs text-dash-muted">Permanently delete this event and all its data.</p>
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setShowDelete(true)}
            >
              Delete
            </Button>
          </div>
        </div>
      </Card>

      {/* Archive confirm */}
      <Modal
        open={showArchive}
        onClose={() => setShowArchive(false)}
        title={event.is_archived ? "Unarchive Event" : "Archive Event"}
      >
        <p className="text-sm text-dash-muted mb-4">
          {event.is_archived
            ? "This will restore the event to your active events list."
            : "This will hide the event from your dashboard. You can restore it later."}
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setShowArchive(false)}>Cancel</Button>
          <Button
            variant={event.is_archived ? "primary" : "secondary"}
            loading={archiveMutation.isPending}
            onClick={() => archiveMutation.mutate()}
          >
            {event.is_archived ? "Unarchive" : "Archive"}
          </Button>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal open={showDelete} onClose={() => setShowDelete(false)} title="Delete Event">
        <p className="text-sm text-dash-muted mb-4">
          This action cannot be undone. Type <strong>{event.name}</strong> to confirm.
        </p>
        <Input
          value={deleteConfirm}
          onChange={(e) => setDeleteConfirm(e.target.value)}
          placeholder={event.name}
        />
        <div className="flex gap-3 justify-end mt-4">
          <Button variant="secondary" onClick={() => setShowDelete(false)}>Cancel</Button>
          <Button
            variant="danger"
            loading={deleteMutation.isPending}
            disabled={deleteConfirm !== event.name}
            onClick={() => deleteMutation.mutate()}
          >
            Delete forever
          </Button>
        </div>
      </Modal>
    </div>
  );
}
