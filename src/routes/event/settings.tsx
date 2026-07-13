import { useState } from "react";
import { useParams, useOutletContext, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, EVENT_TYPES } from "../../lib/supabase";
import { toDatetimeLocal, fromDatetimeLocal } from "../../lib/utils";
import { Button } from "../../components/ui/Button";
import { Card, Badge, FormField, Toggle, Modal, Toast } from "../../components/ui";
import { Input, Select } from "../../components/ui/Input";
import { DatePicker } from "../../components/ui/DatePicker";
import { TimePicker } from "../../components/ui/TimePicker";
import { slugify, isValidSlug } from "../../lib/theme";
import { Save, Archive, Trash2, AlertTriangle, Globe } from "lucide-react";

function SettingsPage() {
  const { eventId } = useParams();
  const { event } = useOutletContext<{ event: UserEvent }>();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [toast, setToast] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const [name, setName] = useState(event.draft_name || event.name || "");
  const [eventType, setEventType] = useState(event.draft_event_type || event.event_type || "");
  const [eventDate, setEventDate] = useState<string | null>(event.draft_event_date || event.event_date || null);
  const [eventTime, setEventTime] = useState<string | null>(event.draft_event_time || event.event_time || null);
  const [venue, setVenue] = useState(event.draft_venue || event.venue || "");
  const [address, setAddress] = useState(event.draft_address || event.address || "");
  const [slug, setSlug] = useState(event.draft_slug || event.slug || "");
  const [rsvpDeadline, setRsvpDeadline] = useState(
    toDatetimeLocal(event.draft_rsvp_deadline || event.rsvp_deadline || null)
  );
  const [isPublished, setIsPublished] = useState(event.is_published);

  const saveMutation = useMutation({
    mutationFn: async (payload: {
      name: string;
      eventType: string;
      eventDate: string | null;
      eventTime: string | null;
      venue: string;
      address: string;
      slug: string;
      rsvpDeadline: string | null;
    }) => {
      const { error } = await supabase
        .from("user_events")
        .update({
          draft_name: payload.name,
          draft_event_type: payload.eventType,
          draft_event_date: payload.eventDate,
          draft_event_time: payload.eventTime,
          draft_venue: payload.venue,
          draft_address: payload.address,
          draft_slug: payload.slug,
          draft_rsvp_deadline: payload.rsvpDeadline,
          updated_at: new Date().toISOString(),
        })
        .eq("id", eventId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      setToastType("success");
      setToast("Settings saved successfully");
    },
    onError: (err: Error) => {
      setToastType("error");
      setToast(`Failed to save: ${err.message}`);
    },
  });

  const publishMutation = useMutation({
    mutationFn: async (publish: boolean) => {
      const updates: Record<string, unknown> = {
        is_published: publish,
        updated_at: new Date().toISOString(),
      };
      if (publish) {
        updates.published_at = new Date().toISOString();
        updates.name = name;
        updates.event_type = eventType;
        updates.event_date = eventDate;
        updates.event_time = eventTime;
        updates.venue = venue;
        updates.address = address;
        updates.slug = slug;
        updates.rsvp_deadline = rsvpDeadline ? fromDatetimeLocal(rsvpDeadline) : null;
      }
      const { error } = await supabase.from("user_events").update(updates).eq("id", eventId!);
      if (error) throw error;
    },
    onSuccess: (_, publish) => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      setIsPublished(publish);
      setToastType("success");
      setToast(publish ? "Event published!" : "Event unpublished");
    },
    onError: (err: Error) => {
      setToastType("error");
      setToast(`Failed: ${err.message}`);
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("user_events")
        .update({ is_archived: !event.is_archived, updated_at: new Date().toISOString() })
        .eq("id", eventId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      setToastType("success");
      setToast(event.is_archived ? "Event restored" : "Event archived");
    },
    onError: (err: Error) => {
      setToastType("error");
      setToast(`Failed: ${err.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("user_events").delete().eq("id", eventId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      navigate("/dashboard");
    },
    onError: (err: Error) => {
      setToastType("error");
      setToast(`Failed to delete: ${err.message}`);
    },
  });

  const handleSave = () => {
    if (!name.trim()) {
      setToastType("error");
      setToast("Event name is required");
      return;
    }
    if (slug && !isValidSlug(slug)) {
      setToastType("error");
      setToast("Invalid slug. Use lowercase letters, numbers, and hyphens only.");
      return;
    }
    saveMutation.mutate({
      name,
      eventType,
      eventDate,
      eventTime,
      venue,
      address,
      slug,
      rsvpDeadline: rsvpDeadline ? fromDatetimeLocal(rsvpDeadline) : null,
    });
  };

  const handleSlugAuto = () => {
    setSlug(slugify(name || "my-event"));
  };

  const handleDelete = () => {
    if (deleteConfirm !== (event.draft_name || event.name || "")) {
      setToastType("error");
      setToast("Type the event name exactly to confirm deletion");
      return;
    }
    deleteMutation.mutate();
  };

  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="font-heading text-2xl text-[var(--color-text)]">Settings</h2>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">Manage your event details and preferences</p>
      </div>

      {/* Event Details */}
      <Card className="p-5 space-y-5 mb-6">
        <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">Event Details</h3>

        <FormField label="Event Name" hint="Required">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Our Wedding" />
        </FormField>

        <FormField label="Event Type">
          <Select value={eventType} onChange={(e) => setEventType(e.target.value)}>
            {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </Select>
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Date">
            <DatePicker value={eventDate} onChange={setEventDate} />
          </FormField>
          <FormField label="Time">
            <TimePicker value={eventTime} onChange={setEventTime} />
          </FormField>
        </div>

        <FormField label="Venue">
          <Input value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="The Grand Ballroom" />
        </FormField>

        <FormField label="Address">
          <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Main Street, City" />
        </FormField>
      </Card>

      {/* Custom Slug */}
      <Card className="p-5 space-y-4 mb-6">
        <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">Custom URL</h3>

        <FormField label="Custom Slug" hint="Lowercase letters, numbers, and hyphens. 2-50 characters.">
          <div className="flex items-center gap-2">
            <div className="flex items-center px-3 py-2.5 bg-[var(--color-bg-subtle)] border border-[var(--color-border)] text-sm text-[var(--color-text-muted)]" style={{ borderRadius: "var(--radius)" }}>
              /e/
            </div>
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="my-event"
              className="flex-1"
            />
            <Button variant="secondary" size="sm" onClick={handleSlugAuto}>Auto</Button>
          </div>
        </FormField>

        {slug && (
          <p className="text-xs text-[var(--color-text-muted)] flex items-center gap-1">
            <Globe className="w-3 h-3" />
            {isValidSlug(slug)
              ? <span className="text-green-600">Valid slug — your event will be at /e/{slug}</span>
              : <span className="text-red-600">Invalid slug format</span>}
          </p>
        )}
      </Card>

      {/* RSVP Deadline */}
      <Card className="p-5 space-y-4 mb-6">
        <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">RSVP Deadline</h3>

        <FormField label="Deadline" hint="When RSVP closes. Leave empty for no deadline.">
          <Input
            type="datetime-local"
            value={rsvpDeadline}
            onChange={(e) => setRsvpDeadline(e.target.value)}
          />
        </FormField>
      </Card>

      {/* Publish */}
      <Card className="p-5 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-[var(--color-text)]">Published</h3>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              {isPublished ? "Your event is live and accessible" : "Your event is in draft mode"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={isPublished ? "success" : "default"}>
              {isPublished ? "Published" : "Draft"}
            </Badge>
            <Toggle
              checked={isPublished}
              onChange={(v) => publishMutation.mutate(v)}
            />
          </div>
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end mb-6">
        <Button onClick={handleSave} loading={saveMutation.isPending} size="md">
          <Save className="w-4 h-4" /> Save Changes
        </Button>
      </div>

      {/* Danger Zone */}
      <Card className="p-5 space-y-4 border-red-200">
        <h3 className="text-xs font-medium uppercase tracking-wider text-red-600 flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5" /> Danger Zone
        </h3>

        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-[var(--color-text)]">{event.is_archived ? "Restore Event" : "Archive Event"}</h4>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              {event.is_archived ? "Unarchive this event" : "Hide this event from your dashboard"}
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => archiveMutation.mutate()}
            loading={archiveMutation.isPending}
          >
            <Archive className="w-3.5 h-3.5" /> {event.is_archived ? "Restore" : "Archive"}
          </Button>
        </div>

        <div className="pt-4 border-t border-[var(--color-border)] flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-red-600">Delete Event</h4>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Permanently delete this event and all its data</p>
          </div>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setShowDeleteModal(true)}
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </Button>
        </div>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal open={showDeleteModal} onClose={() => { setShowDeleteModal(false); setDeleteConfirm(""); }} title="Delete Event">
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200" style={{ borderRadius: "var(--radius)" }}>
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-900">This action cannot be undone.</p>
              <p className="text-xs text-red-700 mt-1">
                All event data, guests, RSVPs, and images will be permanently deleted.
              </p>
            </div>
          </div>

          <FormField label={`Type "${event.draft_name || event.name || ""}" to confirm`}>
            <Input
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder={event.draft_name || event.name || ""}
            />
          </FormField>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" onClick={() => { setShowDeleteModal(false); setDeleteConfirm(""); }}>Cancel</Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDelete}
              loading={deleteMutation.isPending}
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete Forever
            </Button>
          </div>
        </div>
      </Modal>

      {toast && <Toast message={toast} type={toastType} onClose={() => setToast(null)} />}
    </div>
  );
}

export default SettingsPage;
