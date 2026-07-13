import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Wedding, type WeddingEvent, type EventKind, type EventVisibility } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { RsvpPreview } from "../../components/preview/PreviewRenderers";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, Label, Select } from "../../components/ui/Input";
import { Card, Badge, Modal, EmptyState, Toast } from "../../components/ui/index";
import { ImageUpload, FormField } from "../../components/ui/ImageUpload";
import { formatDate, formatTime } from "../../lib/utils";
import { Plus, Pencil, Trash2, Calendar, Save, GripVertical, MapPin } from "lucide-react";

const EVENT_KINDS: { value: EventKind; label: string }[] = [
  { value: "ceremony", label: "Ceremony" },
  { value: "reception", label: "Reception" },
  { value: "welcome", label: "Welcome" },
  { value: "rehearsal", label: "Rehearsal" },
  { value: "brunch", label: "Brunch" },
  { value: "cultural", label: "Cultural" },
  { value: "other", label: "Other" },
];

const emptyEvent = (weddingId: string, sortOrder: number): Omit<WeddingEvent, "id" | "created_at"> => ({
  wedding_id: weddingId,
  name: "",
  kind: "ceremony",
  starts_at: null,
  venue_name: null,
  venue_address: null,
  dress_code: null,
  notes: null,
  visibility: "public",
  sort_order: sortOrder,
  description: null,
  maps_url: null,
  image_url: null,
  rsvp_deadline: null,
  capacity: null,
  programme: null,
});

