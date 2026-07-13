import { useState, useEffect, useCallback, useRef } from "react";
import { useOutletContext, useParams, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, EVENT_TYPES } from "../../lib/supabase";
import { debounce, toDatetimeLocal, fromDatetimeLocal } from "../../lib/utils";
import { slugify, isValidSlug } from "../../lib/theme";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, Select } from "../../components/ui/Input";
import { Card, Toggle, FormField, Toast, Skeleton, Modal, Badge } from "../../components/ui";
import { DatePicker } from "../../components/ui/DatePicker";
import { TimePicker } from "../../components/ui/TimePicker";
import { Trash2, Copy, AlertTriangle, Check, ExternalLink } from "lucide-react";

export default function SettingsPage() {
  const { event } = useOutletContext<{ event: UserEvent | null }>();
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [eventType, setEventType] = useState("Wedding");
  const [eventDate, setEventDate] = useState<string | null>(null);
  const [eventTime, setEventTime] = useState<string | null>(null);
  const [venue, setVenue] = useState("");
  const [address, setAddress] = useState("");
  const [slug, setSlug] = useState("");
  const [originalSlug, setOriginalSlug] = useState("");
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [rsvpDeadline, setRsvpDeadline] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [isArchived, setIsArchived] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (event && !initialized.current) {
      setName(event.draft_name || event.name || "");
      setEventType(event.draft_event_type || event.event_type || "Wedding");
      setEventDate(event.draft_event_date || event.event_date || null);
      setEventTime(event.draft_event_time || event.event_time || null);
      setVenue(event.draft_venue || event.venue || "");
      setAddress(event.draft_address || event.address || "");
      setSlug(event.draft_slug || event.slug || "");
      setOriginalSlug(event.draft_slug || event.slug || "");
      setRsvpDeadline(toDatetimeLocal(event.draft_rsvp_deadline || event.rsvp_deadline || null));
      setIsPublished(event.is_published);
      setIsArchived(event.is_archived);
      initialized.current = true;
    }
  }, [event]);

  const checkSlugUniqueness = useCallback(async (s: string) => {
    if (!s || !isValidSlug(s)) { setSlugAvailable(null); return; }
    if (s === originalSlug) { setSlugAvailable(true); return; }
    const { data } = await supabase.from("events").select("id").eq("draft_slug", s).limit(1);
    setSlugAvailable(!data || data.length === 0);
  }, [originalSlug]);

  const debouncedCheckSlug = useRef(debounce((s: string) => checkSlugUniqueness(s), 400)).current;

  const handleSlugChange = (v: string) => {
    const slugified = slugify(v);
    setSlug(slugified);
    if (slugified !== originalSlug) debouncedCheckSlug(slugified);
    else setSlugAvailable(null);
  };

  const saveMutation = useMutation<void, Error>({
    mutationFn: async () => {
      if (!eventId) throw new Error("No event ID");
      const updates: Record<string, unknown> = {
        draft_name: name,
        draft_event_type: eventType,
        draft_event_date: eventDate,
        draft_event_time: eventTime,
        draft_venue: venue,
        draft_address: address,
        draft_slug: slug,
        draft_rsvp_deadline: rsvpDeadline ? fromDatetimeLocal(rsvpDeadline) : null,
      };
      const { error } = await supabase.from("events").update(updates).eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      setToast({ message: "Settings saved", type: "success" });
    },
    onError: () => setToast({ message: "Failed to save", type: "error" }),
  });

  const toggleMutation = useMutation<void, Error, { field: "is_published" | "is_archived"; value: boolean }>({
    mutationFn: async ({ field, value }) => {
      if (!eventId) throw new Error("No event ID");
      const { error } = await supabase.from("events").update({ [field]: value }).eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
    },
    onError: () => setToast({ message: "Failed to update", type: "error" }),
  });

  const deleteMutation = useMutation<void, Error>({
    mutationFn: async () => {
      if (!eventId) throw new Error("No event ID");
      const { error } = await supabase.from("events").delete().eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      navigate("/dashboard");
    },
    onError: () => setToast({ message: "Failed to delete event", type: "error" }),
  });

  const duplicateMutation = useMutation<void, Error>({
    mutationFn: async () => {
      if (!eventId || !event) throw new Error("No event ID");
      const { id, created_at, updated_at, published_at, ...rest } = event;
      const { data, error } = await supabase.from("events").insert({
        ...rest,
        name: `${event.name} (Copy)`,
        draft_name: `${event.draft_name || event.name} (Copy)`,
        is_published: false,
        is_archived: false,
        published_at: null,
        slug: null,
        draft_slug: null,
      }).select("id").single();
      if (error) throw error;
      if (data) navigate(`/event/${data.id}/settings`);
    },
    onSuccess: () => setToast({ message: "Event duplicated", type: "success" }),
    onError: () => setToast({ message: "Failed to duplicate event", type: "error" }),
  });

  const debouncedSave = useRef(debounce(() => saveMutation.mutate(), 600)).current;

  const triggerSave = useCallback(() => {
    if (!initialized.current) return;
    debouncedSave();
  }, [debouncedSave]);

  const updateName = (v: string) => { setName(v); triggerSave(); };
  const updateEventType = (v: string) => { setEventType(v); triggerSave(); };
  const updateDate = (v: string | null) => { setEventDate(v); triggerSave(); };
  const updateTime = (v: string | null) => { setEventTime(v); triggerSave(); };
  const updateVenue = (v: string) => { setVenue(v); triggerSave(); };
  const updateAddress = (v: string) => { setAddress(v); triggerSave(); };
  const updateSlug = (v: string) => { handleSlugChange(v); triggerSave(); };
  const updateDeadline = (v: string) => { setRsvpDeadline(v); triggerSave(); };

  const handleTogglePublished = (v: boolean) => {
    setIsPublished(v);
    toggleMutation.mutate({ field: "is_published", value: v });
  };

  const handleToggleArchived = (v: boolean) => {
    setIsArchived(v);
    toggleMutation.mutate({ field: "is_archived", value: v });
  };

  if (!event) return <div className="p-6"><Skeleton className="h-8 w-48 mb-4" /><Skeleton className="h-96 w-full" /></div>;

  const eventUrl = slug ? `${window.location.origin}/e/${slug}` : "";
  const slugValid = !slug || isValidSlug(slug);

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-xl font-semibold text-slate-900 mb-6">Event Settings</h1>

      <Card className="p-6 mb-6">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">Event Details</h2>
        <div className="space-y-4">
          <FormField label="Event Name">
            <Input value={name} onChange={(e) => updateName(e.target.value)} placeholder="Our Wedding" />
          </FormField>
          <FormField label="Event Type">
            <Select value={eventType} onChange={(e) => updateEventType(e.target.value)}>
              {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Event Date">
              <DatePicker value={eventDate} onChange={updateDate} />
            </FormField>
            <FormField label="Event Time">
              <TimePicker value={eventTime} onChange={updateTime} />
            </FormField>
          </div>
          <FormField label="Venue">
            <Input value={venue} onChange={(e) => updateVenue(e.target.value)} placeholder="Grand Ballroom" />
          </FormField>
          <FormField label="Address">
            <Textarea value={address} onChange={(e) => updateAddress(e.target.value)} placeholder="123 Main St, City" />
          </FormField>
        </div>
      </Card>

      <Card className="p-6 mb-6">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">Custom URL</h2>
        <div className="space-y-3">
          <FormField label="URL Slug" hint="Lowercase letters, numbers, and hyphens. 2-50 characters.">
            <Input value={slug} onChange={(e) => updateSlug(e.target.value)} placeholder="our-wedding-2024" />
          </FormField>
          {slug && !slugValid && (
            <div className="flex items-center gap-2 text-sm text-red-600">
              <AlertTriangle className="w-4 h-4" /> Invalid slug format
            </div>
          )}
          {slug && slugValid && slug !== originalSlug && (
            <div className="flex items-center gap-2 text-sm">
              {slugAvailable === true ? (
                <><Check className="w-4 h-4 text-green-600" /><span className="text-green-600">Slug is available</span></>
              ) : slugAvailable === false ? (
                <><AlertTriangle className="w-4 h-4 text-red-600" /><span className="text-red-600">Slug is already taken</span></>
              ) : (
                <span className="text-slate-400">Checking availability...</span>
              )}
            </div>
          )}
          {slug && slugValid && eventUrl && (
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <ExternalLink className="w-4 h-4 text-slate-400" />
                <span className="font-mono">{eventUrl}</span>
              </div>
            </div>
          )}
          {slug !== originalSlug && slug && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-amber-700">Changing the URL slug will break existing links and bookmarks that use the old URL.</p>
            </div>
          )}
        </div>
      </Card>

      <Card className="p-6 mb-6">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">RSVP Deadline</h2>
        <FormField label="Deadline" hint="Guests cannot RSVP after this date and time.">
          <Input type="datetime-local" value={rsvpDeadline} onChange={(e) => updateDeadline(e.target.value)} />
        </FormField>
      </Card>

      <Card className="p-6 mb-6">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">Publishing</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-slate-900">Published</div>
              <div className="text-xs text-slate-500">Make event visible to guests</div>
            </div>
            <Toggle checked={isPublished} onChange={handleTogglePublished} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-slate-900">Archived</div>
              <div className="text-xs text-slate-500">Archive this event</div>
            </div>
            <Toggle checked={isArchived} onChange={handleToggleArchived} />
          </div>
          {isPublished && <Badge variant="success">Published</Badge>}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">Danger Zone</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-slate-900">Duplicate Event</div>
              <div className="text-xs text-slate-500">Create a copy of this event</div>
            </div>
            <Button variant="secondary" size="sm" onClick={() => setDuplicateOpen(true)}>
              <Copy className="w-4 h-4" /> Duplicate
            </Button>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <div>
              <div className="text-sm font-medium text-red-700">Delete Event</div>
              <div className="text-xs text-slate-500">Permanently delete this event and all its data</div>
            </div>
            <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="w-4 h-4" /> Delete
            </Button>
          </div>
        </div>
      </Card>

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete Event">
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-700">This will permanently delete the event "{name}" and all associated data including guests, RSVPs, and messages. This action cannot be undone.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setDeleteOpen(false)} className="flex-1">Cancel</Button>
            <Button variant="danger" onClick={() => deleteMutation.mutate()} loading={deleteMutation.isPending} className="flex-1">Delete Permanently</Button>
          </div>
        </div>
      </Modal>

      <Modal open={duplicateOpen} onClose={() => setDuplicateOpen(false)} title="Duplicate Event">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">This will create a copy of "{name}" with all its content. The duplicate will be unpublished and have no URL slug.</p>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setDuplicateOpen(false)} className="flex-1">Cancel</Button>
            <Button onClick={() => duplicateMutation.mutate()} loading={duplicateMutation.isPending} className="flex-1">Create Copy</Button>
          </div>
        </div>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
