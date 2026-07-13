import { useState, useEffect, useCallback } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Plus, Calendar, MapPin, Clock, Pencil, Trash2 } from "lucide-react";
import { supabase, Wedding, WeddingEvent } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, Select } from "../../components/ui/Input";
import { Card, Badge, FormField, Modal, EmptyState, Toast, ErrorState, Skeleton } from "../../components/ui/index";
import { DatePicker, TimePicker } from "../../components/ui/DatePicker";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { formatDate, formatTime, generateToken } from "../../lib/utils";

type OutletContext = { wedding: Wedding | null };

const EMPTY_EVENT: Omit<WeddingEvent, "id" | "wedding_id" | "created_at"> = {
  title: "",
  description: "",
  event_date: "",
  end_date: null,
  start_time: "",
  end_time: "",
  venue: "",
  address: "",
  dress_code: "",
  category: "",
  cover_image: "",
  order_index: 0,
};

export default function EventsPage() {
  const { wedding } = useOutletContext<OutletContext>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<WeddingEvent | null>(null);
  const [formData, setFormData] = useState<Omit<WeddingEvent, "id" | "wedding_id" | "created_at">>(EMPTY_EVENT);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const { data: events, isLoading, isError, refetch } = useQuery<WeddingEvent[]>({
    queryKey: ["events", wedding?.id],
    queryFn: async () => {
      if (!wedding) return [];
      const { data, error } = await supabase.from("events").select("*").eq("wedding_id", wedding.id).order("order_index", { ascending: true });
      if (error) throw error;
      return data as WeddingEvent[];
    },
    enabled: !!wedding,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: { event: typeof formData; id?: string }) => {
      if (!wedding) throw new Error("No wedding");
      if (data.id) {
        const { error } = await supabase.from("events").update(data.event).eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("events").insert({ ...data.event, wedding_id: wedding.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events", wedding?.id] });
      setModalOpen(false);
      setToast({ msg: "Event saved successfully!", type: "success" });
      setTimeout(() => setToast(null), 3000);
    },
    onError: (err: any) => {
      setToast({ msg: "Failed: " + err.message, type: "error" });
      setTimeout(() => setToast(null), 3000);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events", wedding?.id] });
      setToast({ msg: "Event deleted", type: "success" });
      setTimeout(() => setToast(null), 3000);
    },
    onError: (err: any) => {
      setToast({ msg: "Failed: " + err.message, type: "error" });
      setTimeout(() => setToast(null), 3000);
    },
  });

  const openAdd = useCallback(() => {
    setEditingEvent(null);
    setFormData({ ...EMPTY_EVENT, order_index: (events?.length ?? 0) });
    setModalOpen(true);
  }, [events]);

  const openEdit = useCallback((event: WeddingEvent) => {
    setEditingEvent(event);
    const { id, wedding_id, created_at, ...rest } = event;
    setFormData(rest);
    setModalOpen(true);
  }, []);

  const handleSave = useCallback(() => {
    saveMutation.mutate({ event: formData, id: editingEvent?.id });
  }, [formData, editingEvent, saveMutation]);

  const handleDelete = useCallback((id: string) => {
    if (confirm("Delete this event?")) deleteMutation.mutate(id);
  }, [deleteMutation]);

  const update = useCallback((patch: Partial<typeof formData>) => {
    setFormData((prev) => ({ ...prev, ...patch }));
  }, []);

  if (!wedding) return <ErrorState message="Could not load wedding data" onRetry={() => navigate("/admin")} />;
  if (isError) return <ErrorState message="Failed to load events" onRetry={() => refetch()} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Events</h1>
          <p className="text-sm text-gray-500">Manage your wedding events and ceremonies</p>
        </div>
        <Button onClick={openAdd}><Plus className="w-4 h-4" /> Add Event</Button>
      </div>

      <SplitEditor
        title="Events"
        previewKey="events-preview"
        preview={<div className="p-8 bg-gray-50 h-full"><div className="text-center text-gray-400"><Calendar className="w-16 h-16 mx-auto mb-4 opacity-30" /><p className="text-sm">Event preview</p></div></div>}
        children={
          <div>
            {isLoading ? (
              <div className="space-y-3"><Skeleton className="h-20" /><Skeleton className="h-20" /><Skeleton className="h-20" /></div>
            ) : events && events.length > 0 ? (
              <div className="space-y-3">
                {events.map((event) => (
                  <Card key={event.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-semibold text-gray-900 truncate">{event.title}</h3>
                          {event.category && <Badge color="blue">{event.category}</Badge>}
                        </div>
                        <div className="space-y-1 text-xs text-gray-500">
                          <p className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {formatDate(event.event_date)}</p>
                          {event.start_time && <p className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {formatTime(event.start_time)}{event.end_time && ` – ${formatTime(event.end_time)}`}</p>}
                          {event.venue && <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {event.venue}</p>}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(event)}><Pencil className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(event.id)}><Trash2 className="w-3.5 h-3.5 text-red-500" /></Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState icon={<Calendar className="w-10 h-10" />} title="No events yet" description="Add your first event to get started" action={<Button size="sm" onClick={openAdd}><Plus className="w-4 h-4" /> Add Event</Button>} />
            )}
          </div>
        }
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingEvent ? "Edit Event" : "Add Event"} size="lg">
        <div className="space-y-4">
          <FormField label="Event Title"><Input value={formData.title} onChange={(e) => update({ title: e.target.value })} placeholder="e.g. Akad Nikah" /></FormField>
          <FormField label="Description"><Textarea value={formData.description} onChange={(e) => update({ description: e.target.value })} placeholder="Event description..." /></FormField>
          <div className="grid grid-cols-2 gap-4">
            <DatePicker value={formData.event_date || null} onChange={(v) => update({ event_date: v || "" })} label="Event Date" />
            <DatePicker value={formData.end_date} onChange={(v) => update({ end_date: v })} label="End Date" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <TimePicker value={formData.start_time || null} onChange={(v) => update({ start_time: v || "" })} label="Start Time" />
            <TimePicker value={formData.end_time || null} onChange={(v) => update({ end_time: v || "" })} label="End Time" />
          </div>
          <FormField label="Venue"><Input value={formData.venue} onChange={(e) => update({ venue: e.target.value })} placeholder="Venue name" /></FormField>
          <FormField label="Address"><Textarea value={formData.address} onChange={(e) => update({ address: e.target.value })} placeholder="Full address" /></FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Dress Code"><Input value={formData.dress_code} onChange={(e) => update({ dress_code: e.target.value })} placeholder="e.g. Formal" /></FormField>
            <FormField label="Category"><Input value={formData.category} onChange={(e) => update({ category: e.target.value })} placeholder="e.g. Akad, Reception" /></FormField>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saveMutation.isPending}>{editingEvent ? "Save Changes" : "Add Event"}</Button>
          </div>
        </div>
      </Modal>

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
