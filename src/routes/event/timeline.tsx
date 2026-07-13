import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type ScheduleItem } from "../../lib/supabase";
import { formatDate, formatTime } from "../../lib/utils";
import { Button } from "../../components/ui/Button";
import {
  Card,
  Badge,
  EmptyState,
  FormField,
  Modal,
  Toast,
  ErrorState,
  Skeleton,
} from "../../components/ui";
import { Input, Textarea, Select } from "../../components/ui/Input";
import { DatePicker } from "../../components/ui/DatePicker";
import { TimePicker } from "../../components/ui/TimePicker";
import {
  Clock,
  Plus,
  Trash2,
  Pencil,
  ArrowUp,
  ArrowDown,
  MapPin,
  Calendar,
} from "lucide-react";

interface EditItem {
  id?: string;
  title: string;
  schedule_date: string | null;
  start_time: string | null;
  end_time: string | null;
  venue: string;
  address: string;
  dress_code: string;
  category: string;
  description: string;
  order_index: number;
}

const emptyItem: EditItem = {
  title: "",
  schedule_date: null,
  start_time: null,
  end_time: null,
  venue: "",
  address: "",
  dress_code: "",
  category: "",
  description: "",
  order_index: 0,
};

const CATEGORIES = ["Ceremony", "Reception", "Dinner", "Party", "Other"];

