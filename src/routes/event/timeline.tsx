import { useState } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, UserEvent, ScheduleItem } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Input";
import { Card, Badge, Modal, FormField, Toast, Skeleton, ErrorState, EmptyState } from "../../components/ui/index";
import { DatePicker } from "../../components/ui/DatePicker";
import { TimePicker } from "../../components/ui/TimePicker";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { cn, formatDate, formatTime } from "../../lib/utils";
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, Calendar, Clock, MapPin } from "lucide-react";

export default function TimelinePage() {
  const { event } = useOutletContext<{ event: UserEvent | null }>();
  const { eventId } = useParams<{ eventId: string }>();
  const queryClient = useQueryClient();

  const [toast, setToast] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ScheduleItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    schedule_date: null as string | null,
    start_time: null as string | null,
    end_time: null as string | null,
    venue: "",
    address: "",
    dress_code: "",
    category: "",
    cover_image: "",
  });

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast(msg);
    setToastType(type);
    setTimeout(() => setToast(null), 3000);
  };

  const { data: items, isLoading, isError, refetch } = useQuery<ScheduleItem[]>({
    queryKey: ["schedule", eventId],
    queryFn: async () => {
      if (!eventId) return [];
      const { data, error } = await supabase
        .from("event_schedule")
        .select("*")
        .eq("event_id", eventId)
        .order("order_index", { ascending: true });
      if (error) throw error;
      return (data || []) as ScheduleItem[];
    },
    enabled: !!eventId,
  });

  const createMutation = useMutation<void, Error>({
    mutationFn: async () => {
      if (!eventId) return;
      const nextIndex = items ? items.length : 0;
      const { error } = await supabase.from("event_schedule").insert({
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
        cover_image: form.cover_image || null,
        order_index: nextIndex,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule", eventId] });
      setModalOpen(false);
      showToast("Schedule item added");
    },
    onError: () => showToast("Failed to add item", "error"),
  });

  const updateMutation = useMutation<void, Error>({
    mutationFn: async () => {
      if (!editing) return;
      const { error } = await supabase
        .from("event_schedule")
        .update({
          title: form.title,
          description: form.description || null,
          schedule_date: form.schedule_date,
          start_time: form.start_time,
          end_time: form.end_time,
          venue: form.venue || null,
          address: form.address || null,
          dress_code: form.dress_code || null,
          category: form.category || null,
          cover_image: form.cover_image || null,
        })
        .eq("id", editing.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule", eventId] });
      setModalOpen(false);
      showToast("Schedule item updated");
    },
    onError: () => showToast("Failed to update item", "error"),
  });

  const deleteMutation = useMutation<void, Error>({
    mutationFn: async () => {
      if (!deleteId) return;
      const { error } = await supabase.from("event_schedule").delete().eq("id", deleteId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule", eventId] });
      setDeleteId(null);
      showToast("Schedule item deleted");
    },
    onError: () => showToast("Failed to delete item", "error"),
  });

  const reorderMutation = useMutation<void, Error, { item: ScheduleItem; direction: "up" | "down" }>({
    mutationFn: async ({ item, direction }) => {
      if (!items || !eventId) return;
      const sorted = [...items].sort((a, b) => a.order_index - b.order_index);
      const idx = sorted.findIndex((i) => i.id === item.id);
      if (idx < 0) return;
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= sorted.length) return;
      const swapItem = sorted[swapIdx];
      const updates = [
        { id: item.id, order_index: swapItem.order_index },
        { id: swapItem.id, order_index: item.order_index },
      ];
      for (const u of updates) {
        const { error } = await supabase.from("event_schedule").update({ order_index: u.order_index }).eq("id", u.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule", eventId] });
    },
    onError: () => showToast("Failed to reorder item", "error"),
  });

  const openAdd = () => {
    setEditing(null);
    setForm({
      title: "",
      description: "",
      schedule_date: null,
      start_time: null,
      end_time: null,
      venue: "",
      address: "",
      dress_code: "",
      category: "",
      cover_image: "",
    });
    setModalOpen(true);
  };

  const openEdit = (item: ScheduleItem) => {
    setEditing(item);
    setForm({
      title: item.title || "",
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
    setModalOpen(true);
  };

  const handleSubmit = () => {
    if (!form.title.trim()) {
      showToast("Title is required", "error");
      return;
    }
    if (editing) updateMutation.mutate();
    else createMutation.mutate();
  };

  if (!event) {
    return (
      <div className="flex items-center justify-center py-16">
        <Skeleton className="w-full h-32" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Timeline</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your event schedule</p>
        </div>
        <Button size="sm" onClick={openAdd}>
          <Plus className="w-4 h-4" /> Add Item
        </Button>
      </div>

      <Card className="p-4">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : isError ? (
          <ErrorState message="Failed to load schedule" onRetry={() => refetch()} />
        ) : !items || items.length === 0 ? (
          <EmptyState
            icon={<Calendar className="w-12 h-12" />}
            title="No schedule items yet"
            description="Add items to create your event timeline"
            action={<Button size="sm" onClick={openAdd}><Plus className="w-4 h-4" /> Add Item</Button>}
          />
        ) : (
          <div className="space-y-3">
            {[...items].sort((a, b) => a.order_index - b.order_index).map((item, idx, arr) => (
              <div key={item.id} className="flex gap-3 border border-gray-100 rounded-lg p-4 hover:border-gray-200">
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => reorderMutation.mutate({ item, direction: "up" })}
                    disabled={idx === 0 || reorderMutation.isPending}
                    className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ArrowUp className="w-4 h-4 text-gray-500" />
                  </button>
                  <button
                    onClick={() => reorderMutation.mutate({ item, direction: "down" })}
                    disabled={idx === arr.length - 1 || reorderMutation.isPending}
                    className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ArrowDown className="w-4 h-4 text-gray-500" />
                  </button>
                </div>

                {item.cover_image && (
                  <img src={item.cover_image} alt={item.title} className="w-20 h-20 rounded-lg object-cover border border-gray-200 flex-shrink-0" />
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">{item.title}</h3>
                      {item.category && <Badge variant="info">{item.category}</Badge>}
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg hover:bg-gray-100">
                        <Pencil className="w-3.5 h-3.5 text-gray-500" />
                      </button>
                      <button onClick={() => setDeleteId(item.id)} className="p-1.5 rounded-lg hover:bg-red-50">
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      </button>
                    </div>
                  </div>
                  {item.description && <p className="text-sm text-gray-600 mt-1 line-clamp-2">{item.description}</p>}
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
                    {item.schedule_date && (
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(item.schedule_date)}</span>
                    )}
                    {item.start_time && (
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatTime(item.start_time)}{item.end_time ? ` – ${formatTime(item.end_time)}` : ""}</span>
                    )}
                    {item.venue && (
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{item.venue}</span>
                    )}
                    {item.dress_code && <Badge>Dress: {item.dress_code}</Badge>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Schedule Item" : "Add Schedule Item"} maxWidth="max-w-lg">
        <div className="space-y-4">
          <FormField label="Title">
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ceremony" />
          </FormField>
          <FormField label="Description">
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description..." rows={2} />
          </FormField>
          <FormField label="Cover Image">
            <ImageUpload value={form.cover_image} onChange={(url) => setForm({ ...form, cover_image: url })} eventId={eventId} label="" />
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
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Venue">
              <Input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} placeholder="St. Mary's Church" />
            </FormField>
            <FormField label="Dress Code">
              <Input value={form.dress_code} onChange={(e) => setForm({ ...form, dress_code: e.target.value })} placeholder="Black Tie" />
            </FormField>
          </div>
          <FormField label="Address">
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="123 Main St, City" />
          </FormField>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} loading={createMutation.isPending || updateMutation.isPending}>
              {editing ? "Save Changes" : "Add Item"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Schedule Item" maxWidth="max-w-sm">
        <p className="text-sm text-gray-600">Are you sure you want to delete this schedule item? This action cannot be undone.</p>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="secondary" onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => deleteMutation.mutate()} loading={deleteMutation.isPending}>Delete</Button>
        </div>
      </Modal>

      {toast && <Toast message={toast} type={toastType} onClose={() => setToast(null)} />}
    </div>
  );
}
