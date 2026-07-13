import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { WeddingEvent, EventKind } from "@/lib/supabase";
import { useHostWedding } from "@/lib/use-host-wedding";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Label, Select } from "@/components/ui/Input";
import { Card, Badge, Modal, EmptyState, SectionTitle } from "@/components/ui";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { formatDate, formatTime, formatDateShort } from "@/lib/utils";
import { Plus, Calendar, MapPin, Clock, Edit2, Trash2, Users } from "lucide-react";

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

const EVENT_KINDS: { value: EventKind; label: string }[] = [
  { value: "ceremony", label: "Ceremony" },
  { value: "reception", label: "Reception" },
  { value: "welcome", label: "Welcome Party" },
  { value: "rehearsal", label: "Rehearsal" },
  { value: "brunch", label: "Brunch" },
  { value: "cultural", label: "Cultural" },
  { value: "other", label: "Other" },
];

const KIND_BADGE: Record<EventKind, { label: string; variant: "default" | "success" | "warning" | "danger" | "info" }> = {
  ceremony: { label: "Ceremony", variant: "info" },
  reception: { label: "Reception", variant: "success" },
  welcome: { label: "Welcome", variant: "warning" },
  rehearsal: { label: "Rehearsal", variant: "default" },
  brunch: { label: "Brunch", variant: "warning" },
  cultural: { label: "Cultural", variant: "info" },
  other: { label: "Other", variant: "default" },
};

