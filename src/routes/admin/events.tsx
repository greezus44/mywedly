import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Pencil,
  Trash2,
  CalendarDays,
  MapPin,
  Clock,
  Users,
  X,
} from "lucide-react";
import {
  supabase,
  type Wedding,
  type WeddingEvent,
  type EventKind,
  type EventVisibility,
} from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { RsvpPreview } from "../../components/preview/PreviewRenderers";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, Label, Select, Toggle } from "../../components/ui/Input";
import { ImageUpload, FormField } from "../../components/ui/ImageUpload";
import { Card, Badge, Modal, EmptyState, Toast } from "../../components/ui/index";
import { formatDate, formatTime, cn } from "../../lib/utils";
import { useLang } from "../../lib/lang-context";

const EVENT_KINDS: { value: EventKind; label: string }[] = [
  { value: "ceremony", label: "Ceremony" },
  { value: "reception", label: "Reception" },
  { value: "welcome", label: "Welcome Party" },
  { value: "rehearsal", label: "Rehearsal" },
  { value: "brunch", label: "Brunch" },
  { value: "cultural", label: "Cultural" },
  { value: "other", label: "Other" },
];

interface EventFormData {
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

const EMPTY_FORM: EventFormData = {
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
  const { lang } = useLang();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<EventFormData>(EMPTY_FORM);

  const { data: wedding, isLoading: weddingLoading } = useQuery({
    queryKey: ["wedding"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("weddings")
        .select("*")
        .eq("created_by", user.user.id)
        .single();
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
        .order("starts_at", { ascending: true });
      if (error) throw error;
      return data as WeddingEvent[];
    },
    enabled: !!wedding,
  });

  const createMutation = useMutation({
    mutationFn: async (data: EventFormData) => {
      if (!wedding) throw new Error("No wedding");
      const maxSort = events.length > 0 ? Math.max(...events.map((e) => e.sort_order)) : 0;
      const payload = {
        wedding_id: wedding.id,
        name: data.name,
        kind: data.kind,
        starts_at: data.starts_at || null,
        venue_name: data.venue_name || null,
        venue_address: data.venue_address || null,
        dress_code: data.dress_code || null,
        programme: data.programme || null,
        notes: data.notes || null,
        maps_url: data.maps_url || null,
        image_url: data.image_url,
        rsvp_deadline: data.rsvp_deadline || null,
        capacity: data.capacity ? parseInt(data.capacity) : null,
        visibility: data.visibility,
        sort_order: maxSort + 1,
      };
      const { error } = await supabase.from("events").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      setToast({ message: "Event created!", type: "success" });
      setShowForm(false);
      setFormData(EMPTY_FORM);
    },
    onError: () => setToast({ message: "Failed to create event", type: "error" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: EventFormData }) => {
      const payload = {
        name: data.name,
        kind: data.kind,
        starts_at: data.starts_at || null,
        venue_name: data.venue_name || null,
        venue_address: data.venue_address || null,
        dress_code: data.dress_code || null,
        programme: data.programme || null,
        notes: data.notes || null,
        maps_url: data.maps_url || null,
        image_url: data.image_url,
        rsvp_deadline: data.rsvp_deadline || null,
        capacity: data.capacity ? parseInt(data.capacity) : null,
        visibility: data.visibility,
      };
      const { error } = await supabase.from("events").update(payload).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      setToast({ message: "Event updated!", type: "success" });
      setShowForm(false);
      setEditingId(null);
      setFormData(EMPTY_FORM);
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

  const handleEdit = (event: WeddingEvent) => {
    setEditingId(event.id);
    setFormData({
      name: event.name,
      kind: event.kind,
      starts_at: event.starts_at ? event.starts_at.slice(0, 16) : "",
      venue_name: event.venue_name || "",
      venue_address: event.venue_address || "",
      dress_code: event.dress_code || "",
      programme: event.programme || "",
      notes: event.notes || "",
      maps_url: event.maps_url || "",
      image_url: event.image_url,
      rsvp_deadline: event.rsvp_deadline ? event.rsvp_deadline.slice(0, 16) : "",
      capacity: event.capacity?.toString() || "",
      visibility: event.visibility,
    });
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      setToast({ message: "Event name is required", type: "error" });
      return;
    }
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this event?")) {
      deleteMutation.mutate(id);
    }
  };

  const isLoading = weddingLoading || eventsLoading;

  if (isLoading || !wedding) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <p className="font-ui text-sm text-[var(--color-text-muted)]">Loading events...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <SplitEditor title="Events Manager" preview={<RsvpPreview wedding={wedding} events={events} />}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading text-2xl text-[var(--color-text)] mb-1">Events</h2>
              <p className="font-ui text-sm text-[var(--color-text-muted)]">
                {events.length} {events.length === 1 ? "event" : "events"} configured
              </p>
            </div>
            <Button variant="primary" size="sm" onClick={handleAdd}>
              <Plus size={14} className="mr-1.5" /> Add
            </Button>
          </div>

          {events.length === 0 && !showForm ? (
            <EmptyState
              icon={<CalendarDays size={32} />}
              title="No events yet"
              description="Add your ceremony, reception, and other events for guests to RSVP to."
              action={
                <Button variant="primary" size="sm" onClick={handleAdd}>
                  <Plus size={14} className="mr-1.5" /> Add Event
                </Button>
              }
            />
          ) : (
            <div className="space-y-3">
              {events.map((event) => (
                <Card key={event.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-heading text-base text-[var(--color-text)]">{event.name}</h3>
                        <Badge>{event.kind}</Badge>
                        {event.visibility === "private" && (
                          <Badge variant="warning">Private</Badge>
                        )}
                      </div>
                      {event.starts_at && (
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-ui text-xs text-[var(--color-text-muted)] flex items-center gap-1">
                            <CalendarDays size={12} />
                            {formatDate(event.starts_at, lang)}
                          </span>
                          <span className="font-ui text-xs text-[var(--color-text-muted)] flex items-center gap-1">
                            <Clock size={12} />
                            {formatTime(event.starts_at, lang)}
                          </span>
                        </div>
                      )}
                      {event.venue_name && (
                        <p className="font-ui text-xs text-[var(--color-text-muted)] flex items-center gap-1">
                          <MapPin size={12} />
                          {event.venue_name}
                        </p>
                      )}
                      {event.capacity && (
                        <p className="font-ui text-xs text-[var(--color-text-muted)] flex items-center gap-1 mt-1">
                          <Users size={12} />
                          Capacity: {event.capacity}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleEdit(event)}
                        className="p-2 rounded-lg hover:bg-[var(--color-bg-light)] text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(event.id)}
                        className="p-2 rounded-lg hover:bg-red-50 text-[var(--color-text-muted)] hover:text-[var(--color-error)] transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </SplitEditor>

      {/* Event Form Modal */}
      <Modal
        open={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingId(null);
          setFormData(EMPTY_FORM);
        }}
        title={editingId ? "Edit Event" : "New Event"}
        maxWidth="max-w-xl"
      >
        <div className="space-y-4">
          <FormField label="Event Name" hint="e.g. Akad Nikah, Wedding Reception">
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Event name"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Event Type">
              <Select
                value={formData.kind}
                onChange={(e) => setFormData({ ...formData, kind: e.target.value as EventKind })}
              >
                {EVENT_KINDS.map((k) => (
                  <option key={k.value} value={k.value}>
                    {k.label}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Start Date & Time">
              <Input
                type="datetime-local"
                value={formData.starts_at}
                onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
              />
            </FormField>
          </div>

          <FormField label="Venue Name">
            <Input
              value={formData.venue_name}
              onChange={(e) => setFormData({ ...formData, venue_name: e.target.value })}
              placeholder="e.g. Grand Ballroom Hotel"
            />
          </FormField>

          <FormField label="Venue Address">
            <Textarea
              value={formData.venue_address}
              onChange={(e) => setFormData({ ...formData, venue_address: e.target.value })}
              placeholder="Full address of the venue"
              className="min-h-[80px]"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Dress Code">
              <Input
                value={formData.dress_code}
                onChange={(e) => setFormData({ ...formData, dress_code: e.target.value })}
                placeholder="e.g. Formal, Smart Casual"
              />
            </FormField>
            <FormField label="Capacity">
              <Input
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                placeholder="e.g. 200"
              />
            </FormField>
          </div>

          <FormField label="Programme" hint="Schedule or programme details">
            <Textarea
              value={formData.programme}
              onChange={(e) => setFormData({ ...formData, programme: e.target.value })}
              placeholder="e.g. 6:00 PM - Arrival&#10;6:30 PM - Ceremony&#10;7:30 PM - Dinner"
              className="min-h-[100px]"
            />
          </FormField>

          <FormField label="Notes" hint="Additional notes for guests">
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Parking info, gift preferences, etc."
              className="min-h-[80px]"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Maps URL">
              <Input
                value={formData.maps_url}
                onChange={(e) => setFormData({ ...formData, maps_url: e.target.value })}
                placeholder="https://maps.google.com/..."
              />
            </FormField>
            <FormField label="RSVP Deadline">
              <Input
                type="datetime-local"
                value={formData.rsvp_deadline}
                onChange={(e) => setFormData({ ...formData, rsvp_deadline: e.target.value })}
              />
            </FormField>
          </div>

          <FormField label="Event Image">
            <ImageUpload
              value={formData.image_url}
              onChange={(v) => setFormData({ ...formData, image_url: v })}
              label="Event Cover Image"
            />
          </FormField>

          <div className="flex items-center justify-between p-3 rounded-lg border border-[var(--color-border)]/15">
            <div>
              <p className="font-ui text-sm text-[var(--color-text)]">Visibility</p>
              <p className="font-ui text-xs text-[var(--color-text-muted)]">
                {formData.visibility === "public" ? "All guests can see" : "Only invited guests"}
              </p>
            </div>
            <Toggle
              checked={formData.visibility === "public"}
              onChange={(v) => setFormData({ ...formData, visibility: v ? "public" : "private" })}
              label={formData.visibility === "public" ? "Public" : "Private"}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
                setFormData(EMPTY_FORM);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending
                ? "Saving..."
                : editingId
                ? "Update Event"
                : "Create Event"}
            </Button>
          </div>
        </div>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </AdminLayout>
  );
}
