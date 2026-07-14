import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, Select } from "../../components/ui/Input";
import { Card, Toggle } from "../../components/ui";
import { DatePicker } from "../../components/ui/DatePicker";
import { TimePicker } from "../../components/ui/TimePicker";
import { slugify, isValidSlug } from "../../lib/theme";

const EVENT_TYPES = [
  { label: "Wedding", value: "wedding" },
  { label: "Birthday", value: "birthday" },
  { label: "Anniversary", value: "anniversary" },
  { label: "Engagement", value: "engagement" },
  { label: "Other", value: "other" },
];

export function SettingsPage() {
  const { event, eventId } = useEventContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState(event.draft_name ?? event.name);
  const [eventType, setEventType] = useState(event.draft_event_type ?? event.event_type ?? "wedding");
  const [eventDate, setEventDate] = useState(event.draft_event_date ?? "");
  const [eventTime, setEventTime] = useState(event.draft_event_time ?? "");
  const [venue, setVenue] = useState(event.draft_venue ?? "");
  const [address, setAddress] = useState(event.draft_address ?? "");
  const [slug, setSlug] = useState(event.draft_slug ?? "");
  const [rsvpDeadline, setRsvpDeadline] = useState(event.draft_rsvp_deadline ?? "");
  const [isArchived, setIsArchived] = useState(event.is_archived);
  const [slugError, setSlugError] = useState<string | null>(null);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const finalSlug = slug ? slugify(slug) : slugify(name);
      if (finalSlug && !isValidSlug(finalSlug)) {
        throw new Error("Invalid URL slug. Use only lowercase letters, numbers, and hyphens.");
      }
      const { error } = await supabase
        .from("events")
        .update({
          draft_name: name,
          draft_event_type: eventType,
          draft_event_date: eventDate || null,
          draft_event_time: eventTime || null,
          draft_venue: venue,
          draft_address: address,
          draft_slug: finalSlug || null,
          draft_rsvp_deadline: rsvpDeadline || null,
          is_archived: isArchived,
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
      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      navigate("/dashboard");
    },
  });

  function handleSlugChange(value: string) {
    setSlug(value);
    if (value && !isValidSlug(slugify(value))) {
      setSlugError("Use only lowercase letters, numbers, and hyphens.");
    } else {
      setSlugError(null);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dash-text">Settings</h1>
        <p className="mt-1 text-sm text-dash-muted">
          Manage your event details and configuration.
        </p>
      </div>

      {/* Event Details */}
      <Card>
        <h2 className="mb-4 text-lg font-semibold text-dash-text">Event Details</h2>
        <div className="space-y-4">
          <Input
            label="Event name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Sarah & John's Wedding"
          />
          <Select
            label="Event type"
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
          >
            {EVENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </Select>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DatePicker
              label="Event date"
              value={eventDate}
              onChange={setEventDate}
            />
            <TimePicker
              label="Event time"
              value={eventTime}
              onChange={setEventTime}
            />
          </div>
          <Input
            label="Venue"
            type="text"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            placeholder="e.g. The Grand Ballroom"
          />
          <Textarea
            label="Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="123 Main Street, City, State"
          />
        </div>
      </Card>

      {/* Website Settings */}
      <Card>
        <h2 className="mb-4 text-lg font-semibold text-dash-text">Website Settings</h2>
        <div className="space-y-4">
          <Input
            label="Website URL slug"
            type="text"
            value={slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            placeholder="sarah-and-john"
          />
          {slugError && <p className="text-sm text-dash-danger">{slugError}</p>}
          <p className="text-sm text-dash-muted">
            Your website will be available at: {window.location.origin}/e/{slug ? slugify(slug) : "your-slug"}
          </p>
          <DatePicker
            label="RSVP deadline"
            value={rsvpDeadline}
            onChange={setRsvpDeadline}
          />
        </div>
      </Card>

      {/* Archive */}
      <Card>
        <h2 className="mb-4 text-lg font-semibold text-dash-text">Archive</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-dash-text">Archive this event</p>
            <p className="text-sm text-dash-muted">Archived events are hidden from your dashboard.</p>
          </div>
          <Toggle checked={isArchived} onChange={setIsArchived} label="" />
        </div>
      </Card>

      {/* Save */}
      <Button
        onClick={() => saveMutation.mutate()}
        loading={saveMutation.isPending}
        disabled={saveMutation.isPending}
        className="w-full"
      >
        Save Settings
      </Button>
      {saveMutation.isSuccess && (
        <p className="text-sm text-green-600">Settings saved successfully!</p>
      )}
      {saveMutation.isError && (
        <p className="text-sm text-dash-danger">
          {saveMutation.error instanceof Error ? saveMutation.error.message : "Save failed."}
        </p>
      )}

      {/* Danger Zone */}
      <Card className="border-dash-danger/30">
        <h2 className="mb-2 text-lg font-semibold text-dash-danger">Danger Zone</h2>
        <p className="mb-4 text-sm text-dash-muted">
          Permanently delete this event and all associated data. This cannot be undone.
        </p>
        <Button
          variant="danger"
          loading={deleteMutation.isPending}
          disabled={deleteMutation.isPending}
          onClick={() => {
            if (window.confirm("Are you sure you want to delete this event? This cannot be undone.")) {
              deleteMutation.mutate();
            }
          }}
        >
          Delete Event
        </Button>
        {deleteMutation.isError && (
          <p className="mt-2 text-sm text-dash-danger">
            {deleteMutation.error instanceof Error ? deleteMutation.error.message : "Delete failed."}
          </p>
        )}
      </Card>
    </div>
  );
}
