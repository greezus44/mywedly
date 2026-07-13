import { useState, useMemo } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, UserEvent, EventRsvp } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Card, Badge, Modal, FormField, Toast, Skeleton, ErrorState, EmptyState, Select } from "../../components/ui/index";
import { cn, formatDate, formatTime, getRsvpStatus, formatDeadline } from "../../lib/utils";
import { Check, X, Clock, Download, Calendar } from "lucide-react";

type StatusFilter = "all" | "attending" | "declined" | "pending";

export default function RsvpPage() {
  const { event } = useOutletContext<{ event: UserEvent | null }>();
  const { eventId } = useParams<{ eventId: string }>();
  const queryClient = useQueryClient();

  const [toast, setToast] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [editingRsvp, setEditingRsvp] = useState<EventRsvp | null>(null);
  const [editStatus, setEditStatus] = useState<string>("");

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast(msg);
    setToastType(type);
    setTimeout(() => setToast(null), 3000);
  };

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

  const updateStatusMutation = useMutation<void, Error>({
    mutationFn: async () => {
      if (!editingRsvp) return;
      const { error } = await supabase
        .from("event_rsvps")
        .update({ status: editStatus })
        .eq("id", editingRsvp.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rsvps", eventId] });
      setEditingRsvp(null);
      showToast("RSVP status updated");
    },
    onError: () => showToast("Failed to update RSVP", "error"),
  });

  const filtered = useMemo(() => {
    if (!rsvps) return [];
    if (statusFilter === "all") return rsvps;
    return rsvps.filter((r) => r.status === statusFilter);
  }, [rsvps, statusFilter]);

  const summary = useMemo(() => {
    if (!rsvps) return { total: 0, attending: 0, declined: 0, pending: 0 };
    return {
      total: rsvps.length,
      attending: rsvps.filter((r) => r.status === "attending").length,
      declined: rsvps.filter((r) => r.status === "declined").length,
      pending: rsvps.filter((r) => r.status === "maybe").length,
    };
  }, [rsvps]);

  const rsvpStatus = getRsvpStatus(event?.rsvp_deadline || event?.draft_rsvp_deadline || null);

  const exportCsv = () => {
    if (!rsvps || rsvps.length === 0) {
      showToast("No RSVPs to export", "error");
      return;
    }
    const headers = ["Guest Name", "Status", "Plus Ones", "Dietary", "Message", "Submitted At"];
    const rows = rsvps.map((r) => [
      r.guest_name || "",
      r.status || "",
      r.plus_ones || 0,
      r.dietary || "",
      r.message || "",
      r.submitted_at ? formatDate(r.submitted_at) + " " + formatTime(r.submitted_at.split("T")[1]?.split("Z")[0] || null) : "",
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `rsvps-${eventId}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast("CSV exported");
  };

  const openEdit = (r: EventRsvp) => {
    setEditingRsvp(r);
    setEditStatus(r.status || "pending");
  };

  const handleSubmitStatus = () => {
    updateStatusMutation.mutate();
  };

  if (!event) {
    return (
      <div className="flex items-center justify-center py-16">
        <Skeleton className="w-full h-32" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">RSVPs</h1>
          <p className="text-sm text-gray-500 mt-0.5">View and manage RSVP responses</p>
        </div>
        <Button variant="secondary" size="sm" onClick={exportCsv}>
          <Download className="w-4 h-4" /> Export
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">RSVP Deadline</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">
              {event.rsvp_deadline || event.draft_rsvp_deadline
                ? formatDeadline(event.rsvp_deadline || event.draft_rsvp_deadline || null)
                : "No deadline set"}
            </span>
            {rsvpStatus === "open" && <Badge variant="success">Open</Badge>}
            {rsvpStatus === "closing-soon" && <Badge variant="warning">Closing Soon</Badge>}
            {rsvpStatus === "closed" && <Badge variant="error">Closed</Badge>}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard label="Total RSVPs" value={summary.total} />
        <SummaryCard label="Attending" value={summary.attending} color="text-green-600" icon={<Check className="w-4 h-4" />} />
        <SummaryCard label="Declined" value={summary.declined} color="text-red-600" icon={<X className="w-4 h-4" />} />
        <SummaryCard label="Pending" value={summary.pending} color="text-yellow-600" icon={<Clock className="w-4 h-4" />} />
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-sm font-medium text-gray-700">Filter:</span>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)} className="w-40">
            <option value="all">All</option>
            <option value="attending">Attending</option>
            <option value="declined">Declined</option>
            <option value="pending">Pending</option>
          </Select>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : isError ? (
          <ErrorState message="Failed to load RSVPs" onRetry={() => refetch()} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Calendar className="w-12 h-12" />}
            title="No RSVPs yet"
            description="RSVP responses will appear here once guests submit them"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-medium text-gray-500 px-3 py-2">Guest Name</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-3 py-2">Status</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-3 py-2">Plus Ones</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-3 py-2">Dietary</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-3 py-2">Message</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-3 py-2">Submitted At</th>
                  <th className="text-right text-xs font-medium text-gray-500 px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-3 py-3 text-sm font-medium text-gray-900">{r.guest_name}</td>
                    <td className="px-3 py-3">
                      {r.status === "attending" && <Badge variant="success">Attending</Badge>}
                      {r.status === "declined" && <Badge variant="error">Declined</Badge>}
                      {(r.status === "maybe") && <Badge variant="warning">Pending</Badge>}
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-600">{r.plus_ones || 0}</td>
                    <td className="px-3 py-3 text-sm text-gray-600 max-w-32 truncate" title={r.dietary || ""}>{r.dietary || "—"}</td>
                    <td className="px-3 py-3 text-sm text-gray-600 max-w-48 truncate" title={r.message || ""}>{r.message || "—"}</td>
                    <td className="px-3 py-3 text-sm text-gray-500">
                      {r.submitted_at ? formatDate(r.submitted_at) : "—"}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(r)}>Edit</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={!!editingRsvp} onClose={() => setEditingRsvp(null)} title="Edit RSVP Status" maxWidth="max-w-sm">
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-900">{editingRsvp?.guest_name}</p>
            <p className="text-xs text-gray-500 mt-0.5">Current status: {editingRsvp?.status}</p>
          </div>
          <FormField label="Status">
            <Select value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
              <option value="attending">Attending</option>
              <option value="declined">Declined</option>
              <option value="pending">Pending</option>
            </Select>
          </FormField>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setEditingRsvp(null)}>Cancel</Button>
            <Button onClick={handleSubmitStatus} loading={updateStatusMutation.isPending}>Save</Button>
          </div>
        </div>
      </Modal>

      {toast && <Toast message={toast} type={toastType} onClose={() => setToast(null)} />}
    </div>
  );
}

function SummaryCard({ label, value, color, icon }: { label: string; value: number; color?: string; icon?: React.ReactNode }) {
  return (
    <Card className="p-4">
      {icon && <div className="flex items-center gap-2 text-gray-400 mb-2">{icon}<span className="text-xs font-medium text-gray-500">{label}</span></div>}
      {!icon && <div className="text-xs font-medium text-gray-500 mb-2">{label}</div>}
      <p className={cn("text-2xl font-bold", color || "text-gray-900")}>{value}</p>
    </Card>
  );
}
