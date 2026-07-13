import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Save, X, Calendar, Clock, MapPin } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { WeddingEvent } from "@/lib/supabase";
import { useHostWedding } from "@/lib/use-host-wedding";
import { getDraftTheme } from "@/lib/theme";
import { formatDate, formatTime } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Label, Select } from "@/components/ui/Input";
import { Card, Badge, Modal, EmptyState, SectionTitle, Toast } from "@/components/ui";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { SplitEditor } from "@/components/preview/SplitEditor";
import { EventCardPreview } from "@/components/preview/PreviewRenderers";

const EVENT_KINDS = [
  "ceremony",
  "reception",
  "rehearsal",
  "brunch",
  "party",
  "other",
] as const;

const KIND_COLORS: Record<string, "success" | "info" | "warning" | "default" | "danger"> = {
  ceremony: "info",
  reception: "success",
  rehearsal: "warning",
  brunch: "default",
  party: "danger",
  other: "default",
};

type EventForm = {
  name: string;
  kind: string;
  starts_at: string;
  venue_name: string;
  venue_address: string;
  maps_url: string;
  dress_code: string;
  description: string;
  image_url: string | null;
  rsvp_deadline: string;
  capacity: string;
  notes: string;
};

function emptyForm(): EventForm {
  return {
    name: "",
    kind: "ceremony",
    starts_at: "",
    venue_name: "",
    venue_address: "",
    maps_url: "",
    dress_code: "",
    description: "",
    image_url: null,
    rsvp_deadline: "",
    capacity: "",
    notes: "",
  };
}

function toForm(event: WeddingEvent): EventForm {
  return {
    name: event.name,
    kind: event.kind,
    starts_at: event.starts_at ? new Date(event.starts_at).toISOString().slice(0, 16) : "",
    venue_name: event.venue_name ?? "",
    venue_address: event.venue_address ?? "",
    maps_url: event.maps_url ?? "",
    dress_code: event.dress_code ?? "",
    description: event.description ?? "",
    image_url: event.image_url,
    rsvp_deadline: event.rsvp_deadline ? new Date(event.rsvp_deadline).toISOString().slice(0, 16) : "",
    capacity: event.capacity != null ? String(event.capacity) : "",
    notes: event.notes ?? "",
  };
}

function toRow(form: EventForm, weddingId: string, sortOrder: number) {
  return {
    wedding_id: weddingId,
    name: form.name,
    kind: form.kind,
    starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
    venue_name: form.venue_name || null,
    venue_address: form.venue_address || null,
    maps_url: form.maps_url || null,
    dress_code: form.dress_code || null,
    description: form.description || null,
    image_url: form.image_url,
    rsvp_deadline: form.rsvp_deadline ? new Date(form.rsvp_deadline).toISOString() : null,
    capacity: form.capacity ? parseInt(form.capacity, 10) : null,
    notes: form.notes || null,
    sort_order: sortOrder,
  };
}

