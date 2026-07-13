import { useState } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type ScheduleItem } from "../../lib/supabase";
import { Card, EmptyState, ErrorState, Skeleton, Toast, Modal, FormField, Badge } from "../../components/ui";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, Select } from "../../components/ui/Input";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { DatePicker } from "../../components/ui/DatePicker";
import { TimePicker } from "../../components/ui/TimePicker";
import { formatDate, formatTime } from "../../lib/utils";
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, Calendar, Clock, MapPin } from "lucide-react";

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

const CATEGORIES = ["Ceremony", "Reception", "Dinner", "Party", "Other"];

export default function TimelinePage() {
  const { event } = useOutletContext<{ event: UserEvent | null }>();
  const { eventId } = useParams<{ eventId: string }>();
  const queryClient = useQueryClient();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ScheduleItem | null>(null);
  const [formData, setFormData] = useState<ScheduleInput>(emptySchedule);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const { data: schedule, isLoading, isError, refetch } = useQuery({
    queryKey: ["schedule", eventId],
    queryFn: async () => {
      if (!eventId) return [];
      const { data, error } = await supabase.from("event_schedule").select("*").eq("event_id", eventId).order("order_index", { ascending: true });
      if (error) throw error;
      return data as ScheduleItem[];
    },
    enabled: !!eventId,
  });

  const createMutation = useMutation<void, Error, ScheduleInput>({
    mutationFn: async (input: ScheduleInput) => {
      if (!eventId) throw new Error("No event ID");
      const maxOrder = schedule && schedule.length > 0 ? Math.max(...schedule.map((s) => s.order_index)) : -1;
      const { error } = await supabase.from("event_schedule").insert({ ...input, event_id: eventId, order_index: maxOrder + 1 });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule", eventId] });
      setModalOpen(false);
      setFormData(emptySchedule);
      setToast({ message: "Schedule item added", type: "success" });
    },
    onError: (err) => setToast({ message: err.message, type: "error" }),
  });

  const updateMutation = useMutation<void, Error, { id: string; data: Partial<ScheduleInput> }>({
    mutationFn: async ({ id, data }) => {
      const { error } = await supabase.from("event_schedule").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule", eventId] });
      setModalOpen(false);
      setEditing(null);
      setFormData(emptySchedule);
      setToast({ message: "Schedule item updated", type: "success" });
    },
    onError: (err) => setToast({ message: err.message, type: "error" }),
  });

  const deleteMutation = useMutation<void, Error, string>({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("event_schedule").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule", eventId] });
      setDeleteId(null);
      setToast({ message: "Schedule item deleted", type: "success" });
    },
    onError: (err) => setToast({ message: err.message, type: "error" }),
  });

  const reorderMutation = useMutation<void, Error, { id: string; direction: "up" | "down" }>({
    mutationFn: async ({ id, direction }) => {
      if (!schedule) return;
      const currentIndex = schedule.findIndex((s) => s.id === id);
      if (currentIndex === -1) return;
      const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
      if (targetIndex < 0 || targetIndex >= schedule.length) return;
      const current = schedule[currentIndex];
      const target = schedule[targetIndex];
      const { error: e1 } = await supabase.from("event_schedule").update({ order_index: target.order_index }).eq("id", current.id);
      if (e1) throw e1;
      const { error: e2 } = await supabase.from("event_schedule").update({ order_index: current.order_index }).eq("id", target.id);
      if (e2) throw e2;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule", eventId] });
    },
    onError: (err) => setToast({ message: err.message, type: "error" }),
  });

  const openAdd = () => {
    setEditing(null);
    setFormData(emptySchedule);
    setModalOpen(true);
  };

  const openEdit = (item: ScheduleItem) => {
    setEditing(item);
    setFormData({
      title: item.title, description: item.description || "", schedule_date: item.schedule_date,
      start_time: item.start_time, end_time: item.end_time, venue: item.venue || "",
      address: item.address || "", dress_code: item.dress_code || "", category: item.category || "",
      cover_image: item.cover_image || "",
    });
    setModalOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.title.trim()) {
      setToast({ message: "Title is required", type: "error" });
      return;
    }
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  if (!event) {
    return (
      <div className="p-6">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Timeline</h1>
          <p className="text-sm text-slate-500">Manage your event schedule</p>
        </div>
        <Button size="sm" onClick={openAdd}><Plus className="w-4 h-4" /> Add Item</Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      ) : isError ? (
        <ErrorState message="Failed to load schedule" onRetry={() => refetch()} />
      ) : !schedule || schedule.length === 0 ? (
        <Card>
          <EmptyState icon={<Calendar className="w-12 h-12" />} title="No schedule items" description="Add items to build your event timeline" action={<Button size="sm" onClick={openAdd}><Plus className="w-4 h-4" /> Add Item</Button>} />
        </Card>
      ) : (
        <div className="space-y-3">
          {schedule.map((item, index) => (
            <Card key={item.id} className="p-4">
              <div className="flex gap-4">
                {item.cover_image && (
                  <img src={item.cover_image} alt={item.title} className="w-24 h-24 rounded-lg object-cover flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {item.category && <Badge variant="info">{item.category}</Badge>}
                        <h3 className="text-sm font-semibold text-slate-900">{item.title}</h3>
                      </div>
                      {item.description && <p className="text-sm text-slate-500 mb-2 line-clamp-2">{item.description}</p>}
                      <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                        {item.schedule_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(item.schedule_date)}</span>}
                        {item.start_time && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatTime(item.start_time)}{item.end_time ? ` - ${formatTime(item.end_time)}` : ""}</span>}
                        {item.venue && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{item.venue}</span>}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex gap-1">
                        <button onClick={() => reorderMutation.mutate({ id: item.id, direction: "up" })} disabled={index === 0} className="p-1 hover:bg-slate-100 rounded text-slate-600 disabled:opacity-30"><ArrowUp className="w-4 h-4" /></button>
                        <button onClick={() => reorderMutation.mutate({ id: item.id, direction: "down" })} disabled={index === schedule.length - 1} className="p-1 hover:bg-slate-100 rounded text-slate-600 disabled:opacity-30"><ArrowDown className="w-4 h-4" /></button>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(item)} className="p-1 hover:bg-slate-100 rounded text-slate-600"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => setDeleteId(item.id)} className="p-1 hover:bg-red-50 rounded text-red-600"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Schedule Item" : "Add Schedule Item"}>
        <div className="space-y-4">
          <FormField label="Title">
            <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Event title" />
          </FormField>
          <FormField label="Description">
            <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Description" />
          </FormField>
          <FormField label="Cover Image">
            <ImageUpload value={formData.cover_image} onChange={(v) => setFormData({ ...formData, cover_image: v })} eventId={eventId} aspectRatio="16/9" />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <DatePicker label="Date" value={formData.schedule_date} onChange={(v) => setFormData({ ...formData, schedule_date: v })} />
            <FormField label="Category">
              <Select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                <option value="">Select category</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <TimePicker label="Start Time" value={formData.start_time} onChange={(v) => setFormData({ ...formData, start_time: v })} />
            <TimePicker label="End Time" value={formData.end_time} onChange={(v) => setFormData({ ...formData, end_time: v })} />
          </div>
          <FormField label="Venue">
            <Input value={formData.venue} onChange={(e) => setFormData({ ...formData, venue: e.target.value })} placeholder="Venue name" />
          </FormField>
          <FormField label="Address">
            <Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="Address" />
          </FormField>
          <FormField label="Dress Code">
            <Input value={formData.dress_code} onChange={(e) => setFormData({ ...formData, dress_code: e.target.value })} placeholder="e.g. Black tie" />
          </FormField>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} loading={createMutation.isPending || updateMutation.isPending}>{editing ? "Save" : "Add"}</Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Schedule Item">
        <p className="text-sm text-slate-600 mb-4">Are you sure you want to delete this schedule item?</p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => deleteId && deleteMutation.mutate(deleteId)} loading={deleteMutation.isPending}>Delete</Button>
        </div>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
