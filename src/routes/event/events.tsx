import { useState, useEffect } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type SubEvent } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Card, Badge, EmptyState, Skeleton, ErrorState, Modal, Toast, Toggle, FormField } from "../../components/ui";
import { Input, Textarea } from "../../components/ui/Input";
import { DatePicker } from "../../components/ui/DatePicker";
import { TimePicker } from "../../components/ui/TimePicker";
import { CalendarCheck, Plus, Trash2, Pencil, Copy, ChevronUp, ChevronDown, MapPin } from "lucide-react";
import { formatDate, formatTime, toDatetimeLocal, fromDatetimeLocal, getRsvpStatus } from "../../lib/utils";

interface OutletContext { event: UserEvent; }

export default function EventsPage() {
  const { event } = useOutletContext<OutletContext>();
  const { eventId } = useParams();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const emptyForm = {
    name: "",
    date: null as string | null,
    time: null as string | null,
    venue: "",
    address: "",
    description: "",
    dress_code: "",
    rsvp_deadline: "",
    rsvp_enabled: true,
  };
  const [form, setForm] = useState(emptyForm);

  const { data: subEvents, isLoading, error } = useQuery({
    queryKey: ["sub_events", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sub_events")
        .select("*")
        .eq("parent_event_id", eventId)
        .order("order_index", { ascending: true });
      if (error) throw error;
      return data as SubEvent[];
    },
  });

  const { data: rsvpCounts } = useQuery({
    queryKey: ["sub_event_rsvp_counts", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_rsvps")
        .select("sub_event_id, status")
        .eq("event_id", eventId);
      if (error) throw error;
      const counts: Record<string, { attending: number; declined: number; pending: number }> = {};
      (data || []).forEach((r: any) => {
        const sid = r.sub_event_id;
        if (!sid) return;
        if (!counts[sid]) counts[sid] = { attending: 0, declined: 0, pending: 0 };
        if (counts[sid][r.status as keyof typeof counts[string]] !== undefined) {
          counts[sid][r.status as keyof typeof counts[string]]++;
        }
      });
      return counts;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const orderIndex = subEvents?.length || 0;
      const { error } = await supabase.from("sub_events").insert({
        parent_event_id: eventId,
        name: form.name,
        date: form.date,
        time: form.time,
        venue: form.venue || null,
        address: form.address || null,
        description: form.description || null,
        dress_code: form.dress_code || null,
        rsvp_deadline: form.rsvp_deadline ? fromDatetimeLocal(form.rsvp_deadline) : null,
        rsvp_enabled: form.rsvp_enabled,
        order_index: orderIndex,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub_events", eventId] });
      setShowModal(false);
      setForm(emptyForm);
      setToast({ msg: "Event created", type: "success" });
    },
    onError: (err: Error) => {
      setToast({ msg: `Failed to create: ${err.message}`, type: "error" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sub_events").update({
        name: form.name,
        date: form.date,
        time: form.time,
        venue: form.venue || null,
        address: form.address || null,
        description: form.description || null,
        dress_code: form.dress_code || null,
        rsvp_deadline: form.rsvp_deadline ? fromDatetimeLocal(form.rsvp_deadline) : null,
        rsvp_enabled: form.rsvp_enabled,
        updated_at: new Date().toISOString(),
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub_events", eventId] });
      setShowModal(false);
      setEditingId(null);
      setForm(emptyForm);
      setToast({ msg: "Event updated", type: "success" });
    },
    onError: (err: Error) => {
      setToast({ msg: `Failed to update: ${err.message}`, type: "error" });
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async (sub: SubEvent) => {
      const orderIndex = (subEvents?.length || 0);
      const { error } = await supabase.from("sub_events").insert({
        parent_event_id: sub.parent_event_id,
        name: `${sub.name} (Copy)`,
        date: sub.date,
        time: sub.time,
        venue: sub.venue,
        address: sub.address,
        description: sub.description,
        dress_code: sub.dress_code,
        rsvp_deadline: sub.rsvp_deadline,
        rsvp_enabled: sub.rsvp_enabled,
        order_index: orderIndex,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub_events", eventId] });
      setToast({ msg: "Event duplicated", type: "success" });
    },
    onError: (err: Error) => {
      setToast({ msg: `Failed to duplicate: ${err.message}`, type: "error" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sub_events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub_events", eventId] });
      setDeleteId(null);
      setToast({ msg: "Event deleted", type: "success" });
    },
    onError: (err: Error) => {
      setToast({ msg: `Failed to delete: ${err.message}`, type: "error" });
      setDeleteId(null);
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async ({ id, direction }: { id: string; direction: "up" | "down" }) => {
      if (!subEvents) return;
      const idx = subEvents.findIndex((s) => s.id === id);
      if (idx === -1) return;
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= subEvents.length) return;
      const a = subEvents[idx];
      const b = subEvents[swapIdx];
      const updates = [
        { id: a.id, order_index: b.order_index },
        { id: b.id, order_index: a.order_index },
      ];
      for (const u of updates) {
        const { error } = await supabase.from("sub_events").update({ order_index: u.order_index }).eq("id", u.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub_events", eventId] });
    },
    onError: (err: Error) => {
      setToast({ msg: `Failed to reorder: ${err.message}`, type: "error" });
    },
  });

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (sub: SubEvent) => {
    setEditingId(sub.id);
    setForm({
      name: sub.name,
      date: sub.date,
      time: sub.time,
      venue: sub.venue || "",
      address: sub.address || "",
      description: sub.description || "",
      dress_code: sub.dress_code || "",
      rsvp_deadline: sub.rsvp_deadline ? toDatetimeLocal(sub.rsvp_deadline) : "",
      rsvp_enabled: sub.rsvp_enabled,
    });
    setShowModal(true);
  };

  if (isLoading) return <div className="p-8"><Skeleton className="h-64" /></div>;
  if (error) return <ErrorState message={error.message} onRetry={() => queryClient.invalidateQueries({ queryKey: ["sub_events", eventId] })} />;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="font-heading text-2xl text-gray-900">Events</h2>
          <p className="text-sm text-gray-500 mt-1">Manage multiple events within this invitation (e.g. ceremony, reception).</p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="w-4 h-4" /> Add Event
        </Button>
      </div>

      {!subEvents || subEvents.length === 0 ? (
        <EmptyState
          icon={<CalendarCheck className="w-12 h-12" />}
          title="No sub-events yet"
          description="Add events like a ceremony, reception, or brunch to give guests options."
          action={<Button onClick={openCreate}><Plus className="w-4 h-4" /> Add Event</Button>}
        />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {subEvents.map((sub, idx) => {
            const counts = rsvpCounts?.[sub.id] || { attending: 0, declined: 0, pending: 0 };
            const rsvpStatus = sub.rsvp_enabled ? getRsvpStatus(sub.rsvp_deadline) : "no-deadline";
            return (
              <Card key={sub.id} className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-heading text-lg text-gray-900 truncate">{sub.name}</h3>
                    {sub.date && <p className="text-sm text-gray-500 mt-0.5">{formatDate(sub.date)}{sub.time ? ` · ${formatTime(sub.time)}` : ""}</p>}
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <button
                      onClick={() => reorderMutation.mutate({ id: sub.id, direction: "up" })}
                      disabled={idx === 0}
                      className="p-1 text-gray-400 hover:text-gray-900 disabled:opacity-30 transition-colors rounded"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => reorderMutation.mutate({ id: sub.id, direction: "down" })}
                      disabled={idx === subEvents.length - 1}
                      className="p-1 text-gray-400 hover:text-gray-900 disabled:opacity-30 transition-colors rounded"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {sub.venue && (
                  <p className="text-sm text-gray-600 flex items-center gap-1.5 mb-2">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" /> {sub.venue}
                  </p>
                )}
                {sub.description && <p className="text-sm text-gray-500 mb-3 line-clamp-2">{sub.description}</p>}
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  {sub.rsvp_enabled ? (
                    <Badge variant={rsvpStatus === "open" ? "success" : rsvpStatus === "closing-soon" ? "warning" : rsvpStatus === "closed" ? "error" : "default"}>
                      RSVP {rsvpStatus === "no-deadline" ? "Open" : rsvpStatus}
                    </Badge>
                  ) : (
                    <Badge variant="default">RSVP Disabled</Badge>
                  )}
                  <Badge variant="success">{counts.attending} attending</Badge>
                  <Badge variant="error">{counts.declined} declined</Badge>
                  <Badge variant="warning">{counts.pending} pending</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="secondary" onClick={() => openEdit(sub)}>
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => duplicateMutation.mutate(sub)}>
                    <Copy className="w-3.5 h-3.5" /> Duplicate
                  </Button>
                  <button
                    onClick={() => setDeleteId(sub.id)}
                    className="ml-auto p-2 text-gray-400 hover:text-red-600 transition-colors rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal open={showModal} onClose={() => { setShowModal(false); setEditingId(null); }} title={editingId ? "Edit Event" : "Add Event"}>
        <div className="space-y-4">
          <FormField label="Event Name">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ceremony" />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Date">
              <DatePicker value={form.date} onChange={(v) => setForm({ ...form, date: v })} />
            </FormField>
            <FormField label="Time">
              <TimePicker value={form.time} onChange={(v) => setForm({ ...form, time: v })} />
            </FormField>
          </div>
          <FormField label="Venue">
            <Input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} placeholder="St. Mary's Church" />
          </FormField>
          <FormField label="Address">
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="123 Main St" />
          </FormField>
          <FormField label="Description">
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Join us for the ceremony..." />
          </FormField>
          <FormField label="Dress Code">
            <Input value={form.dress_code} onChange={(e) => setForm({ ...form, dress_code: e.target.value })} placeholder="Black Tie" />
          </FormField>
          <FormField label="RSVP Deadline">
            <input
              type="datetime-local"
              value={form.rsvp_deadline}
              onChange={(e) => setForm({ ...form, rsvp_deadline: e.target.value })}
              className="w-full px-4 py-2.5 text-sm bg-white border border-gray-200 text-gray-900 focus:outline-none focus:border-gray-900 transition-colors rounded-md"
            />
          </FormField>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-900">RSVP Enabled</span>
            <Toggle checked={form.rsvp_enabled} onChange={(v) => setForm({ ...form, rsvp_enabled: v })} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              onClick={() => editingId ? updateMutation.mutate(editingId) : createMutation.mutate()}
              loading={createMutation.isPending || updateMutation.isPending}
              disabled={!form.name}
            >
              {editingId ? "Save Changes" : "Create Event"}
            </Button>
            <Button variant="ghost" onClick={() => { setShowModal(false); setEditingId(null); }}>Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Event">
        <p className="text-sm text-gray-600 mb-6">Are you sure you want to delete this event? All RSVP data for this event will also be removed.</p>
        <div className="flex gap-3">
          <Button variant="danger" onClick={() => deleteMutation.mutate(deleteId!)} loading={deleteMutation.isPending}>
            Delete
          </Button>
          <Button variant="ghost" onClick={() => setDeleteId(null)}>Cancel</Button>
        </div>
      </Modal>

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
