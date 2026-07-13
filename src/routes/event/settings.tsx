import { useState, useEffect, useCallback } from "react";
import { useOutletContext, useParams, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2, Copy, Archive, ArchiveRestore } from "lucide-react";
import { supabase, UserEvent, EVENT_TYPES } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input, Select } from "../../components/ui/Input";
import { Card, Toggle, Modal, FormField, Toast, ErrorState } from "../../components/ui/index";
import { DatePicker } from "../../components/ui/DatePicker";

type Ctx = { event: UserEvent | null };

interface SettingsForm {
  name: string;
  event_type: string;
  event_date: string | null;
  event_time: string | null;
  venue: string;
  address: string;
  is_published: boolean;
  is_archived: boolean;
}

export default function SettingsPage() {
  const { event } = useOutletContext<Ctx>();
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<SettingsForm>({
    name: "",
    event_type: "wedding",
    event_date: null,
    event_time: "",
    venue: "",
    address: "",
    is_published: false,
    is_archived: false,
  });
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [duplicateOpen, setDuplicateOpen] = useState(false);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (event) {
      setForm({
        name: event.name,
        event_type: event.event_type,
        event_date: event.event_date,
        event_time: event.event_time || "",
        venue: event.venue,
        address: event.address,
        is_published: event.is_published,
        is_archived: event.is_archived,
      });
    }
  }, [event?.id]);

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<SettingsForm>) => {
      if (!eventId) throw new Error("No event ID");
      const { error } = await supabase.from("user_events").update(updates).eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: (_data, updates) => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      if (event) {
        queryClient.setQueryData(["event", eventId], (old: UserEvent | null) =>
          old ? { ...old, ...updates } : old
        );
      }
      showToast("Settings saved");
    },
    onError: (err: any) => showToast("Failed to save: " + err.message, "error"),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ field, value }: { field: "is_published" | "is_archived"; value: boolean }) => {
      if (!eventId) throw new Error("No event ID");
      const updates: Record<string, any> = { [field]: value };
      if (field === "is_published" && value) updates.published_at = new Date().toISOString();
      const { error } = await supabase.from("user_events").update(updates).eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: (_data, { field, value }) => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      if (event) {
        queryClient.setQueryData(["event", eventId], (old: UserEvent | null) =>
          old ? { ...old, [field]: value } : old
        );
      }
      setForm((prev) => ({ ...prev, [field]: value }));
      showToast(field === "is_published" ? (value ? "Event published" : "Event unpublished") : value ? "Event archived" : "Event restored");
    },
    onError: (err: any) => showToast("Failed: " + err.message, "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!eventId) throw new Error("No event ID");
      const { error } = await supabase.from("user_events").delete().eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.removeQueries({ queryKey: ["event", eventId] });
      navigate("/dashboard");
    },
    onError: (err: any) => {
      showToast("Failed to delete: " + err.message, "error");
      setDeleteOpen(false);
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async () => {
      if (!event) throw new Error("No event");
      const { data, error } = await supabase
        .from("user_events")
        .insert({
          creator_id: event.creator_id,
          name: `${event.name} (Copy)`,
          event_type: event.event_type,
          event_date: event.event_date,
          event_time: event.event_time,
          venue: event.venue,
          address: event.address,
          cover_image: event.cover_image,
          cover_config: event.cover_config,
          login_config: event.login_config,
          theme: event.theme,
          logo_config: event.logo_config,
          content: event.content,
          sharing_config: event.sharing_config,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      setDuplicateOpen(false);
      showToast("Event duplicated!");
      navigate(`/event/${data.id}/cover`);
    },
    onError: (err: any) => showToast("Failed to duplicate: " + err.message, "error"),
  });

  const handleSave = useCallback(() => {
    if (!form.name.trim()) {
      showToast("Event name is required", "error");
      return;
    }
    updateMutation.mutate({
      name: form.name,
      event_type: form.event_type,
      event_date: form.event_date,
      event_time: form.event_time || null,
      venue: form.venue,
      address: form.address,
    });
  }, [form, updateMutation]);

  if (!event) return <ErrorState message="Could not load event data" onRetry={() => navigate("/dashboard")} />;

  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Event Settings</h1>
        <p className="text-sm text-gray-500">Configure your event details</p>
      </div>

      <Card className="p-5 space-y-4">
        <h3 className="text-sm font-semibold text-gray-900">Event Details</h3>
        <FormField label="Event Name" hint="Required">
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Event name" />
        </FormField>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Event Type">
            <Select value={form.event_type} onChange={(e) => setForm({ ...form, event_type: e.target.value })}>
              {EVENT_TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </Select>
          </FormField>
          <DatePicker value={form.event_date} onChange={(v) => setForm({ ...form, event_date: v })} label="Event Date" />
        </div>
        <FormField label="Event Time">
          <input
            type="time"
            value={form.event_time || ""}
            onChange={(e) => setForm({ ...form, event_time: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
          />
        </FormField>
        <FormField label="Venue">
          <Input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} placeholder="Venue name" />
        </FormField>
        <FormField label="Address">
          <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Full address" />
        </FormField>
        <div className="flex justify-end pt-2">
          <Button onClick={handleSave} loading={updateMutation.isPending}>
            Save Changes
          </Button>
        </div>
      </Card>

      <Card className="p-5 space-y-4">
        <h3 className="text-sm font-semibold text-gray-900">Status</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">Published</p>
            <p className="text-xs text-gray-500">Make this event visible to guests</p>
          </div>
          <Toggle
            checked={form.is_published}
            onChange={(v) => toggleMutation.mutate({ field: "is_published", value: v })}
          />
        </div>
        <div className="border-t border-gray-100 pt-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">Archived</p>
            <p className="text-xs text-gray-500">Archive this event to hide it from your dashboard</p>
          </div>
          <Toggle
            checked={form.is_archived}
            onChange={(v) => toggleMutation.mutate({ field: "is_archived", value: v })}
          />
        </div>
      </Card>

      <Card className="p-5 space-y-4">
        <h3 className="text-sm font-semibold text-gray-900">Actions</h3>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setDuplicateOpen(true)}>
            <Copy className="w-4 h-4" /> Duplicate Event
          </Button>
          {form.is_archived ? (
            <Button variant="outline" onClick={() => toggleMutation.mutate({ field: "is_archived", value: false })} loading={toggleMutation.isPending}>
              <ArchiveRestore className="w-4 h-4" /> Restore Event
            </Button>
          ) : (
            <Button variant="outline" onClick={() => toggleMutation.mutate({ field: "is_archived", value: true })} loading={toggleMutation.isPending}>
              <Archive className="w-4 h-4" /> Archive Event
            </Button>
          )}
        </div>
      </Card>

      <Card className="p-5 space-y-4 border-red-200">
        <h3 className="text-sm font-semibold text-red-900">Danger Zone</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">Delete Event</p>
            <p className="text-xs text-gray-500">Permanently delete this event and all associated data</p>
          </div>
          <Button variant="danger" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="w-4 h-4" /> Delete
          </Button>
        </div>
      </Card>

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete Event" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to permanently delete <strong>{event.name}</strong>? This will remove all guests, RSVPs,
            schedule items, and messages. This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" loading={deleteMutation.isPending} onClick={() => deleteMutation.mutate()}>
              Delete Event
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={duplicateOpen} onClose={() => setDuplicateOpen(false)} title="Duplicate Event" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            This will create a copy of <strong>{event.name}</strong> with all its settings. You'll be redirected to the new event.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDuplicateOpen(false)}>
              Cancel
            </Button>
            <Button loading={duplicateMutation.isPending} onClick={() => duplicateMutation.mutate()}>
              <Copy className="w-4 h-4" /> Duplicate
            </Button>
          </div>
        </div>
      </Modal>

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
