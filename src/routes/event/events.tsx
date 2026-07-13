import { useState } from "react";
import { useParams, useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type SubEvent, type EventRsvp } from "../../lib/supabase";
import { cn, formatDate, formatTime, getEventStatus, isRsvpClosed, formatDeadline, toDatetimeLocal, fromDatetimeLocal } from "../../lib/utils";
import { Button } from "../../components/ui/Button";
import { Card, Badge, EmptyState, FormField, Toggle, Skeleton, ErrorState, Toast, Modal } from "../../components/ui";
import { Input, Textarea } from "../../components/ui/Input";
import { DatePicker } from "../../components/ui/DatePicker";
import { TimePicker } from "../../components/ui/TimePicker";
import { Plus, Pencil, Trash2, Copy, ArrowUp, ArrowDown, Calendar, MapPin, Clock, Users, Shirt, CalendarClock } from "lucide-react";

interface EventContext { event: UserEvent; }

interface SubEventWithCounts extends SubEvent { rsvpCounts: { attending: number; declined: number; pending: number; total: number }; }

interface SubEventFormState {
  name: string;
  date: string | null;
  time: string | null;
  venue: string | null;
  address: string | null;
  description: string | null;
  dress_code: string | null;
  rsvp_deadline: string | null;
  rsvp_enabled: boolean;
}

const emptyForm: SubEventFormState = {
  name: "",
  date: null,
  time: null,
  venue: null,
  address: null,
  description: null,
  dress_code: null,
  rsvp_deadline: null,
  rsvp_enabled: true,
};

