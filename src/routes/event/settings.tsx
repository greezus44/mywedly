import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Json } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, Select } from "../../components/ui/Input";
import { Card, Modal, Badge } from "../../components/ui";
import { DateTimePicker } from "../../components/ui/DateTimePicker";

export function SettingsPage() {
  const { event, eventId } = useEventContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState(event.draft_name ?? event.name ?? "");
  const [eventType, setEventType] = useState(event.draft_event_type ?? event.event_type ?? "Wedding");
  const [venue, setVenue] = useState(event.draft_venue ?? event.venue ?? "");
  const [address, setAddress] = useState(event.draft_address ?? event.address ?? "");
  const [eventDate, setEventDate] = useState(event.draft_event_date ?? event.event_date ?? null);
  const [eventTime, setEventTime] = useState(event.draft_event_time ?? event.event_time ?? null);
  const [rsvpDeadline, setRsvpDeadline] = useState(event.draft_rsvp_deadline ?? event.rsvp_deadline ?? null);
  const [saved, setSaved] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("user_events")
        .update({
          draft_name: name,
          draft_event_type: eventType,
          draft_venue: venue,
          draft_address: address,
          draft_event_date: eventDate,
          draft_event_time: eventTime,
          draft_rsvp_deadline: rsvpDeadline,
        })
        .eq("id", eventId)
        .select("*")
        .maybeSingle();
      if (error) throw error;
      return data;
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

  const handleSave = () => {
    saveMutation.mutate();
  };

  const handleDelete = () => {
    if (deleteConfirm !== event.name) return;
    deleteMutation.mutate();
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold text-dash-text">Website Settings</h1>
        <p className="mt-1 text-sm text-dash-muted">
          Manage your event details and website configuration
        </p>
      </div>

      {/* Basic Info */}
      <Card>
        <h3 className="mb-4 text-sm font-semibold text-dash-text">Event Details</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
          <Input
            label="Venue"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            placeholder="e.g. Grand Hotel Ballroom"
          />
          <Input
            label="Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. 123 Main St, City, Country"
          />
          <DateTimePicker
            label="Event Date & Time"
            value={{ date: eventDate, time: eventTime }}
            onChange={({ date, time }) => {
              setEventDate(date);
              setEventTime(time);
            }}
          />
          <DateTimePicker
            label="RSVP Deadline"
            value={{ date: rsvpDeadline, time: null }}
            onChange={({ date }) => setRsvpDeadline(date)}
          />
        </div>
        <div className="mt-4 flex items-center gap-3">
          {saved && <span className="text-sm text-green-600">✓ Saved</span>}
          <Button onClick={handleSave} loading={saveMutation.isPending}>
            Save Changes
          </Button>
        </div>
      </Card>

      {/* Publish Status */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-dash-text">Publish Status</h3>
            <p className="mt-1 text-sm text-dash-muted">
              {event.is_published
                ? "Your website is live and accessible to guests."
                : "Your website is in draft mode. Publish it to make it live."}
            </p>
          </div>
          {event.is_published ? (
            <Badge color="success">Published</Badge>
          ) : (
            <Badge color="warning">Draft</Badge>
          )}
        </div>
      </Card>

      {/* Danger Zone */}
      <Card className="border-dash-danger/20">
        <h3 className="mb-2 text-sm font-semibold text-dash-danger">Danger Zone</h3>
        <p className="mb-4 text-sm text-dash-muted">
          Permanently delete this invitation website and all associated data. This cannot be undone.
        </p>
        <Button variant="danger" onClick={() => setShowDelete(true)}>
          Delete Website
        </Button>
      </Card>

      {/* Delete Modal */}
      <Modal open={showDelete} onClose={() => setShowDelete(false)} title="Delete Website">
        <div className="space-y-4">
          <div className="rounded-lg border border-dash-danger/20 bg-dash-danger/5 p-4">
            <p className="text-sm text-dash-danger">
              ⚠️ This will permanently delete "{event.name}" and all associated data including
              guests, RSVPs, schedule items, and custom pages. This action cannot be undone.
            </p>
          </div>
          <Input
            label={`Type "${event.name}" to confirm`}
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            placeholder={event.name}
          />
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
