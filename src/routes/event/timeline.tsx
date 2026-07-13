import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useOutletContext } from "react-router-dom";
import { Plus, Trash2, Loader2, Clock, MapPin } from "lucide-react";
import { supabase, type UserEvent, type ScheduleItem } from "../../lib/supabase";
import { formatTime12, formatDateShort } from "../../lib/utils";
import {
  Button,
  Card,
  Badge,
  Modal,
  FormField,
  Input,
  Textarea,
  EmptyState,
  ErrorState,
  LoadingSpinner,
  Toast,
} from "../../components/ui";
import { TimePicker, DatePicker } from "../../components/ui";

export default function TimelinePage() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scheduleDate, setScheduleDate] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<string | null>(null);
  const [endTime, setEndTime] = useState<string | null>(null);
  const [venue, setVenue] = useState("");
  const [category, setCategory] = useState("");

  const { data: schedule, isLoading, error, refetch } = useQuery<ScheduleItem[]>({
    queryKey: ["event-schedule", event.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_schedule")
        .select("*")
        .eq("event_id", event.id)
        .order("order_index", { ascending: true });

      if (error) throw error;
      return (data || []) as ScheduleItem[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const maxOrder = schedule?.length || 0;
      const { data, error } = await supabase
        .from("event_schedule")
        .insert({
          event_id: event.id,
          title,
          description: description || null,
          schedule_date: scheduleDate,
          start_time: startTime,
          end_time: endTime,
          venue: venue || null,
          category: category || null,
          order_index: maxOrder,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-schedule", event.id] });
      setShowAdd(false);
      resetForm();
      setToast({ message: "Schedule item added", type: "success" });
    },
    onError: (err: Error) => {
      setToast({ message: err.message, type: "error" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("event_schedule").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-schedule", event.id] });
      setToast({ message: "Schedule item removed", type: "success" });
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
    setCategory("");
  };

  const handleAdd = () => {
    if (!title.trim()) {
      setToast({ message: "Please enter a title", type: "error" });
      return;
    }
    addMutation.mutate();
  };

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Timeline</h1>
          <p className="mt-1 text-sm text-gray-500">
            Build a schedule so guests know when and where to be
          </p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4" />
          Add Item
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner className="h-8 w-8" />
        </div>
      ) : error ? (
        <ErrorState
          message={error instanceof Error ? error.message : "Failed to load schedule"}
          onRetry={() => refetch()}
        />
      ) : !schedule || schedule.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Clock className="h-12 w-12" />}
            title="No schedule items yet"
            description="Add items like ceremony, reception, or dinner."
            action={
              <Button onClick={() => setShowAdd(true)}>
                <Plus className="h-4 w-4" />
                Add Item
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {schedule.map((item) => (
            <Card key={item.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-gray-900">
                      {item.title || "Untitled"}
                    </h3>
                    {item.category && <Badge>{item.category}</Badge>}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                    {item.start_time && (
                      <Badge>
                        <Clock className="h-3 w-3" />
                        {formatTime12(item.start_time)}
                      </Badge>
                    )}
                    {item.end_time && (
                      <span className="text-xs">until {formatTime12(item.end_time)}</span>
                    )}
                    {item.schedule_date && (
                      <span className="text-xs">{formatDateShort(item.schedule_date)}</span>
                    )}
                    {item.venue && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {item.venue}
                      </span>
                    )}
                  </div>
                  {item.description && (
                    <p className="mt-2 text-sm text-gray-600">{item.description}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteMutation.mutate(item.id)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Modal */}
      <Modal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        title="Add Schedule Item"
      >
        <div className="flex flex-col gap-4">
          <FormField label="Title">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Ceremony"
              autoFocus
            />
          </FormField>

          <FormField label="Description">
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Additional details"
              rows={2}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <DatePicker
              value={scheduleDate}
              onChange={(d) => setScheduleDate(d || null)}
              label="Date"
            />
            <FormField label="Category">
              <Input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Main Event"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <TimePicker
              value={startTime}
              onChange={(t) => setStartTime(t || null)}
              label="Start Time"
            />
            <TimePicker
              value={endTime}
              onChange={(t) => setEndTime(t || null)}
              label="End Time"
            />
          </div>

          <FormField label="Venue">
            <Input
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="Venue name"
            />
          </FormField>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowAdd(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAdd}
              disabled={addMutation.isPending || !title.trim()}
            >
              {addMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Adding…
                </>
              ) : (
                "Add Item"
              )}
            </Button>
          </div>
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
