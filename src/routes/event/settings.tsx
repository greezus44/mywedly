import { useState, useEffect } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Card, Input, Modal } from "../../components/ui";
import { DateTimePicker } from "../../components/ui/DateTimePicker";

interface EventContextValue { event: UserEvent; eventId: string; }

export function SettingsPage() {
  const { event, eventId } = useOutletContext<EventContextValue>();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [name, setName] = useState(event.draft_name ?? event.name ?? "");
  const [eventType, setEventType] = useState(event.draft_event_type ?? event.event_type ?? "wedding");
  const [venue, setVenue] = useState(event.draft_venue ?? event.venue ?? "");
  const [address, setAddress] = useState(event.draft_address ?? event.address ?? "");
  const [dateValue, setDateValue] = useState((event.draft_event_date ?? event.event_date ?? "").slice(0, 10));
  const [timeValue, setTimeValue] = useState((event.draft_event_time ?? event.event_time ?? "").slice(0, 5));
  const [rsvpDate, setRsvpDate] = useState((event.draft_rsvp_deadline ?? event.rsvp_deadline ?? "").slice(0, 10));
  const [rsvpTime, setRsvpTime] = useState("23:59");
  const [saved, setSaved] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    setName(event.draft_name ?? event.name ?? "");
    setEventType(event.draft_event_type ?? event.event_type ?? "wedding");
    setVenue(event.draft_venue ?? event.venue ?? "");
    setAddress(event.draft_address ?? event.address ?? "");
    setDateValue((event.draft_event_date ?? event.event_date ?? "").slice(0, 10));
    setTimeValue((event.draft_event_time ?? event.event_time ?? "").slice(0, 5));
    setRsvpDate((event.draft_rsvp_deadline ?? event.rsvp_deadline ?? "").slice(0, 10));
  }, [event]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        draft_name: name,
        draft_event_type: eventType,
        draft_venue: venue,
        draft_address: address,
        draft_event_date: dateValue || null,
        draft_event_time: timeValue || null,
        draft_rsvp_deadline: rsvpDate ? `${rsvpDate}T${rsvpTime}:00` : null,
      };
      const { error } = await supabase.from("user_events").update(payload).eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("user_events").delete().eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      navigate("/dashboard", { replace: true });
    },
    onError: (e) => setDeleteError(e instanceof Error ? e.message : "Failed to delete event"),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-dash-text">Settings</h2>
        <div className="flex items-center gap-3">
          {saved && <span className="text-sm text-green-600">Saved!</span>}
          <Button size="sm" onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>Save</Button>
        </div>
      </div>

      <Card>
        <h3 className="mb-4 text-sm font-semibold text-dash-text">Event Details</h3>
        <div className="space-y-4">
          <Input label="Event Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Untitled Event" />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-dash-text">Event Type</label>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className="w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-dash-text focus:outline-none focus:ring-2 focus:ring-dash-primary/30"
            >
              <option value="wedding">Wedding</option>
              <option value="birthday">Birthday</option>
              <option value="anniversary">Anniversary</option>
              <option value="corporate">Corporate</option>
              <option value="other">Other</option>
            </select>
          </div>
          <Input label="Venue" value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="Venue name" />
          <Input label="Address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Full address" />
          <DateTimePicker
            label="Event Date & Time"
            dateValue={dateValue}
            timeValue={timeValue}
            onDateChange={setDateValue}
            onTimeChange={setTimeValue}
          />
          <DateTimePicker
            label="RSVP Deadline"
            dateValue={rsvpDate}
            timeValue={rsvpTime}
            onDateChange={setRsvpDate}
            onTimeChange={setRsvpTime}
          />
        </div>
      </Card>

      <Card>
        <h3 className="mb-3 text-sm font-semibold text-dash-text">Danger Zone</h3>
        <Button variant="danger" size="sm" onClick={() => setShowDelete(true)}>Delete Event</Button>
      </Card>

      <Modal open={showDelete} onClose={() => { setShowDelete(false); setDeleteError(null); }} title="Delete Event">
        <div className="space-y-4">
          <p className="text-sm text-dash-muted">
            This will permanently delete the event, all guests, RSVPs, and associated data. This action cannot be undone.
          </p>
          {deleteError && <p className="text-sm text-dash-danger">{deleteError}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => { setShowDelete(false); setDeleteError(null); }}>Cancel</Button>
            <Button variant="danger" loading={deleteMutation.isPending} onClick={() => deleteMutation.mutate()}>Delete Permanently</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
