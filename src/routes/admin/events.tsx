import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Wedding, type WeddingEvent, type EventKind, type EventVisibility } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { RsvpPreview } from "../../components/preview/PreviewRenderers";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, Label, Select } from "../../components/ui/Input";
import { ImageUpload, FormField } from "../../components/ui/ImageUpload";
import { Card, Badge, Modal, EmptyState, Toast } from "../../components/ui/index";
import { formatDate, formatTime, cn } from "../../lib/utils";
import { Plus, Pencil, Trash2, Calendar, MapPin, RefreshCw, Users, Eye, EyeOff } from "lucide-react";

const EVENT_KINDS: { value: EventKind; label: string }[] = [
  { value: "ceremony", label: "Ceremony" },
  { value: "reception", label: "Reception" },
  { value: "welcome", label: "Welcome Party" },
  { value: "rehearsal", label: "Rehearsal" },
  { value: "brunch", label: "Brunch" },
  { value: "cultural", label: "Cultural" },
  { value: "other", label: "Other" },
];

const emptyForm = {
  name: "",
  kind: "ceremony" as EventKind,
  starts_at: "",
  venue_name: "",
  venue_address: "",
  dress_code: "",
  programme: "",
  notes: "",
  maps_url: "",
  image_url: "",
  rsvp_deadline: "",
  capacity: "",
  visibility: "public" as EventVisibility,
};

