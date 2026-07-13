import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Edit2, Save, Send, Eye, Calendar, Clock, MapPin, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { WeddingEvent } from "@/lib/supabase";
import { useHostWedding } from "@/lib/use-host-wedding";
import { getDraftTheme } from "@/lib/theme";
import type { ThemeConfig } from "@/lib/theme";
import { formatDate, formatTime, formatDateShort } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Label, Select } from "@/components/ui/Input";
import { Card, Badge, Modal, EmptyState, SectionTitle, Toast } from "@/components/ui";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { SplitEditor } from "@/components/preview/SplitEditor";
import { EventCardPreview } from "@/components/preview/PreviewRenderers";

// ─── Event kinds ───
const EVENT_KINDS = [
  "ceremony",
  "reception",
  "rehearsal",
  "brunch",
  "cocktail",
  "after-party",
  "other",
] as const;

const kindBadgeVariant = (kind: string): "default" | "success" | "warning" | "danger" | "info" => {
  switch (kind) {
    case "ceremony": return "info";
    case "reception": return "success";
    case "rehearsal": return "warning";
    case "cocktail":
    case "after-party": return "danger";
    default: return "default";
  }
};

// ─── Form state ───
type FormState = {
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

const emptyForm: FormState = {
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

const toForm = (e: WeddingEvent): FormState => ({
  name: e.name ?? "",
  kind: e.kind ?? "other",
  starts_at: e.starts_at ? new Date(e.starts_at).toISOString().slice(0, 16) : "",
  venue_name: e.venue_name ?? "",
  venue_address: e.venue_address ?? "",
  maps_url: e.maps_url ?? "",
  dress_code: e.dress_code ?? "",
  description: e.description ?? "",
  image_url: e.image_url,
  rsvp_deadline: e.rsvp_deadline ? e.rsvp_deadline.slice(0, 10) : "",
  capacity: e.capacity != null ? String(e.capacity) : "",
  notes: e.notes ?? "",
});

// ─── Component ───
export function AdminEvents() {
  const { wedding, loading } = useHostWedding();
  const theme: ThemeConfig = useMemo(() => getDraftTheme(wedding), [wedding]);

  const [events, setEvents] = useState<WeddingEvent[]>([]);
  const [fetching, setFetching] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WeddingEvent | null>(null);

  const weddingId = wedding?.id ?? "";

  // ─── Load events ───
  const loadEvents = useCallback(async () => {
    if (!weddingId) { setEvents([]); setFetching(false); return; }
    setFetching(true);
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("wedding_id", weddingId)
      .order("sort_order", { ascending: true });
    if (!error && data) setEvents(data as WeddingEvent[]);
    setFetching(false);
  }, [weddingId]);

  useEffect(() => { if (weddingId) loadEvents(); }, [weddingId, loadEvents]);

  // ─── Helpers ───
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const editingEvent = useMemo(
    () => events.find((e) => e.id === editingId) ?? null,
    [events, editingId]
  );

  const startEdit = (e: WeddingEvent) => {
    setForm(toForm(e));
    setEditingId(e.id);
    setCreating(false);
  };

  const startCreate = () => {
    setForm(emptyForm);
    setCreating(true);
    setEditingId(null);
  };

  const cancel = () => {
    setEditingId(null);
    setCreating(false);
    setForm(emptyForm);
  };

  // ─── Persist ───
  const buildPayload = () => ({
    wedding_id: weddingId,
    name: form.name.trim(),
    kind: form.kind,
    starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
    venue_name: form.venue_name.trim() || null,
    venue_address: form.venue_address.trim() || null,
    maps_url: form.maps_url.trim() || null,
    dress_code: form.dress_code.trim() || null,
    description: form.description.trim() || null,
    image_url: form.image_url,
    rsvp_deadline: form.rsvp_deadline || null,
    capacity: form.capacity ? Number(form.capacity) : null,
    notes: form.notes.trim() || null,
  });

  const saveDraft = async () => {
    if (!weddingId) return;
    if (!form.name.trim()) { showToast("Event name is required", "error"); return; }
    setSaving(true);
    let error: { message: string } | null = null;
    if (editingId) {
      ({ error } = await supabase.from("events").update(buildPayload()).eq("id", editingId));
    } else {
      const sortMax = events.reduce((mx, e) => Math.max(mx, e.sort_order), -1);
      ({ error } = await supabase.from("events").insert({ ...buildPayload(), sort_order: sortMax + 1 }).select().single());
    }
    setSaving(false);
    if (error) { showToast(`Save failed: ${error.message}`, "error"); return; }
    showToast("Event saved");
    await loadEvents();
  };

  const publish = async () => {
    if (!weddingId) return;
    if (!form.name.trim()) { showToast("Event name is required", "error"); return; }
    setSaving(true);
    let error: { message: string } | null = null;
    const payload = { ...buildPayload(), visibility: "public" };
    if (editingId) {
      ({ error } = await supabase.from("events").update(payload).eq("id", editingId));
    } else {
      const sortMax = events.reduce((mx, e) => Math.max(mx, e.sort_order), -1);
      ({ error } = await supabase.from("events").insert({ ...payload, sort_order: sortMax + 1 }).select().single());
    }
    setSaving(false);
    if (error) { showToast(`Publish failed: ${error.message}`, "error"); return; }
    showToast("Event published");
    await loadEvents();
    cancel();
  };

  const deleteEvent = async (e: WeddingEvent) => {
    const { error } = await supabase.from("events").delete().eq("id", e.id);
    if (error) { showToast(`Delete failed: ${error.message}`, "error"); return; }
    showToast("Event deleted");
    setDeleteTarget(null);
    await loadEvents();
  };

  // ─── Render ───
  if (loading || fetching) {
    return (
      <div className="flex items-center justify-center py-24 text-sepia">
        <div className="animate-pulse">Loading events…</div>
      </div>
    );
  }

  if (!wedding) {
    return <EmptyState title="No wedding found" description="Create a wedding to manage events." />;
  }

  // ─── Edit / Create view (SplitEditor with live preview) ───
  if (editingId || creating) {
    const isEditing = !!editingId;
    const previewEvent = {
      name: form.name || "Untitled Event",
      kind: form.kind,
      starts_at: form.starts_at || new Date().toISOString(),
      venue_name: form.venue_name || null,
      venue_address: form.venue_address || null,
      dress_code: form.dress_code || null,
      description: form.description || null,
      maps_url: form.maps_url || null,
      image_url: form.image_url,
      rsvp_deadline: form.rsvp_deadline || null,
    };

    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={cancel}
              className="text-sepia hover:text-onyx text-sm flex items-center gap-1.5 transition-colors"
            >
              ← Back to events
            </button>
            <span className="text-sepia/30">/</span>
            <h1 className="text-xl font-serif text-onyx">
              {isEditing ? "Edit Event" : "New Event"}
            </h1>
            {isEditing && <Badge variant={kindBadgeVariant(form.kind)}>{form.kind}</Badge>}
          </div>
        </div>

        <SplitEditor
          editor={
            <div className="space-y-5">
              <Card className="p-5 space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Event Name</Label>
                    <Input
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="e.g. Wedding Ceremony"
                    />
                  </div>
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
                </div>

                <div>
                  <Label>Starts At</Label>
                  <Input
                    type="datetime-local"
                    value={form.starts_at}
                    onChange={(e) => setForm((f) => ({ ...f, starts_at: e.target.value }))}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
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
                      placeholder="123 Main St, City"
                    />
                  </div>
                </div>

                <div>
                  <Label>Maps URL</Label>
                  <Input
                    value={form.maps_url}
                    onChange={(e) => setForm((f) => ({ ...f, maps_url: e.target.value }))}
                    placeholder="https://maps.google.com/…"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Dress Code</Label>
                    <Input
                      value={form.dress_code}
                      onChange={(e) => setForm((f) => ({ ...f, dress_code: e.target.value }))}
                      placeholder="e.g. Black Tie"
                    />
                  </div>
                  <div>
                    <Label>Capacity</Label>
                    <Input
                      type="number"
                      min={0}
                      value={form.capacity}
                      onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))}
                      placeholder="e.g. 150"
                    />
                  </div>
                </div>

                <div>
                  <Label>RSVP Deadline</Label>
                  <Input
                    type="date"
                    value={form.rsvp_deadline}
                    onChange={(e) => setForm((f) => ({ ...f, rsvp_deadline: e.target.value }))}
                  />
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea
                    rows={4}
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="A short description of this event…"
                  />
                </div>

                <div>
                  <Label>Event Image</Label>
                  <ImageUpload
                    weddingId={weddingId}
                    value={form.image_url}
                    onChange={(url) => setForm((f) => ({ ...f, image_url: url }))}
                  />
                </div>

                <div>
                  <Label>Notes (internal)</Label>
                  <Textarea
                    rows={3}
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                    placeholder="Internal notes, not shown to guests…"
                  />
                </div>
              </Card>
            </div>
          }
          preview={
            <EventCardPreview event={previewEvent} theme={theme} />
          }
          previewLabel="Guest Preview"
          actions={
            <>
              <Button variant="outline" onClick={cancel}>Cancel</Button>
              <Button variant="secondary" onClick={saveDraft} disabled={saving}>
                <Save className="w-4 h-4" /> Save Draft
              </Button>
              <Button onClick={publish} disabled={saving}>
                <Send className="w-4 h-4" /> Publish
              </Button>
            </>
          }
        />

        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    );
  }

  // ─── List view ───
  return (
    <div>
      <SectionTitle
        title="Events"
        subtitle="Manage the events that appear on your wedding website."
        action={
          <Button onClick={startCreate}>
            <Plus className="w-4 h-4" /> New Event
          </Button>
        }
      />

      {events.length === 0 ? (
        <EmptyState
          title="No events yet"
          description="Create your first event to share details with your guests."
          action={
            <Button onClick={startCreate}>
              <Plus className="w-4 h-4" /> Create Event
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((e) => (
            <Card key={e.id} className="overflow-hidden flex flex-col">
              {e.image_url ? (
                <div className="relative h-32 overflow-hidden">
                  <img src={e.image_url} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />
                  <Badge
                    variant={kindBadgeVariant(e.kind)}
                    className="absolute top-2 right-2 bg-white/90"
                  >
                    {e.kind}
                  </Badge>
                </div>
              ) : (
                <div className="h-20 bg-mist flex items-center justify-center">
                  <Badge variant={kindBadgeVariant(e.kind)}>{e.kind}</Badge>
                </div>
              )}

              <div className="p-5 flex flex-col flex-1">
                <h3 className="font-serif text-lg text-onyx mb-2 truncate">{e.name}</h3>

                <div className="space-y-1.5 text-sm text-sepia/80 flex-1">
                  {e.starts_at && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-sepia/50" />
                      <span>{formatDateShort(e.starts_at)}</span>
                      <Clock className="w-3.5 h-3.5 text-sepia/50 ml-1" />
                      <span>{formatTime(e.starts_at)}</span>
                    </div>
                  )}
                  {e.venue_name && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-sepia/50" />
                      <span className="truncate">{e.venue_name}</span>
                    </div>
                  )}
                  {e.dress_code && (
                    <div className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 text-sepia/50 text-xs">◈</span>
                      <span className="truncate">{e.dress_code}</span>
                    </div>
                  )}
                  {e.capacity != null && (
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-sepia/50" />
                      <span>{e.capacity} guests</span>
                    </div>
                  )}
                </div>

                {e.description && (
                  <p className="text-sm text-sepia/60 line-clamp-2 mt-3">{e.description}</p>
                )}

                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-sand">
                  <Button size="sm" variant="outline" onClick={() => startEdit(e)}>
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => startEdit(e)}>
                    <Eye className="w-3.5 h-3.5" /> Preview
                  </Button>
                  <button
                    onClick={() => setDeleteTarget(e)}
                    className="ml-auto text-sepia/50 hover:text-red-600 transition-colors p-1.5 rounded-lg hover:bg-red-50"
                    title="Delete event"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ─── Delete confirmation modal ─── */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Event">
        <div className="space-y-4">
          <p className="text-sm text-sepia">
            Are you sure you want to delete{" "}
            <span className="font-medium text-onyx">{deleteTarget?.name}</span>?
            This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => deleteTarget && deleteEvent(deleteTarget)}>
              <Trash2 className="w-4 h-4" /> Delete
            </Button>
          </div>
        </div>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default AdminEvents;
