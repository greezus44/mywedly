import { useState, useEffect } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type ScheduleItem } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Input";
import { Card, Modal, FormField, Toast, Skeleton, ErrorState, EmptyState } from "../../components/ui";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { DatePicker } from "../../components/ui/DatePicker";
import { TimePicker } from "../../components/ui/TimePicker";
import { Plus, Trash2, Edit2, ArrowUp, ArrowDown, Calendar, Clock, MapPin } from "lucide-react";
import { formatDate, formatTime } from "../../lib/utils";

export default function TimelinePage() {
  const { event } = useOutletContext<{ event: UserEvent | null }>();
  const { eventId } = useParams<{ eventId: string }>();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

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

  const createMutation = useMutation<void, Error, Omit<ScheduleItem, "id" | "event_id" | "created_at" | "order_index">>({
    mutationFn: async (newItem) => {
      if (!eventId) throw new Error("No event ID");
      const nextOrder = (items?.length || 0) > 0 ? Math.max(...items!.map((i) => i.order_index)) + 1 : 0;
      const { error } = await supabase.from("event_schedule").insert({
        ...newItem,
        event_id: eventId,
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

  const updateMutation = useMutation<void, Error, { id: string; patch: Partial<ScheduleItem> }>({
    mutationFn: async ({ id, patch }) => {
      const { error } = await supabase.from("event_schedule").update(patch).eq("id", id);
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
      if (!items) throw new Error("No items");
      const sorted = [...items].sort((a, b) => a.order_index - b.order_index);
      const idx = sorted.findIndex((i) => i.id === id);
      if (idx === -1) return;
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= sorted.length) return;
      const a = sorted[idx];
      const b = sorted[swapIdx];
      const updates = [
        supabase.from("event_schedule").update({ order_index: b.order_index }).eq("id", a.id),
        supabase.from("event_schedule").update({ order_index: a.order_index }).eq("id", b.id),
      ];
      const results = await Promise.all(updates);
      for (const r of results) { if (r.error) throw r.error; }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule", eventId] });
    },
    onError: () => setToast({ message: "Failed to reorder", type: "error" }),
  });

  const openAdd = () => { setEditingItem(null); setModalOpen(true); };
  const openEdit = (item: ScheduleItem) => { setEditingItem(item); setModalOpen(true); };

  if (!event) return <div className="p-6"><Skeleton className="h-8 w-48 mb-4" /><Skeleton className="h-96 w-full" /></div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-slate-900">Schedule</h1>
        <Button size="sm" onClick={openAdd}>
          <Plus className="w-4 h-4" /> Add Item
        </Button>
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
          </div>
        ) : isError ? (
          <ErrorState message="Failed to load schedule" onRetry={() => refetch()} />
        ) : !items || items.length === 0 ? (
          <EmptyState icon={<Calendar className="w-12 h-12" />} title="No schedule items" description="Add items to build your event timeline." action={<Button size="sm" onClick={openAdd}><Plus className="w-4 h-4" /> Add Item</Button>} />
        ) : (
          <div className="divide-y divide-slate-100">
            {[...items].sort((a, b) => a.order_index - b.order_index).map((item, idx, arr) => (
              <div key={item.id} className="p-4 flex items-start gap-4 hover:bg-slate-50/50">
                <div className="flex flex-col gap-1 pt-1">
                  <button
                    onClick={() => reorderMutation.mutate({ id: item.id, direction: "up" })}
                    disabled={idx === 0 || reorderMutation.isPending}
                    className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => reorderMutation.mutate({ id: item.id, direction: "down" })}
                    disabled={idx === arr.length - 1 || reorderMutation.isPending}
                    className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                </div>
                {item.cover_image ? (
                  <img src={item.cover_image} alt={item.title} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-6 h-6 text-slate-300" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-slate-900">{item.title}</h3>
                  {item.description && <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">{item.description}</p>}
                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                    {item.schedule_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(item.schedule_date)}</span>}
                    {item.start_time && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatTime(item.start_time)}</span>}
                    {item.venue && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {item.venue}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(item)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => deleteMutation.mutate(item.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <ScheduleModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        editingItem={editingItem}
        eventId={eventId}
        onSave={(data) => {
          if (editingItem) updateMutation.mutate({ id: editingItem.id, patch: data });
          else createMutation.mutate(data);
        }}
        saving={createMutation.isPending || updateMutation.isPending}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

function ScheduleModal({
  open,
  onClose,
  editingItem,
  eventId,
  onSave,
  saving,
}: {
  open: boolean;
  onClose: () => void;
  editingItem: ScheduleItem | null;
  eventId?: string;
  onSave: (data: { title: string; description: string | null; schedule_date: string | null; start_time: string | null; end_time: string | null; venue: string | null; address: string | null; dress_code: string | null; category: string | null; cover_image: string | null }) => void;
  saving: boolean;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scheduleDate, setScheduleDate] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<string | null>(null);
  const [endTime, setEndTime] = useState<string | null>(null);
  const [venue, setVenue] = useState("");
  const [address, setAddress] = useState("");
  const [dressCode, setDressCode] = useState("");
  const [category, setCategory] = useState("");
  const [coverImage, setCoverImage] = useState("");

  useEffect(() => {
    if (open) {
      setTitle(editingItem?.title || "");
      setDescription(editingItem?.description || "");
      setScheduleDate(editingItem?.schedule_date || null);
      setStartTime(editingItem?.start_time || null);
      setEndTime(editingItem?.end_time || null);
      setVenue(editingItem?.venue || "");
      setAddress(editingItem?.address || "");
      setDressCode(editingItem?.dress_code || "");
      setCategory(editingItem?.category || "");
      setCoverImage(editingItem?.cover_image || "");
    }
  }, [open, editingItem]);

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      description: description.trim() || null,
      schedule_date: scheduleDate,
      start_time: startTime,
      end_time: endTime,
      venue: venue.trim() || null,
      address: address.trim() || null,
      dress_code: dressCode.trim() || null,
      category: category.trim() || null,
      cover_image: coverImage || null,
    });
  };

  return (
    <Modal open={open} onClose={onClose} title={editingItem ? "Edit Schedule Item" : "Add Schedule Item"}>
      <div className="space-y-4">
        <FormField label="Title">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ceremony" />
        </FormField>
        <FormField label="Description">
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description..." />
        </FormField>
        <FormField label="Cover Image">
          <ImageUpload value={coverImage} onChange={setCoverImage} eventId={eventId} aspectRatio="16/9" />
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Date">
            <DatePicker value={scheduleDate} onChange={setScheduleDate} />
          </FormField>
          <FormField label="Start Time">
            <TimePicker value={startTime} onChange={setStartTime} />
          </FormField>
        </div>
        <FormField label="End Time">
          <TimePicker value={endTime} onChange={setEndTime} />
        </FormField>
        <FormField label="Venue">
          <Input value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="Main Hall" />
        </FormField>
        <FormField label="Address">
          <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Main St" />
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Dress Code">
            <Input value={dressCode} onChange={(e) => setDressCode(e.target.value)} placeholder="Formal" />
          </FormField>
          <FormField label="Category">
            <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Ceremony" />
          </FormField>
        </div>
        <div className="flex gap-2 pt-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={handleSave} loading={saving} disabled={!title.trim()} className="flex-1">Save</Button>
        </div>
      </div>
    </Modal>
  );
}
