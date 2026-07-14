import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, Select } from "../../components/ui/Input";
import { Card, Modal, FormField } from "../../components/ui";
import { DatePicker } from "../../components/ui/DatePicker";
import { TimePicker } from "../../components/ui/TimePicker";
import { formatDate } from "../../lib/utils";

export const SettingsPage: React.FC = () => {
  const { event, eventId } = useEventContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState(event.draft_name || "");
  const [eventType, setEventType] = useState(event.draft_event_type || "Wedding");
  const [eventDate, setEventDate] = useState(event.draft_event_date);
  const [eventTime, setEventTime] = useState(event.draft_event_time);
  const [venue, setVenue] = useState(event.draft_venue || "");
  const [address, setAddress] = useState(event.draft_address || "");
  const [rsvpDeadline, setRsvpDeadline] = useState(event.draft_rsvp_deadline);
  const [saved, setSaved] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

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
    deleteMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-dash-text">Website Settings</h2>
        <p className="text-sm text-dash-muted">Manage your event details and settings.</p>
      </div>

      <Card>
        <h3 className="mb-4 text-sm font-semibold text-dash-text">Event Details</h3>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Event name">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane & John's Wedding"
              />
            </FormField>
            <FormField label="Event type">
              <Input
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                placeholder="Wedding"
              />
            </FormField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Event date">
              <DatePicker value={eventDate} onChange={setEventDate} />
            </FormField>
            <FormField label="Event time">
              <TimePicker value={eventTime} onChange={setEventTime} />
            </FormField>
          </div>

          <FormField label="Venue">
            <Input
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="Grand Ballroom Hotel"
            />
          </FormField>

          <FormField label="Address">
            <Textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Main Street, New York, NY 10001"
            />
          </FormField>

          <FormField label="RSVP deadline">
            <DatePicker value={rsvpDeadline} onChange={setRsvpDeadline} />
          </FormField>
        </div>

        <div className="mt-6 flex items-center justify-between">
          {saveMutation.isError && (
            <p className="text-sm text-dash-danger">
              {saveMutation.error instanceof Error ? saveMutation.error.message : "Save failed"}
            </p>
          )}
          {saveMutation.isSuccess && saved && (
            <p className="text-sm text-green-600">Settings saved!</p>
          )}
          <Button onClick={handleSave} loading={saveMutation.isPending} disabled={saveMutation.isPending}>
            Save Changes
          </Button>
        </div>
      </Card>

      <Card className="border-red-200">
        <h3 className="mb-2 text-sm font-semibold text-dash-danger">Danger Zone</h3>
        <p className="mb-4 text-sm text-dash-muted">
          Permanently delete this invitation website and all associated data. This action cannot be undone.
        </p>
        <Button variant="danger" onClick={() => setDeleteOpen(true)}>
          Delete Website
        </Button>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete Website">
        <div className="space-y-4">
          <p className="text-sm text-dash-muted">
            Are you sure you want to delete <strong className="text-dash-text">{event.draft_name || event.name}</strong>?
            This will permanently delete all guests, RSVPs, pages, and settings. This action cannot be undone.
          </p>
          <FormField label={`Type the event name to confirm: "${event.draft_name || event.name}"`}>
            <Input
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder={event.draft_name || event.name || ""}
              autoFocus
            />
          </FormField>
          {deleteMutation.isError && (
            <p className="text-sm text-dash-danger">
              {deleteMutation.error instanceof Error ? deleteMutation.error.message : "Delete failed"}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              loading={deleteMutation.isPending}
              disabled={deleteMutation.isPending || deleteConfirm !== (event.draft_name || event.name || "")}
            >
              Delete Permanently
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
