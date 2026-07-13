import { useState, useMemo } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type EventRsvp } from "../../lib/supabase";
import { getRsvpStatus, formatDeadline, formatDate, formatTime } from "../../lib/utils";
import { Card, Badge, EmptyState, ErrorState, Skeleton, Toast, Modal, FormField } from "../../components/ui";
import { Button } from "../../components/ui/Button";
import { Select } from "../../components/ui/Input";
import { Mail, Download, Clock, Calendar, CheckCircle, XCircle, HelpCircle } from "lucide-react";

type StatusFilter = "all" | EventRsvp["status"];

function downloadCsv(filename: string, rows: EventRsvp[]) {
  const headers = ["Guest Name", "Status", "Plus Ones", "Dietary", "Message", "Submitted At"];
  const csv = [headers, ...rows.map((r) => [r.guest_name, r.status, String(r.plus_ones), r.dietary, r.message, new Date(r.submitted_at).toISOString()])]
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function RsvpPage() {
  const { event } = useOutletContext<{ event: UserEvent | null }>();
  const { eventId } = useParams<{ eventId: string }>();
  const queryClient = useQueryClient();

  const [filter, setFilter] = useState<StatusFilter>("all");
  const [editRsvp, setEditRsvp] = useState<EventRsvp | null>(null);
  const [editStatus, setEditStatus] = useState<EventRsvp["status"]>("pending");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const { data: rsvps, isLoading, isError, refetch } = useQuery({
    queryKey: ["rsvps", eventId],
    queryFn: async () => {
      if (!eventId) return [];
      const { data, error } = await supabase.from("event_rsvps").select("*").eq("event_id", eventId).order("submitted_at", { ascending: false });
      if (error) throw error;
      return data as EventRsvp[];
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
      setEditRsvp(null);
      setToast({ message: "RSVP status updated", type: "success" });
    },
    onError: (err) => setToast({ message: err.message, type: "error" }),
  });

  const summary = useMemo(() => {
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

  const rsvpDeadlineStatus = getRsvpStatus(event?.draft_rsvp_deadline || event?.rsvp_deadline || null);

  const openEdit = (rsvp: EventRsvp) => {
    setEditRsvp(rsvp);
    setEditStatus(rsvp.status);
  };

  const handleUpdateStatus = () => {
    if (editRsvp) updateStatusMutation.mutate({ id: editRsvp.id, status: editStatus });
  };

  if (!event) {
    return (
      <div className="p-6">
        <Skeleton className="h-8 w-48 mb-4" />
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const statusIcon = (status: string) => {
    if (status === "attending") return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (status === "declined") return <XCircle className="w-4 h-4 text-red-600" />;
    return <HelpCircle className="w-4 h-4 text-amber-600" />;
  };

  const statusBadge = (status: string) => {
    const variant = status === "attending" ? "success" : status === "declined" ? "error" : "warning";
    return <Badge variant={variant as "success" | "error" | "warning"}>{status}</Badge>;
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">RSVP Management</h1>
          <p className="text-sm text-slate-500">View and manage RSVP responses</p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => rsvps && downloadCsv(`rsvps-${event.draft_name || event.name}.csv`, rsvps)} disabled={!rsvps || rsvps.length === 0}>
          <Download className="w-4 h-4" /> Export
        </Button>
      </div>

      {rsvpDeadlineStatus !== "no-deadline" && (
        <Card className="p-4 mb-4">
          <div className="flex items-center gap-3">
            <Clock className={`w-5 h-5 ${rsvpDeadlineStatus === "closed" ? "text-red-600" : rsvpDeadlineStatus === "closing-soon" ? "text-amber-600" : "text-green-600"}`} />
            <div>
              <p className="text-sm font-medium text-slate-900">
                RSVP {rsvpDeadlineStatus === "closed" ? "Closed" : rsvpDeadlineStatus === "closing-soon" ? "Closing Soon" : "Open"}
              </p>
              <p className="text-xs text-slate-500">
                Deadline: {formatDeadline(event.draft_rsvp_deadline || event.rsvp_deadline || null)}
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <p className="text-xs font-medium text-slate-500 mb-1">Total RSVPs</p>
          <p className="text-2xl font-bold text-slate-900">{summary.total}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-green-600 mb-1">Attending</p>
          <p className="text-2xl font-bold text-green-600">{summary.attending}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-red-600 mb-1">Declined</p>
          <p className="text-2xl font-bold text-red-600">{summary.declined}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-amber-600 mb-1">Pending</p>
          <p className="text-2xl font-bold text-amber-600">{summary.pending}</p>
        </Card>
      </div>

      <Card className="p-4 mb-4">
        <FormField label="Filter by Status">
          <Select value={filter} onChange={(e) => setFilter(e.target.value as StatusFilter)}>
            <option value="all">All ({summary.total})</option>
            <option value="attending">Attending ({summary.attending})</option>
            <option value="declined">Declined ({summary.declined})</option>
            <option value="pending">Pending ({summary.pending})</option>
          </Select>
        </FormField>
      </Card>

      <Card>
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : isError ? (
          <ErrorState message="Failed to load RSVPs" onRetry={() => refetch()} />
        ) : filtered.length === 0 ? (
          <EmptyState icon={<Mail className="w-12 h-12" />} title={filter !== "all" ? `No ${filter} RSVPs` : "No RSVPs yet"} description="RSVP responses will appear here once guests submit them" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Guest</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Plus Ones</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Dietary</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Message</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Submitted</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">{r.guest_name}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {statusIcon(r.status)}
                        {statusBadge(r.status)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{r.plus_ones}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 max-w-[150px] truncate" title={r.dietary}>{r.dietary || "—"}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 max-w-[200px] truncate" title={r.message}>{r.message || "—"}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      <div className="flex flex-col">
                        <span>{formatDate(r.submitted_at)}</span>
                        <span>{formatTime(r.submitted_at.split("T")[1] || null)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(r)}>Edit</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={!!editRsvp} onClose={() => setEditRsvp(null)} title="Edit RSVP Status">
        {editRsvp && (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-slate-500">Guest</p>
              <p className="text-sm font-medium text-slate-900">{editRsvp.guest_name}</p>
            </div>
            <FormField label="Status">
              <Select value={editStatus} onChange={(e) => setEditStatus(e.target.value as EventRsvp["status"])}>
                <option value="attending">Attending</option>
                <option value="declined">Declined</option>
                <option value="pending">Pending</option>
              </Select>
            </FormField>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setEditRsvp(null)}>Cancel</Button>
              <Button onClick={handleUpdateStatus} loading={updateStatusMutation.isPending}>Save</Button>
            </div>
          </div>
        )}
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
