import { useState, useEffect, useRef, useCallback } from "react";
import { useOutletContext, useParams, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, EVENT_TYPES } from "../../lib/supabase";
import { slugify, isValidSlug } from "../../lib/theme";
import { debounce, toDatetimeLocal, fromDatetimeLocal, formatDate, formatTime } from "../../lib/utils";
import { Card, Toggle, FormField, Toast, Skeleton, Badge, Modal } from "../../components/ui";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, Select } from "../../components/ui/Input";
import { DatePicker } from "../../components/ui/DatePicker";
import { TimePicker } from "../../components/ui/TimePicker";
import { Trash2, Copy, AlertTriangle, ExternalLink, Check } from "lucide-react";

export default function SettingsPage() {
  const { event } = useOutletContext<{ event: UserEvent | null }>();
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [eventType, setEventType] = useState("Other");
  const [eventDate, setEventDate] = useState<string | null>(null);
  const [eventTime, setEventTime] = useState<string | null>(null);
  const [venue, setVenue] = useState("");
  const [address, setAddress] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [rsvpDeadline, setRsvpDeadline] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [isArchived, setIsArchived] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const [dupName, setDupName] = useState("");
  const initialized = useRef(false);

  useEffect(() => {
    if (!event) return;
    setName(event.draft_name || event.name || "");
    setEventType(event.draft_event_type || event.event_type || "Other");
    setEventDate(event.draft_event_date || event.event_date || null);
    setEventTime(event.draft_event_time || event.event_time || null);
    setVenue(event.draft_venue || event.venue || "");
    setAddress(event.draft_address || event.address || "");
    setSlug(event.draft_slug || event.slug || "");
    setRsvpDeadline(toDatetimeLocal(event.draft_rsvp_deadline || event.rsvp_deadline || null));
    setIsPublished(event.is_published);
    setIsArchived(event.is_archived);
    setDupName(`${event.draft_name || event.name} (Copy)`);
    initialized.current = true;
  }, [event]);

  useEffect(() => {
    if (!slugEdited || !slug) return;
    const checkSlug = debounce(async (s: string) => {
      if (!isValidSlug(s)) { setSlugAvailable(false); return; }
      const { data } = await supabase.from("events").select("id").eq("slug", s).neq("id", eventId || "").maybeSingle();
      setSlugAvailable(!data);
    }, 500);
    checkSlug(slug);
  }, [slug, slugEdited, eventId]);

  const save = useCallback(async (data: Record<string, unknown>) => {
    if (!eventId) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("events").update(data).eq("id", eventId);
      if (error) throw error;
      setToast({ message: "Saved", type: "success" });
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : "Save failed", type: "error" });
    } finally {
      setSaving(false);
    }
  }, [eventId]);

  const debouncedSave = useRef(debounce(save, 800)).current;

  const updateField = (field: string, value: unknown) => {
    debouncedSave({ [field]: value });
  };

  const onNameChange = (v: string) => {
    setName(v);
    updateField("draft_name", v);
    if (!slugEdited) {
      const newSlug = slugify(v);
      setSlug(newSlug);
      updateField("draft_slug", newSlug);
    }
  };

  const onSlugChange = (v: string) => {
    setSlugEdited(true);
    const cleaned = slugify(v);
    setSlug(cleaned);
    updateField("draft_slug", cleaned);
  };

  const onEventTypeChange = (v: string) => {
    setEventType(v);
    updateField("draft_event_type", v);
  };

  const onDateChange = (v: string | null) => {
    setEventDate(v);
    updateField("draft_event_date", v);
  };

  const onTimeChange = (v: string | null) => {
    setEventTime(v);
    updateField("draft_event_time", v);
  };

  const onVenueChange = (v: string) => {
    setVenue(v);
    updateField("draft_venue", v);
  };

  const onAddressChange = (v: string) => {
    setAddress(v);
    updateField("draft_address", v);
  };

  const onRsvpDeadlineChange = (v: string) => {
    setRsvpDeadline(v);
    updateField("draft_rsvp_deadline", v ? fromDatetimeLocal(v) : null);
  };

  const onPublishToggle = (v: boolean) => {
    setIsPublished(v);
    updateField("is_published", v);
    if (v) queryClient.invalidateQueries({ queryKey: ["event", eventId] });
  };

  const onArchiveToggle = (v: boolean) => {
    setIsArchived(v);
    updateField("is_archived", v);
  };

  const deleteMutation = useMutation<void, Error, string>({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      navigate("/dashboard");
    },
    onError: (err) => setToast({ message: err.message, type: "error" }),
  });

  const duplicateMutation = useMutation<void, Error, { name: string }>({
    mutationFn: async ({ name: dupNameVal }) => {
      if (!event) throw new Error("No event");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("events").insert({
        creator_id: user.id,
        name: dupNameVal,
        draft_name: dupNameVal,
        event_type: event.event_type,
        draft_event_type: event.draft_event_type,
        template_id: event.template_id,
        draft_cover_config: event.draft_cover_config || event.cover_config,
        draft_login_config: event.draft_login_config || event.login_config,
        draft_theme: event.draft_theme || event.theme,
        draft_logo_config: event.draft_logo_config || event.logo_config,
        draft_content: event.draft_content || event.content,
        draft_sharing_config: event.draft_sharing_config || event.sharing_config,
        is_published: false,
        is_archived: false,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      setDuplicateOpen(false);
      setToast({ message: "Event duplicated", type: "success" });
    },
    onError: (err) => setToast({ message: err.message, type: "error" }),
  });

  if (!event) {
    return (
      <div className="p-6 max-w-2xl">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const eventUrl = `${window.location.origin}/e/${slug || event.id}`;

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Settings</h1>
          <p className="text-sm text-slate-500">Manage your event configuration</p>
        </div>
        {saving && <span className="text-sm text-slate-500">Saving...</span>}
      </div>

      <Card className="p-6 mb-4">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">Event Details</h2>
        <div className="space-y-4">
          <FormField label="Event Name">
            <Input value={name} onChange={(e) => onNameChange(e.target.value)} placeholder="Event name" />
          </FormField>
          <FormField label="Event Type">
            <Select value={eventType} onChange={(e) => onEventTypeChange(e.target.value)}>
              {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <DatePicker label="Event Date" value={eventDate} onChange={onDateChange} />
            <TimePicker label="Event Time" value={eventTime} onChange={onTimeChange} />
          </div>
          <FormField label="Venue">
            <Input value={venue} onChange={(e) => onVenueChange(e.target.value)} placeholder="Venue name" />
          </FormField>
          <FormField label="Address">
            <Textarea value={address} onChange={(e) => onAddressChange(e.target.value)} placeholder="Full address" />
          </FormField>
        </div>
      </Card>

      <Card className="p-6 mb-4">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">Custom URL</h2>
        <div className="space-y-3">
          <FormField label="Slug" hint={`${window.location.origin}/e/`}>
            <Input value={slug} onChange={(e) => onSlugChange(e.target.value)} placeholder="my-event" className="font-mono" />
          </FormField>
          <div className="flex items-center gap-2">
            {slug && !isValidSlug(slug) && (
              <Badge variant="error">Invalid slug: 2-50 chars, lowercase letters, numbers, and hyphens only</Badge>
            )}
            {slug && isValidSlug(slug) && slugAvailable === false && (
              <Badge variant="error">This slug is already taken</Badge>
            )}
            {slug && isValidSlug(slug) && slugAvailable === true && (
              <Badge variant="success"><Check className="w-3 h-3 mr-1 inline" /> Available</Badge>
            )}
          </div>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-sm text-slate-600 font-mono truncate">{eventUrl}</span>
            <a href={eventUrl} target="_blank" rel="noopener noreferrer" className="p-1 hover:bg-slate-200 rounded text-slate-500 flex-shrink-0"><ExternalLink className="w-4 h-4" /></a>
          </div>
          {!isValidSlug(slug) && slug && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">The slug must be 2-50 characters, using only lowercase letters, numbers, and hyphens. It cannot start or end with a hyphen.</p>
            </div>
          )}
        </div>
      </Card>

      <Card className="p-6 mb-4">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">RSVP Deadline</h2>
        <FormField label="Deadline" hint="When this deadline passes, guests can no longer submit RSVPs">
          <Input type="datetime-local" value={rsvpDeadline} onChange={(e) => onRsvpDeadlineChange(e.target.value)} />
        </FormField>
      </Card>

      <Card className="p-6 mb-4">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">Visibility</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900">Published</p>
              <p className="text-xs text-slate-500">Make this event visible to guests</p>
            </div>
            <Toggle checked={isPublished} onChange={onPublishToggle} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900">Archived</p>
              <p className="text-xs text-slate-500">Archive this event to hide it from your dashboard</p>
            </div>
            <Toggle checked={isArchived} onChange={onArchiveToggle} />
          </div>
        </div>
      </Card>

      <Card className="p-6 mb-4">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">Actions</h2>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setDuplicateOpen(true)}><Copy className="w-4 h-4" /> Duplicate Event</Button>
          <Button variant="danger" onClick={() => setDeleteOpen(true)}><Trash2 className="w-4 h-4" /> Delete Event</Button>
        </div>
      </Card>

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete Event">
        <div className="space-y-4">
          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-900">This action cannot be undone.</p>
              <p className="text-xs text-red-700 mt-1">All event data including guests, RSVPs, and messages will be permanently deleted.</p>
            </div>
          </div>
          <p className="text-sm text-slate-600">Are you sure you want to delete "{event.draft_name || event.name}"?</p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={() => eventId && deleteMutation.mutate(eventId)} loading={deleteMutation.isPending}>Delete Permanently</Button>
          </div>
        </div>
      </Modal>

      <Modal open={duplicateOpen} onClose={() => setDuplicateOpen(false)} title="Duplicate Event">
        <div className="space-y-4">
          <FormField label="New Event Name">
            <Input value={dupName} onChange={(e) => setDupName(e.target.value)} placeholder="Duplicated event name" />
          </FormField>
          <p className="text-sm text-slate-500">This will create a new unpublished event with the same theme, content, and configuration.</p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDuplicateOpen(false)}>Cancel</Button>
            <Button onClick={() => duplicateMutation.mutate({ name: dupName })} loading={duplicateMutation.isPending}>Duplicate</Button>
          </div>
        </div>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
