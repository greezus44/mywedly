import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, Modal, DatePicker } from "../../components/ui";

export default function SettingsPage() {
  const { event, eventId } = useEventContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState(event.draft_title ?? event.title ?? "");
  const [description, setDescription] = useState(event.draft_description ?? event.description ?? "");
  const [eventDate, setEventDate] = useState(event.draft_event_date ?? event.event_date ?? "");
  const [eventEndDate, setEventEndDate] = useState(event.draft_event_end_date ?? event.event_end_date ?? "");
  const [venueName, setVenueName] = useState(event.draft_venue_name ?? event.venue_name ?? "");
  const [venueAddress, setVenueAddress] = useState(event.draft_venue_address ?? event.venue_address ?? "");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("user_events")
        .update({
          draft_title: title,
          draft_description: description,
          draft_event_date: eventDate || null,
          draft_event_end_date: eventEndDate || null,
          draft_venue_name: venueName,
          draft_venue_address: venueAddress,
        })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("user_events").delete().eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-events"] });
      navigate("/dashboard");
    },
  });

  function handleSave(e: FormEvent) {
    e.preventDefault();
    saveMutation.mutate();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-dash-text">Website Settings</h2>
        <p className="text-sm text-dash-muted">Manage your event details and configuration.</p>
      </div>

      {saveMutation.isError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          Error saving: {saveMutation.error?.message}
        </div>
      )}
      {saveMutation.isSuccess && (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700">
          Settings saved successfully!
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4">
        <div className="rounded-lg border border-dash-border bg-dash-surface p-6 space-y-4">
          <h3 className="text-sm font-semibold text-dash-text">Event Details</h3>
          <Input
            label="Event Name"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="My Event"
          />
          <Textarea
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="A brief description of your event"
            rows={3}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-dash-text mb-1">Event Date</label>
              <DatePicker value={eventDate} onChange={setEventDate} />
            </div>
            <div>
              <label className="block text-sm font-medium text-dash-text mb-1">End Date</label>
              <DatePicker value={eventEndDate} onChange={setEventEndDate} />
            </div>
          </div>
          <Input
            label="Venue Name"
            value={venueName}
            onChange={(e) => setVenueName(e.target.value)}
            placeholder="Grand Hall"
          />
          <Input
            label="Venue Address"
            value={venueAddress}
            onChange={(e) => setVenueAddress(e.target.value)}
            placeholder="123 Main St, City, State"
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit" loading={saveMutation.isPending}>
            Save Changes
          </Button>
        </div>
      </form>

      {/* Danger zone */}
      <div className="rounded-lg border border-red-200 bg-red-50/50 p-6">
        <h3 className="text-sm font-semibold text-red-700">Danger Zone</h3>
        <p className="mt-1 text-sm text-dash-muted">
          Deleting this website will permanently remove all data, including guests, RSVPs, and pages.
        </p>
        <Button
          variant="danger"
          size="sm"
          className="mt-4"
          onClick={() => setDeleteOpen(true)}
        >
          Delete Website
        </Button>
      </div>

      {/* Delete confirmation modal */}
      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete Website">
        <div className="space-y-4">
          <p className="text-sm text-dash-text">
            Are you sure you want to delete this website? This action cannot be undone.
          </p>
          <p className="text-sm text-dash-muted">
            Type <code className="rounded bg-dash-bg px-1.5 py-0.5">DELETE</code> to confirm:
          </p>
          <Input
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            placeholder="DELETE"
          />
          {deleteMutation.isError && (
            <p className="text-sm text-red-600">Error: {deleteMutation.error?.message}</p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={deleteConfirm !== "DELETE"}
              loading={deleteMutation.isPending}
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
