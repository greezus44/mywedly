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
import { Plus, Pencil, Trash2, Save, Calendar } from "lucide-react";

export function EventsPage() {
  const [device, setDevice] = useState<DeviceType>("desktop");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<WeddingEvent | null>(null);
  const [form, setForm] = useState<Partial<WeddingEvent>>({});
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
    queryKey: ["events", wedding?.id],
    queryFn: async () => {
      if (!wedding) return [];
      const { data } = await supabase.from("events").select("*").eq("wedding_id", wedding.id).order("sort_order", { ascending: true });
      return (data || []) as WeddingEvent[];
    },
    enabled: !!wedding,
  });

  const createEvent = useMutation({
    mutationFn: async () => {
      if (!wedding) throw new Error("No wedding");
      const { error } = await supabase.from("events").insert({
        wedding_id: wedding.id,
        name: form.name || "Untitled Event",
        kind: (form.kind as EventKind) || "other",
        starts_at: form.starts_at || null,
        venue_name: form.venue_name || null,
        venue_address: form.venue_address || null,
        dress_code: form.dress_code || null,
        notes: form.notes || null,
        description: form.description || null,
        maps_url: form.maps_url || null,
        image_url: form.image_url || null,
        rsvp_deadline: form.rsvp_deadline || null,
        capacity: form.capacity || null,
        programme: form.programme || null,
        visibility: (form.visibility as EventVisibility) || "public",
        sort_order: form.sort_order || 0,
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["events"] }); setModalOpen(false); },
  });

  const updateEvent = useMutation({
    mutationFn: async () => {
      if (!editing) throw new Error("No event");
      const { error } = await supabase.from("events").update({
        name: form.name,
        kind: form.kind as EventKind,
        starts_at: form.starts_at || null,
        venue_name: form.venue_name || null,
        venue_address: form.venue_address || null,
        dress_code: form.dress_code || null,
        notes: form.notes || null,
        description: form.description || null,
        maps_url: form.maps_url || null,
        image_url: form.image_url || null,
        rsvp_deadline: form.rsvp_deadline || null,
        capacity: form.capacity || null,
        programme: form.programme || null,
        visibility: form.visibility as EventVisibility,
        sort_order: form.sort_order || 0,
      }).eq("id", editing.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["events"] }); setModalOpen(false); },
  });

  const deleteEvent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["events"] }),
  });

  const openCreate = () => { setEditing(null); setForm({ kind: "other", visibility: "public", sort_order: (events?.length || 0) + 1 }); setModalOpen(true); };
  const openEdit = (e: WeddingEvent) => { setEditing(e); setForm(e); setModalOpen(true); };
  const save = () => { if (editing) updateEvent.mutate(); else createEvent.mutate(); };

  return (
    <AdminLayout>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Events</h2>
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> Add Event</Button>
      </div>

      <SplitEditor device={device} onDeviceChange={setDevice} preview={(d) => <RsvpPreview wedding={wedding || null} device={d} />}>
        <div className="space-y-3">
          {isLoading && <p className="text-sm text-gray-500">Loading...</p>}
          {events && events.length === 0 && !isLoading && (
            <Card><EmptyState icon={<Calendar className="h-8 w-8" />} title="No events yet" description="Create your first event" /></Card>
          )}
          {events?.map((e) => (
            <Card key={e.id} className="space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">{e.name}</h3>
                  <p className="text-sm text-gray-500">{formatDate(e.starts_at)} {e.starts_at && `at ${formatTime(e.starts_at)}`}</p>
                  {e.venue_name && <p className="text-xs text-gray-400">{e.venue_name}</p>}
                </div>
                <div className="flex gap-2">
                  <Badge variant="info">{e.kind}</Badge>
                  <Badge variant={e.visibility === "public" ? "success" : "default"}>{e.visibility}</Badge>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline" onClick={() => openEdit(e)}><Pencil className="mr-1 h-3 w-3" /> Edit</Button>
                <Button size="sm" variant="danger" onClick={() => deleteEvent.mutate(e.id)}><Trash2 className="mr-1 h-3 w-3" /> Delete</Button>
              </div>
            </Card>
          ))}
        </div>
      </SplitEditor>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Event" : "Add Event"}>
        <div className="space-y-4">
          <FormField label="Event Name"><Input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Kind"><Select value={form.kind || "other"} onChange={(e) => setForm({ ...form, kind: e.target.value as EventKind })}><option value="akad">Akad</option><option value="resepsi">Resepsi</option><option value="majlis">Majlis</option><option value="other">Other</option></Select></FormField>
            <FormField label="Visibility"><Select value={form.visibility || "public"} onChange={(e) => setForm({ ...form, visibility: e.target.value as EventVisibility })}><option value="public">Public</option><option value="private">Private</option></Select></FormField>
          </div>
          <FormField label="Start Date & Time"><Input type="datetime-local" value={form.starts_at || ""} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} /></FormField>
          <FormField label="RSVP Deadline"><Input type="datetime-local" value={form.rsvp_deadline || ""} onChange={(e) => setForm({ ...form, rsvp_deadline: e.target.value })} /></FormField>
          <FormField label="Venue Name"><Input value={form.venue_name || ""} onChange={(e) => setForm({ ...form, venue_name: e.target.value })} /></FormField>
          <FormField label="Venue Address"><Textarea value={form.venue_address || ""} onChange={(e) => setForm({ ...form, venue_address: e.target.value })} /></FormField>
          <FormField label="Maps URL"><Input value={form.maps_url || ""} onChange={(e) => setForm({ ...form, maps_url: e.target.value })} /></FormField>
          <FormField label="Dress Code"><Input value={form.dress_code || ""} onChange={(e) => setForm({ ...form, dress_code: e.target.value })} /></FormField>
          <FormField label="Capacity"><Input type="number" value={form.capacity || ""} onChange={(e) => setForm({ ...form, capacity: e.target.value ? Number(e.target.value) : null })} /></FormField>
          <FormField label="Description"><Textarea value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></FormField>
          <FormField label="Programme"><Textarea value={form.programme || ""} onChange={(e) => setForm({ ...form, programme: e.target.value })} /></FormField>
          <FormField label="Notes"><Textarea value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></FormField>
          <FormField label="Image URL"><Input value={form.image_url || ""} onChange={(e) => setForm({ ...form, image_url: e.target.value })} /></FormField>
          <FormField label="Sort Order"><Input type="number" value={form.sort_order || 0} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} /></FormField>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={createEvent.isPending || updateEvent.isPending}><Save className="mr-2 h-4 w-4" /> {editing ? "Update" : "Create"}</Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}
