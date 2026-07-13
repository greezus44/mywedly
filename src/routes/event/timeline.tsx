import { useState, useMemo } from "react";
import { useOutletContext, useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, UserEvent, ScheduleItem } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input, Select, Textarea } from "../../components/ui/Input";
import { FormField, Modal, Badge, EmptyState, ErrorState, Skeleton, Toast, ImageUpload } from "../../components/ui/index";
import { DatePicker } from "../../components/ui/DatePicker";
import { TimePicker } from "../../components/ui/TimePicker";
import { formatDateShort, formatTime } from "../../lib/utils";
import { Calendar, Plus, Pencil, Trash2, ChevronUp, ChevronDown, Clock, MapPin } from "lucide-react";

type Ctx = { event: UserEvent | null };

type ItemForm = {
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
};

const emptyForm: ItemForm = { title: "", description: "", schedule_date: null, start_time: null, end_time: null, venue: "", address: "", dress_code: "", category: "", cover_image: "" };

const CATEGORIES = ["ceremony", "reception", "meal", "party", "break", "other"];

export default function Timeline() {
  const { event } = useOutletContext<Ctx>();
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);
  const [form, setForm] = useState<ItemForm>(emptyForm);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const { data: items = [], isLoading, isError, refetch } = useQuery<ScheduleItem[]>({
    queryKey: ["schedule", eventId],
    queryFn: async () => {
      const { data, error } = await supabase.from("event_schedule").select("*").eq("event_id", eventId).order("order_index", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!eventId,
    staleTime: 30000,
  });

  const addMutation = useMutation({
    mutationFn: async (f: ItemForm) => {
      const { error } = await supabase.from("event_schedule").insert({
        event_id: eventId,
        title: f.title,
        description: f.description || null,
        schedule_date: f.schedule_date,
        start_time: f.start_time,
        end_time: f.end_time,
        venue: f.venue || null,
        address: f.address || null,
        dress_code: f.dress_code || null,
        category: f.category || null,
        cover_image: f.cover_image || null,
        order_index: items.length,
      });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["schedule", eventId] }); setToast({ message: "Item added", type: "success" }); setModalOpen(false); },
    onError: (err: any) => setToast({ message: "Failed: " + err.message, type: "error" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...f }: ItemForm & { id: string }) => {
      const { error } = await supabase.from("event_schedule").update({
        title: f.title,
        description: f.description || null,
        schedule_date: f.schedule_date,
        start_time: f.start_time,
        end_time: f.end_time,
        venue: f.venue || null,
        address: f.address || null,
        dress_code: f.dress_code || null,
        category: f.category || null,
        cover_image: f.cover_image || null,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["schedule", eventId] }); setToast({ message: "Item updated", type: "success" }); setModalOpen(false); },
    onError: (err: any) => setToast({ message: "Failed: " + err.message, type: "error" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("event_schedule").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["schedule", eventId] }); setToast({ message: "Item deleted", type: "success" }); },
    onError: (err: any) => setToast({ message: "Failed: " + err.message, type: "error" }),
  });

  const reorderMutation = useMutation({
    mutationFn: async (reordered: ScheduleItem[]) => {
      const updates = reordered.map((item, idx) =>
        supabase.from("event_schedule").update({ order_index: idx }).eq("id", item.id)
      );
      const results = await Promise.all(updates);
      const err = results.find(r => r.error);
      if (err?.error) throw err.error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["schedule", eventId] }),
    onError: (err: any) => setToast({ message: "Failed: " + err.message, type: "error" }),
  });

  const move = (index: number, dir: "up" | "down") => {
    const newItems = [...items];
    const target = dir === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= newItems.length) return;
    [newItems[index], newItems[target]] = [newItems[target], newItems[index]];
    reorderMutation.mutate(newItems);
  };

  const openAdd = () => { setEditingItem(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (item: ScheduleItem) => {
    setEditingItem(item);
    setForm({
      title: item.title, description: item.description || "", schedule_date: item.schedule_date,
      start_time: item.start_time, end_time: item.end_time, venue: item.venue || "",
      address: item.address || "", dress_code: item.dress_code || "", category: item.category || "",
      cover_image: item.cover_image || "",
    });
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { setToast({ message: "Title is required", type: "error" }); return; }
    if (editingItem) updateMutation.mutate({ id: editingItem.id, ...form });
    else addMutation.mutate(form);
  };

  if (!event) return <ErrorState message="Could not load event data" onRetry={() => navigate("/dashboard")} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Timeline</h1>
          <p className="text-sm text-gray-500">Edit your event schedule</p>
        </div>
        <Button onClick={openAdd}><Plus className="w-4 h-4" /> Add Item</Button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
          </div>
        ) : isError ? (
          <ErrorState message="Failed to load schedule" onRetry={() => refetch()} />
        ) : items.length === 0 ? (
          <EmptyState icon={<Calendar className="w-12 h-12" />} title="No schedule items yet" description="Add items to build your event timeline" action={<Button onClick={openAdd}><Plus className="w-4 h-4" /> Add Item</Button>} />
        ) : (
          <div className="divide-y divide-gray-50">
            {items.map((item, index) => (
              <div key={item.id} className="flex gap-4 p-4 hover:bg-gray-50">
                <div className="flex flex-col items-center gap-1 pt-1">
                  <button onClick={() => move(index, "up")} disabled={index === 0 || reorderMutation.isPending} className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-900 disabled:opacity-30"><ChevronUp className="w-4 h-4" /></button>
                  <span className="text-xs text-gray-400 font-medium">{index + 1}</span>
                  <button onClick={() => move(index, "down")} disabled={index === items.length - 1 || reorderMutation.isPending} className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-900 disabled:opacity-30"><ChevronDown className="w-4 h-4" /></button>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-900">{item.title}</h3>
                    {item.category && <Badge variant="info">{item.category}</Badge>}
                  </div>
                  {item.description && <p className="text-sm text-gray-500 mt-1">{item.description}</p>}
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 flex-wrap">
                    {item.schedule_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDateShort(item.schedule_date)}</span>}
                    {item.start_time && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatTime(item.start_time)}{item.end_time && ` – ${formatTime(item.end_time)}`}</span>}
                    {item.venue && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{item.venue}</span>}
                    {item.dress_code && <span>Dress: {item.dress_code}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-900"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => { if (confirm(`Delete "${item.title}"?`)) deleteMutation.mutate(item.id); }} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingItem ? "Edit Item" : "Add Item"} maxWidth="max-w-xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Title"><Input value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Ceremony" required /></FormField>
          <FormField label="Description"><Textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Short description" rows={2} /></FormField>
          <div className="grid grid-cols-3 gap-3">
            <FormField label="Date"><DatePicker value={form.schedule_date} onChange={(v) => setForm(f => ({ ...f, schedule_date: v }))} /></FormField>
            <FormField label="Start Time"><TimePicker value={form.start_time} onChange={(v) => setForm(f => ({ ...f, start_time: v }))} /></FormField>
            <FormField label="End Time"><TimePicker value={form.end_time} onChange={(v) => setForm(f => ({ ...f, end_time: v }))} /></FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Venue"><Input value={form.venue} onChange={(e) => setForm(f => ({ ...f, venue: e.target.value }))} placeholder="Venue name" /></FormField>
            <FormField label="Address"><Input value={form.address} onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Address" /></FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Dress Code"><Input value={form.dress_code} onChange={(e) => setForm(f => ({ ...f, dress_code: e.target.value }))} placeholder="e.g. Formal" /></FormField>
            <FormField label="Category">
              <Select value={form.category} onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}>
                <option value="">None</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </Select>
            </FormField>
          </div>
          <FormField label="Cover Image"><ImageUpload value={form.cover_image} onChange={(v) => setForm(f => ({ ...f, cover_image: v }))} /></FormField>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={addMutation.isPending || updateMutation.isPending}>{editingItem ? "Save Changes" : "Add Item"}</Button>
          </div>
        </form>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