export function EventsPage() {
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<WeddingEvent | null>(null);
  const [form, setForm] = useState(emptyForm);

  const weddingQuery = useQuery({
    queryKey: ["wedding"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { data, error } = await supabase.from("weddings").select("*").eq("created_by", user.user.id).single();
      if (error) throw error;
      return data as Wedding;
    },
  });

  const wedding = weddingQuery.data;

  const eventsQuery = useQuery({
    queryKey: ["events", wedding?.id],
    queryFn: async () => {
      if (!wedding) return [];
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("wedding_id", wedding.id)
        .order("starts_at", { ascending: true });
      if (error) throw error;
      return (data || []) as WeddingEvent[];
    },
    enabled: !!wedding,
  });

  const events = eventsQuery.data || [];

  const createMutation = useMutation({
    mutationFn: async (values: typeof emptyForm) => {
      if (!wedding) throw new Error("No wedding");
      const { data, error } = await supabase
        .from("events")
        .insert({
          wedding_id: wedding.id,
          name: values.name,
          kind: values.kind,
          starts_at: values.starts_at || null,
          venue_name: values.venue_name || null,
          venue_address: values.venue_address || null,
          dress_code: values.dress_code || null,
          programme: values.programme || null,
          notes: values.notes || null,
          maps_url: values.maps_url || null,
          image_url: values.image_url || null,
          rsvp_deadline: values.rsvp_deadline || null,
          capacity: values.capacity ? parseInt(values.capacity) : null,
          visibility: values.visibility,
          sort_order: events.length,
        })
        .select("*")
        .single();
      if (error) throw error;
      return data as WeddingEvent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      setModalOpen(false);
      setToast({ message: "Event created", type: "success" });
    },
    onError: () => setToast({ message: "Failed to create event", type: "error" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: typeof emptyForm }) => {
      const { data, error } = await supabase
        .from("events")
        .update({
          name: values.name,
          kind: values.kind,
          starts_at: values.starts_at || null,
          venue_name: values.venue_name || null,
          venue_address: values.venue_address || null,
          dress_code: values.dress_code || null,
          programme: values.programme || null,
          notes: values.notes || null,
          maps_url: values.maps_url || null,
          image_url: values.image_url || null,
          rsvp_deadline: values.rsvp_deadline || null,
          capacity: values.capacity ? parseInt(values.capacity) : null,
          visibility: values.visibility,
        })
        .eq("id", id)
        .select("*")
        .single();
      if (error) throw error;
      return data as WeddingEvent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      setModalOpen(false);
      setToast({ message: "Event updated", type: "success" });
    },
    onError: () => setToast({ message: "Failed to update event", type: "error" }),
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
    onError: () => setToast({ message: "Failed to delete event", type: "error" }),
  });

  const openCreate = () => {
    setEditingEvent(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (event: WeddingEvent) => {
    setEditingEvent(event);
    setForm({
      name: event.name,
      kind: event.kind,
      starts_at: event.starts_at ? event.starts_at.slice(0, 16) : "",
      venue_name: event.venue_name || "",
      venue_address: event.venue_address || "",
      dress_code: event.dress_code || "",
      programme: event.programme || "",
      notes: event.notes || "",
      maps_url: event.maps_url || "",
      image_url: event.image_url || "",
      rsvp_deadline: event.rsvp_deadline ? event.rsvp_deadline.slice(0, 16) : "",
      capacity: event.capacity?.toString() || "",
      visibility: event.visibility,
    });
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEvent) {
      updateMutation.mutate({ id: editingEvent.id, values: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const update = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  if (weddingQuery.isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full p-20">
          <RefreshCw size={24} className="animate-spin text-[var(--color-primary)]" />
        </div>
      </AdminLayout>
    );
  }

  if (weddingQuery.isError || !wedding) {
    return (
      <AdminLayout>
        <div className="p-8">
          <EmptyState title="Unable to load events" description="Please try again later." />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <SplitEditor title="Events Manager" preview={<RsvpPreview wedding={wedding} events={events} />}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading text-xl text-[var(--color-text)] mb-1">Events</h2>
              <p className="font-ui text-xs text-[var(--color-text-muted)]">{events.length} event{events.length !== 1 ? "s" : ""}</p>
            </div>
            <Button variant="primary" size="sm" onClick={openCreate}>
              <Plus size={14} className="mr-1" /> Add
            </Button>
          </div>

          {eventsQuery.isLoading ? (
            <div className="flex justify-center py-12">
              <RefreshCw size={20} className="animate-spin text-[var(--color-primary)]" />
            </div>
          ) : events.length === 0 ? (
            <EmptyState
              icon={<Calendar size={32} />}
              title="No events yet"
              description="Create your first event to get started."
              action={<Button variant="outline" size="sm" onClick={openCreate}><Plus size={14} className="mr-1" /> Add Event</Button>}
            />
          ) : (
            <div className="space-y-3">
              {events.map((event) => (
                <Card key={event.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-heading text-base text-[var(--color-text)] truncate">{event.name}</h3>
                        <Badge variant="default">{EVENT_KINDS.find((k) => k.value === event.kind)?.label || event.kind}</Badge>
                        {event.visibility === "private" ? (
                          <EyeOff size={14} className="text-[var(--color-text-muted)]" />
                        ) : (
                          <Eye size={14} className="text-[var(--color-text-muted)]" />
                        )}
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
                      {event.capacity && (
                        <p className="font-ui text-xs text-[var(--color-text-muted)] flex items-center gap-1 mt-1">
                          <Users size={12} /> Capacity: {event.capacity}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => openEdit(event)} className="p-2 hover:bg-[var(--color-primary)]/10 rounded-lg transition-colors">
                        <Pencil size={14} className="text-[var(--color-primary)]" />
                      </button>
                      <button
                        onClick={() => { if (confirm("Delete this event?")) deleteMutation.mutate(event.id); }}
                        className="p-2 hover:bg-[var(--color-error)]/10 rounded-lg transition-colors"
                      >
                        <Trash2 size={14} className="text-[var(--color-error)]" />
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </SplitEditor>

      {/* Create/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingEvent ? "Edit Event" : "New Event"} maxWidth="max-w-xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Event Name">
            <Input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Akad Nikah" required />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Type">
              <Select value={form.kind} onChange={(e) => update("kind", e.target.value)}>
                {EVENT_KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
              </Select>
            </FormField>
            <FormField label="Visibility">
              <Select value={form.visibility} onChange={(e) => update("visibility", e.target.value)}>
                <option value="public">Public</option>
                <option value="private">Private</option>
              </Select>
            </FormField>
          </div>

          <FormField label="Start Date & Time">
            <Input type="datetime-local" value={form.starts_at} onChange={(e) => update("starts_at", e.target.value)} />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Venue Name">
              <Input value={form.venue_name} onChange={(e) => update("venue_name", e.target.value)} placeholder="Grand Ballroom" />
            </FormField>
            <FormField label="Dress Code">
              <Input value={form.dress_code} onChange={(e) => update("dress_code", e.target.value)} placeholder="Formal / Traditional" />
            </FormField>
          </div>

          <FormField label="Venue Address">
            <Textarea value={form.venue_address} onChange={(e) => update("venue_address", e.target.value)} placeholder="123 Wedding Venue Drive, City" className="min-h-[60px]" />
          </FormField>

          <FormField label="Programme" hint="Schedule or programme details">
            <Textarea value={form.programme} onChange={(e) => update("programme", e.target.value)} placeholder="9:00 AM - Arrival&#10;10:00 AM - Ceremony" className="min-h-[100px]" />
          </FormField>

          <FormField label="Notes">
            <Textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} placeholder="Additional notes for guests" className="min-h-[60px]" />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="RSVP Deadline">
              <Input type="datetime-local" value={form.rsvp_deadline} onChange={(e) => update("rsvp_deadline", e.target.value)} />
            </FormField>
            <FormField label="Capacity">
              <Input type="number" value={form.capacity} onChange={(e) => update("capacity", e.target.value)} placeholder="200" min="0" />
            </FormField>
          </div>

          <FormField label="Maps URL">
            <Input value={form.maps_url} onChange={(e) => update("maps_url", e.target.value)} placeholder="https://maps.google.com/..." />
          </FormField>

          <ImageUpload label="Event Image" value={form.image_url || null} onChange={(url) => update("image_url", url || "")} />

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" className="flex-1" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" className="flex-1" disabled={createMutation.isPending || updateMutation.isPending}>
              {createMutation.isPending || updateMutation.isPending ? "Saving..." : editingEvent ? "Update Event" : "Create Event"}
            </Button>
          </div>
        </form>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </AdminLayout>
  );
}
