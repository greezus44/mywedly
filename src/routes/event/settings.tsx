import React, { useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import {
  Input,
  Select,
  Card,
  Modal,
  LoadingSpinner,
} from "../../components/ui";
import { DatePicker, TimePicker } from "../../components/ui";
import type { EventOutletContext } from "./event-layout";

const EVENT_TYPES = [
  "Wedding",
  "Birthday",
  "Anniversary",
  "Engagement",
  "Bridal Shower",
  "Baby Shower",
  "Other",
];

export default function Settings() {
  const { event, eventId } = useOutletContext<EventOutletContext>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState(event.draft_name ?? event.name);
  const [eventType, setEventType] = useState(
    event.draft_event_type ?? event.event_type
  );
  const [eventDate, setEventDate] = useState(
    event.draft_event_date ?? event.event_date
  );
  const [eventTime, setEventTime] = useState(
    event.draft_event_time ?? event.event_time
  );
  const [venue, setVenue] = useState(event.draft_venue ?? event.venue ?? "");
  const [address, setAddress] = useState(
    event.draft_address ?? event.address ?? ""
  );
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

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-2xl space-y-6 p-4">
        <div>
          <h2 className="text-lg font-semibold text-dash-text">
            Website Settings
          </h2>
          <p className="mt-1 text-sm text-dash-muted">
            Manage your invitation website details
          </p>
        </div>

        {/* Basic info */}
        <Card>
          <h3 className="text-sm font-semibold text-dash-text">
            Event Details
          </h3>
          <div className="mt-4 space-y-4">
            <Input
              label="Website Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. John & Jane's Wedding"
            />
            <Select
              label="Event Type"
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
            >
              {EVENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DatePicker
                label="Event Date"
                value={eventDate}
                onChange={setEventDate}
              />
              <TimePicker
                label="Event Time"
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
          </div>
          <div className="mt-6 flex items-center gap-2">
            {saved && <span className="text-sm text-green-600">Saved!</span>}
            <Button
              onClick={() => saveMutation.mutate()}
              loading={saveMutation.isPending}
            >
              Save Changes
            </Button>
          </div>
        </Card>

        {/* Danger zone */}
        <Card className="border-red-200">
          <h3 className="text-sm font-semibold text-red-700">Danger Zone</h3>
          <p className="mt-1 text-xs text-dash-muted">
            Permanently delete this invitation website and all its data. This
            action cannot be undone.
          </p>
          <div className="mt-4">
            <Button
              variant="danger"
              size="sm"
              onClick={() => setDeleteOpen(true)}
            >
              Delete Website
            </Button>
          </div>
        </Card>
      </div>

      {/* Delete confirmation modal */}
      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete Website"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setDeleteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => deleteMutation.mutate()}
              loading={deleteMutation.isPending}
              disabled={deleteConfirm !== (event.draft_name ?? event.name)}
            >
              Delete Permanently
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-dash-text">
            Are you sure you want to delete{" "}
            <strong>{event.draft_name ?? event.name}</strong>? This will
            permanently remove all data including guests, RSVPs, and custom
            pages.
          </p>
          <p className="text-sm text-dash-muted">
            Type <strong>{event.draft_name ?? event.name}</strong> to confirm:
          </p>
          <Input
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            placeholder={event.draft_name ?? event.name}
          />
          {deleteMutation.isError && (
            <p className="text-sm text-red-600">
              {deleteMutation.error.message}
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}
