import React, { useState, useEffect } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input, Select } from "../../components/ui/Input";
import { Card, Modal } from "../../components/ui";

const EVENT_TYPES = ["Wedding", "Birthday", "Engagement", "Anniversary", "Baby Shower", "Other"];

export default function Settings() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState(event.draft_name ?? event.name ?? "");
  const [eventType, setEventType] = useState(event.draft_event_type ?? event.event_type ?? "Wedding");
  const [eventDate, setEventDate] = useState(event.draft_event_date ?? event.event_date ?? "");
  const [eventTime, setEventTime] = useState(event.draft_event_time ?? event.event_time ?? "");
  const [venue, setVenue] = useState(event.draft_venue ?? event.venue ?? "");
  const [address, setAddress] = useState(event.draft_address ?? event.address ?? "");
  const [showDelete, setShowDelete] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  useEffect(() => {
    setName(event.draft_name ?? event.name ?? "");
    setEventType(event.draft_event_type ?? event.event_type ?? "Wedding");
    setEventDate(event.draft_event_date ?? event.event_date ?? "");
    setEventTime(event.draft_event_time ?? event.event_time ?? "");
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
          draft_event_date: eventDate || null,
          draft_event_time: eventTime || null,
          draft_venue: venue || null,
          draft_address: address || null,
        })
        .eq("id", event.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", event.id] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("user_events").delete().eq("id", event.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-events"] });
      navigate("/dashboard");
    },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <h2 className="text-lg font-semibold text-dash-text">Website Settings</h2>
        <p className="mt-1 text-sm text-dash-muted">Update your event details.</p>
      </div>

      <Card className="space-y-4 p-5">
        <Input
          label="Website Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Sarah & John's Wedding"
        />
        <Select label="Event Type" value={eventType} onChange={(e) => setEventType(e.target.value)}>
          {EVENT_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </Select>
        <div className="grid grid-cols-2 gap-3">
          <Input
            type="date"
            label="Event Date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
          />
          <Input
            type="time"
            label="Event Time"
            value={eventTime}
            onChange={(e) => setEventTime(e.target.value)}
          />
        </div>
        <Input
          label="Venue"
          value={venue}
          onChange={(e) => setVenue(e.target.value)}
          placeholder="e.g. Grand Ballroom Hotel"
        />
        <Input
          label="Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="e.g. 123 Main Street, City, Country"
        />

        <div className="flex items-center gap-3">
          <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>
            Save Changes
          </Button>
          {saveMutation.isSuccess && (
            <span className="text-sm text-green-600">Saved successfully!</span>
          )}
          {saveMutation.isError && (
            <span className="text-sm text-dash-danger">
              {saveMutation.error instanceof Error ? saveMutation.error.message : "Failed to save"}
            </span>
          )}
        </div>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200 p-5">
        <h3 className="text-sm font-semibold text-red-700">Danger Zone</h3>
        <p className="mt-1 text-sm text-dash-muted">
          Permanently delete this website and all its data. This cannot be undone.
        </p>
        <Button
          variant="danger"
          size="sm"
          className="mt-4"
          onClick={() => setShowDelete(true)}
        >
          Delete Website
        </Button>
      </Card>

      <Modal
        open={showDelete}
        onClose={() => {
          setShowDelete(false);
          setDeleteConfirm("");
        }}
        title="Delete Website"
        size="sm"
        footer={
          <>
            <Button
              variant="ghost"
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
              disabled={deleteConfirm !== event.name}
            >
              Delete Permanently
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-dash-text">
            This will permanently delete <strong>{event.name}</strong> and all associated data
            including guests, RSVPs, schedule, and custom pages.
          </p>
          <p className="text-sm text-dash-muted">
            Type <strong>{event.name}</strong> to confirm:
          </p>
          <Input
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            placeholder={event.name}
          />
          {deleteMutation.isError && (
            <p className="text-sm text-dash-danger">
              {deleteMutation.error instanceof Error ? deleteMutation.error.message : "Failed to delete"}
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}
