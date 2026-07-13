import { useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Trash2,
  Pencil,
  GripVertical,
  Calendar,
  Clock,
  MapPin,
  Shirt,
  Tag,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { supabase, type UserEvent, type ScheduleItem } from "../../lib/supabase";
import { cn, formatDate, formatTime } from "../../lib/utils";
import { Button } from "../../components/ui/Button";
import { Card, Badge, EmptyState, FormField, Skeleton, ErrorState, Toast, Modal } from "../../components/ui";
import { Input, Textarea, Select } from "../../components/ui/Input";
import { DatePicker } from "../../components/ui/DatePicker";
import { TimePicker } from "../../components/ui/TimePicker";

const CATEGORIES = ["Ceremony", "Reception", "Dinner", "Party", "Other"] as const;

function TimelinePage() {
  const { eventId } = useParams<{ eventId: string }>();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    schedule_date: null as string | null,
    start_time: null as string | null,
    end_time: null as string | null,
    venue: "",
    address: "",
    dress_code: "",
    category: "Ceremony",
  });

  const { data: event } = useQuery<UserEvent>({
    queryKey: ["event", eventId],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_events").select("*").eq("id", eventId!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!eventId,
  });

  const { data: items, isLoading, isError, refetch } = useQuery<ScheduleItem[]>({
    queryKey: ["schedule", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("schedule_items")
        .select("*")
        .eq("event_id", eventId!)
        .order("order_index", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!eventId,
  });

  const createMutation = useMutation({
    mutationFn: async (item: typeof form) => {
      const maxOrder = items?.length ? Math.max(...items.map((i) => i.order_index)) : 0;
      const { data, error } = await supabase
        .from("schedule_items")
        .insert({
          event_id: eventId,
          title: item.title,
          description: item.description || null,
          schedule_date: item.schedule_date,
          start_time: item.start_time,
          end_time: item.end_time,
          venue: item.venue || null,
          address: item.address || null,
          dress_code: item.dress_code || null,
          category: item.category,
          order_index: maxOrder + 1,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule", eventId] });
      setModalOpen(false);
      resetForm();
      setToast({ message: "Schedule item added", type: "success" });
    },
    onError: () => setToast({ message: "Failed to add item", type: "error" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, item }: { id: string; item: typeof form }) => {
      const { data, error } = await supabase
        .from("schedule_items")
        .update({
          title: item.title,
          description: item.description || null,
          schedule_date: item.schedule_date,
          start_time: item.start_time,
          end_time: item.end_time,
          venue: item.venue || null,
          address: item.address || null,
          dress_code: item.dress_code || null,
          category: item.category,
        })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule", eventId] });
      setModalOpen(false);
      resetForm();
      setToast({ message: "Schedule item updated", type: "success" });
    },
    onError: () => setToast({ message: "Failed to update item", type: "error" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("schedule_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule", eventId] });
      setToast({ message: "Item removed", type: "success" });
    },
    onError: () => setToast({ message: "Failed to remove item", type: "error" }),
  });

  const reorderMutation = useMutation({
    mutationFn: async (reordered: ScheduleItem[]) => {
      const updates = reordered.map((item, index) => ({
        id: item.id,
        order_index: index + 1,
      }));
      for (const u of updates) {
        const { error } = await supabase.from("schedule_items").update({ order_index: u.order_index }).eq("id", u.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule", eventId] });
    },
    onError: () => setToast({ message: "Failed to reorder", type: "error" }),
  });

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      schedule_date: null,
      start_time: null,
      end_time: null,
      venue: "",
      address: "",
      dress_code: "",
      category: "Ceremony",
    });
    setEditingItem(null);
  };

  const openAddModal = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEditModal = (item: ScheduleItem) => {
    setEditingItem(item);
    setForm({
      title: item.title,
      description: item.description || "",
      schedule_date: item.schedule_date,
      start_time: item.start_time,
      end_time: item.end_time,
      venue: item.venue || "",
      address: item.address || "",
      dress_code: item.dress_code || "",
      category: item.category || "Ceremony",
    });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!form.title.trim()) {
      setToast({ message: "Title is required", type: "error" });
      return;
    }
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, item: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const moveItem = useCallback(
    (index: number, direction: "up" | "down") => {
      if (!items) return;
      const reordered = [...items];
      const swapIndex = direction === "up" ? index - 1 : index + 1;
      if (swapIndex < 0 || swapIndex >= reordered.length) return;
      [reordered[index], reordered[swapIndex]] = [reordered[swapIndex], reordered[index]];
      reorderMutation.mutate(reordered);
    },
    [items, reorderMutation],
  );

  if (isLoading) {
    return (
      <div className="p-8">
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-32 w-full mb-4" />
        <Skeleton className="h-32 w-full mb-4" />
      </div>
    );
  }

  if (isError || !event) {
    return <ErrorState message="Failed to load schedule" onRetry={refetch} />;
  }

  return (
    <div>
      <div className="px-6 lg:px-8 py-6 border-b border-onyx/10 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl text-onyx">Timeline</h1>
          <p className="mt-1 text-sm text-onyx/50">Schedule of events and activities</p>
        </div>
        <Button onClick={openAddModal}>
          <Plus className="w-4 h-4" /> Add Item
        </Button>
      </div>

      <div className="p-6 lg:p-8">
        {items && items.length > 0 ? (
          <div className="space-y-4">
            {items.map((item, index) => (
              <Card key={item.id} className="p-5">
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center gap-1 pt-1">
                    <button
                      onClick={() => moveItem(index, "up")}
                      disabled={index === 0}
                      className="p-1 text-onyx/30 hover:text-onyx disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <GripVertical className="w-4 h-4 text-onyx/20" />
                    <button
                      onClick={() => moveItem(index, "down")}
                      disabled={index === items.length - 1}
                      className="p-1 text-onyx/30 hover:text-onyx disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-heading text-lg text-onyx">{item.title}</h3>
                          {item.category && (
                            <Badge variant="info">{item.category}</Badge>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-sm text-onyx/60 mb-3">{item.description}</p>
                        )}
                        <div className="flex flex-wrap gap-x-6 gap-y-2">
                          {item.schedule_date && (
                            <div className="flex items-center gap-1.5 text-xs text-onyx/50">
                              <Calendar className="w-3.5 h-3.5" /> {formatDate(item.schedule_date)}
                            </div>
                          )}
                          {item.start_time && (
                            <div className="flex items-center gap-1.5 text-xs text-onyx/50">
                              <Clock className="w-3.5 h-3.5" />
                              {formatTime(item.start_time)}
                              {item.end_time && ` — ${formatTime(item.end_time)}`}
                            </div>
                          )}
                          {item.venue && (
                            <div className="flex items-center gap-1.5 text-xs text-onyx/50">
                              <MapPin className="w-3.5 h-3.5" /> {item.venue}
                            </div>
                          )}
                          {item.dress_code && (
                            <div className="flex items-center gap-1.5 text-xs text-onyx/50">
                              <Shirt className="w-3.5 h-3.5" /> {item.dress_code}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-1.5 text-onyx/30 hover:text-onyx transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteMutation.mutate(item.id)}
                          className="p-1.5 text-onyx/30 hover:text-red-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Calendar className="w-12 h-12" />}
            title="No schedule items"
            description="Add events like ceremony, reception, or dinner to build your timeline"
            action={<Button onClick={openAddModal}><Plus className="w-4 h-4" /> Add Item</Button>}
          />
        )}
      </div>

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); resetForm(); }} title={editingItem ? "Edit Schedule Item" : "Add Schedule Item"}>
        <div className="space-y-4">
          <FormField label="Title">
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ceremony"
            />
          </FormField>
          <FormField label="Description">
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Optional description..."
              rows={2}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Date">
              <DatePicker
                value={form.schedule_date}
                onChange={(v) => setForm({ ...form, schedule_date: v })}
              />
            </FormField>
            <FormField label="Category">
              <Select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </Select>
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Start Time">
              <TimePicker
                value={form.start_time}
                onChange={(v) => setForm({ ...form, start_time: v })}
              />
            </FormField>
            <FormField label="End Time">
              <TimePicker
                value={form.end_time}
                onChange={(v) => setForm({ ...form, end_time: v })}
              />
            </FormField>
          </div>
          <FormField label="Venue">
            <Input
              value={form.venue}
              onChange={(e) => setForm({ ...form, venue: e.target.value })}
              placeholder="St. Mary's Church"
            />
          </FormField>
          <FormField label="Address">
            <Input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="123 Main Street"
            />
          </FormField>
          <FormField label="Dress Code">
            <Input
              value={form.dress_code}
              onChange={(e) => setForm({ ...form, dress_code: e.target.value })}
              placeholder="Black Tie"
            />
          </FormField>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => { setModalOpen(false); resetForm(); }}>Cancel</Button>
            <Button onClick={handleSave} loading={createMutation.isPending || updateMutation.isPending}>
              {editingItem ? "Save Changes" : "Add Item"}
            </Button>
          </div>
        </div>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default TimelinePage;
