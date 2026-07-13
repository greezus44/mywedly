import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Wedding, type WeddingEvent, type EventKind, type EventVisibility } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { SplitEditor, type DeviceType } from "../../components/preview/SplitEditor";
import { RsvpPreview } from "../../components/preview/PreviewRenderers";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, Select, Label } from "../../components/ui/Input";
import { Card, Badge, Modal, EmptyState } from "../../components/ui/index";
import { FormField } from "../../components/ui/ImageUpload";
import { formatDate, formatTime } from "../../lib/utils";
import { Plus, Pencil, Trash2, Calendar, Save } from "lucide-react";

interface EventForm {
  name: string;
  kind: EventKind;
  starts_at: string;
  venue_name: string;
  venue_address: string;
  dress_code: string;
  notes: string;
  visibility: EventVisibility;
  sort_order: number;
  description: string;
  maps_url: string;
  image_url: string;
  rsvp_deadline: string;
  capacity: string;
  programme: string;
}

const emptyForm: EventForm = {
  name: "",
  kind: "other",
  starts_at: "",
  venue_name: "",
  venue_address: "",
  dress_code: "",
  notes: "",
  visibility: "public",
  sort_order: 0,
  description: "",
  maps_url: "",
  image_url: "",
  rsvp_deadline: "",
  capacity: "",
  programme: "",
};

