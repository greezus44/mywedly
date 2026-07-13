import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Wedding, type WeddingEvent, type EventKind, type EventVisibility } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { RsvpPreview } from "../../components/preview/PreviewRenderers";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, Select } from "../../components/ui/Input";
import { Card, Badge, Modal, EmptyState, Toast } from "../../components/ui/index";
import { FormField } from "../../components/ui/ImageUpload";
import { formatDate, formatTime } from "../../lib/utils";
import { Save, Calendar, Plus, Pencil, Trash2, Clock, MapPin } from "lucide-react";

const EVENT_KINDS: { value: EventKind; label: string }[] = [
  { value: "ceremony", label: "Ceremony" },
  { value: "reception", label: "Reception" },
  { value: "welcome", label: "Welcome" },
  { value: "rehearsal", label: "Rehearsal" },
  { value: "brunch", label: "Brunch" },
  { value: "cultural", label: "Cultural" },
  { value: "other", label: "Other" },
];

export function EventsPage() {
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<WeddingEvent | null>(null);
  const [showModal, setShowModal] = useState(false);

  const { data: wedding, isLoading } = useQuery({
    queryKey: ["wedding"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { data, error } = await supabase.from("weddings").select("*").eq("created_by", user.user.id).single();
      if (error) throw error;
      return data as Wedding;
    },
  });

  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ["events", wedding?.id],
    queryFn: async () => {
      if (!wedding) return [];
      const { data } = await supabase.from("events").select("*").eq("wedding_id", wedding.id).order("sort_order");
      return (data || []) as WeddingEvent[];
    },
    enabled: !!wedding,
  });

  const createEvent = useMutation({
    mutationFn: async (event: Omit<WeddingEvent, "id" | "created_at">) => {
      const { error } = await supabase.from("events").insert(event);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["events"] }); setToast("Event created"); setShowModal(false); },
  });

  const updateEvent = useMutation({
    mutationFn: async ({ id, ...event }: Partial<WeddingEvent> & { id: string }) => {
      const { error } = await supabase.from("events").update(event).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["events"] }); setToast("Event updated"); setShowModal(false); },
  });

  const deleteEvent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["events"] }); setToast("Event deleted"); },
  });

  if (isLoading) return <AdminLayout><div className="flex items-center justify-center h-full"><div className="animate-pulse text-gray-400">Loading...</div></div></AdminLayout>;
  if (!wedding) return <AdminLayout><div className="p-6 text-gray-500">Wedding not found</div></AdminLayout>;

  const handleAdd = () => {
    setEditingEvent(null);
    setShowModal(true);
  };

  const handleEdit = (event: WeddingEvent) => {
    setEditingEvent(event);
    setShowModal(true);
  };

  const handleSave = (formData: Record<string, string>) => {
    const eventData = {
      wedding_id: wedding.id,
      name: formData.name || "Untitled Event",
      kind: (formData.kind || "ceremony") as EventKind,
      starts_at: formData.starts_at || null,
      venue_name: formData.venue_name || null,
      venue_address: formData.venue_address || null,
      dress_code: formData.dress_code || null,
      notes: formData.notes || null,
      visibility: (formData.visibility || "public") as EventVisibility,
      sort_order: Number(formData.sort_order) || 0,
      description: formData.description || null,
      maps_url: formData.maps_url || null,
      image_url: formData.image_url || null,
      capacity: formData.capacity ? Number(formData.capacity) : null,
      programme: formData.programme || null,
      rsvp_deadline: formData.rsvp_deadline || null,
    };

    if (editingEvent) {
      updateEvent.mutate({ id: editingEvent.id, ...eventData });
    } else {
      createEvent.mutate(eventData);
    }
  };

  return (
    <AdminLayout>
      <SplitEditor title="Events Manager" preview={<RsvpPreview wedding={wedding} events={events || []} />}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-indigo-600" />
              <h2 className="font-ui text-base font-semibold text-gray-900">Events</h2>
            </div>
            <Button variant="primary" size="sm" onClick={handleAdd}>
              <Plus size={14} className="mr-1" /> Add Event
            </Button>
          </div>

          {eventsLoading ? (
            <div className="text-center py-8 text-gray-400 font-ui text-sm">Loading events...</div>
          ) : events && events.length > 0 ? (
            <div className="space-y-3">
              {events.map((event) => (
                <Card key={event.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-ui text-sm font-semibold text-gray-900">{event.name}</h3>
                        <Badge variant="default">{event.kind}</Badge>
                        <Badge variant={event.visibility === "public" ? "success" : "warning"}>{event.visibility}</Badge>
                      </div>
                      {event.starts_at && (
                        <div className="flex items-center gap-1.5 font-ui text-xs text-gray-500 mb-1">
                          <Clock size={12} />
                          {formatDate(event.starts_at)} at {formatTime(event.starts_at)}
                        </div>
                      )}
                      {event.venue_name && (
                        <div className="flex items-center gap-1.5 font-ui text-xs text-gray-500">
                          <MapPin size={12} />
                          {event.venue_name}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleEdit(event)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"><Pencil size={14} className="text-gray-500" /></button>
                      <button onClick={() => { if (confirm("Delete this event?")) deleteEvent.mutate(event.id); }} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14} className="text-red-500" /></button>
                    </div>
                  </div>
                  {event.description && <p className="font-ui text-xs text-gray-500 mt-2">{event.description}</p>}
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState icon={<Calendar size={48} />} title="No events yet" description="Add your wedding events so guests can RSVP to them." action={<Button variant="primary" size="sm" onClick={handleAdd}><Plus size={14} className="mr-1" /> Add Event</Button>} />
          )}
        </div>
      </SplitEditor>

      {showModal && (
        <EventModal event={editingEvent} onClose={() => setShowModal(false)} onSave={handleSave} />
      )}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </AdminLayout>
  );
}

function EventModal({ event, onClose, onSave }: { event: WeddingEvent | null; onClose: () => void; onSave: (data: Record<string, string>) => void }) {
  const [form, setForm] = useState<Record<string, string>>({
    name: event?.name || "",
    kind: event?.kind || "ceremony",
    starts_at: event?.starts_at ? new Date(event.starts_at).toISOString().slice(0, 16) : "",
    venue_name: event?.venue_name || "",
    venue_address: event?.venue_address || "",
    dress_code: event?.dress_code || "",
    notes: event?.notes || "",
    visibility: event?.visibility || "public",
    sort_order: String(event?.sort_order || 0),
    description: event?.description || "",
    maps_url: event?.maps_url || "",
    image_url: event?.image_url || "",
    capacity: event?.capacity ? String(event.capacity) : "",
    programme: event?.programme || "",
  });

  const set = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <Modal open onClose={onClose} title={event ? "Edit Event" : "Add Event"} maxWidth="max-w-xl">
      <div className="space-y-4">
        <FormField label="Event Name"><Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Akad Nikah" className="!bg-white !border-gray-200 !text-gray-700" /></FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Event Type">
            <Select value={form.kind} onChange={(e) => set("kind", e.target.value)} className="!bg-white !border-gray-200 !text-gray-700">
              {EVENT_KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
            </Select>
          </FormField>
          <FormField label="Visibility">
            <Select value={form.visibility} onChange={(e) => set("visibility", e.target.value)} className="!bg-white !border-gray-200 !text-gray-700">
              <option value="public">Public</option>
              <option value="private">Private</option>
            </Select>
          </FormField>
        </div>
        <FormField label="Date & Time"><Input type="datetime-local" value={form.starts_at} onChange={(e) => set("starts_at", e.target.value)} className="!bg-white !border-gray-200 !text-gray-700" /></FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Venue Name"><Input value={form.venue_name} onChange={(e) => set("venue_name", e.target.value)} placeholder="Venue name" className="!bg-white !border-gray-200 !text-gray-700" /></FormField>
          <FormField label="Capacity"><Input type="number" value={form.capacity} onChange={(e) => set("capacity", e.target.value)} placeholder="Max guests" className="!bg-white !border-gray-200 !text-gray-700" /></FormField>
        </div>
        <FormField label="Venue Address"><Textarea value={form.venue_address} onChange={(e) => set("venue_address", e.target.value)} placeholder="Full address" className="!bg-white !border-gray-200 !text-gray-700" /></FormField>
        <FormField label="Maps URL"><Input value={form.maps_url} onChange={(e) => set("maps_url", e.target.value)} placeholder="Google Maps link" className="!bg-white !border-gray-200 !text-gray-700" /></FormField>
        <FormField label="Dress Code"><Input value={form.dress_code} onChange={(e) => set("dress_code", e.target.value)} placeholder="e.g. Formal / Smart Casual" className="!bg-white !border-gray-200 !text-gray-700" /></FormField>
        <FormField label="Description"><Textarea value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Event description" className="!bg-white !border-gray-200 !text-gray-700" /></FormField>
        <FormField label="Programme"><Textarea value={form.programme} onChange={(e) => set("programme", e.target.value)} placeholder="Event programme details" className="!bg-white !border-gray-200 !text-gray-700" /></FormField>
        <FormField label="Notes"><Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Additional notes" className="!bg-white !border-gray-200 !text-gray-700" /></FormField>
        <FormField label="Sort Order"><Input type="number" value={form.sort_order} onChange={(e) => set("sort_order", e.target.value)} className="!bg-white !border-gray-200 !text-gray-700" /></FormField>
        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
          <Button variant="outline" size="md" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="md" onClick={() => onSave(form)}><Save size={14} className="mr-1" /> {event ? "Update" : "Create"}</Button>
        </div>
      </div>
    </Modal>
  );
}
