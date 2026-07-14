import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type SubEvent } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import {
  Input,
  Textarea,
  Toggle,
  Card,
  Modal,
  DatePicker,
  TimePicker,
  LoadingSpinner,
  ErrorState,
  EmptyState,
  Badge,
} from "../../components/ui";
import { formatDate, formatTime12 } from "../../lib/utils";

interface SubEventForm {
  name: string;
  date: string | null;
  time: string | null;
  venue: string;
  address: string;
  description: string;
  dress_code: string;
  rsvp_enabled: boolean;
  rsvp_deadline: string | null;
  display_order: number;
}

const emptyForm: SubEventForm = {
  name: "",
  date: null,
  time: null,
  venue: "",
  address: "",
  description: "",
  dress_code: "",
  rsvp_enabled: true,
  rsvp_deadline: null,
  display_order: 0,
};

async function fetchSubEvents(eventId: string): Promise<SubEvent[]> {
  const { data, error } = await supabase
    .from("sub_events")
    .select("*")
    .eq("parent_event_id", eventId)
    .order("display_order", { ascending: true });

  if (error) throw error;
  return (data ?? []) as SubEvent[];
}

async function createSubEvent(eventId: string, form: SubEventForm): Promise<void> {
  const { error } = await supabase.from("sub_events").insert({
    parent_event_id: eventId,
    name: form.name,
    date: form.date,
    time: form.time,
    venue: form.venue || null,
    address: form.address || null,
    description: form.description || null,
    dress_code: form.dress_code || null,
    rsvp_enabled: form.rsvp_enabled,
    rsvp_deadline: form.rsvp_deadline,
    display_order: form.display_order,
    order_index: form.display_order,
  });
  if (error) throw error;
}

async function updateSubEvent(id: string, form: SubEventForm): Promise<void> {
  const { error } = await supabase
    .from("sub_events")
    .update({
      name: form.name,
      date: form.date,
      time: form.time,
      venue: form.venue || null,
      address: form.address || null,
      description: form.description || null,
      dress_code: form.dress_code || null,
      rsvp_enabled: form.rsvp_enabled,
      rsvp_deadline: form.rsvp_deadline,
      display_order: form.display_order,
      order_index: form.display_order,
    })
    .eq("id", id);
  if (error) throw error;
}

async function deleteSubEvent(id: string): Promise<void> {
  const { error } = await supabase.from("sub_events").delete().eq("id", id);
  if (error) throw error;
}

export function EventsPage() {
  const { eventId } = useEventContext();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<SubEvent | null>(null);
  const [form, setForm] = useState<SubEventForm>(emptyForm);

  const { data: subEvents, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["sub-events", eventId],
    queryFn: () => fetchSubEvents(eventId),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editingItem) {
        await updateSubEvent(editingItem.id, form);
      } else {
        await createSubEvent(eventId, form);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-events", eventId] });
      setShowModal(false);
      setEditingItem(null);
      setForm(emptyForm);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteSubEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-events", eventId] });
    },
  });

  const openCreate = () => {
    setEditingItem(null);
    setForm({ ...emptyForm, display_order: subEvents?.length ?? 0 });
    setShowModal(true);
  };

  const openEdit = (item: SubEvent) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      date: item.date,
      time: item.time,
      venue: item.venue ?? "",
      address: item.address ?? "",
      description: item.description ?? "",
      dress_code: item.dress_code ?? "",
      rsvp_enabled: item.rsvp_enabled,
      rsvp_deadline: item.rsvp_deadline,
      display_order: item.display_order,
    });
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-dash-text">Events</h2>
          <p className="text-sm text-dash-muted">
            Manage the individual events within your occasion
          </p>
        </div>
        <Button onClick={openCreate}>Add event</Button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner className="h-8 w-8" />
        </div>
      )}

      {isError && (
        <ErrorState
          title="Failed to load events"
          description={error instanceof Error ? error.message : undefined}
          onRetry={() => refetch()}
        />
      )}

      {subEvents && subEvents.length === 0 && (
        <EmptyState
          title="No events yet"
          description="Add events like Ceremony, Reception, or Dinner to organize your occasion."
          action={<Button onClick={openCreate}>Add event</Button>}
        />
      )}

      {subEvents && subEvents.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {subEvents.map((item) => (
            <Card key={item.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-dash-text">{item.name}</h3>
                    {item.rsvp_enabled ? (
                      <Badge variant="success">RSVP</Badge>
                    ) : (
                      <Badge variant="default">No RSVP</Badge>
                    )}
                  </div>
                  {item.date && (
                    <p className="text-sm text-dash-muted">
                      {formatDate(item.date)}
                      {item.time && ` at ${formatTime12(item.time)}`}
                    </p>
                  )}
                  {item.venue && (
                    <p className="text-sm text-dash-muted mt-1">{item.venue}</p>
                  )}
                  {item.description && (
                    <p className="text-sm text-dash-text mt-2 line-clamp-2">
                      {item.description}
                    </p>
                  )}
                  {item.dress_code && (
                    <p className="text-sm text-dash-muted mt-1">
                      Dress code: {item.dress_code}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm(`Delete "${item.name}"?`)) {
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

      {/* Create/Edit modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingItem ? "Edit Event" : "Add Event"}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Event name"
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Ceremony, Reception"
            required
          />
          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Optional description"
            rows={2}
          />
          <div className="grid grid-cols-2 gap-3">
            <DatePicker
              label="Date"
              value={form.date}
              onChange={(d) => setForm({ ...form, date: d })}
            />
            <TimePicker
              label="Time"
              value={form.time}
              onChange={(t) => setForm({ ...form, time: t })}
            />
          </div>
          <Input
            label="Venue"
            type="text"
            value={form.venue}
            onChange={(e) => setForm({ ...form, venue: e.target.value })}
            placeholder="Venue name"
          />
          <Input
            label="Address"
            type="text"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="Full address"
          />
          <Input
            label="Dress code"
            type="text"
            value={form.dress_code}
            onChange={(e) => setForm({ ...form, dress_code: e.target.value })}
            placeholder="e.g. Black tie, Casual"
          />
          <Toggle
            checked={form.rsvp_enabled}
            onChange={(checked) => setForm({ ...form, rsvp_enabled: checked })}
            label="RSVP enabled for this event"
          />

          {saveMutation.isError && (
            <p className="text-sm text-dash-danger">
              {saveMutation.error instanceof Error ? saveMutation.error.message : "Save failed"}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => saveMutation.mutate()}
              loading={saveMutation.isPending}
              disabled={!form.name.trim()}
            >
              {editingItem ? "Save changes" : "Add event"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
