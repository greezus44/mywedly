import { useState, useEffect, type FormEvent } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Card, Input, Select, Badge, LoadingSpinner } from "../../components/ui";
import { slugify, isValidSlug } from "../../lib/theme";
import { formatDate } from "../../lib/utils";
import type { EventContextValue } from "./event-layout";

const EVENT_TYPES = [
  "Wedding",
  "Engagement",
  "Reception",
  "Mehndi",
  "Sangeet",
  "Haldi",
  "Other",
];

export function SettingsPage() {
  const { event, eventId } = useOutletContext<EventContextValue>();
  const queryClient = useQueryClient();

  const [name, setName] = useState(event.draft_name ?? event.name ?? "");
  const [eventType, setEventType] = useState(event.draft_event_type ?? event.event_type ?? "Wedding");
  const [eventDate, setEventDate] = useState(event.draft_event_date ?? event.event_date ?? "");
  const [eventTime, setEventTime] = useState(event.draft_event_time ?? event.event_time ?? "");
  const [venue, setVenue] = useState(event.draft_venue ?? event.venue ?? "");
  const [address, setAddress] = useState(event.draft_address ?? event.address ?? "");
  const [slug, setSlug] = useState(event.draft_slug ?? event.slug ?? "");
  const [rsvpDeadline, setRsvpDeadline] = useState(event.draft_rsvp_deadline ?? event.rsvp_deadline ?? "");
  const [slugError, setSlugError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!loaded) {
      setName(event.draft_name ?? event.name ?? "");
      setEventType(event.draft_event_type ?? event.event_type ?? "Wedding");
      setEventDate(event.draft_event_date ?? event.event_date ?? "");
      setEventTime(event.draft_event_time ?? event.event_time ?? "");
      setVenue(event.draft_venue ?? event.venue ?? "");
      setAddress(event.draft_address ?? event.address ?? "");
      setSlug(event.draft_slug ?? event.slug ?? "");
      setRsvpDeadline(event.draft_rsvp_deadline ?? event.rsvp_deadline ?? "");
      setLoaded(true);
    }
  }, [event, loaded]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (slug && !isValidSlug(slug)) {
        throw new Error("Slug can only contain lowercase letters, numbers, and hyphens.");
      }
      const { error } = await supabase
        .from("user_events")
        .update({
          draft_name: name,
          draft_event_type: eventType,
          draft_event_date: eventDate || null,
          draft_event_time: eventTime || null,
          draft_venue: venue || null,
          draft_address: address || null,
          draft_slug: slug || null,
          draft_rsvp_deadline: rsvpDeadline || null,
        })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
    },
  });

  function handleSlugChange(value: string) {
    setSlug(value);
    if (value && !isValidSlug(value)) {
      setSlugError("Slug can only contain lowercase letters, numbers, and hyphens.");
    } else {
      setSlugError(null);
    }
  }

  function handleSlugify() {
    const generated = slugify(name || event.name || "");
    setSlug(generated);
    setSlugError(null);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    saveMutation.mutate();
  }

  if (!loaded) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-dash-text">Website Settings</h2>
        <p className="text-sm text-dash-muted">Configure your event details and website URL.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Event Details */}
        <Card className="space-y-4 p-4">
          <h3 className="text-sm font-semibold text-dash-text">Event Details</h3>
          <Input
            label="Event Name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Our Wedding"
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-dash-text">Event Type</label>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className="w-full rounded-md border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text"
            >
              {EVENT_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Event Date"
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
            />
            <Input
              label="Event Time"
              type="time"
              value={eventTime}
              onChange={(e) => setEventTime(e.target.value)}
            />
          </div>
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
          <Input
            label="RSVP Deadline"
            type="datetime-local"
            value={rsvpDeadline}
            onChange={(e) => setRsvpDeadline(e.target.value)}
          />
        </Card>

        {/* Website URL */}
        <Card className="space-y-4 p-4">
          <h3 className="text-sm font-semibold text-dash-text">Website URL</h3>
          <div>
            <div className="flex items-center gap-2">
              <Input
                label="URL Slug"
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="my-event"
                error={slugError ?? undefined}
              />
              <div className="pt-6">
                <Button type="button" variant="secondary" size="sm" onClick={handleSlugify}>
                  Auto-Generate
                </Button>
              </div>
            </div>
            {slug && !slugError && (
              <p className="mt-2 text-xs text-dash-muted">
                Your guest page will be: <span className="font-medium text-dash-text">{window.location.origin}/e/{slug}</span>
              </p>
            )}
          </div>
        </Card>

        {/* Publish Status */}
        <Card className="p-4">
          <h3 className="mb-3 text-sm font-semibold text-dash-text">Publish Status</h3>
          <div className="flex items-center gap-2">
            {event.is_published ? (
              <>
                <Badge variant="success">Published</Badge>
                {event.published_at && (
                  <span className="text-xs text-dash-muted">
                    on {formatDate(event.published_at)}
                  </span>
                )}
              </>
            ) : (
              <Badge variant="warning">Draft</Badge>
            )}
          </div>
        </Card>

        {saveMutation.isError && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-dash-danger">
            {saveMutation.error?.message ?? "Failed to save settings"}
          </div>
        )}
        {saveMutation.isSuccess && (
          <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            Settings saved successfully!
          </div>
        )}

        <div className="flex justify-end">
          <Button type="submit" loading={saveMutation.isPending} disabled={saveMutation.isPending}>
            Save Settings
          </Button>
        </div>
      </form>
    </div>
  );
}

export default SettingsPage;
