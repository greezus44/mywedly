import { useState, useEffect } from "react";
import { useOutletContext, useParams, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, EVENT_TYPES } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Card, Badge, Modal, Toast, Toggle, FormField } from "../../components/ui";
import { Input, Select } from "../../components/ui/Input";
import { slugify, isValidSlug } from "../../lib/theme";
import { toDatetimeLocal, fromDatetimeLocal, getEventStatus } from "../../lib/utils";
import { Archive, Trash2, Eye, AlertTriangle } from "lucide-react";

interface OutletContext { event: UserEvent; }

export default function SettingsPage() {
  const { event } = useOutletContext<OutletContext>();
  const { eventId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [showArchive, setShowArchive] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const [form, setForm] = useState({
    name: event.draft_name || event.name || "",
    event_type: event.draft_event_type || event.event_type || "Wedding",
    event_date: event.draft_event_date || event.event_date || "",
    event_time: event.draft_event_time || event.event_time || "",
    venue: event.draft_venue || event.venue || "",
    address: event.draft_address || event.address || "",
    slug: event.draft_slug || event.slug || "",
    rsvp_deadline: toDatetimeLocal(event.draft_rsvp_deadline || event.rsvp_deadline),
    is_published: event.is_published,
  });

  useEffect(() => {
    setForm({
      name: event.draft_name || event.name || "",
      event_type: event.draft_event_type || event.event_type || "Wedding",
      event_date: event.draft_event_date || event.event_date || "",
      event_time: event.draft_event_time || event.event_time || "",
      venue: event.draft_venue || event.venue || "",
      address: event.draft_address || event.address || "",
      slug: event.draft_slug || event.slug || "",
      rsvp_deadline: toDatetimeLocal(event.draft_rsvp_deadline || event.rsvp_deadline),
      is_published: event.is_published,
    });
  }, [event]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("user_events")
        .update({
          draft_name: form.name,
          draft_event_type: form.event_type,
          draft_event_date: form.event_date || null,
          draft_event_time: form.event_time || null,
          draft_venue: form.venue,
          draft_address: form.address,
          draft_slug: form.slug,
          draft_rsvp_deadline: form.rsvp_deadline ? fromDatetimeLocal(form.rsvp_deadline) : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", event.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", event.id] });
      setToast({ msg: "Settings saved", type: "success" });
    },
    onError: (err: Error) => {
      setToast({ msg: `Save failed: ${err.message}`, type: "error" });
    },
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      const newPublished = !form.is_published;
      const updates: Record<string, unknown> = {
        is_published: newPublished,
        updated_at: new Date().toISOString(),
      };
      if (newPublished) {
        updates.published_at = new Date().toISOString();
        updates.name = form.name;
        updates.event_type = form.event_type;
        updates.event_date = form.event_date || null;
        updates.event_time = form.event_time || null;
        updates.venue = form.venue;
        updates.address = form.address;
        updates.slug = form.slug;
        updates.rsvp_deadline = form.rsvp_deadline ? fromDatetimeLocal(form.rsvp_deadline) : null;
      }
      const { error } = await supabase.from("user_events").update(updates).eq("id", event.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", event.id] });
      setForm((prev) => ({ ...prev, is_published: !prev.is_published }));
      setToast({ msg: form.is_published ? "Event unpublished" : "Event published", type: "success" });
    },
    onError: (err: Error) => {
      setToast({ msg: `Failed: ${err.message}`, type: "error" });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("user_events")
        .update({ is_archived: !event.is_archived, updated_at: new Date().toISOString() })
        .eq("id", event.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", event.id] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      setShowArchive(false);
      setToast({ msg: event.is_archived ? "Event unarchived" : "Event archived", type: "success" });
      if (!event.is_archived) navigate("/dashboard");
    },
    onError: (err: Error) => {
      setToast({ msg: `Failed: ${err.message}`, type: "error" });
      setShowArchive(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("user_events").delete().eq("id", event.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      navigate("/dashboard");
    },
    onError: (err: Error) => {
      setToast({ msg: `Failed to delete: ${err.message}`, type: "error" });
      setShowDelete(false);
    },
  });

  const slugValid = isValidSlug(form.slug);
  const slugError = form.slug && !slugValid ? "Slug must be 2-50 chars, lowercase letters/numbers/hyphens only" : "";

  const eventStatus = getEventStatus(form.event_date || null);

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-3xl">
      <div>
        <h2 className="font-heading text-2xl text-gray-900">Settings</h2>
        <p className="text-sm text-gray-500 mt-1">Manage event details, slug, and publication status.</p>
      </div>

      {/* Event Details */}
      <Card className="p-5 space-y-4">
        <h3 className="text-xs font-medium uppercase tracking-wider text-gray-500">Event Details</h3>
        <FormField label="Event Name">
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="John & Jane's Wedding" />
        </FormField>
        <FormField label="Event Type">
          <Select value={form.event_type} onChange={(e) => setForm({ ...form, event_type: e.target.value })}>
            {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </Select>
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Event Date">
            <Input type="date" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} />
          </FormField>
          <FormField label="Event Time">
            <Input type="time" value={form.event_time} onChange={(e) => setForm({ ...form, event_time: e.target.value })} />
          </FormField>
        </div>
        <FormField label="Venue">
          <Input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} placeholder="The Grand Ballroom" />
        </FormField>
        <FormField label="Address">
          <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="123 Main St, City, State" />
        </FormField>
      </Card>

      {/* Custom Slug */}
      <Card className="p-5 space-y-4">
        <h3 className="text-xs font-medium uppercase tracking-wider text-gray-500">Custom URL Slug</h3>
        <p className="text-sm text-gray-500">The slug is used in the public URL: <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">/e/your-slug</code></p>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-sm text-gray-400">
            <span>/e/</span>
          </div>
          <Input
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })}
            placeholder="john-jane-wedding"
            className={slugError ? "border-red-500" : ""}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setForm({ ...form, slug: slugify(form.name) })}
            disabled={!form.name}
          >
            Auto-generate
          </Button>
        </div>
        {slugError && <p className="text-xs text-red-600">{slugError}</p>}
        {form.slug && slugValid && event.is_published && (
          <p className="text-sm text-green-600 flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5" /> Live at <code className="text-xs bg-green-50 px-1.5 py-0.5 rounded">/e/{form.slug}</code>
          </p>
        )}
      </Card>

      {/* RSVP Deadline */}
      <Card className="p-5 space-y-4">
        <h3 className="text-xs font-medium uppercase tracking-wider text-gray-500">RSVP Deadline</h3>
        <FormField label="Deadline" hint="Guests cannot RSVP after this date/time. Leave blank for no deadline.">
          <input
            type="datetime-local"
            value={form.rsvp_deadline}
            onChange={(e) => setForm({ ...form, rsvp_deadline: e.target.value })}
            className="w-full px-4 py-2.5 text-sm bg-white border border-gray-200 text-gray-900 focus:outline-none focus:border-gray-900 transition-colors rounded-md"
          />
        </FormField>
      </Card>

      {/* Save Button */}
      <div className="flex items-center gap-3">
        <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending} disabled={!form.name || !slugValid}>
          Save Changes
        </Button>
        <span className="text-xs text-gray-500">Changes are saved to draft. Publish to make live.</span>
      </div>

      {/* Publication Status */}
      <Card className="p-5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-sm font-medium text-gray-900">Publication Status</h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={form.is_published ? "success" : "default"}>
                {form.is_published ? "Published" : "Draft"}
              </Badge>
              <Badge variant={eventStatus === "upcoming" ? "info" : eventStatus === "ongoing" ? "success" : "default"}>
                {eventStatus}
              </Badge>
              {event.is_archived && <Badge variant="default">Archived</Badge>}
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {form.is_published
                ? "Your event is live and accessible via the public URL."
                : "Your event is in draft mode. Publish to make it accessible to guests."}
            </p>
          </div>
          <Button
            variant={form.is_published ? "secondary" : "primary"}
            onClick={() => publishMutation.mutate()}
            loading={publishMutation.isPending}
          >
            {form.is_published ? "Unpublish" : "Publish"}
          </Button>
        </div>
      </Card>

      {/* Danger Zone */}
      <Card className="p-5 border-red-200">
        <h3 className="text-xs font-medium uppercase tracking-wider text-red-600 mb-4">Danger Zone</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-900">{event.is_archived ? "Unarchive Event" : "Archive Event"}</p>
              <p className="text-xs text-gray-500">{event.is_archived ? "Restore this event to active status." : "Hide this event from your dashboard without deleting it."}</p>
            </div>
            <Button variant="secondary" size="sm" onClick={() => setShowArchive(true)}>
              <Archive className="w-4 h-4" /> {event.is_archived ? "Unarchive" : "Archive"}
            </Button>
          </div>
          <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-red-900">Delete Event</p>
              <p className="text-xs text-red-600">Permanently delete this event and all associated data. This cannot be undone.</p>
            </div>
            <Button variant="danger" size="sm" onClick={() => setShowDelete(true)}>
              <Trash2 className="w-4 h-4" /> Delete
            </Button>
          </div>
        </div>
      </Card>

      {/* Archive Confirmation */}
      <Modal open={showArchive} onClose={() => setShowArchive(false)} title={event.is_archived ? "Unarchive Event" : "Archive Event"}>
        <p className="text-sm text-gray-600 mb-6">
          {event.is_archived
            ? "This will restore the event to your active dashboard."
            : "Archiving will hide this event from your dashboard. You can unarchive it later."}
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => archiveMutation.mutate()} loading={archiveMutation.isPending}>
            {event.is_archived ? "Unarchive" : "Archive"}
          </Button>
          <Button variant="ghost" onClick={() => setShowArchive(false)}>Cancel</Button>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <Modal open={showDelete} onClose={() => setShowDelete(false)} title="Delete Event">
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-900">This action is permanent</p>
              <p className="text-sm text-red-700 mt-1">All guest data, RSVPs, groups, and event content will be permanently deleted. This cannot be undone.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="danger" onClick={() => deleteMutation.mutate()} loading={deleteMutation.isPending}>
              <Trash2 className="w-4 h-4" /> Delete Permanently
            </Button>
            <Button variant="ghost" onClick={() => setShowDelete(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
