import { useState, type FormEvent } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type SubEvent } from "../../lib/supabase";
import { formatDateShort, formatTime12, cn } from "../../lib/utils";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Input";
import {
  Card,
  Modal,
  LoadingSpinner,
  ErrorState,
  EmptyState,
  Badge,
  IconButton,
} from "../../components/ui";
import { DatePicker } from "../../components/ui/DatePicker";
import { TimePicker } from "../../components/ui/TimePicker";
import { InvitationManager } from "./invitation-manager";

interface FormState {
  name: string;
  date: string | null;
  time: string | null;
  venue: string;
  address: string;
  description: string;
  dress_code: string;
  rsvp_enabled: boolean;
  order_index: number;
}

const emptyForm: FormState = {
  name: "",
  date: null,
  time: null,
  venue: "",
  address: "",
  description: "",
  dress_code: "",
  rsvp_enabled: true,
  order_index: 0,
};

export default function Events() {
  const { eventId } = useOutletContext<{ event: UserEvent; eventId: string }>();
  const queryClient = useQueryClient();

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: subEvents, isLoading, isError } = useQuery({
    queryKey: ["sub-events", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sub_events")
        .select("*")
        .eq("parent_event_id", eventId)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as SubEvent[];
    },
    enabled: !!eventId,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        parent_event_id: eventId,
        wedding_id: eventId,
        start_time: form.time,
        end_time: null,
        display_order: form.order_index,
        order_index: form.order_index,
      };
      if (editingId) {
        const { error } = await supabase
          .from("sub_events")
          .update(payload)
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("sub_events").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-events", eventId] });
      setShowModal(false);
      setForm(emptyForm);
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("sub_events")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-events", eventId] });
    },
  });

  const openCreate = () => {
    setForm({ ...emptyForm, order_index: subEvents?.length ?? 0 });
    setEditingId(null);
    setShowModal(true);
  };

  const openEdit = (sub: SubEvent) => {
    setForm({
      name: sub.name,
      date: sub.date,
      time: sub.time ?? sub.start_time,
      venue: sub.venue ?? "",
      address: sub.address ?? "",
      description: sub.description ?? "",
      dress_code: sub.dress_code ?? "",
      rsvp_enabled: sub.rsvp_enabled,
      order_index: sub.display_order ?? sub.order_index,
    });
    setEditingId(sub.id);
    setShowModal(true);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    saveMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (isError) {
    return <ErrorState title="Failed to load events" />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Events</h2>
          <p className="text-sm text-muted">
            Create and manage individual events within your celebration.
          </p>
        </div>
        <Button onClick={openCreate}>Add Event</Button>
      </div>

      {subEvents && subEvents.length > 0 ? (
        <div className="flex flex-col gap-3">
          {subEvents.map((sub) => {
            const isExpanded = expandedId === sub.id;
            return (
              <Card key={sub.id}>
                <div className="flex items-start justify-between">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : sub.id)}
                    className="flex-1 text-left"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">
                        {isExpanded ? "▼" : "▶"}
                      </span>
                      <h3 className="font-semibold text-foreground">
                        {sub.name}
                      </h3>
                      {sub.rsvp_enabled && <Badge variant="success">RSVP</Badge>}
                    </div>
                    {sub.description && (
                      <p className="mt-1 text-sm text-muted">{sub.description}</p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted">
                      {sub.date && <span>📅 {formatDateShort(sub.date)}</span>}
                      {sub.time && <span>⏰ {formatTime12(sub.time)}</span>}
                      {sub.venue && <span>📍 {sub.venue}</span>}
                      {sub.dress_code && <span>👔 {sub.dress_code}</span>}
                    </div>
                  </button>
                  <div className="flex gap-1">
                    <IconButton onClick={() => openEdit(sub)} title="Edit">
                      ✏️
                    </IconButton>
                    <IconButton
                      onClick={() => deleteMutation.mutate(sub.id)}
                      title="Delete"
                      className="hover:text-danger"
                    >
                      🗑
                    </IconButton>
                  </div>
                </div>
                {isExpanded && (
                  <div className="mt-4 border-t border-border pt-4">
                    <InvitationManager eventId={eventId} subEvent={sub} />
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No events yet"
          description="Add events like Ceremony, Reception, or After-Party."
          action={<Button onClick={openCreate}>Add Event</Button>}
        />
      )}

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingId ? "Edit Event" : "Add Event"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Event Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Wedding Ceremony"
            required
            autoFocus
          />
          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Details about this event..."
            rows={2}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
            value={form.venue}
            onChange={(e) => setForm({ ...form, venue: e.target.value })}
            placeholder="Venue name"
          />
          <Input
            label="Address"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="Full address"
          />
          <Input
            label="Dress Code"
            value={form.dress_code}
            onChange={(e) => setForm({ ...form, dress_code: e.target.value })}
            placeholder="e.g. Black tie, Casual"
          />
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.rsvp_enabled}
              onChange={(e) => setForm({ ...form, rsvp_enabled: e.target.checked })}
              className="h-4 w-4 rounded border-border"
            />
            <span className="text-sm text-foreground">RSVP enabled for this event</span>
          </label>
          {saveMutation.isError && (
            <p className="text-sm text-danger">
              {saveMutation.error instanceof Error
                ? saveMutation.error.message
                : "Failed to save"}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowModal(false)}
            >
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
