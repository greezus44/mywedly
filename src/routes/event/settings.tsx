import { useState, useEffect } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input, DatePicker, TimePicker, DateTimePicker } from "../../components/ui";
import { Modal } from "../../components/ui";
import { isValidSlug, slugify } from "../../lib/utils";

interface EventContextValue { event: UserEvent; eventId: string; }

export function SettingsPage() {
  const { event, eventId } = useOutletContext<EventContextValue>();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [name, setName] = useState(event.draft_name ?? event.name ?? "");
  const [slug, setSlug] = useState(event.draft_slug ?? event.slug ?? "");
  const [eventType, setEventType] = useState(event.draft_event_type ?? event.event_type ?? "");
  const [eventDate, setEventDate] = useState(event.draft_event_date ?? event.event_date ?? "");
  const [eventTime, setEventTime] = useState(event.draft_event_time ?? event.event_time ?? "");
  const [venue, setVenue] = useState(event.draft_venue ?? event.venue ?? "");
  const [address, setAddress] = useState(event.draft_address ?? event.address ?? "");
  const [rsvpDeadline, setRsvpDeadline] = useState(event.draft_rsvp_deadline ?? event.rsvp_deadline ?? "");
  const [showDelete, setShowDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(event.draft_name ?? event.name ?? "");
    setSlug(event.draft_slug ?? event.slug ?? "");
    setEventType(event.draft_event_type ?? event.event_type ?? "");
    setEventDate(event.draft_event_date ?? event.event_date ?? "");
    setEventTime(event.draft_event_time ?? event.event_time ?? "");
    setVenue(event.draft_venue ?? event.venue ?? "");
    setAddress(event.draft_address ?? event.address ?? "");
    setRsvpDeadline(event.draft_rsvp_deadline ?? event.rsvp_deadline ?? "");
  }, [event]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (slug && !isValidSlug(slug)) throw new Error("Invalid slug. Use lowercase letters, numbers, and hyphens only.");
      const { error } = await supabase.from("user_events").update({
        draft_name: name, draft_slug: slug || slugify(name), draft_event_type: eventType,
        draft_event_date: eventDate, draft_event_time: eventTime, draft_venue: venue,
        draft_address: address, draft_rsvp_deadline: rsvpDeadline,
      }).eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["event", eventId] }); setError(null); },
    onError: (e) => setError(e instanceof Error ? e.message : "Save failed"),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("user_events").delete().eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["events"] }); navigate("/dashboard"); },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-dash-text">Settings</h2>
        <Button size="sm" onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>Save</Button>
      </div>
      {error && <p className="text-sm text-dash-danger">{error}</p>}
      {saveMutation.isSuccess && <p className="text-sm text-green-600">Saved</p>}
      <div className="space-y-4 rounded-lg border border-dash-border bg-dash-surface p-4">
        <Input label="Event Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Event name" />
        <Input label="Slug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="url-slug" />
        <Input label="Event Type" value={eventType} onChange={(e) => setEventType(e.target.value)} placeholder="e.g. Wedding, Birthday" />
        <div className="grid gap-4 sm:grid-cols-2">
          <DatePicker label="Event Date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
          <TimePicker label="Event Time" value={eventTime} onChange={setEventTime} />
        </div>
        <Input label="Venue" value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="Venue name" />
        <Input label="Address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Full address" />
        <DateTimePicker label="RSVP Deadline" value={rsvpDeadline} onChange={setRsvpDeadline} />
      </div>
      <div className="rounded-lg border border-dash-border border-red-200 bg-dash-surface p-4">
        <h3 className="mb-2 text-sm font-semibold text-dash-danger">Danger Zone</h3>
        <p className="mb-3 text-sm text-dash-muted">Permanently delete this event and all its data. This cannot be undone.</p>
        <Button variant="danger" onClick={() => setShowDelete(true)}>Delete Event</Button>
      </div>
      <Modal open={showDelete} onClose={() => setShowDelete(false)} title="Delete Event">
        <div className="space-y-4">
          <p className="text-sm text-dash-muted">Are you sure you want to permanently delete "{name}"? All guests, RSVPs, and pages will be lost.</p>
          {deleteMutation.isError && <p className="text-sm text-dash-danger">{deleteMutation.error instanceof Error ? deleteMutation.error.message : "Delete failed"}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowDelete(false)}>Cancel</Button>
            <Button variant="danger" onClick={() => deleteMutation.mutate()} loading={deleteMutation.isPending}>Delete Permanently</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
