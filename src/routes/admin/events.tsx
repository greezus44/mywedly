import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Wedding, type WeddingEvent, type EventKind, type EventVisibility } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { SplitEditor, type DeviceType } from "../../components/preview/SplitEditor";
import { RsvpPreview } from "../../components/preview/PreviewRenderers";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, Select, Label } from "../../components/ui/Input";
import { Card, Badge, Modal, EmptyState } from "../../components/ui/index";
import { formatDate, formatTime } from "../../lib/utils";
import { Plus, Pencil, Trash2, Calendar, MapPin, Clock } from "lucide-react";

export function EventsPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<WeddingEvent | null>(null);
  const [form, setForm] = useState<Partial<WeddingEvent>>({});
  const [toast, setToast] = useState<string | null>(null);

  const { data: user } = useQuery({
    queryKey: ["auth-user"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user;
    },
  });

  const { data: wedding } = useQuery({
    queryKey: ["wedding", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from("weddings").select("*").eq("created_by", user.id).maybeSingle();
      return data as Wedding | null;
    },
    enabled: !!user,
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

  useEffect(() => {
    if (editingEvent) {
      setForm(editingEvent);
    } else {
      setForm({ kind: "resepsi", visibility: "public", sort_order: (events?.length || 0) + 1 });
    }
  }, [editingEvent, events]);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!wedding) throw new Error("No wedding");
      const { error } = await supabase.from("events").insert({
        wedding_id: wedding.id,
        name: form.name || "Untitled Event",
        kind: form.kind || "resepsi",
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
        visibility: form.visibility || "public",
        sort_order: form.sort_order || (events?.length || 0) + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events", wedding?.id] });
      setModalOpen(false);
      setEditingEvent(null);
      setToast("Event created");
      setTimeout(() => setToast(null), 2000);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingEvent) throw new Error("No event");
      const { error } = await supabase.from("events").update({
        name: form.name,
        kind: form.kind,
        starts_at: form.starts_at,
        venue_name: form.venue_name,
        venue_address: form.venue_address,
        dress_code: form.dress_code,
        notes: form.notes,
        description: form.description,
        maps_url: form.maps_url,
        image_url: form.image_url,
        rsvp_deadline: form.rsvp_deadline,
        capacity: form.capacity,
        programme: form.programme,
        visibility: form.visibility,
        sort_order: form.sort_order,
      }).eq("id", editingEvent.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events", wedding?.id] });
      setModalOpen(false);
      setEditingEvent(null);
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
      queryClient.invalidateQueries({ queryKey: ["events", wedding?.id] });
      setToast("Event deleted");
      setTimeout(() => setToast(null), 2000);
    },
  });

  const handleSubmit = () => {
    if (editingEvent) updateMutation.mutate();
    else createMutation.mutate();
  };

  if (!wedding) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <div className="text-gray-500">Loading events...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Events</h1>
            <p className="mt-1 text-sm text-gray-500">Manage your wedding events and schedule.</p>
          </div>
          <Button onClick={() => { setEditingEvent(null); setModalOpen(true); }}>
            <Plus className="mr-1.5 h-4 w-4" /> Add Event
          </Button>
        </div>

        <SplitEditor
          preview={(device: DeviceType) => <RsvpPreview wedding={wedding} device={device} />}
        >
          <div />
        </SplitEditor>

        <div className="space-y-3">
          {isLoading ? (
            <div className="text-gray-500">Loading events...</div>
          ) : events && events.length === 0 ? (
            <Card>
              <EmptyState icon={<Calendar className="h-8 w-8" />} title="No events yet" description="Add your first event to get started." />
            </Card>
          ) : (
            events?.map((event) => (
              <Card key={event.id}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-gray-900">{event.name}</h3>
                      <Badge variant="default">{event.kind}</Badge>
                      <Badge variant={event.visibility === "public" ? "success" : "warning"}>
                        {event.visibility}
                      </Badge>
                    </div>
                    <div className="mt-2 space-y-1 text-sm text-gray-500">
                      {event.starts_at && (
                        <p className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4" /> {formatDate(event.starts_at)} at {formatTime(event.starts_at)}
                        </p>
                      )}
                      {event.venue_name && (
                        <p className="flex items-center gap-1.5">
                          <MapPin className="h-4 w-4" /> {event.venue_name}
                        </p>
                      )}
                      {event.rsvp_deadline && (
                        <p className="flex items-center gap-1.5">
                          <Clock className="h-4 w-4" /> RSVP by {formatDate(event.rsvp_deadline)}
                        </p>
                      )}
                      {event.description && <p className="mt-2 text-gray-600">{event.description}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => { setEditingEvent(event); setModalOpen(true); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(event.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingEvent ? "Edit Event" : "Add Event"}>
          <div className="space-y-4">
            <Input
              label="Event Name"
              value={form.name || ""}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Wedding Reception"
            />
            <Select
              label="Event Type"
              value={form.kind || "resepsi"}
              onChange={(e) => setForm((p) => ({ ...p, kind: e.target.value as EventKind }))}
            >
              <option value="akad">Akad Nikah</option>
              <option value="resepsi">Resepsi</option>
              <option value="majlis">Majlis</option>
              <option value="other">Other</option>
            </Select>
            <Input
              label="Start Date & Time"
              type="datetime-local"
              value={form.starts_at ? new Date(form.starts_at).toISOString().slice(0, 16) : ""}
              onChange={(e) => setForm((p) => ({ ...p, starts_at: e.target.value ? new Date(e.target.value).toISOString() : null }))}
            />
            <Input
              label="Venue Name"
              value={form.venue_name || ""}
              onChange={(e) => setForm((p) => ({ ...p, venue_name: e.target.value }))}
              placeholder="Grand Ballroom Hotel"
            />
            <Textarea
              label="Venue Address"
              value={form.venue_address || ""}
              onChange={(e) => setForm((p) => ({ ...p, venue_address: e.target.value }))}
              placeholder="123 Jalan Bukit Bintang, Kuala Lumpur"
              rows={2}
            />
            <Input
              label="RSVP Deadline"
              type="datetime-local"
              value={form.rsvp_deadline ? new Date(form.rsvp_deadline).toISOString().slice(0, 16) : ""}
              onChange={(e) => setForm((p) => ({ ...p, rsvp_deadline: e.target.value ? new Date(e.target.value).toISOString() : null }))}
            />
            <Input
              label="Capacity"
              type="number"
              value={form.capacity || ""}
              onChange={(e) => setForm((p) => ({ ...p, capacity: e.target.value ? Number(e.target.value) : null }))}
              placeholder="500"
            />
            <Input
              label="Dress Code"
              value={form.dress_code || ""}
              onChange={(e) => setForm((p) => ({ ...p, dress_code: e.target.value }))}
              placeholder="Formal / Traditional"
            />
            <Textarea
              label="Description"
              value={form.description || ""}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              rows={3}
            />
            <Input
              label="Maps URL"
              value={form.maps_url || ""}
              onChange={(e) => setForm((p) => ({ ...p, maps_url: e.target.value }))}
              placeholder="https://maps.google.com/..."
            />
            <Textarea
              label="Programme"
              value={form.programme || ""}
              onChange={(e) => setForm((p) => ({ ...p, programme: e.target.value }))}
              rows={4}
            />
            <Select
              label="Visibility"
              value={form.visibility || "public"}
              onChange={(e) => setForm((p) => ({ ...p, visibility: e.target.value as EventVisibility }))}
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </Select>
            <Input
              label="Sort Order"
              type="number"
              value={form.sort_order || 0}
              onChange={(e) => setForm((p) => ({ ...p, sort_order: Number(e.target.value) }))}
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
                {editingEvent ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </Modal>

        {toast && (
          <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-gray-900 px-4 py-2 text-sm text-white shadow-lg">
            {toast}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
