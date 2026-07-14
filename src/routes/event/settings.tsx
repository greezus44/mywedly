import { useState, useEffect, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Input, Select, Textarea } from "../../components/ui/Input";
import { Modal, LoadingSpinner } from "../../components/ui";

export default function Settings() {
  const { event, eventId } = useEventContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState(event.draft_name ?? event.name ?? "");
  const [eventType, setEventType] = useState(
    event.draft_event_type ?? event.event_type ?? "Wedding"
  );
  const [eventDate, setEventDate] = useState(
    event.draft_event_date ?? event.event_date ?? null
  );
  const [eventTime, setEventTime] = useState(
    event.draft_event_time ?? event.event_time ?? null
  );
  const [venue, setVenue] = useState(event.draft_venue ?? event.venue ?? "");
  const [address, setAddress] = useState(event.draft_address ?? event.address ?? "");
  const [showDelete, setShowDelete] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  useEffect(() => {
    setName(event.draft_name ?? event.name ?? "");
    setEventType(event.draft_event_type ?? event.event_type ?? "Wedding");
    setEventDate(event.draft_event_date ?? event.event_date ?? null);
    setEventTime(event.draft_event_time ?? event.event_time ?? null);
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
      queryClient.invalidateQueries({ queryKey: ["user_events", eventId] });
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

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    saveMutation.mutate();
  };

  return (
    <div className="mx-auto max-w-2xl p-4 lg:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-dash-text">Website Settings</h1>
        <p className="mt-1 text-sm text-dash-muted">
          Update your event details and manage your website.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Website Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Sarah & John's Wedding"
          required
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
          <option value="Baby Shower">Baby Shower</option>
          <option value="Other">Other</option>
        </Select>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
        </div>

        <Input
          label="Venue"
          value={venue}
          onChange={(e) => setVenue(e.target.value)}
          placeholder="e.g. The Grand Ballroom"
        />

        <Textarea
          label="Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Full venue address"
          rows={2}
        />

        {saveMutation.isError && (
          <p className="text-sm text-dash-danger">
            {saveMutation.error instanceof Error
              ? saveMutation.error.message
              : "Failed to save"}
          </p>
        )}
        {saveMutation.isSuccess && (
          <p className="text-sm text-green-600">Settings saved successfully!</p>
        )}

        <Button
          type="submit"
          loading={saveMutation.isPending}
          className="w-full"
        >
          {saveMutation.isPending ? <LoadingSpinner size="sm" /> : "Save Changes"}
        </Button>
      </form>

      {/* Danger Zone */}
      <div className="mt-8 rounded-xl border border-dash-danger/30 bg-red-50 p-5">
        <h2 className="text-sm font-semibold text-dash-danger">Danger Zone</h2>
        <p className="mt-1 text-sm text-dash-muted">
          Permanently delete this website and all its data. This cannot be undone.
        </p>
        <Button
          variant="danger"
          size="sm"
          className="mt-3"
          onClick={() => setShowDelete(true)}
        >
          Delete Website
        </Button>
      </div>

      {/* Delete Modal */}
      <Modal open={showDelete} onClose={() => setShowDelete(false)} title="Delete Website">
        <div className="space-y-4">
          <p className="text-sm text-dash-text">
            Are you sure you want to delete <strong>{name}</strong>? This action
            cannot be undone. All guest data, RSVPs, and pages will be permanently removed.
          </p>
          <p className="text-sm text-dash-muted">
            Type <strong>{name}</strong> to confirm:
          </p>
          <Input
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            placeholder={name}
            autoFocus
          />
          {deleteMutation.isError && (
            <p className="text-sm text-dash-danger">
              {deleteMutation.error instanceof Error
                ? deleteMutation.error.message
                : "Failed to delete"}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-2">
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
              loading={deleteMutation.isPending}
              disabled={deleteConfirm !== name}
              onClick={() => deleteMutation.mutate()}
            >
              Delete Permanently
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
