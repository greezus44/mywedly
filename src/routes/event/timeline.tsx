import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Loader2, Clock, Calendar } from "lucide-react";
import { supabase, type UserEvent, type ScheduleItem } from "../../lib/supabase";
import { formatTime12, formatDateShort } from "../../lib/utils";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Input";
import {
  Card,
  Badge,
  EmptyState,
  Skeleton,
  Modal,
  FormField,
  Toast,
  type ToastType,
} from "../../components/ui";
import { DatePicker, TimePicker } from "../../components/ui";

async function fetchSchedule(eventId: string): Promise<ScheduleItem[]> {
  const { data, error } = await supabase
    .from("event_schedule")
    .select("*")
    .eq("event_id", eventId)
    .order("order_index", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ScheduleItem[];
}

async function createScheduleItem(input: {
  event_id: string;
  title: string;
  description: string | null;
  schedule_date: string | null;
  start_time: string | null;
  end_time: string | null;
  venue: string | null;
  order_index: number;
}): Promise<ScheduleItem> {
  const { data, error } = await supabase
    .from("event_schedule")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as ScheduleItem;
}

async function deleteScheduleItem(id: string): Promise<void> {
  const { error } = await supabase.from("event_schedule").delete().eq("id", id);
  if (error) throw error;
}

export default function TimelinePage() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scheduleDate, setScheduleDate] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<string | null>(null);
  const [endTime, setEndTime] = useState<string | null>(null);
  const [venue, setVenue] = useState("");

  const { data: items, isLoading } = useQuery({
    queryKey: ["schedule", event.id],
    queryFn: () => fetchSchedule(event.id),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createScheduleItem({
        event_id: event.id,
        title: title.trim(),
        description: description.trim() || null,
        schedule_date: scheduleDate,
        start_time: startTime,
        end_time: endTime,
        venue: venue.trim() || null,
        order_index: (items?.length ?? 0),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule", event.id] });
      setToast({ message: "Timeline item added!", type: "success" });
      resetForm();
      setShowAdd(false);
    },
    onError: (err: Error) => {
      setToast({ message: err.message, type: "error" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteScheduleItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule", event.id] });
      setToast({ message: "Item deleted", type: "success" });
    },
    onError: (err: Error) => {
      setToast({ message: err.message, type: "error" });
    },
  });

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setScheduleDate(null);
    setStartTime(null);
    setEndTime(null);
    setVenue("");
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    createMutation.mutate();
  };

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="mx-auto max-w-4xl space-y-6 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading text-xl font-bold text-gray-900">
              Timeline
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Build the schedule for your event day.
            </p>
          </div>
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <Plus className="h-4 w-4" /> Add Item
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        ) : !items || items.length === 0 ? (
          <EmptyState
            icon={<Clock className="h-12 w-12" />}
            title="No timeline items yet"
            description="Add items like 'Ceremony', 'Cocktail hour', or 'First dance' to build your event schedule."
            action={
              <Button size="sm" onClick={() => setShowAdd(true)}>
                <Plus className="h-4 w-4" /> Add Item
              </Button>
            }
          />
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <Card key={item.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{item.title}</h3>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {item.schedule_date && (
                        <Badge variant="info">
                          <Calendar className="h-3 w-3" />{" "}
                          {formatDateShort(item.schedule_date)}
                        </Badge>
                      )}
                      {item.start_time && (
                        <Badge variant="default">
                          <Clock className="h-3 w-3" />{" "}
                          {formatTime12(item.start_time)}
                        </Badge>
                      )}
                      {item.end_time && (
                        <span className="text-xs text-gray-500">
                          until {formatTime12(item.end_time)}
                        </span>
                      )}
                    </div>
                    {item.venue && (
                      <p className="mt-1.5 text-sm text-gray-600">{item.venue}</p>
                    )}
                    {item.description && (
                      <p className="mt-1 text-sm text-gray-500">
                        {item.description}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      if (confirm("Delete this timeline item?")) {
                        deleteMutation.mutate(item.id);
                      }
                    }}
                    className="text-gray-400 transition-colors hover:text-red-600"
                    aria-label="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)}>
        <div className="p-6">
          <h2 className="font-heading text-xl font-bold text-gray-900">
            Add Timeline Item
          </h2>
          <form onSubmit={handleAdd} className="mt-4 space-y-4">
            <FormField label="Title">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Ceremony"
                required
                autoFocus
              />
            </FormField>
            <FormField label="Description">
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </FormField>
            <DatePicker
              label="Date"
              value={scheduleDate}
              onChange={setScheduleDate}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TimePicker
                label="Start time"
                value={startTime}
                onChange={setStartTime}
              />
              <TimePicker
                label="End time"
                value={endTime}
                onChange={setEndTime}
              />
            </div>
            <FormField label="Venue">
              <Input value={venue} onChange={(e) => setVenue(e.target.value)} />
            </FormField>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowAdd(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Adding...
                  </>
                ) : (
                  "Add"
                )}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
