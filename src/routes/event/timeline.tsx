import { useState } from "react";
import { useParams, useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type ScheduleItem } from "../../lib/supabase";
import { formatDate, formatTime } from "../../lib/utils";
import { Button } from "../../components/ui/Button";
import { Card, Badge, EmptyState, FormField, Modal, Toast, ErrorState, Skeleton } from "../../components/ui";
import { Input, Textarea, Select } from "../../components/ui/Input";
import { DatePicker } from "../../components/ui/DatePicker";
import { TimePicker } from "../../components/ui/TimePicker";
import { Plus, Clock, Trash2, GripVertical, Pencil, MapPin, ArrowUp, ArrowDown } from "lucide-react";

interface ItemForm {
  title: string;
  description: string;
  schedule_date: string | null;
  start_time: string | null;
  end_time: string | null;
  venue: string;
  address: string;
  dress_code: string;
  category: string;
}

const EMPTY_FORM: ItemForm = {
  title: "",
  description: "",
  schedule_date: null,
  start_time: null,
  end_time: null,
  venue: "",
  address: "",
  dress_code: "",
  category: "",
};

const CATEGORIES = ["Ceremony", "Reception", "Dinner", "Party", "Other"];

function TimelinePage() {
  const { eventId } = useParams();
  const { event } = useOutletContext<{ event: UserEvent }>();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ItemForm>(EMPTY_FORM);
  const [toast, setToast] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");

  const { data: items, isLoading, error } = useQuery({
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

  const createMutation = useMutation({
    mutationFn: async (data: ItemForm) => {
      const orderIndex = (items?.length ?? 0);
      const { error } = await supabase.from("schedule_items").insert({
        event_id: eventId,
        title: data.title,
        description: data.description || null,
        schedule_date: data.schedule_date,
        start_time: data.start_time,
        end_time: data.end_time,
        venue: data.venue || null,
        address: data.address || null,
        dress_code: data.dress_code || null,
        category: data.category || null,
        order_index: orderIndex,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule", eventId] });
      setShowModal(false);
      setForm(EMPTY_FORM);
      setToastType("success");
      setToast("Schedule item added");
    },
    onError: (err: Error) => {
      setToastType("error");
      setToast(`Failed to add: ${err.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ItemForm }) => {
      const { error } = await supabase
        .from("schedule_items")
        .update({
          title: data.title,
          description: data.description || null,
          schedule_date: data.schedule_date,
          start_time: data.start_time,
          end_time: data.end_time,
          venue: data.venue || null,
          address: data.address || null,
          dress_code: data.dress_code || null,
          category: data.category || null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule", eventId] });
      setShowModal(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
      setToastType("success");
      setToast("Schedule item updated");
    },
    onError: (err: Error) => {
      setToastType("error");
      setToast(`Failed to update: ${err.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("schedule_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule", eventId] });
      setToastType("success");
      setToast("Schedule item removed");
    },
    onError: (err: Error) => {
      setToastType("error");
      setToast(`Failed to remove: ${err.message}`);
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async ({ items: reordered }: { items: ScheduleItem[] }) => {
      const updates = reordered.map((item, idx) =>
        supabase.from("schedule_items").update({ order_index: idx }).eq("id", item.id)
      );
      const results = await Promise.all(updates);
      const err = results.find((r) => r.error);
      if (err?.error) throw err.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule", eventId] });
    },
    onError: (err: Error) => {
      setToastType("error");
      setToast(`Reorder failed: ${err.message}`);
    },
  });

  const handleSave = () => {
    if (!form.title.trim()) {
      setToastType("error");
      setToast("Title is required");
      return;
    }
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: form });
    } else {
      createMutation.mutate(form);
    }
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
    });
    setShowModal(true);
  };

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const moveItem = (index: number, direction: "up" | "down") => {
    if (!items) return;
    const newItems = [...items];
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newItems.length) return;
    [newItems[index], newItems[targetIdx]] = [newItems[targetIdx], newItems[index]];
    reorderMutation.mutate({ items: newItems });
  };

  const categoryColor = (cat: string | null) => {
    if (cat === "Ceremony") return "info";
    if (cat === "Reception") return "success";
    if (cat === "Dinner") return "warning";
    if (cat === "Party") return "error";
    return "default";
  };

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-heading text-2xl text-[var(--color-text)]">Timeline</h2>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">Create a schedule for your event day</p>
        </div>
        <Button size="sm" onClick={openAdd}>
          <Plus className="w-3.5 h-3.5" /> Add Item
        </Button>
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : error ? (
          <ErrorState message={error.message} onRetry={() => queryClient.invalidateQueries({ queryKey: ["schedule", eventId] })} />
        ) : !items || items.length === 0 ? (
          <EmptyState
            icon={<Clock className="w-12 h-12" />}
            title="No schedule items"
            description="Add items to create a timeline for your event"
            action={<Button size="sm" onClick={openAdd}><Plus className="w-3.5 h-3.5" /> Add Item</Button>}
          />
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {items.map((item, idx) => (
              <div key={item.id} className="flex items-start gap-3 p-4 hover:bg-[var(--color-bg-subtle)] transition-colors group">
                <div className="flex flex-col items-center gap-1 pt-1">
                  <button
                    onClick={() => moveItem(idx, "up")}
                    disabled={idx === 0 || reorderMutation.isPending}
                    className="p-0.5 text-[var(--color-text-muted)] hover:text-[var(--color-text)] disabled:opacity-30"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <GripVertical className="w-4 h-4 text-[var(--color-text-muted)] opacity-30" />
                  <button
                    onClick={() => moveItem(idx, "down")}
                    disabled={idx === items.length - 1 || reorderMutation.isPending}
                    className="p-0.5 text-[var(--color-text-muted)] hover:text-[var(--color-text)] disabled:opacity-30"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-medium text-[var(--color-text)]">{item.title}</h3>
                    {item.category && <Badge variant={categoryColor(item.category) as "info" | "success" | "warning" | "error" | "default"}>{item.category}</Badge>}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--color-text-muted)]">
                    {item.schedule_date && <span>{formatDate(item.schedule_date)}</span>}
                    {item.start_time && <span>{formatTime(item.start_time)}{item.end_time ? ` – ${formatTime(item.end_time)}` : ""}</span>}
                    {item.venue && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{item.venue}</span>}
                  </div>
                  {item.description && <p className="text-xs text-[var(--color-text-muted)] mt-1.5 line-clamp-2">{item.description}</p>}
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEdit(item)}
                    className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-subtle)]"
                    style={{ borderRadius: "var(--radius)" }}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(item.id)}
                    disabled={deleteMutation.isPending}
                    className="p-1.5 text-[var(--color-text-muted)] hover:text-red-600 hover:bg-red-50"
                    style={{ borderRadius: "var(--radius)" }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Add/Edit Modal */}
      <Modal open={showModal} onClose={() => { setShowModal(false); setEditingId(null); }} title={editingId ? "Edit Schedule Item" : "Add Schedule Item"}>
        <div className="space-y-4">
          <FormField label="Title" hint="Required">
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
              placeholder="Join us for the wedding ceremony..."
              rows={2}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Date">
              <DatePicker value={form.schedule_date} onChange={(v) => setForm({ ...form, schedule_date: v })} />
            </FormField>
            <FormField label="Category">
              <Select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                <option value="">Select category</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
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
              placeholder="123 Main Street, City"
            />
          </FormField>

          <FormField label="Dress Code">
            <Input
              value={form.dress_code}
              onChange={(e) => setForm({ ...form, dress_code: e.target.value })}
              placeholder="Black tie / Formal"
            />
          </FormField>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" onClick={() => { setShowModal(false); setEditingId(null); }}>Cancel</Button>
            <Button size="sm" onClick={handleSave} loading={createMutation.isPending || updateMutation.isPending}>
              {editingId ? "Save Changes" : "Add Item"}
            </Button>
          </div>
        </div>
      </Modal>

      {toast && <Toast message={toast} type={toastType} onClose={() => setToast(null)} />}
    </div>
  );
}

export default TimelinePage;
