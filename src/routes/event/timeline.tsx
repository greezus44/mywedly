import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Loader2, Clock, MapPin } from "lucide-react";
import { supabase, type UserEvent, type ScheduleItem } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Input";
import { Card, Badge, EmptyState, FormField, Modal, useToast } from "../../components/ui";
import { formatDate, formatTime } from "../../lib/utils";

export default function TimelinePage() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    schedule_date: "",
    start_time: "",
    end_time: "",
    venue: "",
    address: "",
    category: "",
  });

  const { data: items, isLoading } = useQuery({
    queryKey: ["event-schedule", event.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_schedule")
        .select("*")
        .eq("event_id", event.id)
        .order("order_index", { ascending: true });
      if (error) throw error;
      return data as ScheduleItem[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const orderIndex = (items?.length ?? 0);
      const { error } = await supabase.from("event_schedule").insert({
        event_id: event.id,
        title: form.title,
        description: form.description || null,
        schedule_date: form.schedule_date || null,
        start_time: form.start_time || null,
        end_time: form.end_time || null,
        venue: form.venue || null,
        address: form.address || null,
        category: form.category || null,
        order_index: orderIndex,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-schedule", event.id] });
      toast("Timeline item added", "success");
      setAddOpen(false);
      setForm({ title: "", description: "", schedule_date: "", start_time: "", end_time: "", venue: "", address: "", category: "" });
    },
    onError: (err: Error) => toast(err.message, "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("event_schedule").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-schedule", event.id] });
      toast("Timeline item removed", "success");
    },
    onError: (err: Error) => toast(err.message, "error"),
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Timeline</h2>
          <p className="text-sm text-gray-500">Schedule of your event's activities.</p>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" />
          Add item
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : !items || items.length === 0 ? (
        <Card>
          <EmptyState
            icon={Clock}
            title="No timeline items"
            description="Add items like ceremony, reception, dinner, etc."
            action={
              <Button size="sm" onClick={() => setAddOpen(true)}>
                <Plus className="h-4 w-4" />
                Add item
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <Card key={item.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{item.title}</h3>
                    {item.category && <Badge variant="info">{item.category}</Badge>}
                  </div>
                  {item.description && <p className="mt-1 text-sm text-gray-500">{item.description}</p>}
                  <div className="mt-2 flex flex-wrap gap-3 text-sm text-gray-600">
                    {item.schedule_date && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-gray-400" />
                        {formatDate(item.schedule_date)}
                        {item.start_time && ` · ${formatTime(item.start_time)}`}
                        {item.end_time && ` – ${formatTime(item.end_time)}`}
                      </span>
                    )}
                    {item.venue && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-gray-400" />
                        {item.venue}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    if (confirm("Delete this timeline item?")) deleteMutation.mutate(item.id);
                  }}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add timeline item">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate();
          }}
          className="flex flex-col gap-3"
        >
          <FormField label="Title" required>
            <Input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Ceremony"
              required
            />
          </FormField>
          <FormField label="Description">
            <Textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Description"
            />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Date">
              <Input
                type="date"
                value={form.schedule_date}
                onChange={(e) => setForm((f) => ({ ...f, schedule_date: e.target.value }))}
              />
            </FormField>
            <FormField label="Category">
              <Input
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                placeholder="Ceremony"
              />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Start time">
              <Input
                type="time"
                value={form.start_time}
                onChange={(e) => setForm((f) => ({ ...f, start_time: e.target.value }))}
              />
            </FormField>
            <FormField label="End time">
              <Input
                type="time"
                value={form.end_time}
                onChange={(e) => setForm((f) => ({ ...f, end_time: e.target.value }))}
              />
            </FormField>
          </div>
          <FormField label="Venue">
            <Input
              value={form.venue}
              onChange={(e) => setForm((f) => ({ ...f, venue: e.target.value }))}
              placeholder="Venue name"
            />
          </FormField>
          <FormField label="Address">
            <Input
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              placeholder="Address"
            />
          </FormField>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={createMutation.isPending}>
              Add
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
