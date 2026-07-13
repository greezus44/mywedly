import { useState, useEffect } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type ScheduleItem } from "../../lib/supabase";
import { Card, Badge, EmptyState, ErrorState, Skeleton, Toast, Modal } from "../../components/ui";
import { Input, Textarea, Select } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { DatePicker } from "../../components/ui/DatePicker";
import { TimePicker } from "../../components/ui/TimePicker";
import {
  Calendar, Plus, Trash2, Pencil, ChevronUp, ChevronDown, Loader2,
} from "lucide-react";
import { formatDate, formatTime } from "../../lib/utils";

interface ScheduleInput {
  title: string;
  description: string;
  schedule_date: string | null;
  start_time: string | null;
  end_time: string | null;
  venue: string;
  address: string;
  dress_code: string;
  category: string;
  cover_image: string;
}

const emptySchedule: ScheduleInput = {
  title: "", description: "", schedule_date: null, start_time: null, end_time: null,
  venue: "", address: "", dress_code: "", category: "", cover_image: "",
};

export default function Timeline() {
  const { event } = useOutletContext<{ event: UserEvent | null }>();
  const { eventId } = useParams<{ eventId: string }>();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ScheduleInput>(emptySchedule);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const { data: items, isLoading, error, refetch } = useQuery<ScheduleItem[], Error>({
    queryKey: ["schedule", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_schedule")
        .select("*")
        .eq("event_id", eventId!)
        .order("order_index", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!eventId,
  });

  const createMutation = useMutation<void, Error, ScheduleInput>({
    mutationFn: async (input) => {
      const nextOrder = (items?.length || 0);
      const { error } = await supabase.from("event_schedule").insert({
        ...input,
        event_id: eventId!,
        order_index: nextOrder,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule", eventId] });
      setModalOpen(false);
      setToast({ message: "Schedule item added", type: "success" });
    },
    onError: () => setToast({ message: "Failed to add item", type: "error" }),
  });

  const updateMutation = useMutation<void, Error, { id: string; input: ScheduleInput }>({
    mutationFn: async ({ id, input }) => {
      const { error } = await supabase.from("event_schedule").update(input).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule", eventId] });
      setModalOpen(false);
      setToast({ message: "Schedule item updated", type: "success" });
    },
    onError: () => setToast({ message: "Failed to update item", type: "error" }),
  });

  const deleteMutation = useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const { error } = await supabase.from("event_schedule").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule", eventId] });
      setToast({ message: "Item deleted", type: "success" });
    },
    onError: () => setToast({ message: "Failed to delete item", type: "error" }),
  });

  const reorderMutation = useMutation<void, Error, { id: string; direction: "up" | "down" }>({
    mutationFn: async ({ id, direction }) => {
      if (!items) return;
      const idx = items.findIndex((i) => i.id === id);
      if (idx === -1) return;
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= items.length) return;
      const current = items[idx];
      const swap = items[swapIdx];
      const { error: e1 } = await supabase.from("event_schedule").update({ order_index: swap.order_index }).eq("id", current.id);
      if (e1) throw e1;
      const { error: e2 } = await supabase.from("event_schedule").update({ order_index: current.order_index }).eq("id", swap.id);
      if (e2) throw e2;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule", eventId] });
    },
  });

  const openAdd = () => {
    setForm(emptySchedule);
    setEditingId(null);
    setModalOpen(true);
  };

  const openEdit = (item: ScheduleItem) => {
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
      cover_image: item.cover_image || "",
    });
    setEditingId(item.id);
    setModalOpen(true);
  };

  const handleSubmit = () => {
    if (!form.title.trim()) {
      setToast({ message: "Title is required", type: "error" });
      return;
    }
    if (editingId) {
      updateMutation.mutate({ id: editingId, input: form });
    } else {
      createMutation.mutate(form);
    }
  };

  if (!event) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Timeline</h1>
          <p className="text-sm text-slate-500">Manage your event schedule.</p>
        </div>
        <Button size="sm" onClick={openAdd}>
          <Plus className="w-4 h-4" /> Add Item
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : (error as any) ? (
        <Card className="p-4"><ErrorState message={(error as any).message || "Failed to load schedule"} onRetry={() => refetch()} /></Card>
      ) : !items || items.length === 0 ? (
        <Card className="p-4">
          <EmptyState
            icon={<Calendar className="w-10 h-10" />}
            title="No schedule items"
            description="Add items to build your event timeline."
            action={<Button size="sm" onClick={openAdd}><Plus className="w-4 h-4" /> Add Item</Button>}
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((item, idx) => (
            <Card key={item.id} className="p-4">
              <div className="flex items-start gap-4">
                {item.cover_image ? (
                  <img src={item.cover_image} alt={item.title} className="w-20 h-20 rounded-lg object-cover flex-shrink-0" />
                ) : (
                  <div className="w-20 h-20 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-6 h-6 text-slate-300" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-slate-900">{item.title}</h3>
                    {item.category && <Badge variant="info">{item.category}</Badge>}
                  </div>
                  {item.description && <p className="text-sm text-slate-500 mb-1 line-clamp-2">{item.description}</p>}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    {item.schedule_date && <span>{formatDate(item.schedule_date)}</span>}
                    {item.start_time && <span>{formatTime(item.start_time)}</span>}
                    {item.end_time && <span>– {formatTime(item.end_time)}</span>}
                    {item.venue && <span>• {item.venue}</span>}
                  </div>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <button
                    onClick={() => reorderMutation.mutate({ id: item.id, direction: "up" })}
                    disabled={idx === 0 || reorderMutation.isPending}
                    className="p-1 hover:bg-slate-100 rounded text-slate-400 disabled:opacity-30"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => reorderMutation.mutate({ id: item.id, direction: "down" })}
                    disabled={idx === items.length - 1 || reorderMutation.isPending}
                    className="p-1 hover:bg-slate-100 rounded text-slate-400 disabled:opacity-30"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(item)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => { if (confirm(`Delete "${item.title}"?`)) deleteMutation.mutate(item.id); }}
                    className="p-1.5 hover:bg-red-50 rounded-lg text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Edit Schedule Item" : "Add Schedule Item"}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Item title" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
              <DatePicker value={form.schedule_date} onChange={(v) => setForm({ ...form, schedule_date: v })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
              <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Ceremony" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Start Time</label>
              <TimePicker value={form.start_time} onChange={(v) => setForm({ ...form, start_time: v })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">End Time</label>
              <TimePicker value={form.end_time} onChange={(v) => setForm({ ...form, end_time: v })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Venue</label>
              <Input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} placeholder="Venue name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Dress Code</label>
              <Input value={form.dress_code} onChange={(e) => setForm({ ...form, dress_code: e.target.value })} placeholder="Dress code" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Full address" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Cover Image</label>
            <ImageUpload value={form.cover_image} onChange={(v) => setForm({ ...form, cover_image: v })} eventId={eventId} />
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} loading={createMutation.isPending || updateMutation.isPending}>
              {editingId ? "Save Changes" : "Add Item"}
            </Button>
          </div>
        </div>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
