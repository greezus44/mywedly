import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { useOutletContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Input, Select, Modal } from "../../components/ui";

const EVENT_TYPES = [
  "Wedding",
  "Birthday",
  "Baby Shower",
  "Engagement",
  "Anniversary",
  "Corporate Event",
  "Other",
];

export default function Settings() {
  const { event, eventId } = useOutletContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState(event.draft_name ?? event.name);
  const [eventType, setEventType] = useState(
    event.draft_event_type ?? event.event_type
  );
  const [eventDate, setEventDate] = useState(
    event.draft_event_date ?? event.event_date ?? ""
  );
  const [venue, setVenue] = useState(event.draft_venue ?? event.venue ?? "");
  const [address, setAddress] = useState(event.draft_address ?? event.address ?? "");
  const [showDelete, setShowDelete] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  useEffect(() => {
    setName(event.draft_name ?? event.name);
    setEventType(event.draft_event_type ?? event.event_type);
    setEventDate(event.draft_event_date ?? event.event_date ?? "");
    setVenue(event.draft_venue ?? event.venue ?? "");
    setAddress(event.draft_address ?? event.address ?? "");
  }, [event]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("user_events")
        .update({
          draft_name: name,
          draft_event_type: eventType,
          draft_event_date: eventDate || null,
          draft_venue: venue || null,
          draft_address: address || null,
        })
        .eq("id", eventId)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_event", eventId] });
      queryClient.invalidateQueries({ queryKey: ["user_events"] });
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
      queryClient.invalidateQueries({ queryKey: ["user_events"] });
      navigate("/dashboard");
    },
  });

  const handleSave = () => {
    if (!name.trim()) return;
    saveMutation.mutate();
  };

  const handleDelete = () => {
    if (deleteConfirm !== event.name) return;
    deleteMutation.mutate();
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="mb-6 text-lg font-semibold text-dash-text">
        Website Settings
      </h2>

      <div className="rounded-lg border border-dash-border bg-dash-surface p-6">
        <div className="flex flex-col gap-4">
          <Input
            label="Event Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Event name"
          />
          <Select
            label="Event Type"
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
          >
            {EVENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </Select>
          <Input
            label="Event Date"
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
          />
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
            placeholder="e.g. 123 Main St, City, State"
          />
        </div>

        <div className="mt-6 flex items-center gap-3">
          <Button onClick={handleSave} loading={saveMutation.isPending}>
            Save Changes
          </Button>
          {saveMutation.isError && (
            <p className="text-sm text-dash-danger">
              {saveMutation.error instanceof Error
                ? saveMutation.error.message
                : "Failed to save"}
            </p>
          )}
          {saveMutation.isSuccess && (
            <p className="text-sm text-green-600">Settings saved!</p>
          )}
        </div>
      </div>

      {/* Danger zone */}
      <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-6">
        <h3 className="mb-1 text-sm font-semibold text-red-700">Danger Zone</h3>
        <p className="mb-4 text-sm text-red-600">
          Deleting this website will permanently remove all associated data including
          guests, RSVPs, and custom pages. This cannot be undone.
        </p>
        <Button variant="danger" onClick={() => setShowDelete(true)}>
          Delete Website
        </Button>
      </div>

      <Modal
        open={showDelete}
        onClose={() => {
          setShowDelete(false);
          setDeleteConfirm("");
        }}
        title="Delete Website"
        size="md"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-dash-text">
            Are you sure you want to delete{" "}
            <strong>{event.name}</strong>? This action cannot be undone.
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
            <p className="text-sm text-dash-danger">
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
              onClick={handleDelete}
              loading={deleteMutation.isPending}
              disabled={deleteConfirm !== event.name}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
