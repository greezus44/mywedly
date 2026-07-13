import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Save,
  Archive,
  Trash2,
  Globe,
  Check,
  AlertTriangle,
  Link as LinkIcon,
} from "lucide-react";
import { supabase, type UserEvent, EVENT_TYPES } from "../../lib/supabase";
import { cn, toDatetimeLocal, fromDatetimeLocal, formatDeadline } from "../../lib/utils";
import { slugify, isValidSlug } from "../../lib/theme";
import { Button } from "../../components/ui/Button";
import { Card, FormField, Toggle, Badge, Skeleton, ErrorState, Toast, Modal } from "../../components/ui";
import { Input, Select } from "../../components/ui/Input";
import { DatePicker } from "../../components/ui/DatePicker";
import { TimePicker } from "../../components/ui/TimePicker";

function SettingsPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: "",
    event_type: "Wedding",
    event_date: null as string | null,
    event_time: null as string | null,
    venue: "",
    address: "",
    slug: "",
    rsvp_deadline: "",
  });
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [slugChecking, setSlugChecking] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [archiveModalOpen, setArchiveModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const { data: event, isLoading, isError, refetch } = useQuery<UserEvent>({
    queryKey: ["event", eventId],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_events").select("*").eq("id", eventId!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!eventId,
  });

  useEffect(() => {
    if (event) {
      setForm({
        name: event.name || "",
        event_type: event.event_type || "Wedding",
        event_date: event.event_date || null,
        event_time: event.event_time || null,
        venue: event.venue || "",
        address: event.address || "",
        slug: event.draft_slug || event.slug || "",
        rsvp_deadline: toDatetimeLocal(event.rsvp_deadline || null),
      });
    }
  }, [event]);

  // Check slug uniqueness
  useEffect(() => {
    if (!form.slug || !isValidSlug(form.slug)) {
      setSlugAvailable(null);
      return;
    }
    if (form.slug === event?.slug) {
      setSlugAvailable(true);
      return;
    }
    setSlugChecking(true);
    const timer = setTimeout(async () => {
      try {
        const { data } = await supabase
          .from("user_events")
          .select("id")
          .eq("draft_slug", form.slug)
          .neq("id", eventId!)
          .maybeSingle();
        setSlugAvailable(!data);
      } catch {
        setSlugAvailable(null);
      } finally {
        setSlugChecking(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [form.slug, event?.slug, eventId]);

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<UserEvent>) => {
      const { data, error } = await supabase
        .from("user_events")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", eventId!)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["event", eventId], data);
      setToast({ message: "Settings saved", type: "success" });
    },
    onError: () => setToast({ message: "Failed to save settings", type: "error" }),
  });

  const publishMutation = useMutation({
    mutationFn: async (publish: boolean) => {
      const updates: Partial<UserEvent> = {
        is_published: publish,
        updated_at: new Date().toISOString(),
      };
      if (publish) {
        updates.published_at = new Date().toISOString();
        // Copy draft fields to published fields
        if (event?.draft_name) updates.name = event.draft_name;
        if (event?.draft_event_type) updates.event_type = event.draft_event_type;
        if (event?.draft_event_date !== undefined) updates.event_date = event.draft_event_date;
        if (event?.draft_event_time !== undefined) updates.event_time = event.draft_event_time;
        if (event?.draft_venue !== undefined) updates.venue = event.draft_venue;
        if (event?.draft_address !== undefined) updates.address = event.draft_address;
        if (event?.draft_cover_config) updates.cover_config = event.draft_cover_config;
        if (event?.draft_login_config) updates.login_config = event.draft_login_config;
        if (event?.draft_theme) updates.theme = event.draft_theme;
        if (event?.draft_logo_config) updates.logo_config = event.draft_logo_config;
        if (event?.draft_content) updates.content = event.draft_content;
        if (event?.draft_sharing_config) updates.sharing_config = event.draft_sharing_config;
        if (event?.draft_slug) updates.slug = event.draft_slug;
        if (event?.draft_rsvp_deadline !== undefined) updates.rsvp_deadline = event.draft_rsvp_deadline;
      }
      const { data, error } = await supabase
        .from("user_events")
        .update(updates)
        .eq("id", eventId!)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["event", eventId], data);
      setToast({ message: data.is_published ? "Event published" : "Event unpublished", type: "success" });
    },
    onError: () => setToast({ message: "Failed to toggle publish", type: "error" }),
  });

  const archiveMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("user_events")
        .update({ is_archived: true, updated_at: new Date().toISOString() })
        .eq("id", eventId!)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      setToast({ message: "Event archived", type: "success" });
      setArchiveModalOpen(false);
    },
    onError: () => setToast({ message: "Failed to archive event", type: "error" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("user_events").delete().eq("id", eventId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      navigate("/");
    },
    onError: () => setToast({ message: "Failed to delete event", type: "error" }),
  });

  const handleSaveSettings = useCallback(() => {
    const updates: Partial<UserEvent> = {
      name: form.name,
      event_type: form.event_type,
      event_date: form.event_date,
      event_time: form.event_time,
      venue: form.venue,
      address: form.address,
      draft_slug: form.slug,
      rsvp_deadline: form.rsvp_deadline ? fromDatetimeLocal(form.rsvp_deadline) : null,
    };
    updateMutation.mutate(updates);
  }, [form, updateMutation]);

  const slugValid = !form.slug || isValidSlug(form.slug);

  if (isLoading) {
    return (
      <div className="p-8">
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-96 w-full max-w-2xl" />
      </div>
    );
  }

  if (isError || !event) {
    return <ErrorState message="Failed to load event" onRetry={refetch} />;
  }

  return (
    <div>
      <div className="px-6 lg:px-8 py-6 border-b border-onyx/10 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl text-onyx">Settings</h1>
          <p className="mt-1 text-sm text-onyx/50">Manage event details, URL, and status</p>
        </div>
        <Button onClick={handleSaveSettings} loading={updateMutation.isPending}>
          <Save className="w-4 h-4" /> Save Changes
        </Button>
      </div>

      <div className="p-6 lg:p-8 max-w-2xl space-y-6">
        {/* Publish Status */}
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading text-xl text-onyx">Publish Status</h2>
              <p className="text-sm text-onyx/40 mt-1">
                {event.is_published
                  ? "Event is live and accessible to guests"
                  : "Event is in draft mode — only visible to you"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={event.is_published ? "success" : "default"}>
                {event.is_published ? "Published" : "Draft"}
              </Badge>
              <Button
                variant={event.is_published ? "secondary" : "primary"}
                size="sm"
                onClick={() => publishMutation.mutate(!event.is_published)}
                loading={publishMutation.isPending}
              >
                <Globe className="w-3.5 h-3.5" />
                {event.is_published ? "Unpublish" : "Publish"}
              </Button>
            </div>
          </div>
        </Card>

        {/* Event Details */}
        <Card className="p-5">
          <h2 className="font-heading text-xl text-onyx mb-4">Event Details</h2>
          <div className="space-y-4">
            <FormField label="Event Name">
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Our Wedding"
              />
            </FormField>
            <FormField label="Event Type">
              <Select
                value={form.event_type}
                onChange={(e) => setForm({ ...form, event_type: e.target.value })}
              >
                {EVENT_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </Select>
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Date">
                <DatePicker
                  value={form.event_date}
                  onChange={(v) => setForm({ ...form, event_date: v })}
                />
              </FormField>
              <FormField label="Time">
                <TimePicker
                  value={form.event_time}
                  onChange={(v) => setForm({ ...form, event_time: v })}
                />
              </FormField>
            </div>
            <FormField label="Venue">
              <Input
                value={form.venue}
                onChange={(e) => setForm({ ...form, venue: e.target.value })}
                placeholder="The Grand Ballroom"
              />
            </FormField>
            <FormField label="Address">
              <Input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="123 Main Street, City"
              />
            </FormField>
          </div>
        </Card>

        {/* Custom URL */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <LinkIcon className="w-5 h-5 text-onyx/50" />
            <h2 className="font-heading text-xl text-onyx">Custom URL</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-onyx/40 font-mono whitespace-nowrap">
                {window.location.origin}/e/
              </span>
              <Input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })}
                placeholder="my-event"
                className={cn(
                  !slugValid && "border-red-400",
                  slugAvailable === false && "border-red-400",
                )}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setForm({ ...form, slug: slugify(form.name) })}
              >
                Generate from name
              </Button>
            </div>
            {form.slug && !slugValid && (
              <p className="text-xs text-red-600">
                Invalid slug. Use only lowercase letters, numbers, and hyphens (2-50 characters).
              </p>
            )}
            {slugValid && slugChecking && (
              <p className="text-xs text-onyx/40">Checking availability...</p>
            )}
            {slugValid && slugAvailable === true && form.slug !== event.slug && (
              <p className="text-xs text-green-600 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> URL is available
              </p>
            )}
            {slugValid && slugAvailable === false && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> This URL is already taken
              </p>
            )}
          </div>
        </Card>

        {/* RSVP Deadline */}
        <Card className="p-5">
          <h2 className="font-heading text-xl text-onyx mb-4">RSVP Deadline</h2>
          <FormField label="Deadline Date & Time" hint="After this time, guests can no longer submit RSVPs">
            <Input
              type="datetime-local"
              value={form.rsvp_deadline}
              onChange={(e) => setForm({ ...form, rsvp_deadline: e.target.value })}
            />
          </FormField>
          {event.rsvp_deadline && (
            <p className="mt-2 text-xs text-onyx/40">
              Current deadline: {formatDeadline(event.rsvp_deadline)}
            </p>
          )}
        </Card>

        {/* Danger Zone */}
        <Card className="p-5 border-red-200">
          <h2 className="font-heading text-xl text-onyx mb-4">Danger Zone</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-onyx/70">Archive Event</p>
                <p className="text-xs text-onyx/40">Hide this event from your dashboard without deleting it</p>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setArchiveModalOpen(true)}>
                <Archive className="w-3.5 h-3.5" /> Archive
              </Button>
            </div>
            <div className="border-t border-onyx/5 pt-3 flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600">Delete Event</p>
                <p className="text-xs text-onyx/40">Permanently remove this event and all associated data</p>
              </div>
              <Button variant="danger" size="sm" onClick={() => setDeleteModalOpen(true)}>
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Archive Modal */}
      <Modal open={archiveModalOpen} onClose={() => setArchiveModalOpen(false)} title="Archive Event">
        <p className="text-sm text-onyx/60 mb-4">
          Are you sure you want to archive <strong className="text-onyx">{event.name}</strong>?
          The event will be hidden from your dashboard but can be restored later.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setArchiveModalOpen(false)}>Cancel</Button>
          <Button variant="secondary" onClick={() => archiveMutation.mutate()} loading={archiveMutation.isPending}>
            <Archive className="w-4 h-4" /> Archive Event
          </Button>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal open={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Delete Event">
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-700 font-medium">This action cannot be undone.</p>
              <p className="text-xs text-red-600 mt-1">
                All event data including guests, RSVPs, and schedule items will be permanently deleted.
              </p>
            </div>
          </div>
          <p className="text-sm text-onyx/60">
            Type the event name <strong className="text-onyx">{event.name}</strong> to confirm:
          </p>
          <ConfirmDeleteInput
            confirmText={event.name}
            onConfirm={() => deleteMutation.mutate()}
            loading={deleteMutation.isPending}
            onCancel={() => setDeleteModalOpen(false)}
          />
        </div>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

function ConfirmDeleteInput({
  confirmText,
  onConfirm,
  loading,
  onCancel,
}: {
  confirmText: string;
  onConfirm: () => void;
  loading: boolean;
  onCancel: () => void;
}) {
  const [value, setValue] = useState("");
  return (
    <div className="space-y-3">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={confirmText}
      />
      <div className="flex justify-end gap-3">
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button
          variant="danger"
          onClick={onConfirm}
          loading={loading}
          disabled={value !== confirmText}
        >
          <Trash2 className="w-4 h-4" /> Delete Permanently
        </Button>
      </div>
    </div>
  );
}

export default SettingsPage;
