import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Input, Card, Modal, LoadingSpinner } from "../../components/ui";
import { slugify, isValidSlug } from "../../lib/theme";

export function SettingsPage() {
  const { event, eventId } = useEventContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState(event.draft_name ?? event.name ?? "");
  const [eventType, setEventType] = useState(event.draft_event_type ?? event.event_type ?? "Wedding");
  const [venue, setVenue] = useState(event.draft_venue ?? event.venue ?? "");
  const [address, setAddress] = useState(event.draft_address ?? event.address ?? "");
  const [slug, setSlug] = useState(event.draft_slug ?? event.slug ?? "");
  const [rsvpDeadline, setRsvpDeadline] = useState(event.draft_rsvp_deadline ?? event.rsvp_deadline ?? "");
  const [slugError, setSlugError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    setName(event.draft_name ?? event.name ?? "");
    setVenue(event.draft_venue ?? event.venue ?? "");
    setSlug(event.draft_slug ?? event.slug ?? "");
  }, [event]);

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
          draft_venue: venue,
          draft_address: address,
          draft_slug: slug,
          draft_rsvp_deadline: rsvpDeadline || null,
        })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 2000);
    },
    onError: (err) => {
      setSlugError(err instanceof Error ? err.message : "Failed to save");
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("user_events")
        .update({ is_archived: true })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      navigate("/dashboard");
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
      queryClient.invalidateQueries({ queryKey: ["events"] });
      navigate("/dashboard");
    },
  });

  const handleSlugChange = (val: string) => {
    setSlug(slugify(val));
    setSlugError(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-dash-text">Settings</h2>
          <p className="text-sm text-dash-muted">Manage your event details and configuration.</p>
        </div>
        <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>
          {savedMsg ? "Saved!" : "Save Changes"}
        </Button>
      </div>

      {saveMutation.isError && (
        <p className="text-sm text-dash-danger">
          {saveMutation.error instanceof Error ? saveMutation.error.message : "Failed to save"}
        </p>
      )}

      {/* Event Details */}
      <Card>
        <h3 className="mb-4 text-sm font-semibold text-dash-text">Event Details</h3>
        <div className="space-y-4">
          <Input
            label="Event Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. John & Jane's Wedding"
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-dash-text">Event Type</label>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className="h-10 w-full rounded-md border border-dash-border bg-dash-surface px-3 text-sm text-dash-text"
            >
              <option value="Wedding">Wedding</option>
              <option value="Birthday">Birthday</option>
              <option value="Corporate">Corporate</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <Input
            label="Venue"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            placeholder="e.g. The Grand Ballroom"
          />
          <Input
            label="Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. 123 Main Street, London"
          />
        </div>
      </Card>

      {/* URL Slug */}
      <Card>
        <h3 className="mb-4 text-sm font-semibold text-dash-text">URL Slug</h3>
        <Input
          label="Slug"
          value={slug}
          onChange={(e) => handleSlugChange(e.target.value)}
          placeholder="john-and-jane"
          error={slugError ?? undefined}
        />
        {slug && (
          <p className="mt-2 text-xs text-dash-muted">
            Your invitation will be at: <span className="text-dash-primary">{window.location.origin}/e/{slug}</span>
          </p>
        )}
      </Card>

      {/* RSVP Deadline */}
      <Card>
        <h3 className="mb-4 text-sm font-semibold text-dash-text">RSVP Deadline</h3>
        <Input
          label="Deadline"
          type="datetime-local"
          value={rsvpDeadline ? rsvpDeadline.slice(0, 16) : ""}
          onChange={(e) => setRsvpDeadline(e.target.value ? new Date(e.target.value).toISOString() : "")}
        />
      </Card>

      {/* Danger Zone */}
      <Card className="border-dash-danger/30">
        <h3 className="mb-4 text-sm font-semibold text-dash-danger">Danger Zone</h3>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            variant="secondary"
            onClick={() => archiveMutation.mutate()}
            loading={archiveMutation.isPending}
          >
            Archive Event
          </Button>
          <Button
            variant="danger"
            onClick={() => setShowDelete(true)}
          >
            Delete Event
          </Button>
        </div>
      </Card>

      <Modal open={showDelete} onClose={() => setShowDelete(false)} title="Delete Event">
        <div className="space-y-4">
          <p className="text-sm text-dash-muted">
            Are you sure you want to permanently delete this event? This action cannot be undone and all
            guest data, RSVPs, and custom pages will be lost.
          </p>
          {deleteMutation.isError && (
            <p className="text-sm text-dash-danger">
              {deleteMutation.error instanceof Error ? deleteMutation.error.message : "Failed to delete"}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowDelete(false)}>Cancel</Button>
            <Button variant="danger" onClick={() => deleteMutation.mutate()} loading={deleteMutation.isPending}>
              Delete Permanently
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
