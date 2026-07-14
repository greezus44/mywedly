import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type EventSchedule } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Textarea } from "../../components/ui/Input";
import { DatePicker } from "../../components/ui/DatePicker";
import { TimePicker } from "../../components/ui/TimePicker";
import {
  Card,
  Modal,
  LoadingSpinner,
  ErrorState,
  EmptyState,
  Badge,
} from "../../components/ui";
import { formatDate, to12Hour, cn } from "../../lib/utils";

const CATEGORIES = [
  "Ceremony",
  "Reception",
  "Dinner",
  "Party",
  "Photos",
  "Other",
];

export function TimelinePage() {
  const { eventId } = useEventContext();
  const queryClient = useQueryClient();
  const [showEdit, setShowEdit] = useState(false);
  const [editing, setEditing] = useState<EventSchedule | null>(null);

  const { data: schedule, isLoading, isError, error } = useQuery({
    queryKey: ["schedule", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_schedule")
        .select("*")
        .eq("event_id", eventId)
        .order("order_index", { ascending: true });
      if (error) throw error;
      return (data ?? []) as EventSchedule[];
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

  const handleAdd = () => {
    setEditing(null);
    setShowEdit(true);
  };

  const handleEdit = (item: EventSchedule) => {
    setEditing(item);
    setShowEdit(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (isError) {
    return <ErrorState title="Failed to load schedule" description={error instanceof Error ? error.message : undefined} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-dash-text">Schedule</h2>
        <Button onClick={handleAdd}>Add Item</Button>
      </div>

      {schedule && schedule.length === 0 ? (
        <EmptyState
          title="No schedule items yet"
          description="Add items to your event schedule to show guests what to expect."
          action={<Button onClick={handleAdd}>Add Item</Button>}
        />
      ) : (
        <div className="space-y-3">
          {schedule?.map((item, i) => (
            <Card key={item.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="flex flex-col items-center mt-1">
                    <div className="w-8 h-8 rounded-full bg-dash-primary/10 text-dash-primary flex items-center justify-center text-sm font-semibold">
                      {i + 1}
                    </div>
                    {i < schedule.length - 1 && (
                      <div className="w-px h-full bg-dash-border mt-2" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base font-semibold text-dash-text">{item.title}</h3>
                      {item.category && <Badge>{item.category}</Badge>}
                    </div>
                    {item.description && (
                      <p className="text-sm text-dash-muted mb-2">{item.description}</p>
                    )}
                    <div className="flex flex-wrap gap-4 text-sm text-dash-muted">
                      {item.schedule_date && (
                        <span>📅 {formatDate(item.schedule_date)}</span>
                      )}
                      {item.start_time && (
                        <span>🕒 {to12Hour(item.start_time)}</span>
                      )}
                      {item.end_time && (
                        <span>→ {to12Hour(item.end_time)}</span>
                      )}
                      {item.venue && <span>📍 {item.venue}</span>}
                      {item.dress_code && <span>👔 {item.dress_code}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => handleEdit(item)}>
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-dash-danger"
                    loading={deleteMutation.isPending}
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

      {showEdit && (
        <ScheduleEditor
          eventId={eventId}
          item={editing}
          orderIndex={schedule?.length ?? 0}
          onClose={() => setShowEdit(false)}
        />
      )}
    </div>
  );
}

function ScheduleEditor({
  eventId,
  item,
  orderIndex,
  onClose,
}: {
  eventId: string;
  item: EventSchedule | null;
  orderIndex: number;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(item?.title ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [date, setDate] = useState(item?.schedule_date ?? "");
  const [startTime, setStartTime] = useState(item?.start_time ?? "");
  const [endTime, setEndTime] = useState(item?.end_time ?? "");
  const [venue, setVenue] = useState(item?.venue ?? "");
  const [address, setAddress] = useState(item?.address ?? "");
  const [dressCode, setDressCode] = useState(item?.dress_code ?? "");
  const [category, setCategory] = useState(item?.category ?? "");

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        event_id: eventId,
        title,
        description: description || null,
        schedule_date: date || null,
        start_time: startTime || null,
        end_time: endTime || null,
        venue: venue || null,
        address: address || null,
        dress_code: dressCode || null,
        category: category || null,
        order_index: item?.order_index ?? orderIndex,
      };
      if (item) {
        const { error } = await supabase
          .from("event_schedule")
          .update(payload)
          .eq("id", item.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("event_schedule")
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule", eventId] });
      onClose();
    },
  });

  return (
    <Modal open onClose={onClose} title={item ? "Edit Schedule Item" : "Add Schedule Item"} size="lg">
      <div className="space-y-4">
        <Input
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Ceremony"
          required
        />
        <Textarea
          label="Description"
          value={description ?? ""}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Additional details..."
        />
        <div className="grid grid-cols-2 gap-4">
          <DatePicker label="Date" value={date} onChange={setDate} />
          <div>
            <span className="block text-sm font-medium text-dash-text mb-1.5">Category</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-dash-border bg-dash-surface text-sm text-dash-text"
            >
              <option value="">None</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <TimePicker label="Start time" value={startTime} onChange={setStartTime} />
          <TimePicker label="End time" value={endTime} onChange={setEndTime} />
        </div>
        <Input
          label="Venue"
          value={venue ?? ""}
          onChange={(e) => setVenue(e.target.value)}
          placeholder="e.g. Main Hall"
        />
        <Input
          label="Address"
          value={address ?? ""}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="e.g. 123 Main St"
        />
        <Input
          label="Dress code"
          value={dressCode ?? ""}
          onChange={(e) => setDressCode(e.target.value)}
          placeholder="e.g. Black tie"
        />
        {saveMutation.isError && (
          <p className="text-sm text-dash-danger">
            {saveMutation.error instanceof Error ? saveMutation.error.message : "Save failed"}
          </p>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => saveMutation.mutate()}
            loading={saveMutation.isPending}
            disabled={!title.trim()}
          >
            {item ? "Update" : "Add"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
