import { useState } from "react";
import { useOutletContext, useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, Calendar, MapPin, Clock } from "lucide-react";
import { supabase, UserEvent, ScheduleItem } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input, Select, Textarea } from "../../components/ui/Input";
import { Card, Badge, Modal, FormField, ImageUpload, EmptyState, Skeleton, Toast, ErrorState } from "../../components/ui/index";
import { DatePicker } from "../../components/ui/DatePicker";
import { formatDateShort, formatTime } from "../../lib/utils";

type Ctx = { event: UserEvent | null };

interface ScheduleForm {
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

const EMPTY_FORM: ScheduleForm = {
  title: "",
  description: "",
  schedule_date: null,
  start_time: null,
  end_time: null,
  venue: "",
  address: "",
  dress_code: "",
  category: "ceremony",
  cover_image: "",
};

const CATEGORIES = [
  { id: "ceremony", label: "Ceremony" },
  { id: "reception", label: "Reception" },
  { id: "dinner", label: "Dinner" },
  { id: "party", label: "Party" },
  { id: "preparation", label: "Preparation" },
  { id: "other", label: "Other" },
];

const CATEGORY_COLORS: Record<string, "blue" | "green" | "yellow" | "gray" | "red"> = {
  ceremony: "blue",
  reception: "green",
  dinner: "yellow",
  party: "red",
  preparation: "gray",
  other: "gray",
};

function TimePicker({ value, onChange, label }: { value: string | null; onChange: (v: string | null) => void; label?: string }) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
      <input
        type="time"
        value={value || ""}
        onChange={(e) => onChange(e.target.value || null)}
        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
      />
    </div>
  );
}