export function EventsPage() {
  const [device, setDevice] = useState<DeviceType>("desktop");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EventForm>(emptyForm);
  const [toast, setToast] = useState<string | null>(null);
  const qc = useQueryClient();

  const { data: wedding } = useQuery({
    queryKey: ["wedding"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { data } = await supabase.from("weddings").select("*").eq("created_by", user.user.id).maybeSingle();
      return data as Wedding | null;
    },
  });

  const { data: events, isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      if (!wedding) return [];
      const { data } = await supabase.from("events").select("*").eq("wedding_id", wedding.id).order("sort_order", { ascending: true });
      return (data || []) as WeddingEvent[];
    },
    enabled: !!wedding,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!wedding) throw new Error("No wedding");
      const { error } = await supabase.from("events").insert({
        wedding_id: wedding.id,
        name: form.name,
        kind: form.kind,
        starts_at: form.starts_at || null,
        venue_name: form.venue_name || null,
        venue_address: form.venue_address || null,
        dress_code: form.dress_code || null,
        notes: form.notes || null,
        visibility: form.visibility,
        sort_order: form.sort_order,
        description: form.description || null,
        maps_url: form.maps_url || null,
        image_url: form.image_url || null,
        rsvp_deadline: form.rsvp_deadline || null,
        capacity: form.capacity ? Number(form.capacity) : null,
        programme: form.programme || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events"] });
      setModalOpen(false);
      setForm(emptyForm);
      setToast("Event created");
      setTimeout(() => setToast(null), 2000);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingId) throw new Error("No event selected");
      const { error } = await supabase.from("events").update({
        name: form.name,
        kind: form.kind,
        starts_at: form.starts_at || null,
        venue_name: form.venue_name || null,
        venue_address: form.venue_address || null,
        dress_code: form.dress_code || null,
        notes: form.notes || null,
        visibility: form.visibility,
        sort_order: form.sort_order,
        description: form.description || null,
        maps_url: form.maps_url || null,
        image_url: form.image_url || null,
        rsvp_deadline: form.rsvp_deadline || null,
        capacity: form.capacity ? Number(form.capacity) : null,
        programme: form.programme || null,
      }).eq("id", editingId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events"] });
      setModalOpen(false);
      setEditingId(null);
      setForm(emptyForm);
      setToast("Event updated");
      setTimeout(() => setToast(null), 2000);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events"] });
      setToast("Event deleted");
      setTimeout(() => setToast(null), 2000);
    },
  });

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm, sort_order: events?.length || 0 });
    setModalOpen(true);
  };

  const openEdit = (event: WeddingEvent) => {
    setEditingId(event.id);
    setForm({
      name: event.name,
      kind: event.kind,
      starts_at: event.starts_at || "",
      venue_name: event.venue_name || "",
      venue_address: event.venue_address || "",
      dress_code: event.dress_code || "",
      notes: event.notes || "",
      visibility: event.visibility,
      sort_order: event.sort_order,
      description: event.description || "",
      maps_url: event.maps_url || "",
      image_url: event.image_url || "",
      rsvp_deadline: event.rsvp_deadline || "",
      capacity: event.capacity?.toString() || "",
      programme: event.programme || "",
    });
    setModalOpen(true);
  };

  const handleSubmit = () => {
    if (editingId) updateMutation.mutate();
    else createMutation.mutate();
  };

  const update = (patch: Partial<EventForm>) => setForm({ ...form, ...patch });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20 text-gray-500">Loading events...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Events</h2>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> Add Event
        </Button>
      </div>

      <SplitEditor device={device} onDeviceChange={setDevice} preview={(d) => <RsvpPreview wedding={wedding || null} device={d} />}>
        <div className="space-y-3">
          {events && events.length > 0 ? (
            events.map((event) => (
              <Card key={event.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{event.name}</h3>
                      <Badge variant="info">{event.kind}</Badge>
                      <Badge variant={event.visibility === "public" ? "success" : "default"}>{event.visibility}</Badge>
                    </div>
                    {event.starts_at && (
                      <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                        <Calendar className="h-3 w-3" /> {formatDate(event.starts_at)} · {formatTime(event.starts_at)}
                      </p>
                    )}
                    {event.venue_name && <p className="mt-1 text-sm text-gray-600">{event.venue_name}</p>}
                    {event.description && <p className="mt-1 text-sm text-gray-500 line-clamp-2">{event.description}</p>}
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(event)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(event.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card>
              <EmptyState icon={<Calendar className="h-10 w-10" />} title="No events yet" description="Click 'Add Event' to create your first event." />
            </Card>
          )}
        </div>
      </SplitEditor>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Edit Event" : "Add Event"}>
        <div className="space-y-4">
          <FormField label="Event Name">
            <Input value={form.name} onChange={(e) => update({ name: e.target.value })} placeholder="e.g. Wedding Reception" />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Event Type">
              <Select value={form.kind} onChange={(e) => update({ kind: e.target.value as EventKind })}>
                <option value="akad">Akad</option>
                <option value="resepsi">Resepsi</option>
                <option value="majlis">Majlis</option>
                <option value="other">Other</option>
              </Select>
            </FormField>
            <FormField label="Visibility">
              <Select value={form.visibility} onChange={(e) => update({ visibility: e.target.value as EventVisibility })}>
                <option value="public">Public</option>
                <option value="private">Private</option>
              </Select>
            </FormField>
          </div>
          <FormField label="Start Date & Time">
            <Input type="datetime-local" value={form.starts_at} onChange={(e) => update({ starts_at: e.target.value })} />
          </FormField>
          <FormField label="Venue Name">
            <Input value={form.venue_name} onChange={(e) => update({ venue_name: e.target.value })} placeholder="e.g. Grand Ballroom" />
          </FormField>
          <FormField label="Venue Address">
            <Textarea value={form.venue_address} onChange={(e) => update({ venue_address: e.target.value })} placeholder="Full address" />
          </FormField>
          <FormField label="Maps URL">
            <Input value={form.maps_url} onChange={(e) => update({ maps_url: e.target.value })} placeholder="Google Maps link" />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Dress Code">
              <Input value={form.dress_code} onChange={(e) => update({ dress_code: e.target.value })} placeholder="e.g. Formal" />
            </FormField>
            <FormField label="Capacity">
              <Input type="number" value={form.capacity} onChange={(e) => update({ capacity: e.target.value })} placeholder="e.g. 200" />
            </FormField>
          </div>
          <FormField label="RSVP Deadline">
            <Input type="datetime-local" value={form.rsvp_deadline} onChange={(e) => update({ rsvp_deadline: e.target.value })} />
          </FormField>
          <FormField label="Sort Order">
            <Input type="number" value={form.sort_order} onChange={(e) => update({ sort_order: Number(e.target.value) })} />
          </FormField>
          <FormField label="Description">
            <Textarea value={form.description} onChange={(e) => update({ description: e.target.value })} placeholder="Event description" />
          </FormField>
          <FormField label="Programme">
            <Textarea value={form.programme} onChange={(e) => update({ programme: e.target.value })} placeholder="Event programme details" />
          </FormField>
          <FormField label="Notes">
            <Textarea value={form.notes} onChange={(e) => update({ notes: e.target.value })} placeholder="Additional notes" />
          </FormField>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending || !form.name}>
              <Save className="mr-2 h-4 w-4" /> {editingId ? "Update" : "Create"}
            </Button>
          </div>
        </div>
      </Modal>

      {toast && (
        <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </AdminLayout>
  );
}
