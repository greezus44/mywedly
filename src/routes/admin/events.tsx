import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Wedding, type WeddingEvent, type EventKind, type EventVisibility } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { SplitEditor, type DeviceType } from "../../components/preview/SplitEditor";
import { RsvpPreview } from "../../components/preview/PreviewRenderers";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, Select, Label, Toggle } from "../../components/ui/Input";
import { Card, Badge, Modal, EmptyState, Toast } from "../../components/ui/index";
import { ImageUpload, FormField } from "../../components/ui/ImageUpload";
import { formatDate, formatTime } from "../../lib/utils";
import { Plus, Pencil, Trash2, Calendar, MapPin, Clock, Save, Upload } from "lucide-react";

export function EventsPage() {
  const queryClient = useQueryClient();
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [events, setEvents] = useState<WeddingEvent[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<WeddingEvent | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [device, setDevice] = useState<DeviceType>("desktop");

  const [form, setForm] = useState({
    name: "", kind: "resepsi" as EventKind, starts_at: "", venue_name: "", venue_address: "",
    dress_code: "", notes: "", visibility: "public" as EventVisibility, description: "",
    maps_url: "", image_url: "", rsvp_deadline: "", capacity: "", programme: "",
  });

  const { data: user } = useQuery({
    queryKey: ["auth-user"],
    queryFn: async () => { const { data: { user } } = await supabase.auth.getUser(); return user; },
  });

  const { data: wed, isLoading, error } = useQuery({
    queryKey: ["wedding", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("weddings").select("*").eq("created_by", user!.id).maybeSingle();
      if (error) throw error;
      return data as Wedding | null;
    },
  });

  const { data: evData, refetch } = useQuery({
    queryKey: ["events", wed?.id],
    enabled: !!wed,
    queryFn: async () => {
      const { data, error } = await supabase.from("events").select("*").eq("wedding_id", wed!.id).order("sort_order", { ascending: true });
      if (error) throw error;
      return (data || []) as WeddingEvent[];
    },
  });

  useEffect(() => { if (wed) setWedding(wed); }, [wed]);
  useEffect(() => { if (evData) setEvents(evData); }, [evData]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editingEvent) {
        const { error } = await supabase.from("events").update({
          name: form.name, kind: form.kind, starts_at: form.starts_at || null, venue_name: form.venue_name || null,
          venue_address: form.venue_address || null, dress_code: form.dress_code || null, notes: form.notes || null,
          visibility: form.visibility, description: form.description || null, maps_url: form.maps_url || null,
          image_url: form.image_url || null, rsvp_deadline: form.rsvp_deadline || null,
          capacity: form.capacity ? Number(form.capacity) : null, programme: form.programme || null,
        }).eq("id", editingEvent.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("events").insert({
          wedding_id: wedding!.id, name: form.name, kind: form.kind, starts_at: form.starts_at || null,
          venue_name: form.venue_name || null, venue_address: form.venue_address || null, dress_code: form.dress_code || null,
          notes: form.notes || null, visibility: form.visibility, sort_order: events.length,
          description: form.description || null, maps_url: form.maps_url || null, image_url: form.image_url || null,
          rsvp_deadline: form.rsvp_deadline || null, capacity: form.capacity ? Number(form.capacity) : null,
          programme: form.programme || null,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ["events", wed?.id] });
      setModalOpen(false);
      setToast({ message: editingEvent ? "Event updated" : "Event created", type: "success" });
    },
    onError: (e) => setToast({ message: e.message, type: "error" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { refetch(); queryClient.invalidateQueries({ queryKey: ["events", wed?.id] }); setToast({ message: "Event deleted", type: "success" }); },
    onError: (e) => setToast({ message: e.message, type: "error" }),
  });

  const openCreate = () => {
    setEditingEvent(null);
    setForm({ name: "", kind: "resepsi", starts_at: "", venue_name: "", venue_address: "", dress_code: "", notes: "", visibility: "public", description: "", maps_url: "", image_url: "", rsvp_deadline: "", capacity: "", programme: "" });
    setModalOpen(true);
  };

  const openEdit = (ev: WeddingEvent) => {
    setEditingEvent(ev);
    setForm({
      name: ev.name, kind: ev.kind, starts_at: ev.starts_at || "", venue_name: ev.venue_name || "",
      venue_address: ev.venue_address || "", dress_code: ev.dress_code || "", notes: ev.notes || "",
      visibility: ev.visibility, description: ev.description || "", maps_url: ev.maps_url || "",
      image_url: ev.image_url || "", rsvp_deadline: ev.rsvp_deadline || "", capacity: ev.capacity?.toString() || "",
      programme: ev.programme || "",
    });
    setModalOpen(true);
  };

  if (isLoading) return <AdminLayout><div className="py-20 text-center text-gray-500">Loading…</div></AdminLayout>;
  if (error) return <AdminLayout><div className="py-20 text-center text-red-600">{error.message}</div></AdminLayout>;
  if (!wedding) return <AdminLayout><div className="py-20 text-center text-gray-500">No wedding found.</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Events</h2>
            <p className="text-sm text-gray-500">Manage your wedding events and ceremonies.</p>
          </div>
          <Button onClick={openCreate}><Plus className="mr-1.5 h-4 w-4" /> Add Event</Button>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            {events.length === 0 ? (
              <Card><EmptyState icon={<Calendar className="h-10 w-10" />} title="No events yet" description="Click 'Add Event' to create your first event." /></Card>
            ) : (
              events.map((ev) => (
                <Card key={ev.id}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-gray-900">{ev.name}</h3>
                        <Badge variant="default">{ev.kind}</Badge>
                        <Badge variant={ev.visibility === "public" ? "info" : "default"}>{ev.visibility}</Badge>
                      </div>
                      <div className="mt-2 space-y-1 text-sm text-gray-500">
                        {ev.starts_at && <p className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {formatDate(ev.starts_at)} · {formatTime(ev.starts_at)}</p>}
                        {ev.venue_name && <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {ev.venue_name}</p>}
                        {ev.capacity && <p className="text-xs">Capacity: {ev.capacity}</p>}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(ev)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => { if (confirm("Delete this event?")) deleteMutation.mutate(ev.id); }}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>

          <div className="hidden lg:block">
            <SplitEditor device={device} onDeviceChange={setDevice} preview={(d) => <RsvpPreview wedding={wedding} device={d} />}><div /></SplitEditor>
          </div>
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingEvent ? "Edit Event" : "New Event"}>
        <div className="space-y-4">
          <FormField label="Event Name">
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Wedding Reception" />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <Select label="Event Type" value={form.kind} onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value as EventKind }))}>
              <option value="akad">Akad</option>
              <option value="resepsi">Resepsi</option>
              <option value="majlis">Majlis</option>
              <option value="other">Other</option>
            </Select>
            <Select label="Visibility" value={form.visibility} onChange={(e) => setForm((f) => ({ ...f, visibility: e.target.value as EventVisibility }))}>
              <option value="public">Public</option>
              <option value="private">Private</option>
            </Select>
          </div>
          <FormField label="Start Date & Time">
            <Input type="datetime-local" value={form.starts_at} onChange={(e) => setForm((f) => ({ ...f, starts_at: e.target.value }))} />
          </FormField>
          <FormField label="RSVP Deadline">
            <Input type="datetime-local" value={form.rsvp_deadline} onChange={(e) => setForm((f) => ({ ...f, rsvp_deadline: e.target.value }))} />
          </FormField>
          <FormField label="Venue Name">
            <Input value={form.venue_name} onChange={(e) => setForm((f) => ({ ...f, venue_name: e.target.value }))} placeholder="Grand Ballroom" />
          </FormField>
          <FormField label="Venue Address">
            <Textarea value={form.venue_address} onChange={(e) => setForm((f) => ({ ...f, venue_address: e.target.value }))} placeholder="123 Main Street, City" />
          </FormField>
          <FormField label="Maps URL">
            <Input value={form.maps_url} onChange={(e) => setForm((f) => ({ ...f, maps_url: e.target.value }))} placeholder="https://maps.google.com/…" />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Capacity">
              <Input type="number" value={form.capacity} onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))} placeholder="200" />
            </FormField>
            <FormField label="Dress Code">
              <Input value={form.dress_code} onChange={(e) => setForm((f) => ({ ...f, dress_code: e.target.value }))} placeholder="Formal" />
            </FormField>
          </div>
          <FormField label="Description">
            <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Event description…" />
          </FormField>
          <FormField label="Programme">
            <Textarea value={form.programme} onChange={(e) => setForm((f) => ({ ...f, programme: e.target.value }))} placeholder="Event programme…" />
          </FormField>
          <FormField label="Event Image">
            <ImageUpload value={form.image_url || null} onChange={(url) => setForm((f) => ({ ...f, image_url: url || "" }))} />
          </FormField>
          <FormField label="Notes">
            <Textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Additional notes…" />
          </FormField>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !form.name}>{editingEvent ? "Update" : "Create"}</Button>
          </div>
        </div>
      </Modal>
      {toast && <Toast message={toast.message} type={toast.type} />}
    </AdminLayout>
  );
}
