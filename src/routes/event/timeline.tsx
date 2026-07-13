import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type EventSchedule } from "../../lib/supabase";
import { Input, Textarea, Select, Modal, LoadingSpinner, ErrorState, EmptyState, Card, Badge } from "../../components/ui";
import { Button } from "../../components/ui/Button";
import { formatDate, formatTime12 } from "../../lib/utils";

const CATEGORIES = [
  { value: "ceremony", label: "Ceremony" },
  { value: "reception", label: "Reception" },
  { value: "dinner", label: "Dinner" },
  { value: "party", label: "Party" },
  { value: "other", label: "Other" },
];

interface FormState {
  title: string;
  description: string;
  schedule_date: string;
  start_time: string;
  end_time: string;
  venue: string;
  address: string;
  dress_code: string;
  category: string;
}

const EMPTY_FORM: FormState = {
  title: "", description: "", schedule_date: "", start_time: "", end_time: "",
  venue: "", address: "", dress_code: "", category: "other",
};

export default function Timeline() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const { data: items, isLoading, error } = useQuery({
    queryKey: ["event_schedule", event.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_schedule")
        .select("*")
        .eq("event_id", event.id)
        .order("order_index", { ascending: true });
      if (error) throw error;
      return data as EventSchedule[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        event_id: event.id,
        title: form.title,
        description: form.description || null,
        schedule_date: form.schedule_date || null,
        start_time: form.start_time || null,
        end_time: form.end_time || null,
        venue: form.venue,
        address: form.address,
        dress_code: form.dress_code,
        category: form.category,
      };
      if (editingId) {
        const { error } = await supabase.from("event_schedule").update(payload).eq("id", editingId).select().maybeSingle();
        if (error) throw error;
      } else {
        const maxOrder = items?.reduce((max, i) => Math.max(max, i.order_index), -1) ?? -1;
        const { error } = await supabase.from("event_schedule").insert({ ...payload, order_index: maxOrder + 1 });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event_schedule", event.id] });
      setModalOpen(false);
      setForm(EMPTY_FORM);
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("event_schedule").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event_schedule", event.id] });
    },
  });

  function openAdd() { setForm(EMPTY_FORM); setEditingId(null); setModalOpen(true); }
  function openEdit(item: EventSchedule) {
    setForm({
      title: item.title, description: item.description || "", schedule_date: item.schedule_date || "",
      start_time: item.start_time || "", end_time: item.end_time || "", venue: item.venue,
      address: item.address, dress_code: item.dress_code, category: item.category,
    });
    setEditingId(item.id);
    setModalOpen(true);
  }

  if (isLoading) return <div className="flex justify-center py-12"><LoadingSpinner /></div>;
  if (error) return <ErrorState message="Failed to load schedule." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-dash-text">Schedule</h2>
          <p className="mt-1 text-sm text-dash-muted">Manage the schedule items for your event.</p>
        </div>
        <Button onClick={openAdd}>Add Item</Button>
      </div>

      {!items || items.length === 0 ? (
        <EmptyState title="No schedule items" description="Add schedule items to show your event timeline." action={<Button onClick={openAdd}>Add Item</Button>} />
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <Card key={item.id} className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-dash-text">{item.title}</h3>
                  <Badge variant="info">{item.category}</Badge>
                </div>
                {item.description && <p className="mt-1 text-sm text-dash-muted">{item.description}</p>}
                <div className="mt-2 flex flex-wrap gap-4 text-xs text-dash-muted">
                  {item.schedule_date && <span>{formatDate(item.schedule_date)}</span>}
                  {item.start_time && <span>{formatTime12(item.start_time)}{item.end_time ? ` – ${formatTime12(item.end_time)}` : ""}</span>}
                  {item.venue && <span>{item.venue}</span>}
                  {item.dress_code && <span>Dress: {item.dress_code}</span>}
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => openEdit(item)}>Edit</Button>
                <Button size="sm" variant="danger" loading={deleteMutation.isPending} onClick={() => deleteMutation.mutate(item.id)}>Delete</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Edit Schedule Item" : "Add Schedule Item"} size="lg">
        <div className="space-y-4">
          <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Opening Ceremony" />
          <Textarea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description..." />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Date" type="date" value={form.schedule_date} onChange={(e) => setForm({ ...form, schedule_date: e.target.value })} />
            <Select label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </Select>
            <Input label="Start Time" type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
            <Input label="End Time" type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
            <Input label="Venue" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} placeholder="Venue name" />
            <Input label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Address" />
          </div>
          <Input label="Dress Code" value={form.dress_code} onChange={(e) => setForm({ ...form, dress_code: e.target.value })} placeholder="e.g. Black tie" />
          {saveMutation.isError && <div className="rounded-md border border-dash-danger/30 bg-red-50 px-4 py-3 text-sm text-dash-danger">Failed to save. Please try again.</div>}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button loading={saveMutation.isPending} disabled={!form.title.trim()} onClick={() => saveMutation.mutate()}>{editingId ? "Save" : "Add"}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
