import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type Json } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Card, Input, Textarea, Badge, Toggle, DateTimePicker, Modal } from "../../components/ui";
import { formatDate, formatDateTime } from "../../lib/utils";
import { isValidSlug } from "../../lib/theme";

export function SettingsPage() {
  const { event, eventId } = useEventContext();
  const queryClient = useQueryClient();

  const [name, setName] = useState(event.draft_name || "");
  const [slug, setSlug] = useState(event.draft_slug || "");
  const [eventType, setEventType] = useState(event.draft_event_type || "Wedding");
  const [eventDate, setEventDate] = useState(event.draft_event_date || "");
  const [eventTime, setEventTime] = useState(event.draft_event_time || "");
  const [venue, setVenue] = useState(event.draft_venue || "");
  const [address, setAddress] = useState(event.draft_address || "");
  const [rsvpDeadline, setRsvpDeadline] = useState(event.draft_rsvp_deadline || "");
  const [isArchived, setIsArchived] = useState(event.is_archived);
  const [showPublish, setShowPublish] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (slug && !isValidSlug(slug)) {
        throw new Error("Slug can only contain lowercase letters, numbers, and hyphens.");
      }
      const { error } = await supabase
        .from("user_events")
        .update({
          draft_name: name,
          draft_slug: slug,
          draft_event_type: eventType,
          draft_event_date: eventDate || null,
          draft_event_time: eventTime || null,
          draft_venue: venue,
          draft_address: address,
          draft_rsvp_deadline: rsvpDeadline || null,
          is_archived: isArchived,
        })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      setSaved(true);
      setError(null);
      setTimeout(() => setSaved(false), 2000);
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Failed to save settings.");
    },
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      if (!slug || !isValidSlug(slug)) {
        throw new Error("A valid slug is required to publish.");
      }
      if (!name) {
        throw new Error("Event name is required to publish.");
      }
      const { error } = await supabase
        .from("user_events")
        .update({
          slug,
          name,
          theme: event.draft_theme ?? event.theme,
          cover_config: event.draft_cover_config ?? event.cover_config,
          cover_image: event.draft_cover_image ?? event.cover_image,
          logo_config: event.draft_logo_config ?? event.logo_config,
          content: event.draft_content ?? event.content,
          login_config: event.draft_login_config ?? event.login_config,
          sharing_config: event.draft_sharing_config ?? event.sharing_config,
          event_date: event.draft_event_date ?? event.event_date,
          event_time: event.draft_event_time ?? event.event_time,
          venue: event.draft_venue ?? event.venue,
          address: event.draft_address ?? event.address,
          event_type: event.draft_event_type ?? event.event_type,
          rsvp_deadline: event.draft_rsvp_deadline ?? event.rsvp_deadline,
          is_published: true,
          published_at: new Date().toISOString(),
        })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      setShowPublish(false);
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Failed to publish.");
    },
  });

  const unpublishMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("user_events")
        .update({ is_published: false })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    saveMutation.mutate();
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-bold text-dash-text">Settings</h2>
        <p className="text-sm text-dash-muted">Manage your event details and publishing.</p>
      </div>

      {/* Publish status */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-dash-text">Publish Status</h3>
            <p className="mt-1 text-sm text-dash-muted">
              {event.is_published
                ? `Published on ${event.published_at ? formatDateTime(event.published_at) : "unknown date"}`
                : "This event is not yet published."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {event.is_published ? (
              <>
                <Badge variant="success">Published</Badge>
                <Button variant="secondary" size="sm" onClick={() => unpublishMutation.mutate()} loading={unpublishMutation.isPending}>
                  Unpublish
                </Button>
              </>
            ) : (
              <>
                <Badge variant="default">Draft</Badge>
                <Button size="sm" onClick={() => setShowPublish(true)}>Publish</Button>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Event details */}
      <form onSubmit={handleSave}>
        <Card>
          <h3 className="mb-4 text-sm font-semibold text-dash-text">Event Details</h3>
          <div className="space-y-4">
            <Input
              label="Event Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John & Jane's Wedding"
              required
            />
            <Input
              label="URL Slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="john-and-jane"
            />
            <p className="-mt-2 text-xs text-dash-muted">Lowercase letters, numbers, and hyphens only.</p>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-dash-text">Event Type</label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text focus:border-dash-primary focus:outline-none"
              >
                <option value="Wedding">Wedding</option>
                <option value="Birthday">Birthday</option>
                <option value="Corporate">Corporate</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
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
              placeholder="Venue name"
            />
            <Textarea
              label="Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Full venue address"
              rows={2}
            />
            <DateTimePicker
              label="RSVP Deadline"
              value={rsvpDeadline}
              onChange={setRsvpDeadline}
            />
            <Toggle
              checked={isArchived}
              onChange={setIsArchived}
              label="Archive this event"
            />
          </div>

          {error && <p className="mt-3 text-sm text-dash-danger">{error}</p>}

          <div className="mt-4 flex justify-end">
            <Button type="submit" loading={saveMutation.isPending}>
              {saved ? "Saved!" : "Save Settings"}
            </Button>
          </div>
        </Card>
      </form>

      {/* Publish confirmation modal */}
      <Modal open={showPublish} onClose={() => setShowPublish(false)} title="Publish Event">
        <div className="space-y-4">
          <p className="text-sm text-dash-muted">
            Publishing will copy all draft content to your live event site. Guests will be able to
            access it at <span className="font-medium text-dash-text">/e/{slug}</span>.
          </p>
          <div className="rounded-lg bg-dash-bg p-3 text-sm">
            <p><span className="text-dash-muted">Name:</span> {name || "—"}</p>
            <p><span className="text-dash-muted">Slug:</span> /e/{slug || "—"}</p>
            {eventDate && <p><span className="text-dash-muted">Date:</span> {formatDate(eventDate)}</p>}
          </div>
          {publishMutation.isError && (
            <p className="text-sm text-dash-danger">
              {publishMutation.error instanceof Error ? publishMutation.error.message : "Failed to publish."}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowPublish(false)}>Cancel</Button>
            <Button onClick={() => publishMutation.mutate()} loading={publishMutation.isPending}>
              Publish Now
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
