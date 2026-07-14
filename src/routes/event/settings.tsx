import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Input, Textarea, Select, Modal } from "../../components/ui";
import { Button } from "../../components/ui/Button";

export default function SettingsPage() {
  const { event, eventId } = useEventContext();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [name, setName] = useState(event.draft_name ?? event.name);
  const [eventType, setEventType] = useState(event.draft_event_type ?? event.event_type);
  const [eventDate, setEventDate] = useState(event.draft_event_date ?? event.event_date);
  const [eventTime, setEventTime] = useState(event.draft_event_time ?? event.event_time);
  const [venue, setVenue] = useState(event.draft_venue ?? event.venue ?? "");
  const [address, setAddress] = useState(event.draft_address ?? event.address ?? "");
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [showDelete, setShowDelete] = useState(false);
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
          draft_venue: venue || null,
          draft_address: address || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      setSavedMsg("Saved successfully!");
      setTimeout(() => setSavedMsg(null), 3000);
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
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-dash-text">Website Settings</h1>
        <p className="text-sm text-dash-muted">Update your event details and settings.</p>
      </div>

      {savedMsg && (
        <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">{savedMsg}</p>
      )}
      {saveMutation.isError && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-dash-danger">
          {saveMutation.error?.message}
        </p>
      )}

      {/* Settings form */}
      <div className="rounded-lg border border-dash-border bg-dash-surface p-6">
        <h2 className="text-lg font-semibold text-dash-text">Event Details</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
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
            <option>Wedding</option>
            <option>Birthday</option>
            <option>Anniversary</option>
            <option>Engagement</option>
            <option>Corporate</option>
            <option>Other</option>
          </Select>
          <Input
            label="Event Date"
            type="date"
            value={eventDate ?? ""}
            onChange={(e) => setEventDate(e.target.value || null)}
          />
          <Input
            label="Event Time"
            type="time"
            value={eventTime ?? ""}
            onChange={(e) => setEventTime(e.target.value || null)}
          />
          <Input
            label="Venue"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            placeholder="e.g. Grand Ballroom"
          />
          <Input
            label="Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. 123 Main St, New York, NY"
          />
        </div>

        <div className="mt-6">
          <Button
            loading={saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
          >
            Save Changes
          </Button>
        </div>
      </div>

      {/* Danger zone */}
      <div className="rounded-lg border border-red-200 bg-red-50/50 p-6">
        <h2 className="text-lg font-semibold text-dash-danger">Danger Zone</h2>
        <p className="mt-1 text-sm text-dash-muted">
          Permanently delete this website and all its data. This cannot be undone.
        </p>
        <Button
          variant="danger"
          className="mt-4"
          onClick={() => {
            setDeleteConfirm("");
            setShowDelete(true);
          }}
        >
          Delete Website
        </Button>
      </div>

      {/* Delete confirmation modal */}
      <Modal
        open={showDelete}
        onClose={() => setShowDelete(false)}
        title="Delete Website"
        footer={
          <>
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
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-dash-text">
            This will permanently delete <strong>{event.name}</strong> and all associated
            data including guests, RSVPs, pages, and schedule items.
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
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-dash-danger">
              {deleteMutation.error?.message}
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}