type FormState = {
  name: string;
  kind: EventKind;
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

const EMPTY_FORM: FormState = {
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

/** Convert an ISO timestamp to a value suitable for a datetime-local input. */
function toDatetimeLocal(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Convert a datetime-local value to an ISO string (or null when empty). */
function fromDatetimeLocal(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

/** Convert a date-only input value (yyyy-mm-dd) to an ISO string (or null). */
function fromDateOnly(value: string): string | null {
  if (!value) return null;
  // Keep it as a date boundary — use local noon to avoid timezone surprises.
  const d = new Date(value + "T12:00:00");
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

/** Convert an ISO string to a date-only value (yyyy-mm-dd) for a date input. */
function toDateOnly(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function eventToForm(ev: WeddingEvent): FormState {
  return {
    name: ev.name ?? "",
    kind: ev.kind,
    starts_at: toDatetimeLocal(ev.starts_at),
    venue_name: ev.venue_name ?? "",
    venue_address: ev.venue_address ?? "",
    maps_url: ev.maps_url ?? "",
    dress_code: ev.dress_code ?? "",
    description: ev.description ?? "",
    image_url: ev.image_url,
    rsvp_deadline: toDateOnly(ev.rsvp_deadline),
    capacity: ev.capacity != null ? String(ev.capacity) : "",
    notes: ev.notes ?? "",
  };
}

function formToRow(form: FormState) {
  return {
    name: form.name.trim(),
    kind: form.kind,
    starts_at: fromDatetimeLocal(form.starts_at),
    venue_name: form.venue_name.trim() || null,
    venue_address: form.venue_address.trim() || null,
    maps_url: form.maps_url.trim() || null,
    dress_code: form.dress_code.trim() || null,
    description: form.description.trim() || null,
    image_url: form.image_url,
    rsvp_deadline: fromDateOnly(form.rsvp_deadline),
    capacity: form.capacity.trim() === "" ? null : Number(form.capacity),
    notes: form.notes.trim() || null,
  };
}

/* ------------------------------------------------------------------ */
/* Main component                                                      */
/* ------------------------------------------------------------------ */

export function AdminEvents() {
  const { wedding } = useHostWedding();
  const weddingId = wedding?.id;

  const [events, setEvents] = useState<WeddingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form modal (create + edit share the same modal)
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<WeddingEvent | null>(null);

  /* ---------------------------------------------------------------- */
  /* Data fetching                                                    */
  /* ---------------------------------------------------------------- */

  const fetchEvents = useCallback(async () => {
    if (!weddingId) return;
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("wedding_id", weddingId)
      .order("sort_order", { ascending: true });
    if (error) {
      setError(error.message);
    } else {
      setEvents((data ?? []) as WeddingEvent[]);
    }
    setLoading(false);
  }, [weddingId]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  /* ---------------------------------------------------------------- */
  /* Form helpers                                                     */
  /* ---------------------------------------------------------------- */

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  };

  const openEdit = (ev: WeddingEvent) => {
    setEditingId(ev.id);
    setForm(eventToForm(ev));
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  /* ---------------------------------------------------------------- */
  /* CRUD: Save (create or update)                                    */
  /* ---------------------------------------------------------------- */

  const handleSave = async () => {
    if (!weddingId) return;
    if (!form.name.trim()) {
      setError("Event name is required.");
      return;
    }
    if (!form.starts_at) {
      setError("Please choose a date and time for the event.");
      return;
    }

    setBusy(true);
    setError(null);

    const row = formToRow(form);

    if (editingId) {
      const { data, error } = await supabase
        .from("events")
        .update(row)
        .eq("id", editingId)
        .select()
        .single();
      setBusy(false);
      if (error) {
        setError(error.message);
        return;
      }
      setEvents((prev) => prev.map((e) => (e.id === editingId ? (data as WeddingEvent) : e)));
      closeForm();
    } else {
      const { data, error } = await supabase
        .from("events")
        .insert({
          ...row,
          wedding_id: weddingId,
          sort_order: events.length,
        })
        .select()
        .single();
      setBusy(false);
      if (error) {
        setError(error.message);
        return;
      }
      setEvents((prev) => [...prev, data as WeddingEvent]);
      closeForm();
    }
  };

  /* ---------------------------------------------------------------- */
  /* CRUD: Delete                                                     */
  /* ---------------------------------------------------------------- */

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setBusy(true);
    setError(null);
    const { error } = await supabase.from("events").delete().eq("id", deleteTarget.id);
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    setEvents((prev) => prev.filter((e) => e.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  /* ---------------------------------------------------------------- */
  /* Render                                                           */
  /* ---------------------------------------------------------------- */

  if (!weddingId) {
    return <div className="text-sepia text-sm">Loading wedding…</div>;
  }

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Events"
        subtitle="Manage the schedule of events for your wedding weekend."
        action={
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4" />
            New Event
          </Button>
        }
      />

      {error && (
        <div className="rounded-md border border-rose/40 bg-rose/10 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* ---------------------------------------------------------- */}
      {/* Event cards                                                */}
      {/* ---------------------------------------------------------- */}
      {loading ? (
        <div className="text-sepia text-sm">Loading events…</div>
      ) : events.length === 0 ? (
        <Card>
          <EmptyState
            title="No events yet"
            description="Add your first event — ceremony, reception, welcome party, and more — to build out your wedding schedule."
            action={
              <Button onClick={openCreate}>
                <Plus className="w-4 h-4" />
                Create Event
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((ev) => {
            const badge = KIND_BADGE[ev.kind] ?? KIND_BADGE.other;
            return (
              <Card
                key={ev.id}
                className="group relative flex flex-col transition-shadow hover:shadow-md"
              >
                {/* Image header */}
                {ev.image_url ? (
                  <div className="relative -mx-6 -mt-6 mb-4 h-32 overflow-hidden rounded-t-lg">
                    <img
                      src={ev.image_url}
                      alt={ev.name}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-onyx/40 to-transparent" />
                    <div className="absolute top-3 right-3">
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sepia/10 text-sepia">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                  </div>
                )}

                {/* Body */}
                <div className="flex-1">
                  <h3 className="font-serif text-lg text-onyx">{ev.name}</h3>

                  <div className="mt-3 space-y-1.5 text-sm text-sepia/80">
                    {ev.starts_at && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 shrink-0 text-sepia/60" />
                        <span>{formatDate(ev.starts_at)}</span>
                        <Clock className="w-3.5 h-3.5 shrink-0 text-sepia/60 ml-1" />
                        <span>{formatTime(ev.starts_at)}</span>
                      </div>
                    )}
                    {ev.venue_name && (
                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 shrink-0 text-sepia/60 mt-0.5" />
                        <span className="min-w-0">
                          {ev.venue_name}
                          {ev.venue_address && (
                            <span className="block text-xs text-sepia/60">{ev.venue_address}</span>
                          )}
                        </span>
                      </div>
                    )}
                    {ev.dress_code && (
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 shrink-0 text-sepia/60" />
                        <span className="capitalize">{ev.dress_code}</span>
                      </div>
                    )}
                  </div>

                  {ev.description && (
                    <p className="mt-3 text-sm text-sepia/70 line-clamp-2">{ev.description}</p>
                  )}

                  {/* Meta row */}
                  <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-sepia/60">
                    {ev.rsvp_deadline && (
                      <span>RSVP by {formatDateShort(ev.rsvp_deadline)}</span>
                    )}
                    {ev.capacity != null && (
                      <span>Capacity: {ev.capacity}</span>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="mt-4 flex items-center gap-1 border-t border-sand pt-3">
                  {ev.maps_url && (
                    <a
                      href={ev.maps_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-sepia transition-colors hover:bg-sepia/10"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      Map
                    </a>
                  )}
                  <div className="ml-auto flex items-center gap-1">
                    <button
                      className="rounded-md p-1.5 text-sepia/60 transition-colors hover:bg-sepia/10 hover:text-onyx"
                      onClick={() => openEdit(ev)}
                      title="Edit event"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      className="rounded-md p-1.5 text-sepia/60 transition-colors hover:bg-red-50 hover:text-red-600"
                      onClick={() => setDeleteTarget(ev)}
                      title="Delete event"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ---------------------------------------------------------- */}
      {/* Create / Edit modal                                        */}
      {/* ---------------------------------------------------------- */}
      <Modal
        open={formOpen}
        onClose={closeForm}
        title={editingId ? "Edit Event" : "New Event"}
        className="max-w-2xl"
      >
        <div className="space-y-4">
          {/* Name + Kind */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Event Name *</Label>
              <Input
                autoFocus
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                placeholder="e.g. Wedding Ceremony"
              />
            </div>
            <div>
              <Label>Kind</Label>
              <Select
                value={form.kind}
                onChange={(e) => setField("kind", e.target.value as EventKind)}
              >
                {EVENT_KINDS.map((k) => (
                  <option key={k.value} value={k.value}>
                    {k.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {/* Date/time + capacity */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Starts At *</Label>
              <Input
                type="datetime-local"
                value={form.starts_at}
                onChange={(e) => setField("starts_at", e.target.value)}
              />
            </div>
            <div>
              <Label>Capacity (optional)</Label>
              <Input
                type="number"
                min={0}
                value={form.capacity}
                onChange={(e) => setField("capacity", e.target.value)}
                placeholder="e.g. 150"
              />
            </div>
          </div>

          {/* Venue name + address */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Venue Name</Label>
              <Input
                value={form.venue_name}
                onChange={(e) => setField("venue_name", e.target.value)}
                placeholder="e.g. St. Mary's Church"
              />
            </div>
            <div>
              <Label>Venue Address</Label>
              <Input
                value={form.venue_address}
                onChange={(e) => setField("venue_address", e.target.value)}
                placeholder="e.g. 123 Main St, Charleston, SC"
              />
            </div>
          </div>

          {/* Maps URL + dress code */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Maps URL</Label>
              <Input
                type="url"
                value={form.maps_url}
                onChange={(e) => setField("maps_url", e.target.value)}
                placeholder="https://maps.google.com/…"
              />
            </div>
            <div>
              <Label>Dress Code</Label>
              <Input
                value={form.dress_code}
                onChange={(e) => setField("dress_code", e.target.value)}
                placeholder="e.g. Black Tie, Cocktail, Casual"
              />
            </div>
          </div>

          {/* RSVP deadline */}
          <div>
            <Label>RSVP Deadline</Label>
            <Input
              type="date"
              value={form.rsvp_deadline}
              onChange={(e) => setField("rsvp_deadline", e.target.value)}
            />
          </div>

          {/* Description */}
          <div>
            <Label>Description</Label>
            <Textarea
              rows={3}
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              placeholder="A short description shown to your guests."
            />
          </div>

          {/* Image */}
          <div>
            <Label>Event Image</Label>
            <ImageUpload
              weddingId={weddingId}
              value={form.image_url}
              onChange={(url) => setField("image_url", url)}
            />
          </div>

          {/* Notes */}
          <div>
            <Label>Internal Notes</Label>
            <Textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setField("notes", e.target.value)}
              placeholder="Private notes for the host team (not shown to guests)."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={closeForm}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={busy || !form.name.trim() || !form.starts_at}>
              {busy ? "Saving…" : editingId ? "Save Changes" : "Create Event"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ---------------------------------------------------------- */}
      {/* Delete confirm modal                                       */}
      {/* ---------------------------------------------------------- */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Event">
        <div className="space-y-4">
          <p className="text-sm text-sepia">
            Are you sure you want to delete{" "}
            <span className="font-medium text-onyx">"{deleteTarget?.name}"</span>?
          </p>
          <div className="rounded-md border border-sand bg-mist px-4 py-3 text-xs text-sepia/80">
            <p className="flex items-center gap-2">
              <Trash2 className="w-3.5 h-3.5 shrink-0" />
              This action cannot be undone. Any RSVPs or group invitations tied to this event may be affected.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={busy}>
              {busy ? "Deleting…" : "Delete Event"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default AdminEvents;
