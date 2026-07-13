import { useState, useEffect } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { Input, Select, DatePicker, TimePicker, Button, Card, Modal } from "../../components/ui";

export default function SettingsPage() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState(event.draft_name ?? event.name);
  const [eventType, setEventType] = useState(event.draft_event_type ?? event.event_type);
  const [eventDate, setEventDate] = useState(event.draft_event_date ?? event.event_date);
  const [eventTime, setEventTime] = useState(event.draft_event_time ?? event.event_time);
  const [venue, setVenue] = useState(event.draft_venue ?? event.venue ?? "");
  const [address, setAddress] = useState(event.draft_address ?? event.address ?? "");
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
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
          draft_venue: venue,
          draft_address: address,
        })
        .eq("id", event.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_events", event.id] });
      setSavedMsg("Saved successfully");
      setTimeout(() => setSavedMsg(null), 3000);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("user_events")
        .delete()
        .eq("id", event.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_events"] });
      navigate("/dashboard");
    },
  });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-dash-text">Website Settings</h2>
        <p className="text-sm text-dash-muted">Update the basic details of your event website.</p>
      </div>

      <Card className="space-y-4">
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
          <option value="wedding">Wedding</option>
          <option value="birthday">Birthday</option>
          <option value="corporate">Corporate</option>
          <option value="other">Other</option>
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
          placeholder="e.g. Grand Ballroom Hotel"
        />
        <Input
          label="Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="e.g. 123 Main St, City, State"
        />

        <div className="flex items-center gap-2">
          <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>
            Save Changes
          </Button>
          {saveMutation.isError && (
            <p className="text-sm text-dash-danger">
              {saveMutation.error instanceof Error ? saveMutation.error.message : "Failed to save"}
            </p>
          )}
          {savedMsg && <span className="text-sm text-green-600">{savedMsg}</span>}
        </div>
      </Card>

      {/* Danger Zone */}
      <Card className="border-dash-danger/30">
        <h3 className="text-sm font-semibold text-dash-danger">Danger Zone</h3>
        <p className="mt-1 text-sm text-dash-muted">
          Permanently delete this event website and all associated data. This cannot be undone.
        </p>
        <Button
          variant="danger"
          className="mt-3"
          onClick={() => setDeleteOpen(true)}
        >
          Delete Website
        </Button>
      </Card>

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete Website">
        <div className="space-y-4">
          <p className="text-sm text-dash-text">
            Are you sure you want to delete{" "}
            <strong>{event.draft_name || event.name}</strong>? This action is permanent and cannot be undone.
          </p>
          <Input
            label='Type the event name to confirm'
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            placeholder={event.draft_name || event.name}
          />
          {deleteMutation.isError && (
            <p className="text-sm text-dash-danger">
              {deleteMutation.error instanceof Error ? deleteMutation.error.message : "Failed to delete"}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
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
