import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, EVENT_TYPES } from "../../lib/supabase";
import { debounce, toDatetimeLocal, fromDatetimeLocal, formatDate } from "../../lib/utils";
import { slugify, isValidSlug } from "../../lib/theme";
import { Button } from "../../components/ui/Button";
import { Card, FormField, Toggle, Badge, Modal, Toast } from "../../components/ui";
import { Input, Select } from "../../components/ui/Input";
import { DatePicker } from "../../components/ui/DatePicker";
import { TimePicker } from "../../components/ui/TimePicker";
import {
  Save,
  Trash2,
  Archive,
  Globe,
  AlertTriangle,
  Check,
  X,
  Eye,
} from "lucide-react";

export default function SettingsPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { event } = useOutletContext<{ event: UserEvent }>();
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<string | null>(null);
  const [toastError, setToastError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [slugChecking, setSlugChecking] = useState(false);

  // Form state
  const [name, setName] = useState(event.draft_name || event.name || "");
  const [eventType, setEventType] = useState(event.draft_event_type || event.event_type || "Wedding");
  const [eventDate, setEventDate] = useState<string | null>(event.draft_event_date || event.event_date);
  const [eventTime, setEventTime] = useState<string | null>(event.draft_event_time || event.event_time);
  const [venue, setVenue] = useState(event.draft_venue || event.venue || "");
  const [address, setAddress] = useState(event.draft_address || event.address || "");
  const [slug, setSlug] = useState(event.draft_slug || event.slug || "");
  const [rsvpDeadline, setRsvpDeadline] = useState(
    toDatetimeLocal(event.draft_rsvp_deadline || event.rsvp_deadline)
  );
  const [isArchived, setIsArchived] = useState(event.is_archived);
  const [isPublished, setIsPublished] = useState(event.is_published);

  const detailsMutation = useMutation({
    mutationFn: async (updates: Record<string, unknown>) => {
      if (!eventId) return;
      const { error } = await supabase
        .from("user_events")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
    },
  });

  const slugMutation = useMutation({
    mutationFn: async (newSlug: string) => {
      if (!eventId) return;
      const { error } = await supabase
        .from("user_events")
        .update({ draft_slug: newSlug, updated_at: new Date().toISOString() })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      setToast("Custom URL updated");
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async (archived: boolean) => {
      if (!eventId) return;
      const { error } = await supabase
        .from("user_events")
        .update({ is_archived: archived, updated_at: new Date().toISOString() })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: (_data, archived) => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      setToast(archived ? "Event archived" : "Event restored");
    },
  });

  const publishToggleMutation = useMutation({
    mutationFn: async (published: boolean) => {
      if (!eventId) return;
      const updates: Record<string, unknown> = {
        is_published: published,
        updated_at: new Date().toISOString(),
      };
      if (published) {
        updates.published_at = new Date().toISOString();
        if (event.draft_name) updates.name = event.draft_name;
        if (event.draft_event_type) updates.event_type = event.draft_event_type;
        if (event.draft_event_date !== undefined) updates.event_date = event.draft_event_date;
        if (event.draft_event_time !== undefined) updates.event_time = event.draft_event_time;
        if (event.draft_venue !== undefined) updates.venue = event.draft_venue;
        if (event.draft_address !== undefined) updates.address = event.draft_address;
        if (event.draft_slug !== undefined) updates.slug = event.draft_slug;
        if (event.draft_rsvp_deadline !== undefined) updates.rsvp_deadline = event.draft_rsvp_deadline;
      }
      const { error } = await supabase
        .from("user_events")
        .update(updates)
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      setToast(isPublished ? "Event unpublished" : "Event published");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!eventId) return;
      const { error } = await supabase
        .from("user_events")
        .delete()
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      navigate("/dashboard");
    },
    onError: (err: Error) => setToastError(err.message),
  });

  // Debounced save for details
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSaveDetails = useCallback(
    debounce((updates: Record<string, unknown>) => detailsMutation.mutate(updates), 600),
    [detailsMutation]
  );

  useEffect(() => {
    debouncedSaveDetails({
      draft_name: name,
      draft_event_type: eventType,
      draft_event_date: eventDate,
      draft_event_time: eventTime,
      draft_venue: venue,
      draft_address: address,
      draft_rsvp_deadline: rsvpDeadline ? fromDatetimeLocal(rsvpDeadline) : null,
    });
  }, [name, eventType, eventDate, eventTime, venue, address, rsvpDeadline, debouncedSaveDetails]);

  // Slug availability check
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedCheckSlug = useCallback(
    debounce(async (slugToCheck: string) => {
      if (!slugToCheck || !isValidSlug(slugToCheck)) {
        setSlugAvailable(null);
        return;
      }
      setSlugChecking(true);
      try {
        const { data, error } = await supabase
          .from("user_events")
          .select("id")
          .eq("draft_slug", slugToCheck)
          .neq("id", eventId || "");
        if (error) throw error;
        setSlugAvailable(data.length === 0);
      } catch {
        setSlugAvailable(null);
      } finally {
        setSlugChecking(false);
      }
    }, 500),
    [eventId]
  );

  useEffect(() => {
    debouncedCheckSlug(slug);
  }, [slug, debouncedCheckSlug]);

  const handleSlugChange = (value: string) => {
    setSlug(slugify(value));
  };

  const handleSlugSave = () => {
    if (!slug || !isValidSlug(slug)) {
      setToastError("Invalid slug. Use 2-50 lowercase letters, numbers, and hyphens.");
      return;
    }
    if (slugAvailable === false) {
      setToastError("This URL is already taken. Please choose another.");
      return;
    }
    slugMutation.mutate(slug);
  };

  const handleArchiveToggle = () => {
    const newArchived = !isArchived;
    setIsArchived(newArchived);
    archiveMutation.mutate(newArchived);
  };

  const handlePublishToggle = () => {
    const newPublished = !isPublished;
    setIsPublished(newPublished);
    publishToggleMutation.mutate(newPublished);
  };

  const handleDelete = () => {
    if (deleteConfirm !== event.name) {
      setToastError(`Type "${event.name}" to confirm deletion`);
      return;
    }
    deleteMutation.mutate();
  };

  const slugValid = slug && isValidSlug(slug);
  const shareUrl = `${window.location.origin}/e/${slug || event.id}`;

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h2 className="font-heading text-2xl text-[var(--color-text)] mb-1">Settings</h2>
        <p className="text-sm text-[var(--color-text-muted)]">
          Manage your event details, URL, and publication status.
        </p>
      </div>

      {/* Event Details */}
      <Card className="p-5 space-y-5">
        <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
          Event Details
        </h3>

        <FormField label="Event Name">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Our Wedding"
          />
        </FormField>

        <FormField label="Event Type">
          <Select
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
          >
            {EVENT_TYPES.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </Select>
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Event Date">
            <DatePicker value={eventDate} onChange={setEventDate} />
          </FormField>
          <FormField label="Event Time">
            <TimePicker value={eventTime} onChange={setEventTime} />
          </FormField>
        </div>

        <FormField label="Venue">
          <Input
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            placeholder="The Grand Ballroom"
          />
        </FormField>

        <FormField label="Address">
          <Input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="123 Main Street, City"
          />
        </FormField>

        <FormField label="RSVP Deadline" hint="Guests cannot submit RSVPs after this date">
          <Input
            type="datetime-local"
            value={rsvpDeadline}
            onChange={(e) => setRsvpDeadline(e.target.value)}
          />
        </FormField>
      </Card>

      {/* Custom URL */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-[var(--color-text-muted)]" />
          <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
            Custom URL
          </h3>
        </div>

        <FormField label="URL Slug" hint="Only lowercase letters, numbers, and hyphens (2-50 chars)">
          <div className="flex items-center gap-2">
            <span className="text-sm text-[var(--color-text-muted)] whitespace-nowrap">/e/</span>
            <Input
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              placeholder="my-event"
              className={slugValid ? (slugAvailable === false ? "border-red-500" : slugAvailable === true ? "border-green-500" : "") : "border-red-500"}
            />
          </div>
        </FormField>

        {/* Slug validation indicator */}
        <div className="flex items-center gap-2 text-sm">
          {slugChecking ? (
            <span className="text-[var(--color-text-muted)]">Checking availability…</span>
          ) : !slugValid ? (
            <span className="flex items-center gap-1 text-red-600">
              <X className="w-4 h-4" /> Invalid format
            </span>
          ) : slugAvailable === true ? (
            <span className="flex items-center gap-1 text-green-600">
              <Check className="w-4 h-4" /> Available
            </span>
          ) : slugAvailable === false ? (
            <span className="flex items-center gap-1 text-red-600">
              <X className="w-4 h-4" /> Already taken
            </span>
          ) : (
            <span className="text-[var(--color-text-muted)]">Type to check availability</span>
          )}
        </div>

        {slugValid && (
          <div className="p-3 bg-[var(--color-bg-subtle)] border border-[var(--color-border)]" style={{ borderRadius: "var(--radius)" }}>
            <p className="text-xs text-[var(--color-text-muted)] mb-1">Your event will be available at:</p>
            <p className="text-sm text-[var(--color-text)] break-all">{shareUrl}</p>
          </div>
        )}

        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={handleSlugSave}
            loading={slugMutation.isPending}
            disabled={!slugValid || slugAvailable === false}
          >
            <Save className="w-3.5 h-3.5" /> Save URL
          </Button>
        </div>
      </Card>

      {/* Publication Status */}
      <Card className="p-5 space-y-4">
        <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
          Publication
        </h3>

        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-sm text-[var(--color-text)] font-medium">Published</p>
            <p className="text-xs text-[var(--color-text-muted)]">
              {isPublished
                ? "Your event is live and accessible via the share link"
                : "Your event is in draft mode and not publicly accessible"}
            </p>
          </div>
          <Toggle checked={isPublished} onChange={handlePublishToggle} />
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={isPublished ? "success" : "default"}>
            {isPublished ? "Published" : "Draft"}
          </Badge>
          {event.published_at && (
            <span className="text-xs text-[var(--color-text-muted)]">
              Published on {formatDate(event.published_at)}
            </span>
          )}
        </div>

        {isPublished && slug && (
          <a href={`/e/${slug}`} target="_blank" rel="noopener noreferrer">
            <Button variant="secondary" size="sm">
              <Eye className="w-3.5 h-3.5" /> View Live Page
            </Button>
          </a>
        )}
      </Card>

      {/* Archive */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Archive className="w-4 h-4 text-[var(--color-text-muted)]" />
          <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
            Archive
          </h3>
        </div>
        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-sm text-[var(--color-text)] font-medium">
              {isArchived ? "Archived" : "Active"}
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">
              {isArchived
                ? "This event is archived and hidden from your dashboard"
                : "Archiving hides this event from your active dashboard"}
            </p>
          </div>
          <Toggle checked={isArchived} onChange={handleArchiveToggle} />
        </div>
      </Card>

      {/* Danger Zone */}
      <Card className="p-5 space-y-4 border-red-200">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600" />
          <h3 className="text-xs font-medium uppercase tracking-wider text-red-600">
            Danger Zone
          </h3>
        </div>
        <p className="text-sm text-[var(--color-text-muted)]">
          Deleting an event is permanent and cannot be undone. All guest data, RSVPs, and content will be lost.
        </p>
        <Button variant="danger" size="sm" onClick={() => setShowDeleteModal(true)}>
          <Trash2 className="w-3.5 h-3.5" /> Delete Event
        </Button>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal
        open={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setDeleteConfirm(""); }}
        title="Delete Event"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200" style={{ borderRadius: "var(--radius)" }}>
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">
              This action is irreversible. All guests, RSVPs, schedule items, and custom content will be permanently deleted.
            </p>
          </div>
          <FormField label={`Type "${event.name}" to confirm`}>
            <Input
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder={event.name}
            />
          </FormField>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => { setShowDeleteModal(false); setDeleteConfirm(""); }}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              loading={deleteMutation.isPending}
              disabled={deleteConfirm !== event.name}
            >
              <Trash2 className="w-4 h-4" /> Delete Permanently
            </Button>
          </div>
        </div>
      </Modal>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      {toastError && <Toast message={toastError} type="error" onClose={() => setToastError(null)} />}
    </div>
  );
}
