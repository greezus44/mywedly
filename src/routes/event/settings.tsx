import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase, type UserEvent } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, Select, FormField, Modal, Badge } from "../../components/ui";
import { DateTimePicker } from "../../components/ui/DateTimePicker";

export function SettingsPage() {
  const { event, eventId } = useEventContext();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [name, setName] = useState(event.draft_name ?? event.name ?? "");
  const [eventType, setEventType] = useState(event.draft_event_type ?? event.event_type ?? "");
  const [eventDate, setEventDate] = useState<string | null>(event.draft_event_date ?? null);
  const [venue, setVenue] = useState(event.draft_venue ?? event.venue ?? "");
  const [address, setAddress] = useState(event.draft_address ?? event.address ?? "");
  const [rsvpDeadline, setRsvpDeadline] = useState<string | null>(event.draft_rsvp_deadline ?? null);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  useEffect(() => {
    setName(event.draft_name ?? event.name ?? "");
    setEventType(event.draft_event_type ?? event.event_type ?? "");
    setEventDate(event.draft_event_date ?? null);
    setVenue(event.draft_venue ?? event.venue ?? "");
    setAddress(event.draft_address ?? event.address ?? "");
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
          draft_venue: venue,
          draft_address: address,
          draft_rsvp_deadline: rsvpDeadline,
        })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      queryClient.invalidateQueries({ queryKey: ["user-events"] });
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-dash-text">Website Settings</h2>
        <Badge color={event.is_published ? "success" : "warning"}>
          {event.is_published ? "Published" : "Draft"}
        </Badge>
      </div>

      {saveMutation.isError && (
        <p className="text-sm text-red-600">
          {saveMutation.error instanceof Error
            ? saveMutation.error.message
            : "Failed to save"}
        </p>
      )}
      {saveMutation.isSuccess && (
        <p className="text-sm text-green-600">Saved successfully!</p>
      )}

      {/* General Settings */}
      <div className="rounded-lg border border-dash-border bg-dash-surface p-4">
        <h3 className="mb-4 text-sm font-semibold text-dash-text">General</h3>
        <div className="space-y-4">
          <Input
            label="Event Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Sarah & John's Wedding"
          />
          <Select
            label="Event Type"
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
          >
            <option value="">Select type...</option>
            <option value="wedding">Wedding</option>
            <option value="engagement">Engagement</option>
            <option value="birthday">Birthday</option>
            <option value="anniversary">Anniversary</option>
            <option value="other">Other</option>
          </Select>
          <DateTimePicker
            label="Event Date & Time"
            value={eventDate}
            onChange={setEventDate}
          />
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
            rows={2}
          />
          <DateTimePicker
            label="RSVP Deadline"
            value={rsvpDeadline}
            onChange={setRsvpDeadline}
          />
        </div>
        <div className="mt-4">
          <Button
            onClick={() => saveMutation.mutate()}
            loading={saveMutation.isPending}
          >
            Save Changes
          </Button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-lg border-2 border-red-200 bg-red-50 p-4">
        <h3 className="mb-2 text-sm font-semibold text-red-700">Danger Zone</h3>
        <p className="mb-3 text-sm text-red-600">
          Deleting this website will permanently remove all data, including guests, RSVPs, and pages.
        </p>
        <Button
          variant="danger"
          size="sm"
          onClick={() => setShowDelete(true)}
        >
          Delete Website
        </Button>
      </div>

      {/* Delete Confirmation Modal */}
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
            Are you sure you want to delete <strong>{event.draft_name || event.name}</strong>?
            This action cannot be undone.
          </p>
          <Input
            label='Type the event name to confirm'
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            placeholder={event.draft_name || event.name}
          />
          {deleteMutation.isError && (
            <p className="text-sm text-red-600">
              {deleteMutation.error instanceof Error
                ? deleteMutation.error.message
                : "Failed to delete"}
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
              onClick={() => deleteMutation.mutate()}
              loading={deleteMutation.isPending}
              disabled={deleteConfirm !== (event.draft_name || event.name)}
            >
              Delete Permanently
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
