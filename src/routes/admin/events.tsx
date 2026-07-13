import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Calendar, MapPin, Users, Clock } from "lucide-react";
import { supabase, type Wedding, type WeddingEvent, type EventKind, type EventVisibility } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { RsvpPreview } from "../../components/preview/PreviewRenderers";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, Label, Select, Toggle } from "../../components/ui/Input";
import { Card, Badge, Modal, EmptyState, Toast } from "../../components/ui/index";
import { ImageUpload, FormField } from "../../components/ui/ImageUpload";
import { formatDate, formatTime, cn } from "../../lib/utils";

const EVENT_KINDS: { value: EventKind; label: string }[] = [
  { value: "ceremony", label: "Ceremony" },
  { value: "reception", label: "Reception" },
  { value: "welcome", label: "Welcome" },
  { value: "rehearsal", label: "Rehearsal" },
  { value: "brunch", label: "Brunch" },
  { value: "cultural", label: "Cultural" },
  { value: "other", label: "Other" },
];

interface EventForm {
  name: string;
  kind: EventKind;
  starts_at: string;
  venue_name: string;
  venue_address: string;
  dress_code: string;
  programme: string;
  notes: string;
  maps_url: string;
  image_url: string | null;
  rsvp_deadline: string;
  capacity: string;
  visibility: EventVisibility;
}

const EMPTY_FORM: EventForm = {
  name: "",
  kind: "ceremony",
  starts_at: "",
  venue_name: "",
  venue_address: "",
  dress_code: "",
  programme: "",
  notes: "",
  maps_url: "",
  image_url: null,
  rsvp_deadline: "",
  capacity: "",
  visibility: "public",
};

