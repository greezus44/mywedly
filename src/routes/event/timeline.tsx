import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type EventSchedule } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Card, Input, Textarea, Modal, Badge, EmptyState, LoadingSpinner, ErrorState } from "../../components/ui";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { formatDate, formatTime12 } from "../../lib/utils";

interface ScheduleFormData {
  title: string;
  description: string;
  schedule_date: string;
  start_time: string;
  end_time: string;
  venue: string;
  address: string;
  dress_code: string;
  category: string;
  cover_image: string | null;
}

const emptyForm: ScheduleFormData = {
  title: "",
  description: "",
  schedule_date: "",
  start_time: "",
  end_time: "",
  venue: "",
  address: "",
  dress_code: "",
  category: "",
  cover_image: null,
};

export function TimelinePage() {
  const { eventId } = useEventContext();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ScheduleFormData>(emptyForm);

  const { data: schedule, isLoading, isError, refetch } = useQuery({
    queryKey: ["event-schedule", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_schedule")
        .select("*")
        .eq("event_id", eventId!)
        .order("order_index", { ascending: true });
      if (error) throw error;
      return data as EventSchedule[];
    },
    enabled: !!eventId,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const maxOrder = schedule?.length ?? 0;
      const { error } = await supabase.from("event_schedule").insert({
        event_id: eventId,
        title: form.title,
        description: form.description || null,
        schedule_date: form.schedule_date,
        start_time: form.start_time || null,
        end_time: form.end_time || null,
        venue: form.venue || null,
        address: form.address || null,
        dress_code: form.dress_code || null,
        category: form.category || null,
        cover_image: form.cover_image,
        order_index: maxOrder,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-schedule", eventId] });
      setShowForm(false);
      setForm(emptyForm);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("event_schedule")
        .update({
          title: form.title,
          description: form.description || null,
          schedule_date: form.schedule_date,
          start_time: form.start_time || null,
          end_time: form.end_time || null,
          venue: form.venue || null,
          address: form.address || null,
          dress_code: form.dress_code || null,
          category: form.category || null,
          cover_image: form.cover_image,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-schedule", eventId] });
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
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

  const openEdit = (item: EventSchedule) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      description: item.description ?? "",
      schedule_date: item.schedule_date,
      start_time: item.start_time ?? "",
      end_time: item.end_time ?? "",
      venue: item.venue ?? "",
      address: item.address ?? "",
      dress_code: item.dress_code ?? "",
      category: item.category ?? "",
      cover_image: item.cover_image,
    });
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (editingId) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size={32} />
      </div>
    );
  }

  if (isError) {
    return <ErrorState message="Failed to load schedule." onRetry={() => refetch()} />;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-dash-text">Schedule</h2>
          <p className="mt-1 text-sm text-dash-muted">
            Build a timeline for your event day so guests know what to expect.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingId(null);
            setForm(emptyForm);
            setShowForm(true);
          }}
        >
          Add Item
        </Button>
      </div>

      {schedule && schedule.length === 0 ? (
        <EmptyState
          title="No schedule items yet"
          description="Add items to build your event day timeline."
          icon={<div className="text-4xl">📅</div>}
          action={<Button onClick={() => setShowForm(true)}>Add First Item</Button>}
        />
      ) : (
        <div className="space-y-4">
          {schedule?.map((item) => (
            <Card key={item.id}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-dash-text">{item.title}</h3>
                    {item.category && <Badge variant="default">{item.category}</Badge>}
                  </div>
                  <p className="mt-1 text-sm text-dash-muted">
                    {formatDate(item.schedule_date)}
                    {item.start_time && ` · ${formatTime12(item.start_time)}`}
                    {item.end_time && ` – ${formatTime12(item.end_time)}`}
                  </p>
                  {item.venue && (
                    <p className="mt-1 text-sm text-dash-muted">📍 {item.venue}</p>
                  )}
                  {item.description && (
                    <p className="mt-2 text-sm text-dash-text">{item.description}</p>
                  )}
                  {item.dress_code && (
                    <p className="mt-1 text-xs text-dash-muted">Dress code: {item.dress_code}</p>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm("Delete this schedule item?")) {
                        deleteMutation.mutate(item.id);
                      }
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Form Modal */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editingId ? "Edit Schedule Item" : "Add Schedule Item"}
        className="max-w-2xl"
      >
        <div className="space-y-4">
          <Input
            label="Title"
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="Ceremony"
          />
          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Brief description of this part of the event..."
          />
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Date"
              type="date"
              value={form.schedule_date}
              onChange={(e) => setForm((prev) => ({ ...prev, schedule_date: e.target.value }))}
            />
            <Input
              label="Start Time"
              type="time"
              value={form.start_time}
              onChange={(e) => setForm((prev) => ({ ...prev, start_time: e.target.value }))}
            />
            <Input
              label="End Time"
              type="time"
              value={form.end_time}
              onChange={(e) => setForm((prev) => ({ ...prev, end_time: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Venue"
              value={form.venue}
              onChange={(e) => setForm((prev) => ({ ...prev, venue: e.target.value }))}
              placeholder="The Grand Ballroom"
            />
            <Input
              label="Category"
              value={form.category}
              onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
              placeholder="Ceremony / Reception / etc."
            />
          </div>
          <Input
            label="Address"
            value={form.address}
            onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
            placeholder="123 Main Street, City"
          />
          <Input
            label="Dress Code"
            value={form.dress_code}
            onChange={(e) => setForm((prev) => ({ ...prev, dress_code: e.target.value }))}
            placeholder="Black Tie / Cocktail / Casual"
          />
          <ImageUpload
            label="Cover Image"
            value={form.cover_image}
            onChange={(url) => setForm((prev) => ({ ...prev, cover_image: url }))}
            bucket="event-assets"
            pathPrefix={`events/${eventId}/schedule`}
          />
          {(createMutation.isError || updateMutation.isError) && (
            <p className="text-sm text-dash-danger">
              Error: {((createMutation.error || updateMutation.error) as Error)?.message}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              loading={createMutation.isPending || updateMutation.isPending}
              disabled={!form.title.trim() || !form.schedule_date}
            >
              {editingId ? "Update" : "Add"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
