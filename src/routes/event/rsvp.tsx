import { useState, useMemo } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type EventRsvp } from "../../lib/supabase";
import { Card, Badge, EmptyState, ErrorState, Skeleton, Toast, Modal } from "../../components/ui";
import { Button } from "../../components/ui/Button";
import { Select } from "../../components/ui/Input";
import {
  CheckCircle, XCircle, Clock, Download, Pencil, Loader2, MailOpen,
} from "lucide-react";
import { getRsvpStatus, formatDeadline, formatDate } from "../../lib/utils";

type StatusFilter = "all" | "attending" | "declined" | "pending";

export default function Rsvp() {
  const { event } = useOutletContext<{ event: UserEvent | null }>();
  const { eventId } = useParams<{ eventId: string }>();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<"attending" | "declined" | "pending">("pending");

  const { data: rsvps, isLoading, error, refetch } = useQuery<EventRsvp[], Error>({
    queryKey: ["rsvps", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_rsvps")
        .select("*")
        .eq("event_id", eventId!)
        .order("submitted_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!eventId,
  });

  const counts = useMemo(() => {
    const total = rsvps?.length || 0;
    const attending = rsvps?.filter((r) => r.status === "attending").length || 0;
    const declined = rsvps?.filter((r) => r.status === "declined").length || 0;
    const pending = rsvps?.filter((r) => r.status === "pending").length || 0;
    return { total, attending, declined, pending };
  }, [rsvps]);

  const filtered = useMemo(() => {
    if (!rsvps) return [];
    if (filter === "all") return rsvps;
    return rsvps.filter((r) => r.status === filter);
  }, [rsvps, filter]);

  const updateStatusMutation = useMutation<void, Error, { id: string; status: string }>({
    mutationFn: async ({ id, status }) => {
      const { error } = await supabase.from("event_rsvps").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rsvps", eventId] });
      setEditingId(null);
      setToast({ message: "RSVP updated", type: "success" });
    },
    onError: () => setToast({ message: "Failed to update RSVP", type: "error" }),
  });

  const handleExport = () => {
    if (!rsvps || rsvps.length === 0) return;
    const headers = ["guest_name", "status", "plus_ones", "dietary", "message", "submitted_at"];
    const rows = rsvps.map((r) =>
      [r.guest_name, r.status, r.plus_ones, r.dietary, r.message, r.submitted_at]
        .map((v) => `"${String(v || "").replace(/"/g, '""')}"`)
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

  const deadline = event?.draft_rsvp_deadline || event?.rsvp_deadline || null;
  const rsvpStatus = getRsvpStatus(deadline);

  const statusBadge = (status: string) => {
    if (status === "attending") return <Badge variant="success"><CheckCircle className="w-3 h-3 mr-1" />Attending</Badge>;
    if (status === "declined") return <Badge variant="error"><XCircle className="w-3 h-3 mr-1" />Declined</Badge>;
    return <Badge variant="warning"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
  };

  if (!event) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">RSVP Management</h1>
          <p className="text-sm text-slate-500">View and manage RSVP responses.</p>
        </div>
        <Button variant="secondary" size="sm" onClick={handleExport} disabled={!rsvps || rsvps.length === 0}>
          <Download className="w-4 h-4" /> Export
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Card className="p-4">
          <div className="text-xs text-slate-400 mb-1">Total RSVPs</div>
          <div className="text-2xl font-bold text-slate-900">{counts.total}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-slate-400 mb-1">Attending</div>
          <div className="text-2xl font-bold text-green-600">{counts.attending}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-slate-400 mb-1">Declined</div>
          <div className="text-2xl font-bold text-red-600">{counts.declined}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-slate-400 mb-1">Pending</div>
          <div className="text-2xl font-bold text-amber-600">{counts.pending}</div>
        </Card>
      </div>

      {deadline && (
        <Card className="p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400 mb-1">RSVP Deadline</div>
              <div className="text-sm font-medium text-slate-900">{formatDeadline(deadline)}</div>
            </div>
            <div>
              {rsvpStatus === "open" && <Badge variant="success">Open</Badge>}
              {rsvpStatus === "closing-soon" && <Badge variant="warning">Closing Soon</Badge>}
              {rsvpStatus === "closed" && <Badge variant="error">Closed</Badge>}
              {rsvpStatus === "no-deadline" && <Badge variant="default">No Deadline</Badge>}
            </div>
          </div>
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center gap-2">
          {(["all", "attending", "declined", "pending"] as StatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 text-sm rounded-lg capitalize transition-colors ${
                filter === s ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="p-4 space-y-3">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : (error as any) ? (
          <ErrorState message={(error as any).message || "Failed to load RSVPs"} onRetry={() => refetch()} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<MailOpen className="w-10 h-10" />}
            title="No RSVPs"
            description={filter !== "all" ? `No ${filter} responses yet.` : "No RSVP responses yet."}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Guest</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">+1s</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Dietary</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Message</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Submitted</th>
                  <th className="px-4 py-3 text-right font-medium text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{r.guest_name || "—"}</td>
                    <td className="px-4 py-3">{statusBadge(r.status)}</td>
                    <td className="px-4 py-3 text-slate-600">{r.plus_ones}</td>
                    <td className="px-4 py-3 text-slate-600 max-w-[150px] truncate">{r.dietary || "—"}</td>
                    <td className="px-4 py-3 text-slate-600 max-w-[200px] truncate">{r.message || "—"}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{formatDate(r.submitted_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => { setEditingId(r.id); setEditStatus(r.status); }}
                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={!!editingId} onClose={() => setEditingId(null)} title="Edit RSVP Status">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
            <Select value={editStatus} onChange={(e) => setEditStatus(e.target.value as any)}>
              <option value="attending">Attending</option>
              <option value="declined">Declined</option>
              <option value="pending">Pending</option>
            </Select>
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setEditingId(null)}>Cancel</Button>
            <Button
              onClick={() => editingId && updateStatusMutation.mutate({ id: editingId, status: editStatus })}
              loading={updateStatusMutation.isPending}
            >
              Save
            </Button>
          </div>
        </div>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