export function EventsPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<WeddingEvent | null>(null);
  const [form, setForm] = useState<EventForm>(EMPTY_FORM);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const { data: wedding, isLoading: wLoading } = useQuery({
    queryKey: ["wedding"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { data, error } = await supabase.from("weddings").select("*").eq("created_by", user.user.id).single();
      if (error) throw error;
      return data as Wedding;
    },
  });

  const { data: events, isLoading: eLoading } = useQuery({
    queryKey: ["events", wedding?.id],
    queryFn: async () => {
      if (!wedding) return [];
      const { data, error } = await supabase.from("events").select("*").eq("wedding_id", wedding.id).order("starts_at", { ascending: true });
      if (error) throw error;
      return (data || []) as WeddingEvent[];
    },
    enabled: !!wedding,
  });

  const createMutation = useMutation({
    mutationFn: async (newEvent: Omit<WeddingEvent, "id" | "wedding_id" | "created_at" | "sort_order">) => {
      if (!wedding) throw new Error("No wedding");
      const { error } = await supabase.from("events").insert({ ...newEvent, wedding_id: wedding.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events", wedding?.id] });
      setModalOpen(false);
      setToast({ message: "Event created", type: "success" });
    },
    onError: () => setToast({ message: "Failed to create event", type: "error" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<WeddingEvent> }) => {
      const { error } = await supabase.from("events").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events", wedding?.id] });
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
      queryClient.invalidateQueries({ queryKey: ["events", wedding?.id] });
      setToast({ message: "Event deleted", type: "success" });
    },
    onError: () => setToast({ message: "Failed to delete event", type: "error" }),
  });

  const openCreate = () => {
    setEditingEvent(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (event: WeddingEvent) => {
    setEditingEvent(event);
    setForm({
      name: event.name,
      kind: event.kind,
      starts_at: event.starts_at ? new Date(event.starts_at).toISOString().slice(0, 16) : "",
      venue_name: event.venue_name || "",
      venue_address: event.venue_address || "",
      dress_code: event.dress_code || "",
      programme: event.programme || "",
      notes: event.notes || "",
      maps_url: event.maps_url || "",
      image_url: event.image_url,
      rsvp_deadline: event.rsvp_deadline ? new Date(event.rsvp_deadline).toISOString().slice(0, 16) : "",
      capacity: event.capacity?.toString() || "",
      visibility: event.visibility,
    });
    setModalOpen(true);
  };

  const handleSubmit = () => {
    const payload = {
      name: form.name,
      kind: form.kind,
      starts_at: form.starts_at || null,
      venue_name: form.venue_name || null,
      venue_address: form.venue_address || null,
      dress_code: form.dress_code || null,
      programme: form.programme || null,
      notes: form.notes || null,
      maps_url: form.maps_url || null,
      image_url: form.image_url,
      rsvp_deadline: form.rsvp_deadline || null,
      capacity: form.capacity ? parseInt(form.capacity) : null,
      visibility: form.visibility,
    };
    if (editingEvent) {
      updateMutation.mutate({ id: editingEvent.id, updates: payload });
    } else {
      createMutation.mutate(payload as Omit<WeddingEvent, "id" | "wedding_id" | "created_at" | "sort_order">);
    }
  };

  const update = (key: keyof EventForm, value: string | boolean | null) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  if (wLoading) {
    return (
      <AdminLayout>
        <div className="flex-1 flex items-center justify-center">
          <p className="font-ui text-sm text-[var(--color-text-muted)]">Loading...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!wedding) {
    return (
      <AdminLayout>
        <div className="flex-1 flex items-center justify-center">
          <p className="font-ui text-sm text-[var(--color-text-muted)]">Wedding not found</p>
        </div>
      </AdminLayout>
    );
  }

  const loading = wLoading || eLoading;

  return (
    <AdminLayout>
      <SplitEditor title="Events Manager" preview={<RsvpPreview wedding={wedding} events={events || []} />}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading text-2xl text-[var(--color-text)] mb-1">Events</h2>
              <p className="font-ui text-xs text-[var(--color-text-muted)]">Manage your wedding events</p>
            </div>
            <Button variant="primary" size="sm" onClick={openCreate}>
              <Plus size={14} className="mr-1.5" />
              Add Event
            </Button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <Card key={i} className="p-4 animate-pulse">
                  <div className="h-5 w-32 bg-gray-100 rounded mb-3" />
                  <div className="h-4 w-48 bg-gray-100 rounded" />
                </Card>
              ))}
            </div>
          ) : events && events.length > 0 ? (
            <div className="space-y-3">
              {events.map((event) => (
                <Card key={event.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-heading text-lg text-[var(--color-text)] truncate">{event.name}</h3>
                        <Badge variant={event.visibility === "public" ? "success" : "default"}>
                          {event.visibility}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <p className="font-ui text-xs text-[var(--color-text-muted)] flex items-center gap-1.5">
                          <Calendar size={12} />
                          {formatDate(event.starts_at)} {formatTime(event.starts_at)}
                        </p>
                        {event.venue_name && (
                          <p className="font-ui text-xs text-[var(--color-text-muted)] flex items-center gap-1.5">
                            <MapPin size={12} />
                            {event.venue_name}
                          </p>
                        )}
                        {event.capacity && (
                          <p className="font-ui text-xs text-[var(--color-text-muted)] flex items-center gap-1.5">
                            <Users size={12} />
                            Capacity: {event.capacity}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(event)}
                        className="p-2 hover:bg-[var(--color-primary)]/10 rounded-lg transition-colors"
                      >
                        <Pencil size={14} className="text-[var(--color-primary)]" />
                      </button>
                      <button
                        onClick={() => deleteMutation.mutate(event.id)}
                        className="p-2 hover:bg-[var(--color-error)]/10 rounded-lg transition-colors"
                      >
                        <Trash2 size={14} className="text-[var(--color-error)]" />
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Calendar size={32} />}
              title="No events yet"
              description="Add your first wedding event to get started"
              action={
                <Button variant="primary" size="sm" onClick={openCreate}>
                  <Plus size={14} className="mr-1.5" />
                  Add Event
                </Button>
              }
            />
          )}
        </div>
      </SplitEditor>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingEvent ? "Edit Event" : "New Event"} maxWidth="max-w-xl">
        <div className="space-y-4">
          <FormField label="Event Name">
            <Input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Akad Nikah" />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Event Type">
              <Select value={form.kind} onChange={(e) => update("kind", e.target.value as EventKind)}>
                {EVENT_KINDS.map((k) => (
                  <option key={k.value} value={k.value}>{k.label}</option>
                ))}
              </Select>
            </FormField>
            <FormField label="Start Date & Time">
              <Input type="datetime-local" value={form.starts_at} onChange={(e) => update("starts_at", e.target.value)} />
            </FormField>
          </div>

          <FormField label="Venue Name">
            <Input value={form.venue_name} onChange={(e) => update("venue_name", e.target.value)} placeholder="Grand Ballroom Hotel" />
          </FormField>

          <FormField label="Venue Address">
            <Textarea value={form.venue_address} onChange={(e) => update("venue_address", e.target.value)} placeholder="123 Wedding Lane, KL" />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Dress Code">
              <Input value={form.dress_code} onChange={(e) => update("dress_code", e.target.value)} placeholder="Formal / Traditional" />
            </FormField>
            <FormField label="Capacity">
              <Input type="number" value={form.capacity} onChange={(e) => update("capacity", e.target.value)} placeholder="200" />
            </FormField>
          </div>

          <FormField label="Programme" hint="Event schedule or programme details">
            <Textarea value={form.programme} onChange={(e) => update("programme", e.target.value)} placeholder="11:00 AM - Arrival&#10;11:30 AM - Solemnization..." />
          </FormField>

          <FormField label="Maps URL">
            <Input value={form.maps_url} onChange={(e) => update("maps_url", e.target.value)} placeholder="https://maps.google.com/..." />
          </FormField>

          <FormField label="RSVP Deadline">
            <Input type="datetime-local" value={form.rsvp_deadline} onChange={(e) => update("rsvp_deadline", e.target.value)} />
          </FormField>

          <FormField label="Event Image">
            <ImageUpload value={form.image_url} onChange={(url) => update("image_url", url)} label="Upload event image" />
          </FormField>

          <FormField label="Notes" hint="Additional notes for guests">
            <Textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} placeholder="Parking available at basement level..." />
          </FormField>

          <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border)]/15">
            <div>
              <Label>Public Event</Label>
              <p className="font-ui text-xs text-[var(--color-text-muted)]">Visible to all invited guests</p>
            </div>
            <Toggle
              checked={form.visibility === "public"}
              onChange={(v) => update("visibility", v ? "public" : "private")}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="ghost" size="md" className="flex-1" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              className="flex-1"
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending || !form.name}
            >
              {createMutation.isPending || updateMutation.isPending ? "Saving..." : editingEvent ? "Save Changes" : "Create Event"}
            </Button>
          </div>
        </div>
      </Modal>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </AdminLayout>
  );
}
