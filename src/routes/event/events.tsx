import { useState, type FormEvent } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type SubEvent } from "../../lib/supabase";
import { formatDate, formatTime12 } from "../../lib/utils";
import {
  Button, Card, Modal, Input, Textarea, DatePicker, TimePicker, Toggle, Badge,
  EmptyState, ErrorState, LoadingSpinner,
} from "../../components/ui";
import { InvitationManager } from "./invitation-manager";

interface SubEventForm {
  name: string;
  date: string | null;
  start_time: string | null;
  end_time: string | null;
  venue: string;
  address: string;
  description: string;
  dress_code: string;
  rsvp_enabled: boolean;
}

const EMPTY_FORM: SubEventForm = {
  name: "", date: null, start_time: null, end_time: null,
  venue: "", address: "", description: "", dress_code: "", rsvp_enabled: true,
};

export default function EventsPage() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SubEvent | null>(null);
  const [form, setForm] = useState<SubEventForm>(EMPTY_FORM);
  const [inviteModalSubEvent, setInviteModalSubEvent] = useState<SubEvent | null>(null);

  const { data: subEvents, isLoading, isError, refetch } = useQuery({
    queryKey: ["sub_events", event.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sub_events")
        .select("*")
        .eq("parent_event_id", event.id)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as SubEvent[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const orderIndex = subEvents?.length ?? 0;
      const { error } = await supabase.from("sub_events").insert({
        ...form, parent_event_id: event.id, wedding_id: event.id,
        order_index: orderIndex, display_order: orderIndex,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub_events", event.id] });
      setModalOpen(false);
      setForm(EMPTY_FORM);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editing) return;
      const { error } = await supabase.from("sub_events").update(form).eq("id", editing.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub_events", event.id] });
      setModalOpen(false);
      setEditing(null);
      setForm(EMPTY_FORM);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sub_events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub_events", event.id] });
    },
  });

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setModalOpen(true); };
  const openEdit = (s: SubEvent) => {
    setEditing(s);
    setForm({
      name: s.name, date: s.date, start_time: s.start_time ?? s.time ?? null,
      end_time: s.end_time, venue: s.venue ?? "", address: s.address ?? "",
      description: s.description ?? "", dress_code: s.dress_code ?? "", rsvp_enabled: s.rsvp_enabled,
    });
    setModalOpen(true);
  };
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (editing) updateMutation.mutate();
    else createMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  if (isError) {
    return <ErrorState message="Failed to load events." onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-dash-text">Events</h2>
          <p className="text-sm text-dash-muted">Manage individual events within your celebration.</p>
        </div>
        <Button onClick={openCreate}>Add Event</Button>
      </div>

      {(!subEvents || subEvents.length === 0) && (
        <EmptyState
          title="No events yet"
          description="Add events like Ceremony, Reception, or After-Party to organize your celebration."
          icon={<span className="text-4xl">🎉</span>}
          action={<Button onClick={openCreate}>Add Event</Button>}
        />
      )}

      {subEvents && subEvents.length > 0 && (
        <div className="space-y-3">
          {subEvents.map((s) => (
            <Card key={s.id} className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-dash-text">{s.name}</h3>
                  {s.rsvp_enabled && <Badge variant="success">RSVP</Badge>}
                </div>
                {s.description && <p className="mt-1 text-sm text-dash-muted">{s.description}</p>}
                <div className="mt-2 flex flex-wrap gap-3 text-sm text-dash-muted">
                  {s.date && <span>📅 {formatDate(s.date)}</span>}
                  {s.start_time && <span>🕐 {formatTime12(s.start_time)}</span>}
                  {s.venue && <span>📍 {s.venue}</span>}
                  {s.dress_code && <span>👔 {s.dress_code}</span>}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Button size="sm" variant="secondary" onClick={() => setInviteModalSubEvent(s)}>
                  Manage Invitations
                </Button>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(s)}>Edit</Button>
                  <Button size="sm" variant="danger" loading={deleteMutation.isPending}
                    onClick={() => { if (confirm(`Delete "${s.name}"?`)) deleteMutation.mutate(s.id); }}>
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}
        title={editing ? "Edit Event" : "Add Event"} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Event Name" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Ceremony, Reception" required />
          <Textarea label="Description" value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional description" />
          <DatePicker label="Date" value={form.date}
            onChange={(val) => setForm({ ...form, date: val })} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TimePicker label="Start Time" value={form.start_time}
              onChange={(val) => setForm({ ...form, start_time: val })} />
            <TimePicker label="End Time" value={form.end_time}
              onChange={(val) => setForm({ ...form, end_time: val })} />
          </div>
          <Input label="Venue" value={form.venue}
            onChange={(e) => setForm({ ...form, venue: e.target.value })} placeholder="e.g. Main Hall" />
          <Input label="Address" value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="e.g. 123 Main St" />
          <Input label="Dress Code" value={form.dress_code}
            onChange={(e) => setForm({ ...form, dress_code: e.target.value })} placeholder="e.g. Formal, Casual" />
          <Toggle checked={form.rsvp_enabled}
            onChange={(checked) => setForm({ ...form, rsvp_enabled: checked })}
            label="Enable RSVP for this event" />
          {(createMutation.isError || updateMutation.isError) && (
            <p className="text-sm text-dash-danger">
              {createMutation.error?.message || updateMutation.error?.message || "Failed to save"}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>
              {editing ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!inviteModalSubEvent} onClose={() => setInviteModalSubEvent(null)}
        title={`Invitations: ${inviteModalSubEvent?.name ?? ""}`} size="lg">
        {inviteModalSubEvent && (
          <InvitationManager
            subEvent={inviteModalSubEvent}
            event={event}
            onClose={() => setInviteModalSubEvent(null)}
          />
        )}
      </Modal>
    </div>
  );
}