export default function TimelinePage() {
  const { event } = useOutletContext<Ctx>();
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ScheduleForm>(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const { data: schedule, isLoading, error, refetch } = useQuery<ScheduleItem[]>({
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
    staleTime: 30000,
  });

  const addMutation = useMutation({
    mutationFn: async (newItem: ScheduleForm) => {
      if (!eventId) throw new Error("No event ID");
      const nextOrder = (schedule?.length || 0);
      const { data, error } = await supabase
        .from("event_schedule")
        .insert({
          event_id: eventId,
          title: newItem.title,
          description: newItem.description,
          schedule_date: newItem.schedule_date,
          start_time: newItem.start_time,
          end_time: newItem.end_time,
          venue: newItem.venue,
          address: newItem.address,
          dress_code: newItem.dress_code,
          category: newItem.category,
          cover_image: newItem.cover_image,
          order_index: nextOrder,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule", eventId] });
      setModalOpen(false);
      setForm(EMPTY_FORM);
      showToast("Schedule item added");
    },
    onError: (err: any) => showToast("Failed to add item: " + err.message, "error"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ScheduleForm> }) => {
      const { error } = await supabase.from("event_schedule").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule", eventId] });
      setModalOpen(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
      showToast("Schedule item updated");
    },
    onError: (err: any) => showToast("Failed to update item: " + err.message, "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("event_schedule").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule", eventId] });
      setDeleteId(null);
      showToast("Schedule item deleted");
    },
    onError: (err: any) => showToast("Failed to delete item: " + err.message, "error"),
  });

  const reorderMutation = useMutation({
    mutationFn: async (items: { id: string; order_index: number }[]) => {
      for (const item of items) {
        const { error } = await supabase.from("event_schedule").update({ order_index: item.order_index }).eq("id", item.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule", eventId] });
    },
    onError: (err: any) => showToast("Failed to reorder: " + err.message, "error"),
  });

  const handleMove = (index: number, direction: "up" | "down") => {
    if (!schedule) return;
    const newOrder = [...schedule];
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newOrder.length) return;
    [newOrder[index], newOrder[swapIndex]] = [newOrder[swapIndex], newOrder[index]];
    const updates = newOrder.map((item, i) => ({ id: item.id, order_index: i }));
    reorderMutation.mutate(updates);
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const handleOpenEdit = (item: ScheduleItem) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      description: item.description,
      schedule_date: item.schedule_date,
      start_time: item.start_time,
      end_time: item.end_time,
      venue: item.venue,
      address: item.address,
      dress_code: item.dress_code,
      category: item.category,
      cover_image: item.cover_image,
    });
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      showToast("Title is required", "error");
      return;
    }
    if (editingId) {
      updateMutation.mutate({ id: editingId, updates: form });
    } else {
      addMutation.mutate(form);
    }
  };

  if (!event) return <ErrorState message="Could not load event data" onRetry={() => navigate("/dashboard")} />;
  if (error) return <ErrorState message={error.message} onRetry={() => refetch()} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Schedule Timeline</h1>
          <p className="text-sm text-gray-500">Organize your event programme</p>
        </div>
        <Button onClick={handleOpenAdd}>
          <Plus className="w-4 h-4" /> Add Item
        </Button>
      </div>

      <Card className="p-4">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        ) : !schedule || schedule.length === 0 ? (
          <EmptyState
            icon={<Calendar className="w-12 h-12" />}
            title="No schedule items yet"
            description="Add items to build your event timeline"
            action={
              <Button onClick={handleOpenAdd}>
                <Plus className="w-4 h-4" /> Add Item
              </Button>
            }
          />
        ) : (
          <div className="space-y-3">
            {schedule.map((item, index) => (
              <div
                key={item.id}
                className="flex gap-3 p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
              >
                <div className="flex flex-col items-center gap-1">
                  <button
                    onClick={() => handleMove(index, "up")}
                    disabled={index === 0}
                    className="p-1 rounded text-gray-400 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleMove(index, "down")}
                    disabled={index === schedule.length - 1}
                    className="p-1 rounded text-gray-400 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-gray-900">{item.title}</h3>
                      <Badge color={CATEGORY_COLORS[item.category] || "gray"}>
                        {CATEGORIES.find((c) => c.id === item.category)?.label || item.category}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteId(item.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {item.description && <p className="text-sm text-gray-500 mb-2">{item.description}</p>}

                  <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                    {item.schedule_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDateShort(item.schedule_date)}
                      </span>
                    )}
                    {item.start_time && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {formatTime(item.start_time)}
                        {item.end_time && ` – ${formatTime(item.end_time)}`}
                      </span>
                    )}
                    {item.venue && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {item.venue}
                        {item.address && `, ${item.address}`}
                      </span>
                    )}
                    {item.dress_code && (
                      <span className="flex items-center gap-1">
                        <span className="font-medium">Dress:</span> {item.dress_code}
                      </span>
                    )}
                  </div>
                </div>

                {item.cover_image && (
                  <img
                    src={item.cover_image}
                    alt={item.title}
                    className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Edit Schedule Item" : "Add Schedule Item"} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Title" hint="Required">
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Wedding Ceremony"
              autoFocus
            />
          </FormField>
          <FormField label="Description">
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Additional details about this item"
            />
          </FormField>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DatePicker
              value={form.schedule_date}
              onChange={(v) => setForm({ ...form, schedule_date: v })}
              label="Date"
            />
            <FormField label="Category">
              <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TimePicker
              value={form.start_time}
              onChange={(v) => setForm({ ...form, start_time: v })}
              label="Start Time"
            />
            <TimePicker
              value={form.end_time}
              onChange={(v) => setForm({ ...form, end_time: v })}
              label="End Time"
            />
          </div>
          <FormField label="Venue">
            <Input
              value={form.venue}
              onChange={(e) => setForm({ ...form, venue: e.target.value })}
              placeholder="e.g. Grand Ballroom"
            />
          </FormField>
          <FormField label="Address">
            <Input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Full address"
            />
          </FormField>
          <FormField label="Dress Code">
            <Input
              value={form.dress_code}
              onChange={(e) => setForm({ ...form, dress_code: e.target.value })}
              placeholder="e.g. Formal, Black Tie, Smart Casual"
            />
          </FormField>
          <FormField label="Cover Image">
            <ImageUpload value={form.cover_image} onChange={(v) => setForm({ ...form, cover_image: v })} />
          </FormField>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={addMutation.isPending || updateMutation.isPending}>
              {editingId ? "Save Changes" : "Add Item"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Schedule Item" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Are you sure you want to delete this schedule item? This action cannot be undone.</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button variant="danger" loading={deleteMutation.isPending} onClick={() => deleteId && deleteMutation.mutate(deleteId)}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
