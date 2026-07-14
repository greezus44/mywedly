import { useState, type FormEvent } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { Button, Card } from "../../components/ui";
import { Input, Select } from "../../components/ui";
import { slugify, isValidSlug } from "../../lib/theme";
import { DateTimePicker } from "../../components/ui/DateTimePicker";

interface EventContextValue { event: UserEvent; eventId: string; }

export function SettingsPage() {
  const { event, eventId } = useOutletContext<EventContextValue>();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [name, setName] = useState(event.draft_name ?? event.name ?? "");
  const [slug, setSlug] = useState(event.draft_slug ?? event.slug ?? "");
  const [eventType, setEventType] = useState(event.draft_event_type ?? event.event_type ?? "wedding");
  const [date, setDate] = useState(event.draft_event_date ?? event.event_date ?? "");
  const [time, setTime] = useState(event.draft_event_time ?? event.event_time ?? "");
  const [venue, setVenue] = useState(event.draft_venue ?? event.venue ?? "");
  const [address, setAddress] = useState(event.draft_address ?? event.address ?? "");
  const [rsvpDeadline, setRsvpDeadline] = useState(event.draft_rsvp_deadline ?? event.rsvp_deadline ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const finalSlug = slug.trim() || slugify(name);
      if (!isValidSlug(finalSlug)) throw new Error("Invalid slug");
      const { error } = await supabase.from("user_events").update({
        draft_name: name, draft_slug: finalSlug, draft_event_type: eventType,
        draft_event_date: date || null, draft_event_time: time || null,
        draft_venue: venue, draft_address: address, draft_rsvp_deadline: rsvpDeadline || null,
      }).eq("id", eventId);
      if (error) throw error;
    },
    onMutate: () => { setSaving(true); setError(null); setSavedMsg(null); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["event", eventId] }); setSaving(false); setSavedMsg("Saved!"); setTimeout(() => setSavedMsg(null), 2000); },
    onError: (e) => { setSaving(false); setError(e instanceof Error ? e.message : "Failed to save"); },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("user_events").delete().eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["events"] }); navigate("/dashboard"); },
  });

  const handleSubmit = (e: FormEvent) => { e.preventDefault(); saveMutation.mutate(); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-dash-text">Settings</h2>
        {savedMsg && <span className="text-sm text-dash-muted">{savedMsg}</span>}
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <div className="space-y-4">
            <Input label="Event Name" value={name} onChange={(e) => setName(e.target.value)} required />
            <Input label="Slug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="auto-generated" />
            <Select label="Event Type" value={eventType} onChange={(e) => setEventType(e.target.value)}>
              <option value="wedding">Wedding</option>
              <option value="engagement">Engagement</option>
              <option value="reception">Reception</option>
              <option value="other">Other</option>
            </Select>
            <DateTimePicker label="Date & Time" dateValue={date} timeValue={time} onDateChange={setDate} onTimeChange={setTime} />
            <Input label="Venue" value={venue} onChange={(e) => setVenue(e.target.value)} />
            <Input label="Address" value={address} onChange={(e) => setAddress(e.target.value)} />
            <Input label="RSVP Deadline" type="datetime-local" value={rsvpDeadline} onChange={(e) => setRsvpDeadline(e.target.value)} />
          </div>
        </Card>
        {error && <p className="text-sm text-dash-danger">{error}</p>}
        <div className="flex justify-end">
          <Button type="submit" loading={saving}>Save Settings</Button>
        </div>
      </form>
      <Card>
        <h3 className="text-sm font-semibold text-dash-danger">Danger Zone</h3>
        <p className="mt-1 text-sm text-dash-muted">Delete this event permanently. This cannot be undone.</p>
        <Button variant="danger" size="sm" className="mt-3" onClick={() => { if (confirm("Are you sure? This cannot be undone.")) deleteMutation.mutate(); }} loading={deleteMutation.isPending}>Delete Event</Button>
      </Card>
    </div>
  );
}