export function AdminEvents() {
  const { wedding, loading } = useHostWedding();
  const theme = getDraftTheme(wedding);

  const [events, setEvents] = useState<WeddingEvent[]>([]);
  const [fetching, setFetching] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<EventForm>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WeddingEvent | null>(null);

  const weddingId = wedding?.id ?? null;

  const fetchEvents = useCallback(async () => {
    if (!weddingId) return;
    setFetching(true);
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("wedding_id", weddingId)
      .order("sort_order", { ascending: true });
    if (!error && data) setEvents(data as WeddingEvent[]);
    setFetching(false);
  }, [weddingId]);

  useEffect(() => {
    if (weddingId) fetchEvents();
  }, [weddingId, fetchEvents]);

  const startCreate = () => {
    setIsCreating(true);
    setEditingId(null);
    setForm(emptyForm());
  };

  const startEdit = (event: WeddingEvent) => {
    setEditingId(event.id);
    setIsCreating(false);
    setForm(toForm(event));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsCreating(false);
    setForm(emptyForm());
  };

  const save = async () => {
    if (!weddingId || !form.name.trim() || !form.starts_at) {
      setToast({ message: "Name and start time are required", type: "error" });
      return;
    }
    setSaving(true);
    if (isCreating) {
      const maxSort = events.reduce((max, e) => Math.max(max, e.sort_order), -1);
      const { error } = await supabase.from("events").insert(toRow(form, weddingId, maxSort + 1));
      setSaving(false);
      if (error) {
        setToast({ message: "Failed to create event", type: "error" });
      } else {
        setToast({ message: "Event created", type: "success" });
        cancelEdit();
        await fetchEvents();
      }
    } else if (editingId) {
      const existing = events.find((e) => e.id === editingId);
      const sortOrder = existing?.sort_order ?? 0;
      const { error } = await supabase
        .from("events")
        .update(toRow(form, weddingId, sortOrder))
        .eq("id", editingId);
      setSaving(false);
      if (error) {
        setToast({ message: "Failed to save event", type: "error" });
      } else {
        setToast({ message: "Event saved", type: "success" });
        cancelEdit();
        await fetchEvents();
      }
    }
  };

  const deleteEvent = async (event: WeddingEvent) => {
    const { error } = await supabase.from("events").delete().eq("id", event.id);
    setDeleteTarget(null);
    if (error) {
      setToast({ message: "Failed to delete event", type: "error" });
    } else {
      setToast({ message: "Event deleted", type: "success" });
      if (editingId === event.id) cancelEdit();
      await fetchEvents();
    }
  };

  if (loading || fetching) {
    return <div className="flex items-center justify-center py-24 text-sepia">Loading events…</div>;
  }

  if (!wedding) {
    return <EmptyState title="No wedding found" description="Create a wedding to manage events." />;
  }

  const isEditing = isCreating || editingId !== null;

  // Live preview event object derived from form
  const previewEvent = {
    name: form.name || "Untitled Event",
    kind: form.kind,
    starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : new Date().toISOString(),
    venue_name: form.venue_name || null,
    venue_address: form.venue_address || null,
    dress_code: form.dress_code || null,
    description: form.description || null,
    maps_url: form.maps_url || null,
    image_url: form.image_url,
    rsvp_deadline: form.rsvp_deadline ? new Date(form.rsvp_deadline).toISOString() : null,
  };

  return (
    <div>
      <SectionTitle
        title="Events"
        subtitle="Manage the events that make up your wedding weekend."
        action={
          !isEditing && (
            <Button onClick={startCreate}>
              <Plus className="w-4 h-4" /> New Event
            </Button>
          )
        }
      />

      {/* ─── Editing / Creating mode ─── */}
      {isEditing ? (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-serif text-onyx">
              {isCreating ? "Create Event" : "Edit Event"}
            </h2>
            <Button variant="ghost" size="sm" onClick={cancelEdit}>
              <X className="w-4 h-4" /> Close
            </Button>
          </div>

          <SplitEditor
            previewLabel="Event Preview"
            draftData={{ theme }}
            actions={
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={cancelEdit} disabled={saving}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" onClick={save} disabled={saving}>
                  <Save className="w-4 h-4" /> Save
                </Button>
              </div>
            }
            editor={
              <div className="space-y-5">
                <div>
                  <Label>Event Name</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Wedding Ceremony"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Kind</Label>
                    <Select
                      value={form.kind}
                      onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value }))}
                    >
                      {EVENT_KINDS.map((k) => (
                        <option key={k} value={k}>
                          {k.charAt(0).toUpperCase() + k.slice(1)}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label>Starts At</Label>
                    <Input
                      type="datetime-local"
                      value={form.starts_at}
                      onChange={(e) => setForm((f) => ({ ...f, starts_at: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <Label>Venue Name</Label>
                  <Input
                    value={form.venue_name}
                    onChange={(e) => setForm((f) => ({ ...f, venue_name: e.target.value }))}
                    placeholder="e.g. St. Mary's Church"
                  />
                </div>
                <div>
                  <Label>Venue Address</Label>
                  <Input
                    value={form.venue_address}
                    onChange={(e) => setForm((f) => ({ ...f, venue_address: e.target.value }))}
                    placeholder="123 Main Street, City"
                  />
                </div>
                <div>
                  <Label>Google Maps URL</Label>
                  <Input
                    value={form.maps_url}
                    onChange={(e) => setForm((f) => ({ ...f, maps_url: e.target.value }))}
                    placeholder="https://maps.google.com/…"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Dress Code</Label>
                    <Input
                      value={form.dress_code}
                      onChange={(e) => setForm((f) => ({ ...f, dress_code: e.target.value }))}
                      placeholder="Black Tie"
                    />
                  </div>
                  <div>
                    <Label>Capacity</Label>
                    <Input
                      type="number"
                      min="0"
                      value={form.capacity}
                      onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))}
                      placeholder="100"
                    />
                  </div>
                </div>
                <div>
                  <Label>RSVP Deadline</Label>
                  <Input
                    type="datetime-local"
                    value={form.rsvp_deadline}
                    onChange={(e) => setForm((f) => ({ ...f, rsvp_deadline: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Tell guests what to expect…"
                    rows={4}
                  />
                </div>
                <div>
                  <Label>Event Image</Label>
                  <ImageUpload
                    weddingId={wedding.id}
                    value={form.image_url}
                    onChange={(url) => setForm((f) => ({ ...f, image_url: url }))}
                    label="Event image"
                  />
                </div>
                <div>
                  <Label>Notes (internal)</Label>
                  <Textarea
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                    placeholder="Private notes not shown to guests…"
                    rows={3}
                  />
                </div>
              </div>
            }
            preview={
              <EventCardPreview event={previewEvent} theme={theme} />
            }
          />
        </Card>
      ) : (
        /* ─── Grid mode ─── */
        <>
          {events.length === 0 ? (
            <EmptyState
              title="No events yet"
              description="Add your ceremony, reception, and other events for guests to see."
              action={
                <Button onClick={startCreate}>
                  <Plus className="w-4 h-4" /> New Event
                </Button>
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => (
                <Card key={event.id} className="overflow-hidden flex flex-col">
                  {event.image_url ? (
                    <div className="relative h-36 overflow-hidden">
                      <img src={event.image_url} alt="" className="w-full h-full object-cover" />
                      <div className="absolute top-2 right-2">
                        <Badge variant={KIND_COLORS[event.kind] ?? "default"}>
                          {event.kind}
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    <div className="relative h-36 bg-gradient-to-br from-mist to-sand/40 flex items-center justify-center">
                      <Calendar className="w-8 h-8 text-sepia/40" />
                      <div className="absolute top-2 right-2">
                        <Badge variant={KIND_COLORS[event.kind] ?? "default"}>
                          {event.kind}
                        </Badge>
                      </div>
                    </div>
                  )}

                  <div className="p-4 flex-1 flex flex-col">
                    <h3 className="font-serif text-base text-onyx mb-2">{event.name}</h3>
                    <div className="space-y-1.5 text-sm text-sepia/70 flex-1">
                      {event.starts_at && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 shrink-0" />
                          <span>{formatDate(event.starts_at)}</span>
                        </div>
                      )}
                      {event.starts_at && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 shrink-0" />
                          <span>{formatTime(event.starts_at)}</span>
                        </div>
                      )}
                      {event.venue_name && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{event.venue_name}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-sand">
                      <span className="text-xs text-sepia/50">
                        {event.capacity != null ? `${event.capacity} guests` : "No limit"}
                      </span>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => startEdit(event)}>
                          <Pencil className="w-3.5 h-3.5" /> Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteTarget(event)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* ─── Delete confirm modal ─── */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Event">
        <p className="text-sm text-sepia mb-6">
          Are you sure you want to delete{" "}
          <span className="font-medium text-onyx">{deleteTarget?.name}</span>? This cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => deleteTarget && deleteEvent(deleteTarget)}>
            <Trash2 className="w-4 h-4" /> Delete
          </Button>
        </div>
      </Modal>

      {/* ─── Toast ─── */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