export default function TimelinePage() {
  const { eventId } = useParams();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<EditItem>(emptyItem);
  const [isEditing, setIsEditing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [toastError, setToastError] = useState<string | null>(null);

  const { data: items, isLoading, error } = useQuery({
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

  const createMutation = useMutation({
    mutationFn: async (item: EditItem) => {
      if (!eventId) return;
      const { error } = await supabase.from("event_schedule").insert({
        event_id: eventId,
        title: item.title,
        schedule_date: item.schedule_date,
        start_time: item.start_time,
        end_time: item.end_time,
        venue: item.venue || null,
        address: item.address || null,
        dress_code: item.dress_code || null,
        category: item.category || null,
        description: item.description || null,
        order_index: item.order_index,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule", eventId] });
      setShowModal(false);
      setEditItem(emptyItem);
      setIsEditing(false);
      setToast("Schedule item added");
    },
    onError: (err: Error) => setToastError(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: async (item: EditItem) => {
      if (!item.id) return;
      const { error } = await supabase
        .from("event_schedule")
        .update({
          title: item.title,
          schedule_date: item.schedule_date,
          start_time: item.start_time,
          end_time: item.end_time,
          venue: item.venue || null,
          address: item.address || null,
          dress_code: item.dress_code || null,
          category: item.category || null,
          description: item.description || null,
          order_index: item.order_index,
        })
        .eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule", eventId] });
      setShowModal(false);
      setEditItem(emptyItem);
      setIsEditing(false);
      setToast("Schedule item updated");
    },
    onError: (err: Error) => setToastError(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from("event_schedule")
        .delete()
        .eq("id", itemId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule", eventId] });
      setToast("Item removed");
    },
    onError: (err: Error) => setToastError(err.message),
  });

  const reorderMutation = useMutation({
    mutationFn: async (reordered: { id: string; order_index: number }[]) => {
      const updates = reordered.map((r) =>
        supabase.from("event_schedule").update({ order_index: r.order_index }).eq("id", r.id)
      );
      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule", eventId] });
    },
  });

  const handleAdd = () => {
    setEditItem({ ...emptyItem, order_index: (items?.length || 0) });
    setIsEditing(false);
    setShowModal(true);
  };

  const handleEdit = (item: ScheduleItem) => {
    setEditItem({
      id: item.id,
      title: item.title,
      schedule_date: item.schedule_date,
      start_time: item.start_time,
      end_time: item.end_time,
      venue: item.venue || "",
      address: item.address || "",
      dress_code: item.dress_code || "",
      category: item.category || "",
      description: item.description || "",
      order_index: item.order_index,
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const handleMove = (index: number, direction: "up" | "down") => {
    if (!items) return;
    const newItems = [...items];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newItems.length) return;
    [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
    reorderMutation.mutate(
      newItems.map((item, i) => ({ id: item.id, order_index: i }))
    );
  };

  const handleSave = () => {
    if (isEditing) {
      updateMutation.mutate(editItem);
    } else {
      createMutation.mutate(editItem);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8">
        <Skeleton className="h-12 w-48 mb-4" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 lg:p-8">
        <ErrorState message={error.message} onRetry={() => queryClient.invalidateQueries({ queryKey: ["schedule", eventId] })} />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="font-heading text-2xl text-[var(--color-text)] mb-1">Timeline</h2>
          <p className="text-sm text-[var(--color-text-muted)]">
            Create a schedule of events for your guests to follow.
          </p>
        </div>
        <Button size="sm" onClick={handleAdd}>
          <Plus className="w-3.5 h-3.5" /> Add Item
        </Button>
      </div>

      {/* Timeline List */}
      {(items || []).length === 0 ? (
        <Card>
          <EmptyState
            icon={<Clock className="w-12 h-12" />}
            title="No schedule items"
            description="Add events like ceremony, reception, or dinner to build your timeline."
            action={
              <Button onClick={handleAdd}>
                <Plus className="w-4 h-4" /> Add First Item
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {items!.map((item, index) => (
            <Card key={item.id} className="p-5">
              <div className="flex items-start gap-4">
                {/* Reorder controls */}
                <div className="flex flex-col gap-1 mt-1">
                  <button
                    onClick={() => handleMove(index, "up")}
                    disabled={index === 0}
                    className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text)] disabled:opacity-30 transition-colors"
                    title="Move up"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleMove(index, "down")}
                    disabled={index === (items?.length || 0) - 1}
                    className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text)] disabled:opacity-30 transition-colors"
                    title="Move down"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap mb-2">
                    <h3 className="font-heading text-lg text-[var(--color-text)]">{item.title}</h3>
                    {item.category && (
                      <Badge variant="info">{item.category}</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 flex-wrap text-sm text-[var(--color-text-muted)]">
                    {item.schedule_date && (
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(item.schedule_date)}
                      </span>
                    )}
                    {item.start_time && (
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {formatTime(item.start_time)}
                        {item.end_time && ` — ${formatTime(item.end_time)}`}
                      </span>
                    )}
                    {item.venue && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" />
                        {item.venue}
                      </span>
                    )}
                  </div>
                  {item.dress_code && (
                    <p className="text-xs text-[var(--color-text-muted)] mt-2">
                      Dress code: {item.dress_code}
                    </p>
                  )}
                  {item.description && (
                    <p className="text-sm text-[var(--color-text-muted)] mt-2">{item.description}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEdit(item)}
                    className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-subtle)] transition-colors"
                    style={{ borderRadius: "var(--radius)" }}
                    title="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(item.id)}
                    className="p-1.5 text-[var(--color-text-muted)] hover:text-red-600 hover:bg-red-50 transition-colors"
                    style={{ borderRadius: "var(--radius)" }}
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={isEditing ? "Edit Schedule Item" : "Add Schedule Item"}
      >
        <div className="space-y-4">
          <FormField label="Title">
            <Input
              value={editItem.title}
              onChange={(e) => setEditItem({ ...editItem, title: e.target.value })}
              placeholder="Ceremony"
            />
          </FormField>
          <FormField label="Category">
            <Select
              value={editItem.category}
              onChange={(e) => setEditItem({ ...editItem, category: e.target.value })}
            >
              <option value="">—</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Date">
            <DatePicker
              value={editItem.schedule_date}
              onChange={(v) => setEditItem({ ...editItem, schedule_date: v })}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Start Time">
              <TimePicker
                value={editItem.start_time}
                onChange={(v) => setEditItem({ ...editItem, start_time: v })}
              />
            </FormField>
            <FormField label="End Time">
              <TimePicker
                value={editItem.end_time}
                onChange={(v) => setEditItem({ ...editItem, end_time: v })}
              />
            </FormField>
          </div>
          <FormField label="Venue">
            <Input
              value={editItem.venue}
              onChange={(e) => setEditItem({ ...editItem, venue: e.target.value })}
              placeholder="The Grand Ballroom"
            />
          </FormField>
          <FormField label="Address">
            <Input
              value={editItem.address}
              onChange={(e) => setEditItem({ ...editItem, address: e.target.value })}
              placeholder="123 Main Street"
            />
          </FormField>
          <FormField label="Dress Code">
            <Input
              value={editItem.dress_code}
              onChange={(e) => setEditItem({ ...editItem, dress_code: e.target.value })}
              placeholder="Black Tie / Formal"
            />
          </FormField>
          <FormField label="Description">
            <Textarea
              value={editItem.description}
              onChange={(e) => setEditItem({ ...editItem, description: e.target.value })}
              placeholder="Additional details for guests…"
              rows={3}
            />
          </FormField>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              loading={createMutation.isPending || updateMutation.isPending}
              disabled={!editItem.title.trim()}
            >
              {isEditing ? "Save Changes" : "Add Item"}
            </Button>
          </div>
        </div>
      </Modal>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      {toastError && <Toast message={toastError} type="error" onClose={() => setToastError(null)} />}
    </div>
  );
}
