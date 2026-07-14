import { useState, type FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type SubEvent } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { InvitationManager } from "./invitation-manager";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, Modal, Card, LoadingSpinner, ErrorState, EmptyState, Badge, Toggle } from "../../components/ui";
import { DatePicker, TimePicker } from "../../components/ui";
import { formatDateShort, to12Hour, cn } from "../../lib/utils";

interface SubEventForm {
  name: string;
  date: string;
  start_time: string;
  end_time: string;
  venue: string;
  address: string;
  description: string;
  dress_code: string;
  rsvp_enabled: boolean;
  display_order: number;
}

const EMPTY_FORM: SubEventForm = {
  name: "",
  date: "",
  start_time: "",
  end_time: "",
  venue: "",
  address: "",
  description: "",
  dress_code: "",
  rsvp_enabled: true,
  display_order: 0,
};

export default function EventsPage() {
  const { eventId } = useEventContext();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SubEventForm>(EMPTY_FORM);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: subEvents, isLoading, isError, refetch } = useQuery({
    queryKey: ["sub-events", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sub_events")
        .select("*")
        .eq("parent_event_id", eventId)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as unknown as SubEventDB[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        parent_event_id: eventId,
        name: form.name,
        date: form.date || null,
        start_time: form.start_time || null,
        end_time: form.end_time || null,
        venue: form.venue || "",
        address: form.address || "",
        description: form.description || null,
        dress_code: form.dress_code || null,
        rsvp_enabled: form.rsvp_enabled,
        display_order: editingId
          ? subEvents?.find((s) => s.id === editingId)?.display_order ?? 0
          : (subEvents?.length ?? 0),
      };
      if (editingId) {
        const { error } = await supabase.from("sub_events").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("sub_events").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-events", eventId] });
      setModalOpen(false);
      setForm(EMPTY_FORM);
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sub_events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-events", eventId] });
    },
  });

  function openCreate() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setModalOpen(true);
  }

  function openEdit(se: SubEventDB) {
    setForm({
      name: se.name,
      date: se.date ?? "",
      start_time: se.start_time ?? "",
      end_time: se.end_time ?? "",
      venue: se.venue ?? "",
      address: se.address ?? "",
      description: se.description ?? "",
      dress_code: se.dress_code ?? "",
      rsvp_enabled: se.rsvp_enabled ?? true,
      display_order: se.display_order ?? 0,
    });
    setEditingId(se.id);
    setModalOpen(true);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    saveMutation.mutate();
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-dash-text">Events</h2>
          <p className="text-sm text-dash-muted">
            Manage the individual events within your celebration.
          </p>
        </div>
        <Button onClick={openCreate}>Add Event</Button>
      </div>

      {saveMutation.isError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          Error: {saveMutation.error?.message}
        </div>
      )}

      {subEvents && subEvents.length === 0 ? (
        <EmptyState
          title="No events yet"
          description="Add events like Ceremony, Reception, or Dinner to organize your celebration."
          icon={<span className="text-5xl">🎉</span>}
          action={<Button onClick={openCreate}>Add Event</Button>}
        />
      ) : (
        <div className="space-y-4">
          {subEvents?.map((se, idx) => (
            <div key={se.id} className="space-y-2">
              <Card className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-dash-primary/10 text-dash-primary text-sm font-semibold">
                      {idx + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold text-dash-text">{se.name}</h3>
                        {se.rsvp_enabled ? (
                          <Badge variant="success">RSVP</Badge>
                        ) : (
                          <Badge variant="default">No RSVP</Badge>
                        )}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {se.date && (
                          <Badge variant="default">📅 {formatDateShort(se.date)}</Badge>
                        )}
                        {se.start_time && (
                          <Badge variant="default">🕐 {to12Hour(se.start_time)}</Badge>
                        )}
                        {se.end_time && (
                          <Badge variant="default">→ {to12Hour(se.end_time)}</Badge>
                        )}
                        {se.venue && (
                          <Badge variant="default">📍 {se.venue}</Badge>
                        )}
                      </div>
                      {se.description && (
                        <p className="mt-2 text-sm text-dash-muted line-clamp-2">{se.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedId(expandedId === se.id ? null : se.id)}
                    >
                      {expandedId === se.id ? "Hide" : "Manage"}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(se)}>
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMutation.mutate(se.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
              {expandedId === se.id && (
                <InvitationManager subEvent={se as unknown as SubEvent} />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit Event" : "Add Event"}
        className="max-w-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Event Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Ceremony, Reception, Dinner..."
            required
            autoFocus
          />
          <div>
            <label className="block text-sm font-medium text-dash-text mb-1">Date</label>
            <DatePicker value={form.date} onChange={(v) => setForm({ ...form, date: v })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-dash-text mb-1">Start Time</label>
              <TimePicker value={form.start_time} onChange={(v) => setForm({ ...form, start_time: v })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-dash-text mb-1">End Time</label>
              <TimePicker value={form.end_time} onChange={(v) => setForm({ ...form, end_time: v })} />
            </div>
          </div>
          <Input
            label="Venue"
            value={form.venue}
            onChange={(e) => setForm({ ...form, venue: e.target.value })}
            placeholder="Grand Hall"
          />
          <Input
            label="Address"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="123 Main St, City"
          />
          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Optional description"
            rows={2}
          />
          <Input
            label="Dress Code"
            value={form.dress_code}
            onChange={(e) => setForm({ ...form, dress_code: e.target.value })}
            placeholder="Black tie, casual, etc."
          />
          <div className="flex items-center justify-between rounded-md border border-dash-border bg-dash-bg px-3 py-2">
            <div>
              <span className="text-sm font-medium text-dash-text">RSVP Enabled</span>
              <p className="text-xs text-dash-muted">Allow guests to RSVP to this event</p>
            </div>
            <Toggle
              checked={form.rsvp_enabled}
              onChange={(v) => setForm({ ...form, rsvp_enabled: v })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
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

// DB row shape for sub_events
interface SubEventDB {
  id: string;
  parent_event_id: string;
  name: string;
  date: string | null;
  start_time: string | null;
  end_time: string | null;
  venue: string | null;
  address: string | null;
  description: string | null;
  dress_code: string | null;
  rsvp_enabled: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}
