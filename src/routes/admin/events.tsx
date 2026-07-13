import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Wedding, type WeddingEvent, type EventKind, type EventVisibility } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { RsvpPreview } from "../../components/preview/PreviewRenderers";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, Select, Toggle } from "../../components/ui/Input";
import { Card, Badge, Modal, EmptyState, Toast } from "../../components/ui/index";
import { ImageUpload, FormField } from "../../components/ui/ImageUpload";
import { formatDate, formatTime } from "../../lib/utils";
import { Plus, Pencil, Trash2, Calendar } from "lucide-react";

const EMPTY_EVENT: Partial<WeddingEvent> = {
  name: "", kind: "ceremony", starts_at: "", venue_name: "", venue_address: "", dress_code: "",
  notes: "", visibility: "public", sort_order: 0, description: "", maps_url: "", image_url: null,
  rsvp_deadline: "", capacity: null, programme: "",
};

export function EventsPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Partial<WeddingEvent> | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const { data: wedding, isLoading: wLoading, error: wError } = useQuery<Wedding>({
    queryKey: ["wedding"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { data, error } = await supabase.from("weddings").select("*").eq("created_by", user.user.id).single();
      if (error) throw error;
      return data as Wedding;
    },
  });

  const { data: events = [], isLoading: eLoading } = useQuery<WeddingEvent[]>({
    queryKey: ["events", wedding?.id],
    queryFn: async () => {
      if (!wedding) return [];
      const { data } = await supabase.from("events").select("*").eq("wedding_id", wedding.id).order("sort_order", { ascending: true });
      return (data || []) as WeddingEvent[];
    },
    enabled: !!wedding,
  });

  const createMutation = useMutation({
    mutationFn: async (ev: Partial<WeddingEvent>) => {
      if (!wedding) throw new Error("No wedding");
      const { error } = await supabase.from("events").insert({ ...ev, wedding_id: wedding.id });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["events", wedding?.id] }); setToast({ message: "Event created", type: "success" }); setModalOpen(false); },
    onError: () => setToast({ message: "Failed to create event", type: "error" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...ev }: Partial<WeddingEvent> & { id: string }) => {
      const { error } = await supabase.from("events").update(ev).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["events", wedding?.id] }); setToast({ message: "Event updated", type: "success" }); setModalOpen(false); },
    onError: () => setToast({ message: "Failed to update event", type: "error" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["events", wedding?.id] }); setToast({ message: "Event deleted", type: "success" }); },
    onError: () => setToast({ message: "Failed to delete event", type: "error" }),
  });

  const openCreate = () => { setEditing({ ...EMPTY_EVENT }); setModalOpen(true); };
  const openEdit = (ev: WeddingEvent) => { setEditing({ ...ev }); setModalOpen(true); };
  const handleSave = () => {
    if (!editing) return;
    if (editing.id) updateMutation.mutate(editing as WeddingEvent);
    else createMutation.mutate(editing);
  };

  if (wLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full p-8">
          <p className="font-ui text-sm text-gray-500">Loading events...</p>
        </div>
      </AdminLayout>
    );
  }

  if (wError || !wedding) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full p-8">
          <p className="font-ui text-sm text-red-500">Unable to load wedding data.</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200">
          <h1 className="font-ui text-base font-semibold text-gray-900">Events</h1>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white font-ui text-xs font-medium uppercase tracking-wider rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus size={14} /> Add Event
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          <SplitEditor title="Events & RSVP Preview" preview={<RsvpPreview wedding={wedding} events={events} />}>
            {eLoading ? (
              <p className="font-ui text-sm text-gray-500">Loading events...</p>
            ) : events.length === 0 ? (
              <EmptyState
                icon={<Calendar size={40} />}
                title="No events yet"
                description="Create your first event to manage RSVPs and schedules."
                action={<Button variant="outline" size="sm" onClick={openCreate}><Plus size={14} className="mr-1.5" /> Add Event</Button>}
              />
            ) : (
              <div className="space-y-3">
                {events.map((event) => (
                  <Card key={event.id} className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-ui text-sm font-semibold text-gray-900">{event.name}</h3>
                          <Badge variant="default">{event.kind}</Badge>
                          {event.visibility === "private" && <Badge variant="warning">Private</Badge>}
                        </div>
                        <p className="font-ui text-xs text-gray-500">
                          {formatDate(event.starts_at)}{event.starts_at && ` · ${formatTime(event.starts_at)}`}
                        </p>
                        {event.venue_name && <p className="font-ui text-xs text-gray-500 mt-1">{event.venue_name}</p>}
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(event)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Pencil size={14} /></button>
                        <button onClick={() => deleteMutation.mutate(event.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14} /></button>
                      </div>
                    </div>
                    {event.capacity && <p className="font-ui text-xs text-gray-400 mt-1">Capacity: {event.capacity}</p>}
                  </Card>
                ))}
              </div>
            )}
          </SplitEditor>
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing?.id ? "Edit Event" : "New Event"} maxWidth="max-w-xl">
        {editing && (
          <div className="space-y-4">
            <FormField label="Event Name">
              <Input value={editing.name || ""} onChange={(e) => setEditing((p) => ({ ...p, name: e.target.value }))} placeholder="Akad Nikah" />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Type">
                <Select value={editing.kind || "ceremony"} onChange={(e) => setEditing((p) => ({ ...p, kind: e.target.value as EventKind }))}>
                  <option value="ceremony">Ceremony</option>
                  <option value="reception">Reception</option>
                  <option value="welcome">Welcome</option>
                  <option value="rehearsal">Rehearsal</option>
                  <option value="brunch">Brunch</option>
                  <option value="cultural">Cultural</option>
                  <option value="other">Other</option>
                </Select>
              </FormField>
              <FormField label="Visibility">
                <Select value={editing.visibility || "public"} onChange={(e) => setEditing((p) => ({ ...p, visibility: e.target.value as EventVisibility }))}>
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </Select>
              </FormField>
            </div>
            <FormField label="Date & Time">
              <Input type="datetime-local" value={editing.starts_at ? editing.starts_at.slice(0, 16) : ""} onChange={(e) => setEditing((p) => ({ ...p, starts_at: e.target.value }))} />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Venue Name">
                <Input value={editing.venue_name || ""} onChange={(e) => setEditing((p) => ({ ...p, venue_name: e.target.value }))} placeholder="Grand Ballroom" />
              </FormField>
              <FormField label="Capacity">
                <Input type="number" value={editing.capacity ?? ""} onChange={(e) => setEditing((p) => ({ ...p, capacity: e.target.value ? parseInt(e.target.value) : null }))} placeholder="200" />
              </FormField>
            </div>
            <FormField label="Venue Address">
              <Input value={editing.venue_address || ""} onChange={(e) => setEditing((p) => ({ ...p, venue_address: e.target.value }))} placeholder="123 Wedding Lane" />
            </FormField>
            <FormField label="Maps URL">
              <Input value={editing.maps_url || ""} onChange={(e) => setEditing((p) => ({ ...p, maps_url: e.target.value }))} placeholder="https://maps.google.com/..." />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Dress Code">
                <Input value={editing.dress_code || ""} onChange={(e) => setEditing((p) => ({ ...p, dress_code: e.target.value }))} placeholder="Formal" />
              </FormField>
              <FormField label="RSVP Deadline">
                <Input type="datetime-local" value={editing.rsvp_deadline ? editing.rsvp_deadline.slice(0, 16) : ""} onChange={(e) => setEditing((p) => ({ ...p, rsvp_deadline: e.target.value }))} />
              </FormField>
            </div>
            <FormField label="Sort Order">
              <Input type="number" value={editing.sort_order ?? 0} onChange={(e) => setEditing((p) => ({ ...p, sort_order: parseInt(e.target.value) || 0 }))} />
            </FormField>
            <FormField label="Description">
              <Textarea value={editing.description || ""} onChange={(e) => setEditing((p) => ({ ...p, description: e.target.value }))} placeholder="Event description" />
            </FormField>
            <FormField label="Programme">
              <Textarea value={editing.programme || ""} onChange={(e) => setEditing((p) => ({ ...p, programme: e.target.value }))} placeholder="Event programme details" />
            </FormField>
            <FormField label="Event Image">
              <ImageUpload value={editing.image_url || null} onChange={(url) => setEditing((p) => ({ ...p, image_url: url }))} />
            </FormField>
            <FormField label="Notes">
              <Textarea value={editing.notes || ""} onChange={(e) => setEditing((p) => ({ ...p, notes: e.target.value }))} placeholder="Internal notes" />
            </FormField>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)}>Cancel</Button>
              <button
                onClick={handleSave}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-indigo-600 text-white font-ui text-xs font-medium uppercase tracking-wider rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {editing.id ? "Update" : "Create"}
              </button>
            </div>
          </div>
        )}
      </Modal>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </AdminLayout>
  );
}
