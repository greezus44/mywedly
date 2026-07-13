import { useState, useEffect, useMemo } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, UserEvent, EventType, EVENT_TYPES } from "../../lib/supabase";
import { slugify, isValidSlug } from "../../lib/theme";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card, Badge, Modal, FormField, Toggle, Toast, Skeleton } from "../../components/ui/index";
import { DatePicker } from "../../components/ui/DatePicker";
import { TimePicker } from "../../components/ui/TimePicker";
import { cn, toDatetimeLocal, fromDatetimeLocal, formatDate } from "../../lib/utils";
import { Loader2, Copy, Trash2, AlertTriangle, Check, ExternalLink, Wand2 } from "lucide-react";

export default function SettingsPage() {
  const { event } = useOutletContext<{ event: UserEvent | null }>();
  const { eventId } = useParams<{ eventId: string }>();
  const queryClient = useQueryClient();

  const [toast, setToast] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const [slugWarningOpen, setSlugWarningOpen] = useState(false);
  const [pendingSlug, setPendingSlug] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    event_type: "other" as EventType,
    event_date: null as string | null,
    event_time: null as string | null,
    venue: "",
    address: "",
    slug: "",
    rsvp_deadline: "",
    is_published: false,
    is_archived: false,
  });

  useEffect(() => {
    if (event) {
      setForm({
        name: event.name || "",
        event_type: event.event_type || "other",
        event_date: event.draft_event_date || event.event_date || null,
        event_time: event.draft_event_time || event.event_time || null,
        venue: event.draft_venue || event.venue || "",
        address: event.draft_address || event.address || "",
        slug: event.draft_slug || event.slug || "",
        rsvp_deadline: toDatetimeLocal(event.draft_rsvp_deadline || event.rsvp_deadline || null),
        is_published: event.is_published || false,
        is_archived: event.is_archived || false,
      });
    }
  }, [event]);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast(msg);
    setToastType(type);
    setTimeout(() => setToast(null), 3000);
  };

  const { data: slugCheck } = useQuery<{ exists: boolean }>({
    queryKey: ["slug-check", form.slug, eventId],
    queryFn: async () => {
      if (!form.slug || !isValidSlug(form.slug)) return { exists: false };
      const { data, error } = await supabase
        .from("user_events")
        .select("id")
        .or(`slug.eq.${form.slug},draft_slug.eq.${form.slug}`)
        .neq("id", eventId || "")
        .limit(1);
      if (error) return { exists: false };
      return { exists: (data || []).length > 0 };
    },
    enabled: !!form.slug && isValidSlug(form.slug) && !!eventId,
  });

  const slugIsUnique = !slugCheck?.exists;
  const hasExistingSlug = !!(event?.slug && event.slug !== form.slug);

  const saveMutation = useMutation<void, Error>({
    mutationFn: async () => {
      if (!eventId) return;
      const updates: Record<string, unknown> = {
        name: form.name,
        event_type: form.event_type,
        draft_event_date: form.event_date,
        draft_event_time: form.event_time,
        draft_venue: form.venue,
        draft_address: form.address,
        draft_slug: form.slug || null,
        draft_rsvp_deadline: fromDatetimeLocal(form.rsvp_deadline),
        is_published: form.is_published,
        is_archived: form.is_archived,
      };
      const { error } = await supabase.from("user_events").update(updates).eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      showToast("Settings saved");
    },
    onError: () => showToast("Failed to save settings", "error"),
  });

  const deleteMutation = useMutation<void, Error>({
    mutationFn: async () => {
      if (!eventId) return;
      const { error } = await supabase.from("user_events").delete().eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      showToast("Event deleted");
      setDeleteOpen(false);
      window.location.href = "/";
    },
    onError: () => showToast("Failed to delete event", "error"),
  });

  const duplicateMutation = useMutation<void, Error>({
    mutationFn: async () => {
      if (!eventId || !event) return;
      const { data: { user } } = await supabase.auth.getUser();
      const newSlug = `${form.slug || slugify(form.name)}-copy`;
      const { error } = await supabase.from("user_events").insert({
        creator_id: user?.id || event.creator_id,
        name: `${form.name} (Copy)`,
        event_type: event.event_type,
        template_id: event.template_id,
        draft_slug: newSlug,
        draft_event_date: event.draft_event_date,
        draft_event_time: event.draft_event_time,
        draft_venue: event.draft_venue,
        draft_address: event.draft_address,
        draft_cover_config: event.draft_cover_config,
        draft_login_config: event.draft_login_config,
        draft_theme: event.draft_theme,
        draft_logo_config: event.draft_logo_config,
        draft_content: event.draft_content,
        draft_sharing_config: event.draft_sharing_config,
        draft_cover_image: event.draft_cover_image,
        is_published: false,
        is_archived: false,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      setDuplicateOpen(false);
      showToast("Event duplicated");
    },
    onError: () => showToast("Failed to duplicate event", "error"),
  });

  const autoGenerateSlug = () => {
    const generated = slugify(form.name);
    setForm({ ...form, slug: generated });
  };

  const handleSlugChange = (value: string) => {
    setForm({ ...form, slug: value });
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      showToast("Event name is required", "error");
      return;
    }
    if (form.slug && !isValidSlug(form.slug)) {
      showToast("Invalid slug format", "error");
      return;
    }
    if (form.slug && !slugIsUnique) {
      showToast("This slug is already taken", "error");
      return;
    }
    if (hasExistingSlug && form.slug !== event?.slug) {
      setPendingSlug(form.slug);
      setSlugWarningOpen(true);
      return;
    }
    saveMutation.mutate();
  };

  const confirmSlugChange = () => {
    setSlugWarningOpen(false);
    setPendingSlug(null);
    saveMutation.mutate();
  };

  const eventUrl = form.slug ? `${window.location.origin}/e/${form.slug}` : "";

  if (!event) {
    return (
      <div className="flex items-center justify-center py-16">
        <Skeleton className="w-full h-32" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your event configuration</p>
        </div>
        <div className="flex items-center gap-3">
          {saving && (
            <span className="flex items-center gap-1.5 text-xs text-gray-400">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
            </span>
          )}
          <Button size="sm" onClick={handleSave} loading={saveMutation.isPending}>
            Save Changes
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Event Details</h2>
        <div className="space-y-4">
          <FormField label="Event Name">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="My Wedding" />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Event Type">
              <select
                value={form.event_type}
                onChange={(e) => setForm({ ...form, event_type: e.target.value as EventType })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-900 bg-white focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
              >
                {EVENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </FormField>
            <FormField label="Event Date">
              <DatePicker value={form.event_date} onChange={(v) => setForm({ ...form, event_date: v })} />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Event Time">
              <TimePicker value={form.event_time} onChange={(v) => setForm({ ...form, event_time: v })} />
            </FormField>
            <FormField label="Venue">
              <Input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} placeholder="Grand Hotel" />
            </FormField>
          </div>
          <FormField label="Address">
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="123 Main St, City, State" />
          </FormField>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Custom Event URL</h2>
        <div className="space-y-4">
          <FormField label="URL Slug" hint="Lowercase letters, numbers, and hyphens only">
            <div className="flex gap-2">
              <Input
                value={form.slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="my-wedding"
                className="flex-1"
              />
              <Button variant="secondary" onClick={autoGenerateSlug} title="Auto-generate from name">
                <Wand2 className="w-4 h-4" /> Auto
              </Button>
            </div>
          </FormField>

          {form.slug && !isValidSlug(form.slug) && (
            <div className="flex items-center gap-2 text-sm text-red-600">
              <AlertTriangle className="w-4 h-4" /> Invalid slug format
            </div>
          )}

          {form.slug && isValidSlug(form.slug) && !slugIsUnique && (
            <div className="flex items-center gap-2 text-sm text-red-600">
              <AlertTriangle className="w-4 h-4" /> This slug is already taken by another event
            </div>
          )}

          {form.slug && isValidSlug(form.slug) && slugIsUnique && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <Check className="w-4 h-4" /> Slug is available
            </div>
          )}

          {eventUrl && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1.5">Live URL Preview</p>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200">
                <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-700 font-mono truncate">{eventUrl}</span>
              </div>
            </div>
          )}

          {hasExistingSlug && form.slug !== event?.slug && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
              <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-yellow-700">
                Changing the slug will create a redirect from the old URL. Guests with the old link will be automatically redirected.
              </p>
            </div>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">RSVP Deadline</h2>
        <FormField label="RSVP Closing Date & Time" hint="After this date, guests can no longer submit RSVPs">
          <Input
            type="datetime-local"
            value={form.rsvp_deadline}
            onChange={(e) => setForm({ ...form, rsvp_deadline: e.target.value })}
            className="w-full"
          />
        </FormField>
        {form.rsvp_deadline && (
          <p className="mt-2 text-xs text-gray-500">
            Deadline: {formatDate(fromDatetimeLocal(form.rsvp_deadline))}
          </p>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Event Status</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Published</p>
              <p className="text-xs text-gray-500 mt-0.5">Make the event accessible via its URL</p>
            </div>
            <Toggle checked={form.is_published} onChange={(v) => setForm({ ...form, is_published: v })} />
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div>
              <p className="text-sm font-medium text-gray-900">Archived</p>
              <p className="text-xs text-gray-500 mt-0.5">Archive this event to hide it from your dashboard</p>
            </div>
            <Toggle checked={form.is_archived} onChange={(v) => setForm({ ...form, is_archived: v })} />
          </div>
          {form.is_published && (
            <div className="flex items-center gap-2 pt-2">
              <Badge variant="success">Published</Badge>
              {event?.published_at && <span className="text-xs text-gray-500">on {formatDate(event.published_at)}</span>}
            </div>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => setDuplicateOpen(true)}>
            <Copy className="w-4 h-4" /> Duplicate Event
          </Button>
          <Button variant="danger" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="w-4 h-4" /> Delete Event
          </Button>
        </div>
      </Card>

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete Event" maxWidth="max-w-sm">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Are you sure?</p>
              <p className="text-sm text-gray-600 mt-1">
                This will permanently delete "{event.name}" and all associated data including guests, RSVPs, and messages. This action cannot be undone.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={() => deleteMutation.mutate()} loading={deleteMutation.isPending}>Delete Permanently</Button>
          </div>
        </div>
      </Modal>

      <Modal open={duplicateOpen} onClose={() => setDuplicateOpen(false)} title="Duplicate Event" maxWidth="max-w-sm">
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            This will create a copy of "{event.name}" with all its settings. The duplicate will be unpublished with a "-copy" suffix added to the slug.
          </p>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setDuplicateOpen(false)}>Cancel</Button>
            <Button onClick={() => duplicateMutation.mutate()} loading={duplicateMutation.isPending}>Duplicate</Button>
          </div>
        </div>
      </Modal>

      <Modal open={slugWarningOpen} onClose={() => { setSlugWarningOpen(false); setPendingSlug(null); }} title="Change Event URL?" maxWidth="max-w-sm">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-50 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">URL will change</p>
              <p className="text-sm text-gray-600 mt-1">
                Changing the slug from "{event?.slug}" to "{pendingSlug}" will update the event URL. A redirect will be created so old links still work.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => { setSlugWarningOpen(false); setPendingSlug(null); }}>Cancel</Button>
            <Button onClick={confirmSlugChange}>Confirm Change</Button>
          </div>
        </div>
      </Modal>

      {toast && <Toast message={toast} type={toastType} onClose={() => setToast(null)} />}
    </div>
  );
}