export function EventsPage() {
  const queryClient = useQueryClient();
  const [editingEvent, setEditingEvent] = useState<WeddingEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const { data: wedding, isLoading: weddingLoading, error: weddingError } = useQuery({
    queryKey: ["wedding"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { data, error } = await supabase.from("weddings").select("*").eq("created_by", user.user.id).single();
      if (error) throw error;
      return data as Wedding;
    },
  });

  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ["events", wedding?.id],
    queryFn: async () => {
      if (!wedding) return [];
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("wedding_id", wedding.id)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as WeddingEvent[];
    },
    enabled: !!wedding,
  });

  const createMutation = useMutation({
    mutationFn: async (data: Omit<WeddingEvent, "id" | "created_at">) => {
      const { error } = await supabase.from("events").insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      setToast({ message: "Event created", type: "success" });
      setIsModalOpen(false);
    },
    onError: (err) => setToast({ message: err.message || "Failed to create event", type: "error" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<WeddingEvent> }) => {
      const { error } = await supabase.from("events").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      setToast({ message: "Event updated", type: "success" });
      setIsModalOpen(false);
    },
    onError: (err) => setToast({ message: err.message || "Failed to update event", type: "error" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      setToast({ message: "Event deleted", type: "success" });
    },
    onError: (err) => setToast({ message: err.message || "Failed to delete event", type: "error" }),
  });

  const handleAdd = () => {
    if (!wedding) return;
    setEditingEvent(null);
    setIsModalOpen(true);
  };

  const handleEdit = (event: WeddingEvent) => {
    setEditingEvent(event);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this event? This cannot be undone.")) {
      deleteMutation.mutate(id);
    }
  };

  if (weddingLoading || eventsLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full p-8">
          <div className="font-ui text-sm text-gray-400">Loading events...</div>
        </div>
      </AdminLayout>
    );
  }

  if (weddingError || !wedding) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full p-8">
          <p className="font-ui text-sm text-red-500">Unable to load wedding data</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-6 py-3 bg-white border-b border-gray-100 flex items-center justify-between">
          <div>
            <h1 className="font-heading text-xl text-[var(--color-text)]">Events</h1>
            <p className="font-ui text-xs text-[var(--color-text-muted)]">{events.length} event{events.length !== 1 ? "s" : ""}</p>
          </div>
          <Button variant="primary" size="sm" onClick={handleAdd}>
            <Plus size={14} className="mr-1.5" />
            Add Event
          </Button>
        </div>
        <div className="flex-1 overflow-hidden">
          <SplitEditor
            title="Events & RSVP"
            preview={<RsvpPreview wedding={wedding} events={events} />}
          >
            <div className="space-y-4">
              {events.length === 0 ? (
                <EmptyState
                  icon={<Calendar size={32} />}
                  title="No events yet"
                  description="Add your ceremony, reception, and other events for guests to RSVP to."
                  action={<Button variant="primary" size="sm" onClick={handleAdd}><Plus size={14} className="mr-1.5" />Add Event</Button>}
                />
              ) : (
                events.map((event, index) => (
                  <Card key={event.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="flex flex-col items-center gap-1 pt-1">
                          <GripVertical size={14} className="text-gray-300" />
                          <span className="font-ui text-xs text-gray-400">{index + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-heading text-base text-[var(--color-text)] truncate">{event.name}</h3>
                            <Badge variant="default">{EVENT_KINDS.find((k) => k.value === event.kind)?.label || event.kind}</Badge>
                            {event.visibility === "private" && <Badge variant="warning">Private</Badge>}
                          </div>
                          {event.starts_at && (
                            <p className="font-ui text-xs text-[var(--color-text-muted)] mb-1">
                              {formatDate(event.starts_at)} · {formatTime(event.starts_at)}
                            </p>
                          )}
                          {event.venue_name && (
                            <p className="font-ui text-xs text-[var(--color-text-muted)] flex items-center gap-1">
                              <MapPin size={12} /> {event.venue_name}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => handleEdit(event)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                          <Pencil size={14} className="text-gray-500" />
                        </button>
                        <button onClick={() => handleDelete(event.id)} className="p-2 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 size={14} className="text-red-500" />
                        </button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </SplitEditor>
        </div>
      </div>

      {isModalOpen && (
        <EventModal
          event={editingEvent}
          weddingId={wedding.id}
          nextSortOrder={events.length}
          onClose={() => setIsModalOpen(false)}
          onSave={(data) => {
            if (editingEvent) {
              updateMutation.mutate({ id: editingEvent.id, data });
            } else {
              createMutation.mutate(data);
            }
          }}
          isSaving={createMutation.isPending || updateMutation.isPending}
        />
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </AdminLayout>
  );
}

function EventModal({
  event,
  weddingId,
  nextSortOrder,
  onClose,
  onSave,
  isSaving,
}: {
  event: WeddingEvent | null;
  weddingId: string;
  nextSortOrder: number;
  onClose: () => void;
  onSave: (data: Omit<WeddingEvent, "id" | "created_at">) => void;
  isSaving: boolean;
}) {
  const [form, setForm] = useState<Omit<WeddingEvent, "id" | "created_at">>(
    event
      ? { ...event }
      : emptyEvent(weddingId, nextSortOrder)
  );

  const update = (key: string, value: unknown) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = () => {
    if (!form.name.trim()) return;
    onSave(form);
  };

  return (
    <Modal open={true} onClose={onClose} title={event ? "Edit Event" : "Add Event"} maxWidth="max-w-xl">
      <div className="space-y-4">
        <FormField label="Event Name">
          <Input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Wedding Ceremony" />
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Event Type">
            <Select value={form.kind} onChange={(e) => update("kind", e.target.value as EventKind)}>
              {EVENT_KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
            </Select>
          </FormField>
          <FormField label="Visibility">
            <Select value={form.visibility} onChange={(e) => update("visibility", e.target.value as EventVisibility)}>
              <option value="public">Public</option>
              <option value="private">Private</option>
            </Select>
          </FormField>
        </div>

        <FormField label="Date & Time">
          <Input
            type="datetime-local"
            value={form.starts_at ? new Date(form.starts_at).toISOString().slice(0, 16) : ""}
            onChange={(e) => update("starts_at", e.target.value ? new Date(e.target.value).toISOString() : null)}
          />
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Venue Name">
            <Input value={form.venue_name || ""} onChange={(e) => update("venue_name", e.target.value || null)} placeholder="Grand Ballroom" />
          </FormField>
          <FormField label="Dress Code">
            <Input value={form.dress_code || ""} onChange={(e) => update("dress_code", e.target.value || null)} placeholder="Black Tie" />
          </FormField>
        </div>

        <FormField label="Venue Address">
          <Textarea value={form.venue_address || ""} onChange={(e) => update("venue_address", e.target.value || null)} placeholder="123 Venue Street, City" rows={2} />
        </FormField>

        <FormField label="Maps URL">
          <Input value={form.maps_url || ""} onChange={(e) => update("maps_url", e.target.value || null)} placeholder="https://maps.google.com/..." />
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Capacity">
            <Input type="number" value={form.capacity ?? ""} onChange={(e) => update("capacity", e.target.value ? parseInt(e.target.value) : null)} placeholder="Unlimited" />
          </FormField>
          <FormField label="RSVP Deadline">
            <Input
              type="datetime-local"
              value={form.rsvp_deadline ? new Date(form.rsvp_deadline).toISOString().slice(0, 16) : ""}
              onChange={(e) => update("rsvp_deadline", e.target.value ? new Date(e.target.value).toISOString() : null)}
            />
          </FormField>
        </div>

        <FormField label="Description">
          <Textarea value={form.description || ""} onChange={(e) => update("description", e.target.value || null)} placeholder="Event description..." rows={3} />
        </FormField>

        <FormField label="Programme">
          <Textarea value={form.programme || ""} onChange={(e) => update("programme", e.target.value || null)} placeholder="Event programme..." rows={3} />
        </FormField>

        <FormField label="Event Image">
          <ImageUpload value={form.image_url || null} onChange={(v) => update("image_url", v)} />
        </FormField>

        <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} disabled={isSaving || !form.name.trim()}>
            <Save size={14} className="mr-1.5" />
            {isSaving ? "Saving..." : event ? "Update Event" : "Create Event"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
