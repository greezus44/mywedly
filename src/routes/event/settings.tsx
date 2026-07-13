import { useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { Input, Select, FormField, Modal } from "../../components/ui";
import { Button } from "../../components/ui/Button";

const EVENT_TYPES = [
  { value: "wedding", label: "Wedding" },
  { value: "birthday", label: "Birthday" },
  { value: "corporate", label: "Corporate" },
  { value: "other", label: "Other" },
];

export default function Settings() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState(event.draft_name ?? event.name ?? "");
  const [eventType, setEventType] = useState(event.draft_event_type ?? event.event_type ?? "wedding");
  const [eventDate, setEventDate] = useState(event.draft_event_date ?? event.event_date ?? "");
  const [eventTime, setEventTime] = useState(event.draft_event_time ?? event.event_time ?? "");
  const [venue, setVenue] = useState(event.draft_venue ?? event.venue ?? "");
  const [address, setAddress] = useState(event.draft_address ?? event.address ?? "");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("user_events")
        .update({
          draft_name: name,
          draft_event_type: eventType,
          draft_event_date: eventDate || null,
          draft_event_time: eventTime || null,
          draft_venue: venue,
          draft_address: address,
        })
        .eq("id", event.id)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_events", event.id] });
    },
    onError: () => {},
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("user_events").delete().eq("id", event.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_events"] });
      navigate("/dashboard", { replace: true });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-dash-text">Website Settings</h2>
          <p className="mt-1 text-sm text-dash-muted">Update your event details and configuration.</p>
        </div>
        <Button loading={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
          Save Changes
        </Button>
      </div>

      {saveMutation.isError && (
        <div className="rounded-md border border-dash-danger/30 bg-red-50 px-4 py-3 text-sm text-dash-danger">
          Failed to save. Please try again.
        </div>
      )}
      {saveMutation.isSuccess && (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Changes saved successfully.
        </div>
      )}

      <div className="rounded-xl border border-dash-border bg-dash-surface p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input label="Website Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Event name" />
          <Select label="Event Type" value={eventType} onChange={(e) => setEventType(e.target.value)}>
            {EVENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </Select>
          <Input label="Event Date" type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
          <Input label="Event Time" type="time" value={eventTime} onChange={(e) => setEventTime(e.target.value)} />
          <Input label="Venue" value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="Venue name" />
          <Input label="Address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Venue address" />
        </div>
      </div>

      {/* Danger zone */}
      <div className="rounded-xl border border-dash-danger/30 bg-red-50 p-6">
        <h3 className="text-lg font-semibold text-dash-danger">Danger Zone</h3>
        <p className="mt-1 text-sm text-dash-muted">Permanently delete this website and all its data.</p>
        <Button variant="danger" className="mt-4" onClick={() => setDeleteOpen(true)}>
          Delete Website
        </Button>
      </div>

      <Modal open={deleteOpen} onClose={() => { setDeleteOpen(false); setDeleteConfirm(""); }} title="Delete Website">
        <div className="space-y-4">
          <p className="text-sm text-dash-muted">
            This will permanently delete <strong className="text-dash-text">{event.draft_name || event.name}</strong> and all associated data. This action cannot be undone.
          </p>
          <FormField label={`Type "${event.draft_name || event.name}" to confirm`}>
            <Input
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder={event.draft_name || event.name}
            />
          </FormField>
          {deleteMutation.isError && (
            <div className="rounded-md border border-dash-danger/30 bg-red-50 px-4 py-3 text-sm text-dash-danger">
              Failed to delete. Please try again.
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => { setDeleteOpen(false); setDeleteConfirm(""); }}>Cancel</Button>
            <Button
              variant="danger"
              loading={deleteMutation.isPending}
              disabled={deleteConfirm !== (event.draft_name || event.name)}
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
