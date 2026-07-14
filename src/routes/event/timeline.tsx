import { useState, type FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type EventSchedule } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, Modal, Card, LoadingSpinner, ErrorState, EmptyState, Badge } from "../../components/ui";
import { DatePicker, TimePicker } from "../../components/ui";
import { formatDateTime, to12Hour, cn } from "../../lib/utils";

interface ScheduleFormData {
  title: string;
  description: string;
  date: string;
  start_time: string;
  end_time: string;
  location: string;
}

const emptyForm: ScheduleFormData = {
  title: "",
  description: "",
  date: "",
  start_time: "",
  end_time: "",
  location: "",
};

export default function TimelinePage() {
  const { eventId } = useEventContext();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ScheduleFormData>(emptyForm);

  const { data: schedule, isLoading, isError, refetch } = useQuery({
    queryKey: ["event-schedule", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_schedule")
        .select("*")
        .eq("event_id", eventId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as EventSchedule[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const sortOrder = editingId
        ? (schedule?.find((s) => s.id === editingId)?.sort_order ?? 0)
        : (schedule?.length ?? 0);

      const payload = {
        event_id: eventId,
        title: form.title,
        description: form.description || null,
        start_time: form.date && form.start_time ? `${form.date}T${form.start_time}` : new Date().toISOString(),
        end_time: form.date && form.end_time ? `${form.date}T${form.end_time}` : null,
        location: form.location || null,
        sort_order: sortOrder,
      };

      if (editingId) {
        const { error } = await supabase
          .from("event_schedule")
          .update(payload)
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("event_schedule").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-schedule", eventId] });
      setModalOpen(false);
      setForm(emptyForm);
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("event_schedule").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-schedule", eventId] });
    },
  });

  function openCreate() {
    setForm(emptyForm);
    setEditingId(null);
    setModalOpen(true);
  }

  function openEdit(item: EventSchedule) {
    const datePart = item.start_time?.split("T")[0] ?? "";
    const startTimePart = item.start_time?.split("T")[1]?.slice(0, 5) ?? "";
    const endTimePart = item.end_time?.split("T")[1]?.slice(0, 5) ?? "";
    setForm({
      title: item.title,
      description: item.description ?? "",
      date: datePart,
      start_time: startTimePart,
      end_time: endTimePart,
      location: item.location ?? "",
    });
    setEditingId(item.id);
    setModalOpen(true);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    saveMutation.mutate();
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-dash-text">Schedule</h2>
          <p className="text-sm text-dash-muted">Create a timeline for your event day.</p>
        </div>
        <Button onClick={openCreate}>Add Item</Button>
      </div>

      {saveMutation.isError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          Error: {saveMutation.error?.message}
        </div>
      )}

      {schedule && schedule.length === 0 ? (
        <EmptyState
          title="No schedule items"
          description="Add items to create a timeline for your event."
          icon={<span className="text-5xl">📅</span>}
          action={<Button onClick={openCreate}>Add Item</Button>}
        />
      ) : (
        <div className="space-y-3">
          {schedule?.map((item, idx) => {
            const datePart = item.start_time?.split("T")[0] ?? "";
            const startTimePart = item.start_time?.split("T")[1]?.slice(0, 5) ?? "";
            const endTimePart = item.end_time?.split("T")[1]?.slice(0, 5) ?? "";
            return (
              <Card key={item.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-dash-primary/10 text-dash-primary text-sm font-semibold">
                      {idx + 1}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-dash-text">{item.title}</h3>
                      {item.description && (
                        <p className="mt-1 text-sm text-dash-muted">{item.description}</p>
                      )}
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Badge variant="default">
                          📅 {formatDateTime(datePart, startTimePart)}
                        </Badge>
                        {endTimePart && (
                          <Badge variant="default">→ {to12Hour(endTimePart)}</Badge>
                        )}
                        {item.location && (
                          <Badge variant="default">📍 {item.location}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMutation.mutate(item.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Edit Schedule Item" : "Add Schedule Item"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Ceremony"
            required
          />
          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Optional description"
            rows={2}
          />
          <div>
            <label className="block text-sm font-medium text-dash-text mb-1">Date</label>
            <DatePicker value={form.date} onChange={(v) => setForm({ ...form, date: v })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-dash-text mb-1">Start Time</label>
              <TimePicker value={form.start_time} onChange={(v) => setForm({ ...form, start_time: v })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-dash-text mb-1">End Time</label>
              <TimePicker value={form.end_time} onChange={(v) => setForm({ ...form, end_time: v })} />
            </div>
          </div>
          <Input
            label="Location"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder="Main Hall"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saveMutation.isPending}>
              {editingId ? "Update" : "Add"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
