import { useState } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type ScheduleItem, type SubEvent } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Card, Badge, EmptyState, Skeleton, ErrorState, Modal, Toast, FormField } from "../../components/ui";
import { Input, Textarea, Select } from "../../components/ui/Input";
import { DatePicker } from "../../components/ui/DatePicker";
import { TimePicker } from "../../components/ui/TimePicker";
import { Clock, Plus, Trash2, Pencil, ChevronUp, ChevronDown, MapPin } from "lucide-react";
import { formatDate, formatTime } from "../../lib/utils";

interface OutletContext { event: UserEvent; }

export default function TimelinePage() {
  const { event } = useOutletContext<OutletContext>();
  const { eventId } = useParams();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const emptyForm = {
    title: "",
    description: "",
    schedule_date: null as string | null,
    start_time: null as string | null,
    end_time: null as string | null,
    venue: "",
    address: "",
    dress_code: "",
    category: "",
    sub_event_id: null as string | null,
  };
  const [form, setForm] = useState(emptyForm);

  const { data: schedule, isLoading, error } = useQuery({
    queryKey: ["schedule", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("schedule_items")
        .select("*")
        .eq("event_id", eventId)
        .order("order_index", { ascending: true });
      if (error) throw error;
      return data as ScheduleItem[];
    },
  });

  const { data: subEvents } = useQuery({
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

  const createMutation = useMutation({
    mutationFn: async () => {
      const orderIndex = schedule?.length || 0;
      const { error } = await supabase.from("schedule_items").insert({
        event_id: eventId,
        title: form.title,
        description: form.description || null,
        schedule_date: form.schedule_date,
        start_time: form.start_time,
        end_time: form.end_time,
        venue: form.venue || null,
        address: form.address || null,
        dress_code: form.dress_code || null,
        category: form.category || null,
        sub_event_id: form.sub_event_id,
        order_index: orderIndex,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule", eventId] });
      setShowModal(false);
      setForm(emptyForm);
      setToast({ msg: "Schedule item added", type: "success" });
    },
    onError: (err: Error) => {
      setToast({ msg: `Failed to add: ${err.message}`, type: "error" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("schedule_items").update({
        title: form.title,
        description: form.description || null,
        schedule_date: form.schedule_date,
        start_time: form.start_time,
        end_time: form.end_time,
        venue: form.venue || null,
        address: form.address || null,
        dress_code: form.dress_code || null,
        category: form.category || null,
        sub_event_id: form.sub_event_id,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule", eventId] });
      setShowModal(false);
      setEditingId(null);
      setForm(emptyForm);
      setToast({ msg: "Schedule item updated", type: "success" });
    },
    onError: (err: Error) => {
      setToast({ msg: `Failed to update: ${err.message}`, type: "error" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("schedule_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule", eventId] });
      setDeleteId(null);
      setToast({ msg: "Schedule item deleted", type: "success" });
    },
    onError: (err: Error) => {
      setToast({ msg: `Failed to delete: ${err.message}`, type: "error" });
      setDeleteId(null);
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async ({ id, direction }: { id: string; direction: "up" | "down" }) => {
      if (!schedule) return;
      const idx = schedule.findIndex((s) => s.id === id);
      if (idx === -1) return;
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= schedule.length) return;
      const a = schedule[idx];
      const b = schedule[swapIdx];
      const { error: e1 } = await supabase.from("schedule_items").update({ order_index: b.order_index }).eq("id", a.id);
      if (e1) throw e1;
      const { error: e2 } = await supabase.from("schedule_items").update({ order_index: a.order_index }).eq("id", b.id);
      if (e2) throw e2;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule", eventId] });
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

  const openEdit = (item: ScheduleItem) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      description: item.description || "",
      schedule_date: item.schedule_date,
      start_time: item.start_time,
      end_time: item.end_time,
      venue: item.venue || "",
      address: item.address || "",
      dress_code: item.dress_code || "",
      category: item.category || "",
      sub_event_id: item.sub_event_id,
    });
    setShowModal(true);
  };

  if (isLoading) return <div className="p-8"><Skeleton className="h-64" /></div>;
  if (error) return <ErrorState message={error.message} onRetry={() => queryClient.invalidateQueries({ queryKey: ["schedule", eventId] })} />;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="font-heading text-2xl text-gray-900">Timeline</h2>
          <p className="text-sm text-gray-500 mt-1">Create a schedule of events for your guests to follow.</p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="w-4 h-4" /> Add Item
        </Button>
      </div>

      {!schedule || schedule.length === 0 ? (
        <EmptyState
          icon={<Clock className="w-12 h-12" />}
          title="No schedule items"
          description="Add items like 'Ceremony', 'Cocktails', or 'Reception' to build your timeline."
          action={<Button onClick={openCreate}><Plus className="w-4 h-4" /> Add Item</Button>}
        />
      ) : (
        <div className="space-y-3">
          {schedule.map((item, idx) => (
            <Card key={item.id} className="p-4">
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center gap-1 pt-1">
                  <button
                    onClick={() => reorderMutation.mutate({ id: item.id, direction: "up" })}
                    disabled={idx === 0}
                    className="p-1 text-gray-400 hover:text-gray-900 disabled:opacity-30 transition-colors rounded"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => reorderMutation.mutate({ id: item.id, direction: "down" })}
                    disabled={idx === schedule.length - 1}
                    className="p-1 text-gray-400 hover:text-gray-900 disabled:opacity-30 transition-colors rounded"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-heading text-lg text-gray-900">{item.title}</h3>
                    {item.category && <Badge variant="default">{item.category}</Badge>}
                    {item.sub_event_id && subEvents && (() => {
                      const sub = subEvents.find((s) => s.id === item.sub_event_id);
                      return sub ? <Badge variant="info">{sub.name}</Badge> : null;
                    })()}
                  </div>
                  {item.schedule_date && (
                    <p className="text-sm text-gray-500">
                      {formatDate(item.schedule_date)}
                      {item.start_time && ` · ${formatTime(item.start_time)}`}
                      {item.end_time && ` – ${formatTime(item.end_time)}`}
                    </p>
                  )}
                  {item.venue && (
                    <p className="text-sm text-gray-600 flex items-center gap-1.5 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" /> {item.venue}
                    </p>
                  )}
                  {item.description && <p className="text-sm text-gray-500 mt-2">{item.description}</p>}
                  {item.dress_code && <p className="text-xs text-gray-400 mt-1">Dress code: {item.dress_code}</p>}
                </div>

                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(item)} className="p-2 text-gray-400 hover:text-gray-900 transition-colors rounded">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => setDeleteId(item.id)} className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal open={showModal} onClose={() => { setShowModal(false); setEditingId(null); }} title={editingId ? "Edit Schedule Item" : "Add Schedule Item"}>
        <div className="space-y-4">
          <FormField label="Title">
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ceremony" />
          </FormField>
          <FormField label="Description">
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description of this part of the event..." />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Date">
              <DatePicker value={form.schedule_date} onChange={(v) => setForm({ ...form, schedule_date: v })} />
            </FormField>
            <FormField label="Category">
              <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Ceremony" />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Start Time">
              <TimePicker value={form.start_time} onChange={(v) => setForm({ ...form, start_time: v })} />
            </FormField>
            <FormField label="End Time">
              <TimePicker value={form.end_time} onChange={(v) => setForm({ ...form, end_time: v })} />
            </FormField>
          </div>
          <FormField label="Venue">
            <Input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} placeholder="Main Hall" />
          </FormField>
          <FormField label="Address">
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="123 Main St" />
          </FormField>
          <FormField label="Dress Code">
            <Input value={form.dress_code} onChange={(e) => setForm({ ...form, dress_code: e.target.value })} placeholder="Black Tie Optional" />
          </FormField>
          {subEvents && subEvents.length > 0 && (
            <FormField label="Linked Sub-Event" hint="Optionally link this schedule item to a sub-event">
              <Select value={form.sub_event_id || ""} onChange={(e) => setForm({ ...form, sub_event_id: e.target.value || null })}>
                <option value="">None</option>
                {subEvents.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </Select>
            </FormField>
          )}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={() => editingId ? updateMutation.mutate(editingId) : createMutation.mutate()}
              loading={createMutation.isPending || updateMutation.isPending}
              disabled={!form.title}
            >
              {editingId ? "Save Changes" : "Add Item"}
            </Button>
            <Button variant="ghost" onClick={() => { setShowModal(false); setEditingId(null); }}>Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Schedule Item">
        <p className="text-sm text-gray-600 mb-6">Are you sure you want to delete this schedule item?</p>
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
