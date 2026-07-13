import { useState } from "react";
import { useParams, useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type EventRsvp } from "../../lib/supabase";
import { formatDate, formatTime, isRsvpClosed, getRsvpStatus, formatDeadline, toDatetimeLocal, fromDatetimeLocal } from "../../lib/utils";
import { Button } from "../../components/ui/Button";
import {
  Card,
  Badge,
  EmptyState,
  FormField,
  Toast,
  ErrorState,
  Skeleton,
} from "../../components/ui";
import { Input } from "../../components/ui/Input";
import {
  CalendarCheck,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Save,
} from "lucide-react";

export default function RsvpPage() {
  const { eventId } = useParams();
  const { event } = useOutletContext<{ event: UserEvent }>();
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<string | null>(null);
  const [toastError, setToastError] = useState<string | null>(null);

  const currentDeadline = event.draft_rsvp_deadline || event.rsvp_deadline;
  const [deadlineLocal, setDeadlineLocal] = useState(
    toDatetimeLocal(currentDeadline)
  );

  const { data: rsvps, isLoading, error } = useQuery({
    queryKey: ["rsvps", eventId],
    queryFn: async () => {
      if (!eventId) return [];
      const { data, error } = await supabase
        .from("event_rsvps")
        .select("*")
        .eq("event_id", eventId)
        .order("submitted_at", { ascending: false });
      if (error) throw error;
      return (data || []) as EventRsvp[];
    },
    enabled: !!eventId,
  });

  const deadlineMutation = useMutation({
    mutationFn: async (isoDeadline: string | null) => {
      if (!eventId) return;
      const { error } = await supabase
        .from("user_events")
        .update({
          draft_rsvp_deadline: isoDeadline,
          updated_at: new Date().toISOString(),
        })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      setToast("RSVP deadline updated");
    },
    onError: (err: Error) => setToastError(err.message),
  });

  const handleDeadlineSave = () => {
    const iso = deadlineLocal ? fromDatetimeLocal(deadlineLocal) : null;
    deadlineMutation.mutate(iso);
  };

  const attending = (rsvps || []).filter((r) => r.status === "attending");
  const declined = (rsvps || []).filter((r) => r.status === "declined");
  const pending = (rsvps || []).filter((r) => r.status === "pending");

  const rsvpClosed = isRsvpClosed(currentDeadline);
  const rsvpStatus = getRsvpStatus(currentDeadline);

  const statusBadge = (status: EventRsvp["status"]) => {
    if (status === "attending") return <Badge variant="success">{status}</Badge>;
    if (status === "declined") return <Badge variant="error">{status}</Badge>;
    return <Badge variant="default">{status}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8">
        <Skeleton className="h-12 w-48 mb-4" />
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 lg:p-8">
        <ErrorState message={error.message} onRetry={() => queryClient.invalidateQueries({ queryKey: ["rsvps", eventId] })} />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h2 className="font-heading text-2xl text-[var(--color-text)] mb-1">RSVP Management</h2>
        <p className="text-sm text-[var(--color-text-muted)]">
          Track responses and manage your RSVP deadline.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center bg-blue-50" style={{ borderRadius: "var(--radius)" }}>
              <CalendarCheck className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-heading text-[var(--color-text)]">{rsvps?.length || 0}</p>
              <p className="text-xs uppercase tracking-wider text-[var(--color-text-muted)]">Total RSVPs</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center bg-green-50" style={{ borderRadius: "var(--radius)" }}>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-heading text-[var(--color-text)]">{attending.length}</p>
              <p className="text-xs uppercase tracking-wider text-[var(--color-text-muted)]">Attending</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center bg-red-50" style={{ borderRadius: "var(--radius)" }}>
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-heading text-[var(--color-text)]">{declined.length}</p>
              <p className="text-xs uppercase tracking-wider text-[var(--color-text-muted)]">Declined</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center bg-amber-50" style={{ borderRadius: "var(--radius)" }}>
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-heading text-[var(--color-text)]">{pending.length}</p>
              <p className="text-xs uppercase tracking-wider text-[var(--color-text-muted)]">Pending</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Deadline */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
            RSVP Deadline
          </h3>
          {rsvpStatus !== "no-deadline" && (
            <Badge variant={rsvpClosed ? "error" : rsvpStatus === "closing-soon" ? "warning" : "success"}>
              {rsvpClosed ? "Closed" : rsvpStatus === "closing-soon" ? "Closing Soon" : "Open"}
            </Badge>
          )}
        </div>
        {currentDeadline && (
          <p className="text-sm text-[var(--color-text-muted)]">
            Current deadline: {formatDeadline(currentDeadline)}
          </p>
        )}
        <div className="flex items-end gap-3 flex-wrap">
          <FormField label="Set Deadline">
            <Input
              type="datetime-local"
              value={deadlineLocal}
              onChange={(e) => setDeadlineLocal(e.target.value)}
            />
          </FormField>
          <Button
            onClick={handleDeadlineSave}
            loading={deadlineMutation.isPending}
            size="md"
          >
            <Save className="w-4 h-4" /> Save
          </Button>
        </div>
        {rsvpClosed && (
          <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 px-3 py-2" style={{ borderRadius: "var(--radius)" }}>
            <AlertCircle className="w-4 h-4" />
            RSVP is closed. Guests can no longer submit responses.
          </div>
        )}
      </Card>

      {/* RSVP Table */}
      {(rsvps || []).length === 0 ? (
        <Card>
          <EmptyState
            icon={<CalendarCheck className="w-12 h-12" />}
            title="No RSVPs yet"
            description="RSVP responses will appear here once guests start responding."
          />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-subtle)]">
                  <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">Guest</th>
                  <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">Status</th>
                  <th className="text-center px-4 py-3 text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">+1s</th>
                  <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">Dietary</th>
                  <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">Message</th>
                  <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {rsvps!.map((rsvp) => (
                  <tr
                    key={rsvp.id}
                    className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-bg-subtle)] transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-[var(--color-text)] font-medium">{rsvp.guest_name}</td>
                    <td className="px-4 py-3">{statusBadge(rsvp.status)}</td>
                    <td className="px-4 py-3 text-sm text-center text-[var(--color-text-muted)]">{rsvp.plus_ones}</td>
                    <td className="px-4 py-3 text-sm text-[var(--color-text-muted)] max-w-[200px] truncate">{rsvp.dietary || "—"}</td>
                    <td className="px-4 py-3 text-sm text-[var(--color-text-muted)] max-w-[200px] truncate">{rsvp.message || "—"}</td>
                    <td className="px-4 py-3 text-sm text-[var(--color-text-muted)] whitespace-nowrap">
                      {rsvp.submitted_at ? formatDate(rsvp.submitted_at) : "—"}
                      {rsvp.submitted_at && <span className="block text-xs">{formatTime(rsvp.submitted_at.split("T")[1] || null)}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      {toastError && <Toast message={toastError} type="error" onClose={() => setToastError(null)} />}
    </div>
  );
}
