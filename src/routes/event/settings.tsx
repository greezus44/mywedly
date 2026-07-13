import { useState, useEffect, useCallback } from "react";
import { useOutletContext, useParams, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, EVENT_TYPES } from "../../lib/supabase";
import { Card, Badge, Toggle, Toast, Modal, FormField } from "../../components/ui";
import { Input, Select } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { DatePicker } from "../../components/ui/DatePicker";
import { TimePicker } from "../../components/ui/TimePicker";
import {
  Trash2, Copy, Loader2, AlertTriangle, Check, Globe, Calendar,
} from "lucide-react";
import { slugify, isValidSlug } from "../../lib/theme";
import { toDatetimeLocal, fromDatetimeLocal, getRsvpStatus, formatDeadline } from "../../lib/utils";

export default function Settings() {
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
  const [slugTouched, setSlugTouched] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [rsvpDeadline, setRsvpDeadline] = useState<string>("");
  const [isPublished, setIsPublished] = useState(false);
  const [isArchived, setIsArchived] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const [dupName, setDupName] = useState("");
  const initialized = false;

  useEffect(() => {
    if (event && !(initialized as any)) {
      setName(event.draft_name || event.name || "");
      setEventType(event.draft_event_type || event.event_type || "Other");
      setEventDate(event.draft_event_date || event.event_date || null);
      setEventTime(event.draft_event_time || event.event_time || null);
      setVenue(event.draft_venue || event.venue || "");
      setAddress(event.draft_address || event.address || "");
      setSlug(event.draft_slug || event.slug || slugify(event.draft_name || event.name || ""));
      setRsvpDeadline(toDatetimeLocal(event.draft_rsvp_deadline || event.rsvp_deadline || null));
      setIsPublished(event.is_published);
      setIsArchived(event.is_archived);
      setDupName(`${event.draft_name || event.name || "Event"} (Copy)`);
      (initialized as any) = true;
    }
  }, [event]);

  useEffect(() => {
    if (!slug) { setSlugAvailable(null); return; }
    let active = true;
    const timer = setTimeout(async () => {
      if (!isValidSlug(slug)) { setSlugAvailable(false); return; }
      const currentSlug = event?.draft_slug || event?.slug;
      if (slug === currentSlug) { setSlugAvailable(true); return; }
      const { data } = await supabase.from("events").select("id").eq("slug", slug).maybeSingle();
      if (active) setSlugAvailable(!data);
    }, 400);
    return () => { active = false; clearTimeout(timer); };
  }, [slug, event]);

  const saveMutation = useMutation<void, Error, Record<string, unknown>>({
    mutationFn: async (patch) => {
      const { error } = await supabase.from("events").update(patch).eq("id", eventId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      setToast({ message: "Settings saved", type: "success" });
    },
    onError: () => setToast({ message: "Failed to save", type: "error" }),
  });

  const saveDetails = () => {
    saveMutation.mutate({
      draft_name: name,
      draft_event_type: eventType,
      draft_event_date: eventDate,
      draft_event_time: eventTime,
      draft_venue: venue,
      draft_address: address,
    });
  };

  const saveSlug = () => {
    if (!isValidSlug(slug)) {
      setToast({ message: "Invalid slug format", type: "error" });
      return;
    }
    if (slugAvailable === false) {
      setToast({ message: "Slug is already taken", type: "error" });
      return;
    }
    saveMutation.mutate({ draft_slug: slug });
  };

  const saveDeadline = () => {
    saveMutation.mutate({
      draft_rsvp_deadline: rsvpDeadline ? fromDatetimeLocal(rsvpDeadline) : null,
    });
  };

  const togglePublished = (v: boolean) => {
    setIsPublished(v);
    saveMutation.mutate({ is_published: v });
  };

  const toggleArchived = (v: boolean) => {
    setIsArchived(v);
    saveMutation.mutate({ is_archived: v });
  };

  const deleteMutation = useMutation<void, Error, void>({
    mutationFn: async () => {
      const { error } = await supabase.from("events").delete().eq("id", eventId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      navigate("/dashboard");
    },
    onError: () => setToast({ message: "Failed to delete event", type: "error" }),
  });

  const duplicateMutation = useMutation<void, Error, { name: string }>({
    mutationFn: async ({ name: dupName }) => {
      const { data: userData } = await supabase.auth.getUser();
      const creatorId = userData.user?.id;
      if (!creatorId) throw new Error("Not authenticated");
      const newSlug = slugify(dupName);
      const { data: existing } = await supabase.from("events").select("id").eq("slug", newSlug).maybeSingle();
      const finalSlug = existing ? `${newSlug}-${Date.now().toString(36)}` : newSlug;
      const { error } = await supabase.from("events").insert({
        creator_id: creatorId,
        name: dupName,
        draft_name: dupName,
        event_type: eventType,
        draft_event_type: eventType,
        event_date: eventDate,
        draft_event_date: eventDate,
        event_time: eventTime,
        draft_event_time: eventTime,
        venue,
        draft_venue: venue,
        address,
        draft_address: address,
        cover_config: event?.draft_cover_config || event?.cover_config || null,
        draft_cover_config: event?.draft_cover_config || event?.cover_config || null,
        login_config: event?.draft_login_config || event?.login_config || null,
        draft_login_config: event?.draft_login_config || event?.login_config || null,
        theme: event?.draft_theme || event?.theme || null,
        draft_theme: event?.draft_theme || event?.theme || null,
        logo_config: event?.draft_logo_config || event?.logo_config || null,
        draft_logo_config: event?.draft_logo_config || event?.logo_config || null,
        content: event?.draft_content || event?.content || null,
        draft_content: event?.draft_content || event?.content || null,
        sharing_config: event?.draft_sharing_config || event?.sharing_config || null,
        draft_sharing_config: event?.draft_sharing_config || event?.sharing_config || null,
        template_id: event?.template_id || "default",
        slug: finalSlug,
        draft_slug: finalSlug,
        is_published: false,
        is_archived: false,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      setDuplicateOpen(false);
      setToast({ message: "Event duplicated", type: "success" });
      navigate("/dashboard");
    },
    onError: () => setToast({ message: "Failed to duplicate event", type: "error" }),
  });

  if (!event) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
      </div>
    );
  }

  const previewUrl = slug && isValidSlug(slug) ? `${window.location.origin}/e/${slug}` : "";

  return (
    <div className="max-w-2xl">
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500">Manage your event configuration.</p>
      </div>

      <Card className="p-6 mb-4 space-y-4">
        <h3 className="text-sm font-semibold text-slate-900">Event Details</h3>
        <FormField label="Event Name">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Event name" />
        </FormField>
        <FormField label="Event Type">
          <Select value={eventType} onChange={(e) => setEventType(e.target.value)}>
            {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </Select>
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Date">
            <DatePicker value={eventDate} onChange={setEventDate} />
          </FormField>
          <FormField label="Time">
            <TimePicker value={eventTime} onChange={setEventTime} />
          </FormField>
        </div>
        <FormField label="Venue">
          <Input value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="Venue name" />
        </FormField>
        <FormField label="Address">
          <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Full address" />
        </FormField>
        <Button onClick={saveDetails} loading={saveMutation.isPending}>Save Details</Button>
      </Card>

      <Card className="p-6 mb-4 space-y-4">
        <h3 className="text-sm font-semibold text-slate-900">Custom URL</h3>
        <FormField label="Slug" hint="Letters, numbers, and hyphens only (2-50 characters)">
          <Input
            value={slug}
            onChange={(e) => { setSlug(e.target.value); setSlugTouched(true); }}
            placeholder="my-event"
          />
        </FormField>
        {slugTouched && slug && !isValidSlug(slug) && (
          <div className="flex items-center gap-2 text-sm text-amber-600">
            <AlertTriangle className="w-4 h-4" /> Invalid slug format
          </div>
        )}
        {slugTouched && slug && isValidSlug(slug) && slugAvailable === false && (
          <div className="flex items-center gap-2 text-sm text-red-600">
            <AlertTriangle className="w-4 h-4" /> This slug is already taken
          </div>
        )}
        {slug && isValidSlug(slug) && slugAvailable === true && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <Check className="w-4 h-4" /> Available
          </div>
        )}
        {previewUrl && (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Globe className="w-4 h-4" />
            <span className="font-mono">{previewUrl}</span>
          </div>
        )}
        <Button onClick={saveSlug} loading={saveMutation.isPending} disabled={!isValidSlug(slug) || slugAvailable === false}>
          Save URL
        </Button>
      </Card>

      <Card className="p-6 mb-4 space-y-4">
        <h3 className="text-sm font-semibold text-slate-900">RSVP Deadline</h3>
        <FormField label="Deadline" hint="Guests cannot RSVP after this time">
          <Input
            type="datetime-local"
            value={rsvpDeadline}
            onChange={(e) => setRsvpDeadline(e.target.value)}
          />
        </FormField>
        {rsvpDeadline && (
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-600">{formatDeadline(fromDatetimeLocal(rsvpDeadline))}</span>
            {(() => {
              const status = getRsvpStatus(fromDatetimeLocal(rsvpDeadline));
              if (status === "open") return <Badge variant="success">Open</Badge>;
              if (status === "closing-soon") return <Badge variant="warning">Closing Soon</Badge>;
              if (status === "closed") return <Badge variant="error">Closed</Badge>;
              return null;
            })()}
          </div>
        )}
        <Button onClick={saveDeadline} loading={saveMutation.isPending}>Save Deadline</Button>
      </Card>

      <Card className="p-6 mb-4 space-y-4">
        <h3 className="text-sm font-semibold text-slate-900">Status</h3>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-slate-900">Published</div>
            <p className="text-xs text-slate-500">Make event visible to guests.</p>
          </div>
          <Toggle checked={isPublished} onChange={togglePublished} />
        </div>
        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
          <div>
            <div className="text-sm font-medium text-slate-900">Archived</div>
            <p className="text-xs text-slate-500">Archive this event to hide from dashboard.</p>
          </div>
          <Toggle checked={isArchived} onChange={toggleArchived} />
        </div>
      </Card>

      <Card className="p-6 mb-4 space-y-4">
        <h3 className="text-sm font-semibold text-slate-900">Duplicate Event</h3>
        <p className="text-sm text-slate-500">Create a copy of this event with all settings.</p>
        <Button variant="secondary" onClick={() => setDuplicateOpen(true)}>
          <Copy className="w-4 h-4" /> Duplicate
        </Button>
      </Card>

      <Card className="p-6 space-y-4 border-red-200">
        <h3 className="text-sm font-semibold text-red-900">Danger Zone</h3>
        <p className="text-sm text-slate-500">Deleting an event permanently removes all data including guests, RSVPs, and messages.</p>
        <Button variant="danger" onClick={() => setDeleteOpen(true)}>
          <Trash2 className="w-4 h-4" /> Delete Event
        </Button>
      </Card>

      <Modal open={deleteOpen} onClose={() => { setDeleteOpen(false); setDeleteConfirm(""); }} title="Delete Event">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            This will permanently delete <span className="font-semibold text-slate-900">{event.draft_name || event.name}</span> and all associated data. This cannot be undone.
          </p>
          <FormField label={`Type "${event.draft_name || event.name}" to confirm`}>
            <Input value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} placeholder="Event name" />
          </FormField>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => { setDeleteOpen(false); setDeleteConfirm(""); }}>Cancel</Button>
            <Button
              variant="danger"
              onClick={() => deleteMutation.mutate()}
              loading={deleteMutation.isPending}
              disabled={deleteConfirm !== (event.draft_name || event.name)}
            >
              Delete Permanently
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={duplicateOpen} onClose={() => setDuplicateOpen(false)} title="Duplicate Event">
        <div className="space-y-4">
          <FormField label="New Event Name">
            <Input value={dupName} onChange={(e) => setDupName(e.target.value)} placeholder="Copied event name" />
          </FormField>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setDuplicateOpen(false)}>Cancel</Button>
            <Button
              onClick={() => duplicateMutation.mutate({ name: dupName })}
              loading={duplicateMutation.isPending}
              disabled={!dupName.trim()}
            >
              Duplicate
            </Button>
          </div>
        </div>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