export default function EventsPage() {
  const { eventId } = useParams();
  const { event } = useOutletContext<EventContext>();
  const queryClient = useQueryClient();

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [duplicateId, setDuplicateId] = useState<string | null>(null);
  const [form, setForm] = useState<SubEventFormState>(emptyForm);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const subEventsKey = ["sub-events", eventId];
  const rsvpsKey = ["sub-event-rsvps", eventId];

  const { data: subEvents, isLoading, isError, error, refetch } = useQuery({
    queryKey: subEventsKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sub_events")
        .select("*")
        .eq("parent_event_id", eventId)
        .order("order_index", { ascending: true })
        .order("date", { ascending: true, nullsFirst: false })
        .order("time", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data as SubEvent[];
    },
    enabled: !!eventId,
  });

  const { data: rsvps } = useQuery({
    queryKey: rsvpsKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_rsvps")
        .select("*")
        .in("sub_event_id", subEvents?.map((s) => s.id) || []);
      if (error) throw error;
      return data as EventRsvp[];
    },
    enabled: !!subEvents && subEvents.length > 0,
  });

  const buildCounts = (list: SubEvent[]): SubEventWithCounts[] => {
    return list.map((se) => {
      const subset = (rsvps || []).filter((r) => r.sub_event_id === se.id);
      return {
        ...se,
        rsvpCounts: {
          attending: subset.filter((r) => r.status === "attending").length,
          declined: subset.filter((r) => r.status === "declined").length,
          pending: subset.filter((r) => r.status === "pending").length,
          total: subset.length,
        },
      };
    });
  };

  const enriched = subEvents ? buildCounts(subEvents) : [];

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!eventId) throw new Error("Missing event id");
      const orderIndex = (subEvents?.length || 0);
      const { data, error } = await supabase
        .from("sub_events")
        .insert({
          parent_event_id: eventId,
          name: form.name,
          date: form.date,
          time: form.time,
          venue: form.venue,
          address: form.address,
          description: form.description,
          dress_code: form.dress_code,
          rsvp_deadline: form.rsvp_deadline ? fromDatetimeLocal(form.rsvp_deadline) : null,
          rsvp_enabled: form.rsvp_enabled,
          order_index: orderIndex,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subEventsKey });
      queryClient.invalidateQueries({ queryKey: rsvpsKey });
      setShowModal(false);
      setForm(emptyForm);
      setEditingId(null);
      setToast({ message: "Sub-event created", type: "success" });
    },
    onError: (err: Error) => {
      setToast({ message: `Failed to create: ${err.message}`, type: "error" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingId) throw new Error("No sub-event selected");
      const { error } = await supabase
        .from("sub_events")
        .update({
          name: form.name,
          date: form.date,
          time: form.time,
          venue: form.venue,
          address: form.address,
          description: form.description,
          dress_code: form.dress_code,
          rsvp_deadline: form.rsvp_deadline ? fromDatetimeLocal(form.rsvp_deadline) : null,
          rsvp_enabled: form.rsvp_enabled,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subEventsKey });
      queryClient.invalidateQueries({ queryKey: rsvpsKey });
      setShowModal(false);
      setForm(emptyForm);
      setEditingId(null);
      setToast({ message: "Sub-event updated", type: "success" });
    },
    onError: (err: Error) => {
      setToast({ message: `Failed to update: ${err.message}`, type: "error" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sub_events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subEventsKey });
      queryClient.invalidateQueries({ queryKey: rsvpsKey });
      setDeleteId(null);
      setToast({ message: "Sub-event deleted", type: "success" });
    },
    onError: (err: Error) => {
      setToast({ message: `Failed to delete: ${err.message}`, type: "error" });
      setDeleteId(null);
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async (source: SubEvent) => {
      if (!eventId) throw new Error("Missing event id");
      const orderIndex = (subEvents?.length || 0);
      const { data, error } = await supabase
        .from("sub_events")
        .insert({
          parent_event_id: eventId,
          name: `${source.name} (Copy)`,
          date: source.date,
          time: source.time,
          venue: source.venue,
          address: source.address,
          description: source.description,
          dress_code: source.dress_code,
          rsvp_deadline: source.rsvp_deadline,
          rsvp_enabled: source.rsvp_enabled,
          order_index: orderIndex,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subEventsKey });
      setDuplicateId(null);
      setToast({ message: "Sub-event duplicated", type: "success" });
    },
    onError: (err: Error) => {
      setToast({ message: `Failed to duplicate: ${err.message}`, type: "error" });
      setDuplicateId(null);
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async ({ id, direction }: { id: string; direction: "up" | "down" }) => {
      if (!subEvents || subEvents.length < 2) return;
      const sorted = [...subEvents].sort((a, b) => a.order_index - b.order_index);
      const idx = sorted.findIndex((s) => s.id === id);
      if (idx === -1) return;
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= sorted.length) return;
      const a = sorted[idx];
      const b = sorted[swapIdx];
      const updates = [
        supabase.from("sub_events").update({ order_index: b.order_index, updated_at: new Date().toISOString() }).eq("id", a.id),
        supabase.from("sub_events").update({ order_index: a.order_index, updated_at: new Date().toISOString() }).eq("id", b.id),
      ];
      const results = await Promise.all(updates);
      for (const r of results) if (r.error) throw r.error;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: subEventsKey });
      setToast({ message: `Moved ${vars.direction}`, type: "success" });
    },
    onError: (err: Error) => {
      setToast({ message: `Failed to reorder: ${err.message}`, type: "error" });
    },
  });

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (se: SubEvent) => {
    setEditingId(se.id);
    setForm({
      name: se.name,
      date: se.date,
      time: se.time,
      venue: se.venue,
      address: se.address,
      description: se.description,
      dress_code: se.dress_code,
      rsvp_deadline: toDatetimeLocal(se.rsvp_deadline),
      rsvp_enabled: se.rsvp_enabled,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const statusVariant = (status: string): "info" | "success" | "default" => {
    if (status === "upcoming") return "info";
    if (status === "ongoing") return "success";
    return "default";
  };

  const submitForm = () => {
    if (!form.name.trim()) {
      setToast({ message: "Name is required", type: "error" });
      return;
    }
    if (editingId) updateMutation.mutate();
    else createMutation.mutate();
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-heading text-2xl">Multiple Events</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Create sub-events for {event.draft_name || event.name} — guests can RSVP to each individually.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4" /> Add Sub-Event
        </Button>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-56" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState message={(error as Error)?.message || "Failed to load sub-events"} onRetry={() => refetch()} />
      ) : enriched.length === 0 ? (
        <EmptyState
          icon={<Calendar className="w-12 h-12" />}
          title="No sub-events yet"
          description="Add individual events like Ceremony, Reception, or Mehndi so guests can RSVP to each one separately."
          action={<Button onClick={openCreate}><Plus className="w-4 h-4" /> Add Sub-Event</Button>}
        />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {enriched.map((se, idx) => {
            const status = getEventStatus(se.date);
            const rsvpClosed = isRsvpClosed(se.rsvp_deadline);
            return (
              <Card key={se.id} className="p-5 flex flex-col gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-heading text-lg truncate">{se.name}</h3>
                      <Badge variant={statusVariant(status)}>{status}</Badge>
                      {se.rsvp_enabled ? (
                        rsvpClosed ? <Badge variant="error">RSVP Closed</Badge> : <Badge variant="success">RSVP Open</Badge>
                      ) : (
                        <Badge variant="default">RSVP Off</Badge>
                      )}
                    </div>
                    {se.date && (
                      <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] mt-1.5">
                        <Calendar className="w-3.5 h-3.5" /> {formatDate(se.date)}
                        {se.time && (<><span>·</span><Clock className="w-3.5 h-3.5" /> {formatTime(se.time)}</>)}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => reorderMutation.mutate({ id: se.id, direction: "up" })}
                      disabled={idx === 0 || reorderMutation.isPending}
                      className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-subtle)] disabled:opacity-30 transition-colors"
                      style={{ borderRadius: "var(--radius)" }}
                      title="Move up"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => reorderMutation.mutate({ id: se.id, direction: "down" })}
                      disabled={idx === enriched.length - 1 || reorderMutation.isPending}
                      className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-subtle)] disabled:opacity-30 transition-colors"
                      style={{ borderRadius: "var(--radius)" }}
                      title="Move down"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {se.venue && (
                  <div className="flex items-start gap-1.5 text-sm">
                    <MapPin className="w-4 h-4 text-[var(--color-text-muted)] mt-0.5 shrink-0" />
                    <div>
                      <div className="font-medium">{se.venue}</div>
                      {se.address && <div className="text-[var(--color-text-muted)] text-xs mt-0.5">{se.address}</div>}
                    </div>
                  </div>
                )}

                {se.description && (
                  <p className="text-sm text-[var(--color-text-muted)] line-clamp-3">{se.description}</p>
                )}

                {se.dress_code && (
                  <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
                    <Shirt className="w-3.5 h-3.5" /> {se.dress_code}
                  </div>
                )}

                {se.rsvp_enabled && se.rsvp_deadline && (
                  <div className="flex items-center gap-1.5 text-xs">
                    <CalendarClock className={cn("w-3.5 h-3.5", rsvpClosed ? "text-red-500" : "text-[var(--color-text-muted)]")} />
                    <span className={cn(rsvpClosed ? "text-red-600 font-medium" : "text-[var(--color-text-muted)]")}>
                      RSVP {rsvpClosed ? "closed" : "deadline"}: {formatDeadline(se.rsvp_deadline)}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-3 pt-2 border-t border-[var(--color-border)]">
                  <div className="flex items-center gap-1.5 text-xs">
                    <Users className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                    <span className="font-medium text-green-700">{se.rsvpCounts.attending}</span>
                    <span className="text-[var(--color-text-muted)]">attending</span>
                    <span className="text-[var(--color-border)]">·</span>
                    <span className="font-medium text-red-700">{se.rsvpCounts.declined}</span>
                    <span className="text-[var(--color-text-muted)]">declined</span>
                    <span className="text-[var(--color-border)]">·</span>
                    <span className="font-medium text-amber-700">{se.rsvpCounts.pending}</span>
                    <span className="text-[var(--color-text-muted)]">pending</span>
                  </div>
                  <div className="ml-auto flex items-center gap-1">
                    <button
                      onClick={() => openEdit(se)}
                      className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-subtle)] transition-colors"
                      style={{ borderRadius: "var(--radius)" }}
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDuplicateId(se.id)}
                      className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-subtle)] transition-colors"
                      style={{ borderRadius: "var(--radius)" }}
                      title="Duplicate"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteId(se.id)}
                      className="p-1.5 text-[var(--color-text-muted)] hover:text-red-600 hover:bg-red-50 transition-colors"
                      style={{ borderRadius: "var(--radius)" }}
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={showModal} onClose={closeModal} title={editingId ? "Edit Sub-Event" : "Add Sub-Event"}>
        <div className="space-y-4">
          <FormField label="Name">
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Ceremony, Reception, Mehndi"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Date">
              <DatePicker value={form.date} onChange={(v) => setForm({ ...form, date: v })} />
            </FormField>
            <FormField label="Time">
              <TimePicker value={form.time} onChange={(v) => setForm({ ...form, time: v })} />
            </FormField>
          </div>

          <FormField label="Venue">
            <Input
              value={form.venue || ""}
              onChange={(e) => setForm({ ...form, venue: e.target.value || null })}
              placeholder="e.g. The Grand Ballroom"
            />
          </FormField>

          <FormField label="Address">
            <Input
              value={form.address || ""}
              onChange={(e) => setForm({ ...form, address: e.target.value || null })}
              placeholder="123 Main St, City"
            />
          </FormField>

          <FormField label="Description">
            <Textarea
              value={form.description || ""}
              onChange={(e) => setForm({ ...form, description: e.target.value || null })}
              placeholder="Details about this sub-event..."
              rows={3}
            />
          </FormField>

          <FormField label="Dress Code">
            <Input
              value={form.dress_code || ""}
              onChange={(e) => setForm({ ...form, dress_code: e.target.value || null })}
              placeholder="e.g. Black Tie, Cocktail, Casual"
            />
          </FormField>

          <FormField label="RSVP Deadline">
            <Input
              type="datetime-local"
              value={form.rsvp_deadline || ""}
              onChange={(e) => setForm({ ...form, rsvp_deadline: e.target.value || null })}
            />
          </FormField>

          <FormField label="RSVP Enabled">
            <Toggle checked={form.rsvp_enabled} onChange={(v) => setForm({ ...form, rsvp_enabled: v })} label="Allow guests to RSVP to this sub-event" />
          </FormField>

          <div className="flex gap-3 pt-2">
            <Button onClick={submitForm} loading={createMutation.isPending || updateMutation.isPending} disabled={!form.name.trim()}>
              {editingId ? "Save Changes" : "Create Sub-Event"}
            </Button>
            <Button variant="ghost" onClick={closeModal}>Cancel</Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Sub-Event">
        <p className="text-sm text-[var(--color-text-muted)] mb-6">
          Are you sure you want to delete this sub-event? All associated RSVPs will also be removed. This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <Button variant="danger" onClick={() => deleteId && deleteMutation.mutate(deleteId)} loading={deleteMutation.isPending}>
            Delete
          </Button>
          <Button variant="ghost" onClick={() => setDeleteId(null)}>Cancel</Button>
        </div>
      </Modal>

      <Modal open={!!duplicateId} onClose={() => setDuplicateId(null)} title="Duplicate Sub-Event">
        <p className="text-sm text-[var(--color-text-muted)] mb-6">
          This will create a copy of the sub-event with "(Copy)" appended to its name. RSVPs are not copied.
        </p>
        <div className="flex gap-3">
          <Button
            onClick={() => {
              const source = subEvents?.find((s) => s.id === duplicateId);
              if (source) duplicateMutation.mutate(source);
            }}
            loading={duplicateMutation.isPending}
          >
            Duplicate
          </Button>
          <Button variant="ghost" onClick={() => setDuplicateId(null)}>Cancel</Button>
        </div>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

