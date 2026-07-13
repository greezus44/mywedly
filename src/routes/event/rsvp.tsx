import { useState, useMemo } from "react";
import { useParams, useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type EventRsvp } from "../../lib/supabase";
import { formatDate, isRsvpClosed, getRsvpStatus, formatDeadline, toDatetimeLocal, fromDatetimeLocal } from "../../lib/utils";
import { Button } from "../../components/ui/Button";
import { Card, Badge, EmptyState, FormField, Toast, ErrorState, Skeleton } from "../../components/ui";
import { Input } from "../../components/ui/Input";
import { CalendarCheck, Clock, Users, Check, X } from "lucide-react";

function RsvpPage() {
  const { eventId } = useParams();
  const { event } = useOutletContext<{ event: UserEvent }>();
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [deadlineLocal, setDeadlineLocal] = useState(
    toDatetimeLocal(event.draft_rsvp_deadline || event.rsvp_deadline || null)
  );

  const { data: rsvps, isLoading, error } = useQuery({
    queryKey: ["rsvps", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_rsvps")
        .select("*")
        .eq("event_id", eventId)
        .order("submitted_at", { ascending: false });
      if (error) throw error;
      return data as EventRsvp[];
    },
  });

  const deadlineMutation = useMutation({
    mutationFn: async (deadline: string | null) => {
      const { error } = await supabase
        .from("user_events")
        .update({ draft_rsvp_deadline: deadline, updated_at: new Date().toISOString() })
        .eq("id", eventId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      setToastType("success");
      setToast("RSVP deadline updated");
    },
    onError: (err: Error) => {
      setToastType("error");
      setToast(`Failed to update deadline: ${err.message}`);
    },
  });

  const handleDeadlineChange = (localStr: string) => {
    setDeadlineLocal(localStr);
    const iso = localStr ? fromDatetimeLocal(localStr) : null;
    deadlineMutation.mutate(iso);
  };

  const stats = useMemo(() => {
    if (!rsvps) return { total: 0, attending: 0, declined: 0, totalPlusOnes: 0 };
    const attending = rsvps.filter((r) => r.status === "attending");
    const declined = rsvps.filter((r) => r.status === "declined");
    return {
      total: rsvps.length,
      attending: attending.length,
      declined: declined.length,
      totalPlusOnes: attending.reduce((sum, r) => sum + (r.plus_ones || 0), 0),
    };
  }, [rsvps]);

  const rsvpStatus = getRsvpStatus(event.draft_rsvp_deadline || event.rsvp_deadline || null);
  const closed = isRsvpClosed(event.draft_rsvp_deadline || event.rsvp_deadline || null);

  const statusBadge = (status: string) => {
    if (status === "attending") return <Badge variant="success">Attending</Badge>;
    if (status === "declined") return <Badge variant="error">Declined</Badge>;
    return <Badge variant="warning">Pending</Badge>;
  };

  const statusColor = (s: string) => {
    if (s === "open") return "success";
    if (s === "closing-soon") return "warning";
    if (s === "closed") return "error";
    return "default";
  };

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h2 className="font-heading text-2xl text-[var(--color-text)]">RSVP Management</h2>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">Track responses and manage your RSVP deadline</p>
      </div>

      {/* RSVP Status & Deadline */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">RSVP Status</h3>
            <Badge variant={statusColor(rsvpStatus) as "success" | "warning" | "error" | "default"}>
              {rsvpStatus === "no-deadline" ? "No Deadline" : rsvpStatus.replace("-", " ")}
            </Badge>
          </div>
          {event.draft_rsvp_deadline || event.rsvp_deadline ? (
            <p className="text-sm text-[var(--color-text)] mt-2">
              Deadline: <span className="font-medium">{formatDeadline(event.draft_rsvp_deadline || event.rsvp_deadline)}</span>
            </p>
          ) : (
            <p className="text-sm text-[var(--color-text-muted)] mt-2">No deadline set — RSVPs stay open</p>
          )}
          {closed && (
            <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3" /> RSVP is now closed
            </p>
          )}
        </Card>

        <Card className="p-5">
          <FormField label="RSVP Deadline" hint="Set when RSVP closes. Leave empty for no deadline.">
            <Input
              type="datetime-local"
              value={deadlineLocal}
              onChange={(e) => handleDeadlineChange(e.target.value)}
            />
          </FormField>
        </Card>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Responses", value: stats.total, icon: Users, color: "var(--color-text)" },
          { label: "Attending", value: stats.attending, icon: Check, color: "#16a34a" },
          { label: "Declined", value: stats.declined, icon: X, color: "#dc2626" },
          { label: "Total Plus Ones", value: stats.totalPlusOnes, icon: Users, color: "var(--color-text-muted)" },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <s.icon className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
              <p className="text-xs uppercase tracking-wider text-[var(--color-text-muted)]">{s.label}</p>
            </div>
            <p className="text-2xl font-heading" style={{ color: s.color }}>{s.value}</p>
          </Card>
        ))}
      </div>

      {/* RSVP Table */}
      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : error ? (
          <ErrorState message={error.message} onRetry={() => queryClient.invalidateQueries({ queryKey: ["rsvps", eventId] })} />
        ) : !rsvps || rsvps.length === 0 ? (
          <EmptyState
            icon={<CalendarCheck className="w-12 h-12" />}
            title="No RSVPs yet"
            description="RSVP responses will appear here once guests start responding"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-subtle)]">
                  <th className="text-left text-xs uppercase tracking-wider text-[var(--color-text-muted)] px-4 py-3 font-medium">Guest</th>
                  <th className="text-left text-xs uppercase tracking-wider text-[var(--color-text-muted)] px-4 py-3 font-medium">Status</th>
                  <th className="text-left text-xs uppercase tracking-wider text-[var(--color-text-muted)] px-4 py-3 font-medium hidden md:table-cell">Plus Ones</th>
                  <th className="text-left text-xs uppercase tracking-wider text-[var(--color-text-muted)] px-4 py-3 font-medium hidden lg:table-cell">Dietary</th>
                  <th className="text-left text-xs uppercase tracking-wider text-[var(--color-text-muted)] px-4 py-3 font-medium hidden lg:table-cell">Message</th>
                  <th className="text-left text-xs uppercase tracking-wider text-[var(--color-text-muted)] px-4 py-3 font-medium hidden md:table-cell">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {rsvps.map((r) => (
                  <tr key={r.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-bg-subtle)] transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-[var(--color-text)]">{r.guest_name}</span>
                    </td>
                    <td className="px-4 py-3">{statusBadge(r.status)}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-sm text-[var(--color-text-muted)]">{r.plus_ones || 0}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-xs text-[var(--color-text-muted)]">{r.dietary || "—"}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell max-w-xs">
                      <span className="text-xs text-[var(--color-text-muted)] truncate block">{r.message || "—"}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs text-[var(--color-text-muted)]">
                        {r.submitted_at ? formatDate(r.submitted_at) : "—"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {toast && <Toast message={toast} type={toastType} onClose={() => setToast(null)} />}
    </div>
  );
}

export default RsvpPage;
