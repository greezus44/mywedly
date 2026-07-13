import { useState } from "react";
import { useNavigate, useParams, useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  supabase,
  type UserEvent,
  type SubEvent,
  type EventRsvp,
} from "../../lib/supabase";
import {
  cn,
  formatDate,
  formatTime,
  getEventStatus,
  isRsvpClosed,
  formatDeadline,
  toDatetimeLocal,
  fromDatetimeLocal,
} from "../../lib/utils";
import { Button } from "../../components/ui/Button";
import {
  Card,
  Badge,
  EmptyState,
  FormField,
  Toggle,
  Skeleton,
  ErrorState,
  Toast,
  Modal,
} from "../../components/ui";
import { Input, Textarea } from "../../components/ui/Input";
import { DatePicker } from "../../components/ui/DatePicker";
import { TimePicker } from "../../components/ui/TimePicker";
import {
  Plus,
  Pencil,
  Copy,
  Trash2,
  ChevronUp,
  ChevronDown,
  Calendar,
  Clock,
  MapPin,
  Shirt,
  Users,
  Eye,
  EyeOff,
  CalendarPlus,
  AlertCircle,
} from "lucide-react";

interface SubEventForm {
  name: string;
  date: string | null;
  time: string | null;
  venue: string;
  address: string;
  description: string;
  dress_code: string;
  rsvp_deadline: string;
  rsvp_enabled: boolean;
}

const EMPTY_FORM: SubEventForm = {
  name: "",
  date: null,
  time: null,
  venue: "",
  address: "",
  description: "",
  dress_code: "",
  rsvp_deadline: "",
  rsvp_enabled: true,
};

type EventContext = { event: UserEvent };

function EventsPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { event } = useOutletContext<EventContext>();

  const [toast, setToast] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SubEventForm>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<SubEvent | null>(null);

  // Fetch sub-events ordered chronologically
  const {
    data: subEvents = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["sub-events", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sub_events")
        .select("*")
        .eq("parent_event_id", eventId)
        .order("date", { ascending: true, nullsFirst: false })
        .order("time", { ascending: true, nullsFirst: false })
        .order("order_index", { ascending: true });
      if (error) throw error;
      return (data || []) as SubEvent[];
    },
    enabled: !!eventId,
  });

  // Fetch RSVP counts per sub-event
  const { data: rsvpCounts = {} } = useQuery({
    queryKey: ["sub-event-rsvp-counts", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_rsvps")
        .select("sub_event_id, status")
        .eq("event_id", eventId);
      if (error) throw error;
      const counts: Record<string, { total: number; attending: number; declined: number; pending: number }> = {};
      (data || []).forEach((rsvp: Pick<EventRsvp, "sub_event_id" | "status">) => {
        const key = rsvp.sub_event_id || "__parent__";
        if (!counts[key]) counts[key] = { total: 0, attending: 0, declined: 0, pending: 0 };
        counts[key].total++;
        if (rsvp.status === "attending") counts[key].attending++;
        else if (rsvp.status === "declined") counts[key].declined++;
        else counts[key].pending++;
      });
      return counts;
    },
    enabled: !!eventId,
  });

  // Create sub-event
  const createMutation = useMutation({
    mutationFn: async (input: SubEventForm) => {
      const maxOrder = subEvents.length > 0 ? Math.max(...subEvents.map((s) => s.order_index)) : -1;
      const payload = {
        parent_event_id: eventId,
        name: input.name,
        date: input.date,
        time: input.time,
        venue: input.venue || null,
        address: input.address || null,
        description: input.description || null,
        dress_code: input.dress_code || null,
        rsvp_deadline: input.rsvp_deadline ? fromDatetimeLocal(input.rsvp_deadline) : null,
        rsvp_enabled: input.rsvp_enabled,
        order_index: maxOrder + 1,
      };
      const { error } = await supabase.from("sub_events").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-events", eventId] });
      queryClient.invalidateQueries({ queryKey: ["sub-event-rsvp-counts", eventId] });
      setModalOpen(false);
      setForm(EMPTY_FORM);
      setEditingId(null);
      setToast("Sub-event created");
      setToastType("success");
    },
    onError: (err: Error) => {
      setToast(err.message || "Failed to create sub-event");
      setToastType("error");
    },
  });

  // Update sub-event
  const updateMutation = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: SubEventForm }) => {
      const payload = {
        name: input.name,
        date: input.date,
        time: input.time,
        venue: input.venue || null,
        address: input.address || null,
        description: input.description || null,
        dress_code: input.dress_code || null,
        rsvp_deadline: input.rsvp_deadline ? fromDatetimeLocal(input.rsvp_deadline) : null,
        rsvp_enabled: input.rsvp_enabled,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from("sub_events").update(payload).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-events", eventId] });
      queryClient.invalidateQueries({ queryKey: ["sub-event-rsvp-counts", eventId] });
      setModalOpen(false);
      setForm(EMPTY_FORM);
      setEditingId(null);
      setToast("Sub-event updated");
      setToastType("success");
    },
    onError: (err: Error) => {
      setToast(err.message || "Failed to update sub-event");
      setToastType("error");
    },
  });

  // Delete sub-event
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sub_events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-events", eventId] });
      queryClient.invalidateQueries({ queryKey: ["sub-event-rsvp-counts", eventId] });
      setDeleteTarget(null);
      setToast("Sub-event deleted");
      setToastType("success");
    },
    onError: (err: Error) => {
      setToast(err.message || "Failed to delete sub-event");
      setToastType("error");
    },
  });

  // Duplicate sub-event
  const duplicateMutation = useMutation({
    mutationFn: async (source: SubEvent) => {
      const maxOrder = subEvents.length > 0 ? Math.max(...subEvents.map((s) => s.order_index)) : -1;
      const payload = {
        parent_event_id: source.parent_event_id,
        name: `${source.name} (Copy)`,
        date: source.date,
        time: source.time,
        venue: source.venue,
        address: source.address,
        description: source.description,
        dress_code: source.dress_code,
        rsvp_deadline: source.rsvp_deadline,
        rsvp_enabled: source.rsvp_enabled,
        order_index: maxOrder + 1,
      };
      const { error } = await supabase.from("sub_events").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-events", eventId] });
      setToast("Sub-event duplicated");
      setToastType("success");
    },
    onError: (err: Error) => {
      setToast(err.message || "Failed to duplicate sub-event");
      setToastType("error");
    },
  });

  // Reorder (move up/down)
  const reorderMutation = useMutation({
    mutationFn: async ({ sub, direction }: { sub: SubEvent; direction: "up" | "down" }) => {
      const sorted = [...subEvents].sort((a, b) => a.order_index - b.order_index);
      const idx = sorted.findIndex((s) => s.id === sub.id);
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= sorted.length) return;
      const swapSub = sorted[swapIdx];
      const updates = [
        { id: sub.id, order_index: swapSub.order_index },
        { id: swapSub.id, order_index: sub.order_index },
      ];
      for (const u of updates) {
        const { error } = await supabase.from("sub_events").update({ order_index: u.order_index, updated_at: new Date().toISOString() }).eq("id", u.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-events", eventId] });
    },
    onError: (err: Error) => {
      setToast(err.message || "Failed to reorder");
      setToastType("error");
    },
  });

  // Archive (toggle rsvp_enabled to hide from guest view)
  const archiveMutation = useMutation({
    mutationFn: async ({ sub, hide }: { sub: SubEvent; hide: boolean }) => {
      const { error } = await supabase
        .from("sub_events")
        .update({ rsvp_enabled: !hide, updated_at: new Date().toISOString() })
        .eq("id", sub.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-events", eventId] });
    },
    onError: (err: Error) => {
      setToast(err.message || "Failed to update visibility");
      setToastType("error");
    },
  });

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setModalOpen(true);
  };

  const openEdit = (sub: SubEvent) => {
    setForm({
      name: sub.name,
      date: sub.date,
      time: sub.time,
      venue: sub.venue || "",
      address: sub.address || "",
      description: sub.description || "",
      dress_code: sub.dress_code || "",
      rsvp_deadline: sub.rsvp_deadline ? toDatetimeLocal(sub.rsvp_deadline) : "",
      rsvp_enabled: sub.rsvp_enabled,
    });
    setEditingId(sub.id);
    setModalOpen(true);
  };

  const handleSubmit = () => {
    if (!form.name.trim()) {
      setToast("Name is required");
      setToastType("error");
      return;
    }
    if (editingId) {
      updateMutation.mutate({ id: editingId, input: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const statusVariant = (status: string): "success" | "info" | "default" => {
    if (status === "upcoming") return "info";
    if (status === "ongoing") return "success";
    return "default";
  };

  const sortedEvents = [...subEvents].sort((a, b) => {
    const dateA = a.date ? new Date(a.date).getTime() : Infinity;
    const dateB = b.date ? new Date(b.date).getTime() : Infinity;
    if (dateA !== dateB) return dateA - dateB;
    const timeA = a.time ? a.time : "";
    const timeB = b.time ? b.time : "";
    if (timeA !== timeB) return timeA.localeCompare(timeB);
    return a.order_index - b.order_index;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-heading text-[var(--color-text)]">Events</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Manage individual events within "{event.name}" — ceremony, reception, rehearsal dinner, and more.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4" /> Add Event
        </Button>
      </div>

      {/* Info banner */}
      <Card className="p-4 mb-6 bg-[var(--color-bg-subtle)]">
        <div className="flex items-start gap-3">
          <CalendarPlus className="w-5 h-5 text-[var(--color-text-muted)] mt-0.5 shrink-0" />
          <div className="text-sm text-[var(--color-text-muted)]">
            <p className="font-medium text-[var(--color-text)]">Multiple Events per Invitation</p>
            <p className="mt-0.5">
              Create sub-events that guests can RSVP to individually. Each sub-event can have its own date, time, venue, dress code, and RSVP deadline.
            </p>
          </div>
        </div>
      </Card>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-6 w-48 mb-4" />
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-4 w-64" />
            </Card>
          ))}
        </div>
      )}

      {/* Error */}
      {isError && (
        <ErrorState message="Failed to load sub-events" onRetry={() => refetch()} />
      )}

      {/* Empty */}
      {!isLoading && !isError && sortedEvents.length === 0 && (
        <EmptyState
          icon={<Calendar className="w-16 h-16" />}
          title="No events yet"
          description="Add your first sub-event to start managing individual events within this invitation."
          action={<Button onClick={openCreate}><Plus className="w-4 h-4" /> Add Event</Button>}
        />
      )}

      {/* Event cards */}
      {!isLoading && !isError && sortedEvents.length > 0 && (
        <div className="space-y-4">
          {sortedEvents.map((sub, index) => {
            const status = getEventStatus(sub.date);
            const rsvpClosed = isRsvpClosed(sub.rsvp_deadline);
            const counts = rsvpCounts[sub.id] || { total: 0, attending: 0, declined: 0, pending: 0 };
            const isHidden = !sub.rsvp_enabled;

            return (
              <Card key={sub.id} className={cn("p-5 transition-opacity", isHidden && "opacity-60")}>
                {/* Top row: name + badges + actions */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-heading text-[var(--color-text)] truncate">{sub.name}</h3>
                      <Badge variant={statusVariant(status)}>{status}</Badge>
                      {sub.rsvp_enabled ? (
                        <Badge variant={rsvpClosed ? "warning" : "success"}>
                          RSVP {rsvpClosed ? "Closed" : "Open"}
                        </Badge>
                      ) : (
                        <Badge variant="default">Hidden</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => reorderMutation.mutate({ sub, direction: "up" })}
                      disabled={index === 0 || reorderMutation.isPending}
                      className="p-1.5 hover:bg-[var(--color-bg-subtle)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      style={{ borderRadius: "var(--radius)" }}
                      title="Move up"
                    >
                      <ChevronUp className="w-4 h-4 text-[var(--color-text-muted)]" />
                    </button>
                    <button
                      onClick={() => reorderMutation.mutate({ sub, direction: "down" })}
                      disabled={index === sortedEvents.length - 1 || reorderMutation.isPending}
                      className="p-1.5 hover:bg-[var(--color-bg-subtle)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      style={{ borderRadius: "var(--radius)" }}
                      title="Move down"
                    >
                      <ChevronDown className="w-4 h-4 text-[var(--color-text-muted)]" />
                    </button>
                    <button
                      onClick={() => openEdit(sub)}
                      className="p-1.5 hover:bg-[var(--color-bg-subtle)] transition-colors"
                      style={{ borderRadius: "var(--radius)" }}
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4 text-[var(--color-text-muted)]" />
                    </button>
                    <button
                      onClick={() => duplicateMutation.mutate(sub)}
                      disabled={duplicateMutation.isPending}
                      className="p-1.5 hover:bg-[var(--color-bg-subtle)] transition-colors"
                      style={{ borderRadius: "var(--radius)" }}
                      title="Duplicate"
                    >
                      <Copy className="w-4 h-4 text-[var(--color-text-muted)]" />
                    </button>
                    <button
                      onClick={() => archiveMutation.mutate({ sub, hide: sub.rsvp_enabled })}
                      disabled={archiveMutation.isPending}
                      className="p-1.5 hover:bg-[var(--color-bg-subtle)] transition-colors"
                      style={{ borderRadius: "var(--radius)" }}
                      title={isHidden ? "Show from guest view" : "Hide from guest view"}
                    >
                      {isHidden ? <Eye className="w-4 h-4 text-[var(--color-text-muted)]" /> : <EyeOff className="w-4 h-4 text-[var(--color-text-muted)]" />}
                    </button>
                    <button
                      onClick={() => setDeleteTarget(sub)}
                      className="p-1.5 hover:bg-red-50 transition-colors"
                      style={{ borderRadius: "var(--radius)" }}
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 mb-4">
                  {sub.date && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-[var(--color-text-muted)] shrink-0" />
                      <span className="text-[var(--color-text)]">{formatDate(sub.date)}</span>
                    </div>
                  )}
                  {sub.time && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-[var(--color-text-muted)] shrink-0" />
                      <span className="text-[var(--color-text)]">{formatTime(sub.time)}</span>
                    </div>
                  )}
                  {sub.venue && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-[var(--color-text-muted)] shrink-0" />
                      <span className="text-[var(--color-text)]">
                        {sub.venue}
                        {sub.address && <span className="text-[var(--color-text-muted)]"> · {sub.address}</span>}
                      </span>
                    </div>
                  )}
                  {sub.dress_code && (
                    <div className="flex items-center gap-2 text-sm">
                      <Shirt className="w-4 h-4 text-[var(--color-text-muted)] shrink-0" />
                      <span className="text-[var(--color-text)]">{sub.dress_code}</span>
                    </div>
                  )}
                </div>

                {/* Description */}
                {sub.description && (
                  <p className="text-sm text-[var(--color-text-muted)] mb-4 whitespace-pre-wrap">{sub.description}</p>
                )}

                {/* Footer: RSVP info */}
                <div className="flex items-center justify-between pt-4 border-t border-[var(--color-border)] flex-wrap gap-3">
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-[var(--color-text-muted)]" />
                      <span className="text-[var(--color-text)] font-medium">{counts.attending}</span>
                      <span className="text-[var(--color-text-muted)]">attending</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[var(--color-text)] font-medium">{counts.declined}</span>
                      <span className="text-[var(--color-text-muted)]">declined</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[var(--color-text)] font-medium">{counts.pending}</span>
                      <span className="text-[var(--color-text-muted)]">pending</span>
                    </div>
                  </div>
                  {sub.rsvp_deadline && (
                    <div className="text-xs text-[var(--color-text-muted)]">
                      RSVP deadline: <span className={cn("font-medium", rsvpClosed ? "text-red-500" : "text-[var(--color-text)]")}>{formatDeadline(sub.rsvp_deadline)}</span>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Edit Event" : "Add Event"}>
        <div className="space-y-4">
          <FormField label="Event Name" hint="e.g. Ceremony, Reception, Rehearsal Dinner">
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Enter event name"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Date">
              <DatePicker
                value={form.date}
                onChange={(v) => setForm({ ...form, date: v })}
                placeholder="Select date"
              />
            </FormField>
            <FormField label="Time">
              <TimePicker
                value={form.time}
                onChange={(v) => setForm({ ...form, time: v })}
                placeholder="Select time"
              />
            </FormField>
          </div>

          <FormField label="Venue">
            <Input
              value={form.venue}
              onChange={(e) => setForm({ ...form, venue: e.target.value })}
              placeholder="e.g. Grand Ballroom"
            />
          </FormField>

          <FormField label="Address">
            <Input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="e.g. 123 Main St, City, State"
            />
          </FormField>

          <FormField label="Description">
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Additional details about this event..."
              rows={3}
            />
          </FormField>

          <FormField label="Dress Code">
            <Input
              value={form.dress_code}
              onChange={(e) => setForm({ ...form, dress_code: e.target.value })}
              placeholder="e.g. Black Tie, Cocktail, Casual"
            />
          </FormField>

          <FormField label="RSVP Deadline">
            <Input
              type="datetime-local"
              value={form.rsvp_deadline}
              onChange={(e) => setForm({ ...form, rsvp_deadline: e.target.value })}
            />
          </FormField>

          <div className="flex items-center justify-between pt-2">
            <Toggle
              checked={form.rsvp_enabled}
              onChange={(v) => setForm({ ...form, rsvp_enabled: v })}
              label="RSVP enabled (visible to guests)"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              loading={createMutation.isPending || updateMutation.isPending}
            >
              {editingId ? "Save Changes" : "Create Event"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Event">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
            <p className="text-sm text-[var(--color-text)]">
              Are you sure you want to delete <span className="font-medium">"{deleteTarget?.name}"</span>?
              This will also remove all RSVPs associated with this event. This action cannot be undone.
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button
              variant="danger"
              loading={deleteMutation.isPending}
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* Toast */}
      {toast && <Toast message={toast} type={toastType} onClose={() => setToast(null)} />}
    </div>
  );
}

export default EventsPage;
