import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Loader2, Calendar, Clock, MapPin } from "lucide-react";
import { supabase, type UserEvent, type SubEvent } from "../../lib/supabase";
import { formatDateShort, formatTime12 } from "../../lib/utils";
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

async function fetchSubEvents(parentEventId: string): Promise<SubEvent[]> {
  const { data, error } = await supabase
    .from("sub_events")
    .select("*")
    .eq("parent_eventId", parentEventId)
    .order("order_index", { ascending: true });
  if (error) throw error;
  return (data ?? []) as SubEvent[];
}

async function createSubEvent(input: Omit<SubEvent, "id" | "created_at" | "updated_at">): Promise<SubEvent> {
  const { data, error } = await supabase
    .from("sub_events")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as SubEvent;
}

async function deleteSubEvent(id: string): Promise<void> {
  const { error } = await supabase.from("sub_events").delete().eq("id", id);
  if (error) throw error;
}

export default function EventsPage() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const [name, setName] = useState("");
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [venue, setVenue] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");

  const { data: subEvents, isLoading } = useQuery({
    queryKey: ["sub-events", event.id],
    queryFn: () => fetchSubEvents(event.id),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createSubEvent({
        parent_eventId: event.id,
        name: name.trim(),
        date,
        time,
        venue: venue.trim() || null,
        address: address.trim() || null,
        description: description.trim() || null,
        dress_code: null,
        rsvp_deadline: null,
        rsvp_enabled: false,
        order_index: (subEvents?.length ?? 0),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-events", event.id] });
      setToast({ message: "Sub-event added!", type: "success" });
      resetForm();
      setShowAdd(false);
    },
    onError: (err: Error) => {
      setToast({ message: err.message, type: "error" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSubEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-events", event.id] });
      setToast({ message: "Sub-event deleted", type: "success" });
    },
    onError: (err: Error) => {
      setToast({ message: err.message, type: "error" });
    },
  });

  const resetForm = () => {
    setName("");
    setDate(null);
    setTime(null);
    setVenue("");
    setAddress("");
    setDescription("");
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createMutation.mutate();
  };

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="mx-auto max-w-4xl space-y-6 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading text-xl font-bold text-gray-900">
              Sub-Events
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Manage individual events within your celebration.
            </p>
          </div>
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <Plus className="h-4 w-4" /> Add
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : !subEvents || subEvents.length === 0 ? (
          <EmptyState
            icon={<Calendar className="h-12 w-12" />}
            title="No sub-events yet"
            description="Add events like ceremony, reception, or brunch to organize your celebration."
            action={
              <Button size="sm" onClick={() => setShowAdd(true)}>
                <Plus className="h-4 w-4" /> Add Sub-Event
              </Button>
            }
          />
        ) : (
          <div className="space-y-3">
            {subEvents.map((sub) => (
              <Card key={sub.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {sub.name}
                    </h3>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {sub.date && (
                        <Badge variant="info">
                          <Calendar className="h-3 w-3" /> {formatDateShort(sub.date)}
                        </Badge>
                      )}
                      {sub.time && (
                        <Badge variant="default">
                          <Clock className="h-3 w-3" /> {formatTime12(sub.time)}
                        </Badge>
                      )}
                    </div>
                    {sub.venue && (
                      <p className="mt-2 flex items-center gap-1.5 text-sm text-gray-600">
                        <MapPin className="h-3.5 w-3.5 text-gray-400" />
                        {sub.venue}
                        {sub.address && ` • ${sub.address}`}
                      </p>
                    )}
                    {sub.description && (
                      <p className="mt-2 text-sm text-gray-500">{sub.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      if (confirm("Delete this sub-event?")) {
                        deleteMutation.mutate(sub.id);
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
            Add Sub-Event
          </h2>
          <form onSubmit={handleAdd} className="mt-4 space-y-4">
            <FormField label="Name">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ceremony"
                required
                autoFocus
              />
            </FormField>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DatePicker label="Date" value={date} onChange={setDate} />
              <TimePicker label="Time" value={time} onChange={setTime} />
            </div>
            <FormField label="Venue">
              <Input value={venue} onChange={(e) => setVenue(e.target.value)} />
            </FormField>
            <FormField label="Address">
              <Input value={address} onChange={(e) => setAddress(e.target.value)} />
            </FormField>
            <FormField label="Description">
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
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
