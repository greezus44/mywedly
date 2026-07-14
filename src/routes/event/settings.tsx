import React, { useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import type { UserEvent } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, Select } from "../../components/ui/Input";
import { Card, Modal, FormField, Badge } from "../../components/ui";
import { DateTimePicker } from "../../components/ui/DateTimePicker";
import { slugify } from "../../lib/theme";
import { formatDate } from "../../lib/utils";

export function SettingsPage() {
  const { event, eventId } = useOutletContext<{ event: UserEvent; eventId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState(event.draft_name || event.name);
  const [eventType, setEventType] = useState(event.draft_event_type || event.event_type || "wedding");
  const [eventDate, setEventDate] = useState(event.draft_event_date || event.event_date || "");
  const [eventTime, setEventTime] = useState(event.draft_event_time || event.event_time || "");
  const [venue, setVenue] = useState(event.draft_venue || event.venue || "");
  const [address, setAddress] = useState(event.draft_address || event.address || "");
  const [rsvpDeadline, setRsvpDeadline] = useState(event.draft_rsvp_deadline || event.rsvp_deadline || "");
  const [deleteOpen, setDeleteOpen] = useState(false);
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
          draft_venue: venue,
          draft_address: address,
          draft_rsvp_deadline: rsvpDeadline || null,
        })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-event", eventId] });
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
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-dash-text">Website Settings</h2>
        <p className="mt-1 text-sm text-dash-muted">
          Manage your website details and configuration.
        </p>
      </div>

      {/* General Settings */}
      <Card className="p-6 mb-6">
        <h3 className="text-sm font-semibold text-dash-text mb-4">General</h3>
        <div className="space-y-4">
          <FormField label="Website Name">
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </FormField>

          <FormField label="Event Type">
            <Select value={eventType} onChange={(e) => setEventType(e.target.value)}>
              <option value="wedding">Wedding</option>
              <option value="birthday">Birthday</option>
              <option value="engagement">Engagement</option>
              <option value="anniversary">Anniversary</option>
              <option value="corporate">Corporate</option>
              <option value="other">Other</option>
            </Select>
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Event Date">
              <Input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
            </FormField>
            <FormField label="Event Time">
              <Input type="time" value={eventTime} onChange={(e) => setEventTime(e.target.value)} />
            </FormField>
          </div>

          <FormField label="Venue">
            <Input value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="Venue name" />
          </FormField>

          <FormField label="Address">
            <Textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Full address" rows={2} />
          </FormField>

          <FormField label="RSVP Deadline">
            <DateTimePicker value={rsvpDeadline} onChange={(v) => setRsvpDeadline(v ?? "")} />
          </FormField>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>
            Save Settings
          </Button>
          {saveMutation.isError && (
            <span className="text-sm text-dash-danger">
              {saveMutation.error instanceof Error ? saveMutation.error.message : "Save failed"}
            </span>
          )}
          {saveMutation.isSuccess && (
            <span className="text-sm text-green-600">Saved!</span>
          )}
        </div>
      </Card>

      {/* Status */}
      <Card className="p-6 mb-6">
        <h3 className="text-sm font-semibold text-dash-text mb-4">Status</h3>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-sm text-dash-muted">Published:</span>
          {event.is_published ? (
            <Badge variant="success">Yes</Badge>
          ) : (
            <Badge variant="warning">No (Draft)</Badge>
          )}
        </div>
        {event.published_at && (
          <p className="text-sm text-dash-muted">
            Last published: {formatDate(event.published_at)}
          </p>
        )}
        {event.slug && (
          <p className="text-sm text-dash-muted mt-2">
            Published URL: <span className="font-mono">/{event.slug}</span>
          </p>
        )}
      </Card>

      {/* Danger Zone */}
      <Card className="p-6 border-red-200">
        <h3 className="text-sm font-semibold text-red-700 mb-2">Danger Zone</h3>
        <p className="text-sm text-dash-muted mb-4">
          Deleting your website will permanently remove all data, including guests, RSVPs, and pages.
          This cannot be undone.
        </p>
        <Button variant="danger" onClick={() => setDeleteOpen(true)}>
          Delete Website
        </Button>
      </Card>

      {/* Delete confirmation modal */}
      <Modal
        open={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setDeleteConfirm("");
        }}
        title="Delete Website"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setDeleteOpen(false);
                setDeleteConfirm("");
              }}
            >
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
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-dash-text">
            Are you sure you want to delete{" "}
            <span className="font-semibold">{event.name}</span>? This action cannot be undone.
          </p>
          <p className="text-sm text-dash-muted">
            Type <span className="font-mono font-semibold text-dash-text">{event.name}</span> to confirm:
          </p>
          <Input
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
        </div>
      </Modal>
    </div>
  );
}
