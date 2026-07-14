import React, { useState, useEffect } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, Select } from "../../components/ui/Input";
import { Card, Modal, Badge } from "../../components/ui";
import { DatePicker } from "../../components/ui/DatePicker";
import { TimePicker } from "../../components/ui/TimePicker";

export function SettingsPage() {
  const { event, eventId } = useOutletContext<{ event: UserEvent; eventId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState(event.draft_name ?? "");
  const [eventType, setEventType] = useState(event.draft_event_type ?? "Wedding");
  const [eventDate, setEventDate] = useState(event.draft_event_date ?? null);
  const [eventTime, setEventTime] = useState(event.draft_event_time ?? null);
  const [venue, setVenue] = useState(event.draft_venue ?? "");
  const [address, setAddress] = useState(event.draft_address ?? "");
  const [rsvpDeadline, setRsvpDeadline] = useState(event.draft_rsvp_deadline ?? null);
  const [savedMsg, setSavedMsg] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    setName(event.draft_name ?? "");
    setEventType(event.draft_event_type ?? "Wedding");
    setEventDate(event.draft_event_date ?? null);
    setEventTime(event.draft_event_time ?? null);
    setVenue(event.draft_venue ?? "");
    setAddress(event.draft_address ?? "");
    setRsvpDeadline(event.draft_rsvp_deadline ?? null);
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

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-dash-text">Website Settings</h2>
        <p className="text-sm text-dash-muted mt-1">
          Manage your event details and website configuration.
        </p>
      </div>

      {/* Event Details */}
      <Card>
        <h3 className="text-sm font-semibold text-dash-text mb-4">Event Details</h3>
        <div className="space-y-4">
          <Input
            label="Event Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Jane & John's Wedding"
          />
          <Select
            label="Event Type"
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
          >
            <option value="Wedding">Wedding</option>
            <option value="Birthday">Birthday</option>
            <option value="Anniversary">Anniversary</option>
            <option value="Engagement">Engagement</option>
            <option value="Other">Other</option>
          </Select>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dash-text mb-1.5">
                Event Date
              </label>
              <DatePicker value={eventDate} onChange={setEventDate} />
            </div>
            <div>
              <label className="block text-sm font-medium text-dash-text mb-1.5">
                Event Time
              </label>
              <TimePicker value={eventTime} onChange={setEventTime} />
            </div>
          </div>
          <Input
            label="Venue"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            placeholder="e.g. Grand Ballroom Hotel"
          />
          <Textarea
            label="Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Full venue address"
          />
          <div>
            <label className="block text-sm font-medium text-dash-text mb-1.5">
              RSVP Deadline
            </label>
            <DatePicker
              value={rsvpDeadline ? rsvpDeadline.slice(0, 10) : null}
              onChange={(d) => setRsvpDeadline(d ? `${d}T23:59:59` : null)}
              placeholder="Select RSVP deadline"
            />
          </div>
        </div>
      </Card>

      {/* Status */}
      <Card>
        <h3 className="text-sm font-semibold text-dash-text mb-4">Status</h3>
        <div className="flex items-center gap-3">
          <Badge variant={event.is_published ? "success" : "warning"}>
            {event.is_published ? "Published" : "Draft"}
          </Badge>
          {event.is_archived && <Badge variant="danger">Archived</Badge>}
          <span className="text-sm text-dash-muted">
            {event.published_at
              ? `Published on ${new Date(event.published_at).toLocaleDateString()}`
              : "Not yet published"}
          </span>
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex items-center gap-3">
        <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>
          Save Changes
        </Button>
        {saveMutation.isError && (
          <span className="text-sm text-dash-danger">
            {saveMutation.error instanceof Error ? saveMutation.error.message : "Save failed"}
          </span>
        )}
        {savedMsg && <span className="text-sm text-green-600">Saved!</span>}
      </div>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <h3 className="text-sm font-semibold text-dash-danger mb-2">Danger Zone</h3>
        <p className="text-sm text-dash-muted mb-4">
          Permanently delete this website and all its data. This cannot be undone.
        </p>
        <Button variant="danger" onClick={() => setShowDelete(true)}>
          Delete Website
        </Button>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal open={showDelete} onClose={() => setShowDelete(false)} title="Delete Website">
        <div className="space-y-4">
          <p className="text-sm text-dash-text">
            Are you sure you want to delete{" "}
            <strong>{event.draft_name || "this website"}</strong>? This action
            cannot be undone and all data will be permanently lost.
          </p>
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
              onClick={() => deleteMutation.mutate()}
              loading={deleteMutation.isPending}
            >
              Delete Permanently
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
