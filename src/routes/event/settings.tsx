import React, { useState, useEffect } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input, Select } from "../../components/ui/Input";
import { Card, Modal, DatePicker, TimePicker } from "../../components/ui";
import type { EventOutletContext } from "./event-layout";

const EVENT_TYPES = [
  "Wedding",
  "Birthday",
  "Engagement",
  "Anniversary",
  "Corporate Event",
  "Other",
];

export default function Settings(): React.ReactElement {
  const { event, eventId } = useOutletContext<EventOutletContext>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState(event.draft_name ?? event.name);
  const [eventType, setEventType] = useState(event.draft_event_type ?? event.event_type);
  const [eventDate, setEventDate] = useState(event.draft_event_date ?? event.event_date);
  const [eventTime, setEventTime] = useState(event.draft_event_time ?? event.event_time);
  const [venue, setVenue] = useState(event.draft_venue ?? event.venue ?? "");
  const [address, setAddress] = useState(event.draft_address ?? event.address ?? "");
  const [showDelete, setShowDelete] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  useEffect(() => {
    setName(event.draft_name ?? event.name);
    setEventType(event.draft_event_type ?? event.event_type);
    setEventDate(event.draft_event_date ?? event.event_date);
    setEventTime(event.draft_event_time ?? event.event_time);
    setVenue(event.draft_venue ?? event.venue ?? "");
    setAddress(event.draft_address ?? event.address ?? "");
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
          draft_venue: venue || null,
          draft_address: address || null,
        })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-event", eventId] });
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

  const hasChanges =
    name !== (event.draft_name ?? event.name) ||
    eventType !== (event.draft_event_type ?? event.event_type) ||
    eventDate !== (event.draft_event_date ?? event.event_date) ||
    eventTime !== (event.draft_event_time ?? event.event_time) ||
    venue !== (event.draft_venue ?? event.venue ?? "") ||
    address !== (event.draft_address ?? event.address ?? "");

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-dash-text">Website Settings</h2>
        <p className="mt-1 text-sm text-dash-muted">
          Configure the details of your invitation website
        </p>
      </div>

      {saveMutation.isError && (
        <div className="mb-4 rounded-md border border-dash-danger/20 bg-dash-danger/5 px-4 py-3">
          <p className="text-sm text-dash-danger">
            {saveMutation.error instanceof Error ? saveMutation.error.message : "Failed to save"}
          </p>
        </div>
      )}
      {saveMutation.isSuccess && (
        <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3">
          <p className="text-sm text-green-700">Settings saved successfully</p>
        </div>
      )}

      <Card className="space-y-4">
        <Input
          label="Website name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Sarah & John's Wedding"
        />
        <Select label="Event type" value={eventType} onChange={(e) => setEventType(e.target.value)}>
          {EVENT_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </Select>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
          value={venue}
          onChange={(e) => setVenue(e.target.value)}
          placeholder="e.g. The Grand Ballroom"
        />
        <Input
          label="Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="e.g. 123 Main St, City, State"
        />
        <div className="flex justify-end pt-2">
          <Button
            onClick={() => saveMutation.mutate()}
            loading={saveMutation.isPending}
            disabled={saveMutation.isPending || !hasChanges}
          >
            Save Changes
          </Button>
        </div>
      </Card>

      {/* Danger zone */}
      <Card className="mt-6 border-dash-danger/20">
        <h3 className="text-sm font-semibold text-dash-danger">Danger Zone</h3>
        <p className="mt-1 text-xs text-dash-muted">
          Permanently delete this website and all its data. This action cannot be undone.
        </p>
        <div className="mt-4">
          <Button variant="danger" size="sm" onClick={() => setShowDelete(true)}>
            Delete Website
          </Button>
        </div>
      </Card>

      {/* Delete modal */}
      <Modal open={showDelete} onClose={() => setShowDelete(false)} title="Delete Website">
        <div className="space-y-4">
          <p className="text-sm text-dash-text">
            Are you sure you want to delete <strong>{event.name}</strong>? This will permanently
            remove all guests, RSVPs, pages, and settings. This action cannot be undone.
          </p>
          <Input
            label={`Type "${event.name}" to confirm`}
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            placeholder={event.name}
          />
          {deleteMutation.isError && (
            <div className="rounded-md border border-dash-danger/20 bg-dash-danger/5 px-4 py-3">
              <p className="text-sm text-dash-danger">
                {deleteMutation.error instanceof Error ? deleteMutation.error.message : "Failed to delete"}
              </p>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowDelete(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={deleteMutation.isPending}
              disabled={deleteMutation.isPending || deleteConfirm !== event.name}
              onClick={() => deleteMutation.mutate()}
            >
              Delete Forever
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
