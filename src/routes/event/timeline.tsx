import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type EventSchedule } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Input, Card, Modal, EmptyState, LoadingSpinner, ErrorState, Badge } from "../../components/ui";
import { formatDate, formatTime12 } from "../../lib/utils";

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
  order_index: number;
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
  category: "",
  order_index: 0,
};

export function TimelinePage() {
  const { eventId } = useEventContext();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ScheduleForm>(EMPTY_FORM);

  const { data: schedule, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["schedule", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_schedule")
        .select("*")
        .eq("event_id", eventId)
        .order("order_index", { ascending: true });
      if (error) throw error;
      return data as EventSchedule[];
    },
    enabled: !!eventId,
  });

  const createMutation = useMutation({
    mutationFn: async (input: ScheduleForm) => {
      const { error } = await supabase
        .from("event_schedule")
        .insert({
          event_id: eventId,
          title: input.title,
          description: input.description || null,
          schedule_date: input.schedule_date,
          start_time: input.start_time,
          end_time: input.end_time,
          venue: input.venue || null,
          address: input.address || null,
          dress_code: input.dress_code || null,
          category: input.category || null,
          order_index: input.order_index,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule", eventId] });
      setShowModal(false);
      setForm(EMPTY_FORM);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: ScheduleForm }) => {
      const { error } = await supabase
        .from("event_schedule")
        .update({
          title: input.title,
          description: input.description || null,
          schedule_date: input.schedule_date,
          start_time: input.start_time,
          end_time: input.end_time,
          venue: input.venue || null,
          address: input.address || null,
          dress_code: input.dress_code || null,
          category: input.category || null,
          order_index: input.order_index,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule", eventId] });
      setShowModal(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("event_schedule")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule", eventId] });
    },
  });

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, order_index: schedule?.length ?? 0 });
    setShowModal(true);
  };

  const openEdit = (item: EventSchedule) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      description: item.description ?? "",
      schedule_date: item.schedule_date,
      start_time: item.start_time,
      end_time: item.end_time,
      venue: item.venue ?? "",
      address: item.address ?? "",
      dress_code: item.dress_code ?? "",
      category: item.category ?? "",
      order_index: item.order_index,
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, input: form });
    } else {
      createMutation.mutate(form);
    }
  };

  function update<K extends keyof ScheduleForm>(key: K, val: ScheduleForm[K]) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner />
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        title="Failed to load schedule"
        message={error instanceof Error ? error.message : "An unexpected error occurred."}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-dash-text">Schedule</h2>
          <p className="text-sm text-dash-muted">Plan the timeline for your event day.</p>
        </div>
        <Button onClick={openAdd}>Add Item</Button>
      </div>

      {!schedule || schedule.length === 0 ? (
        <EmptyState
          title="No schedule items yet"
          description="Add items to build the timeline for your event."
          action={<Button onClick={openAdd}>Add Item</Button>}
        />
      ) : (
        <div className="relative space-y-4">
          {schedule.map((item, idx) => (
            <div key={item.id} className="flex gap-4">
              {/* Timeline marker */}
              <div className="flex flex-col items-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-dash-primary/10 text-sm font-bold text-dash-primary">
                  {idx + 1}
                </div>
                {idx < schedule.length - 1 && <div className="w-px flex-1 bg-dash-border" />}
              </div>

              <Card className="flex-1">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-dash-text">{item.title}</h3>
                      {item.category && <Badge variant="default">{item.category}</Badge>}
                    </div>
                    {item.schedule_date && (
                      <p className="mt-1 text-sm text-dash-muted">
                        {formatDate(item.schedule_date)}
                        {item.start_time && ` · ${formatTime12(item.start_time)}`}
                        {item.end_time && ` – ${formatTime12(item.end_time)}`}
                      </p>
                    )}
                    {item.venue && <p className="mt-1 text-sm text-dash-muted">{item.venue}</p>}
                    {item.address && <p className="text-sm text-dash-muted">{item.address}</p>}
                    {item.dress_code && <p className="mt-1 text-xs text-dash-muted">Dress code: {item.dress_code}</p>}
                    {item.description && <p className="mt-2 text-sm text-dash-text">{item.description}</p>}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>Edit</Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMutation.mutate(item.id)}
                      loading={deleteMutation.isPending}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editingId ? "Edit Item" : "Add Schedule Item"} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Title"
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="e.g. Ceremony"
            required
            autoFocus
          />
          <Input
            label="Description"
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            placeholder="Optional description"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Date"
              type="date"
              value={form.schedule_date ?? ""}
              onChange={(e) => update("schedule_date", e.target.value || null)}
            />
            <Input
              label="Start Time"
              type="time"
              value={form.start_time ?? ""}
              onChange={(e) => update("start_time", e.target.value || null)}
            />
            <Input
              label="End Time"
              type="time"
              value={form.end_time ?? ""}
              onChange={(e) => update("end_time", e.target.value || null)}
            />
            <Input
              label="Category"
              value={form.category}
              onChange={(e) => update("category", e.target.value)}
              placeholder="e.g. Ceremony"
            />
          </div>
          <Input
            label="Venue"
            value={form.venue}
            onChange={(e) => update("venue", e.target.value)}
            placeholder="e.g. St. Mary's Church"
          />
          <Input
            label="Address"
            value={form.address}
            onChange={(e) => update("address", e.target.value)}
            placeholder="e.g. 123 Main Street"
          />
          <Input
            label="Dress Code"
            value={form.dress_code}
            onChange={(e) => update("dress_code", e.target.value)}
            placeholder="e.g. Smart casual"
          />
          <Input
            label="Order"
            type="number"
            value={form.order_index}
            onChange={(e) => update("order_index", parseInt(e.target.value, 10) || 0)}
          />
          {(createMutation.isError || updateMutation.isError) && (
            <p className="text-sm text-dash-danger">
              {createMutation.error instanceof Error || updateMutation.error instanceof Error
                ? (createMutation.error ?? updateMutation.error)?.message
                : "Failed to save"}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>
              {editingId ? "Update" : "Add"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
