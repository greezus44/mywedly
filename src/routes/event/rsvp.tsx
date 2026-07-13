import { useState, useMemo } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type EventRsvp } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Select } from "../../components/ui/Input";
import { Card, Badge, FormField, Toast, Skeleton, ErrorState, EmptyState } from "../../components/ui";
import { Download, Mail, Check, X, Clock, CalendarClock } from "lucide-react";
import { getRsvpStatus, formatDeadline } from "../../lib/utils";

type StatusFilter = "all" | "attending" | "declined" | "pending";

export default function RsvpPage() {
  const { event } = useOutletContext<{ event: UserEvent | null }>();
  const { eventId } = useParams<{ eventId: string }>();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const { data: rsvps, isLoading, isError, refetch } = useQuery<EventRsvp[]>({
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

  const updateStatusMutation = useMutation<void, Error, { id: string; status: EventRsvp["status"] }>({
    mutationFn: async ({ id, status }) => {
      const { error } = await supabase.from("event_rsvps").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rsvps", eventId] });
      setToast({ message: "Status updated", type: "success" });
    },
    onError: () => setToast({ message: "Failed to update status", type: "error" }),
  });

  const counts = useMemo(() => {
    if (!rsvps) return { total: 0, attending: 0, declined: 0, pending: 0 };
    return {
      total: rsvps.length,
      attending: rsvps.filter((r) => r.status === "attending").length,
      declined: rsvps.filter((r) => r.status === "declined").length,
      pending: rsvps.filter((r) => r.status === "pending").length,
    };
  }, [rsvps]);

  const filtered = useMemo(() => {
    if (!rsvps) return [];
    if (filter === "all") return rsvps;
    return rsvps.filter((r) => r.status === filter);
  }, [rsvps, filter]);

  const deadlineStatus = getRsvpStatus(event?.draft_rsvp_deadline || event?.rsvp_deadline || null);

  const handleExport = () => {
    if (!rsvps || rsvps.length === 0) return;
    const headers = ["guest_name", "status", "plus_ones", "dietary", "message", "submitted_at"];
    const rows = rsvps.map((r) =>
      [r.guest_name, r.status, r.plus_ones, r.dietary || "", r.message || "", r.submitted_at]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `rsvps-${eventId}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!event) return <div className="p-6"><Skeleton className="h-8 w-48 mb-4" /><Skeleton className="h-96 w-full" /></div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-slate-900">RSVPs</h1>
        <Button variant="secondary" size="sm" onClick={handleExport} disabled={!rsvps || rsvps.length === 0}>
          <Download className="w-4 h-4" /> Export
        </Button>
      </div>

      <Card className="p-4 mb-6">
        <div className="flex items-center gap-3">
          <CalendarClock className="w-5 h-5 text-slate-400" />
          <div>
            <div className="text-sm font-medium text-slate-900">RSVP Deadline</div>
            <div className="text-xs text-slate-500">{formatDeadline(event?.draft_rsvp_deadline || event?.rsvp_deadline || null) || "No deadline set"}</div>
          </div>
          <span className={`ml-auto inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${deadlineStatus === "open" ? "bg-green-100 text-green-700" : deadlineStatus === "closing-soon" ? "bg-amber-100 text-amber-700" : deadlineStatus === "closed" ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-700"}`}>
            {deadlineStatus.replace("-", " ")}
          </span>
        </div>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <SummaryCard icon={<Mail className="w-5 h-5" />} label="Total" value={counts.total} color="text-slate-900" bg="bg-slate-50" />
        <SummaryCard icon={<Check className="w-5 h-5" />} label="Attending" value={counts.attending} color="text-green-700" bg="bg-green-50" />
        <SummaryCard icon={<X className="w-5 h-5" />} label="Declined" value={counts.declined} color="text-red-700" bg="bg-red-50" />
        <SummaryCard icon={<Clock className="w-5 h-5" />} label="Pending" value={counts.pending} color="text-amber-700" bg="bg-amber-50" />
      </div>

      <Card className="p-4 mb-4">
        <FormField label="Filter by Status">
          <Select value={filter} onChange={(e) => setFilter(e.target.value as StatusFilter)}>
            <option value="all">All ({counts.total})</option>
            <option value="attending">Attending ({counts.attending})</option>
            <option value="declined">Declined ({counts.declined})</option>
            <option value="pending">Pending ({counts.pending})</option>
          </Select>
        </FormField>
      </Card>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : isError ? (
          <ErrorState message="Failed to load RSVPs" onRetry={() => refetch()} />
        ) : filtered.length === 0 ? (
          <EmptyState icon={<Mail className="w-12 h-12" />} title="No RSVPs yet" description="RSVP submissions will appear here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Guest</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Plus Ones</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Dietary</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Message</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-medium text-slate-900">{r.guest_name}</td>
                    <td className="px-4 py-3">
                      <Select
                        value={r.status}
                        onChange={(e) => updateStatusMutation.mutate({ id: r.id, status: e.target.value as EventRsvp["status"] })}
                        className="w-32"
                      >
                        <option value="attending">Attending</option>
                        <option value="declined">Declined</option>
                        <option value="pending">Pending</option>
                      </Select>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{r.plus_ones}</td>
                    <td className="px-4 py-3 text-slate-600 max-w-[150px] truncate">{r.dietary || "—"}</td>
                    <td className="px-4 py-3 text-slate-600 max-w-[200px] truncate">{r.message || "—"}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{new Date(r.submitted_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

function SummaryCard({ icon, label, value, color, bg }: { icon: React.ReactNode; label: string; value: number; color: string; bg: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${bg} ${color}`}>{icon}</div>
        <div>
          <div className="text-2xl font-bold text-slate-900">{value}</div>
          <div className="text-xs text-slate-500">{label}</div>
        </div>
      </div>
    </Card>
  );
}
