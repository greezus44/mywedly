import { useState } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type EventRsvp } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Card, Badge, EmptyState, Skeleton, ErrorState, Modal, Toast, FormField } from "../../components/ui";
import { Input, Select } from "../../components/ui/Input";
import { CalendarCheck, Check, X, Clock, Users, Mail } from "lucide-react";
import { formatDate, formatDeadline, toDatetimeLocal, fromDatetimeLocal, getRsvpStatus, isRsvpClosed } from "../../lib/utils";

interface OutletContext { event: UserEvent; }

export default function RsvpPage() {
  const { event } = useOutletContext<OutletContext>();
  const { eventId } = useParams();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showDeadline, setShowDeadline] = useState(false);
  const [deadlineValue, setDeadlineValue] = useState(
    toDatetimeLocal(event.draft_rsvp_deadline || event.rsvp_deadline)
  );
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

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

  const { data: guests } = useQuery({
    queryKey: ["guests", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_guests")
        .select("*")
        .eq("event_id", eventId);
      if (error) throw error;
      return data as { id: string; name: string; email: string; rsvp_status: string }[];
    },
  });

  const updateDeadlineMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("user_events")
        .update({
          draft_rsvp_deadline: deadlineValue ? fromDatetimeLocal(deadlineValue) : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      setShowDeadline(false);
      setToast({ msg: "RSVP deadline updated", type: "success" });
    },
    onError: (err: Error) => {
      setToast({ msg: `Failed to update deadline: ${err.message}`, type: "error" });
    },
  });

  const stats = {
    total: rsvps?.length || 0,
    attending: rsvps?.filter((r) => r.status === "attending").length || 0,
    declined: rsvps?.filter((r) => r.status === "declined").length || 0,
    pending: rsvps?.filter((r) => r.status === "pending").length || 0,
    plusOnes: rsvps?.reduce((sum, r) => sum + (r.plus_ones || 0), 0) || 0,
    noResponse: (guests?.length || 0) - (rsvps?.length || 0),
  };

  const filtered = (rsvps || []).filter((r) => {
    const q = search.toLowerCase();
    const matchesSearch = r.guest_name.toLowerCase().includes(q) || (r.message || "").toLowerCase().includes(q);
    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const rsvpStatusBadge = (status: string): "success" | "error" | "warning" => {
    if (status === "attending") return "success";
    if (status === "declined") return "error";
    return "warning";
  };

  const currentDeadline = event.draft_rsvp_deadline || event.rsvp_deadline;
  const deadlineStatus = getRsvpStatus(currentDeadline);
  const rsvpClosed = isRsvpClosed(currentDeadline);

  if (isLoading) return <div className="p-8"><Skeleton className="h-64" /></div>;
  if (error) return <ErrorState message={error.message} onRetry={() => queryClient.invalidateQueries({ queryKey: ["rsvps", eventId] })} />;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h2 className="font-heading text-2xl text-gray-900">RSVP Management</h2>
        <p className="text-sm text-gray-500 mt-1">Track responses and manage the RSVP deadline.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-gray-400 mb-1"><Users className="w-4 h-4" /></div>
          <p className="text-2xl font-heading text-gray-900">{stats.total}</p>
          <p className="text-xs text-gray-500 uppercase tracking-wider">Total Responses</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-green-600 mb-1"><Check className="w-4 h-4" /></div>
          <p className="text-2xl font-heading text-gray-900">{stats.attending}</p>
          <p className="text-xs text-gray-500 uppercase tracking-wider">Attending</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-red-600 mb-1"><X className="w-4 h-4" /></div>
          <p className="text-2xl font-heading text-gray-900">{stats.declined}</p>
          <p className="text-xs text-gray-500 uppercase tracking-wider">Declined</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-amber-600 mb-1"><Clock className="w-4 h-4" /></div>
          <p className="text-2xl font-heading text-gray-900">{stats.pending}</p>
          <p className="text-xs text-gray-500 uppercase tracking-wider">Pending</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-gray-400 mb-1"><Users className="w-4 h-4" /></div>
          <p className="text-2xl font-heading text-gray-900">{stats.plusOnes}</p>
          <p className="text-xs text-gray-500 uppercase tracking-wider">Plus Ones</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-gray-400 mb-1"><Mail className="w-4 h-4" /></div>
          <p className="text-2xl font-heading text-gray-900">{stats.noResponse}</p>
          <p className="text-xs text-gray-500 uppercase tracking-wider">No Response</p>
        </Card>
      </div>

      {/* Deadline Editor */}
      <Card className="p-5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-sm font-medium text-gray-900">RSVP Deadline</h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={deadlineStatus === "open" ? "success" : deadlineStatus === "closing-soon" ? "warning" : deadlineStatus === "closed" ? "error" : "default"}>
                {rsvpClosed ? "Closed" : deadlineStatus === "closing-soon" ? "Closing Soon" : deadlineStatus === "open" ? "Open" : "No Deadline"}
              </Badge>
              {currentDeadline && <span className="text-sm text-gray-500">{formatDeadline(currentDeadline)}</span>}
            </div>
          </div>
          <Button size="sm" variant="secondary" onClick={() => { setDeadlineValue(toDatetimeLocal(currentDeadline)); setShowDeadline(true); }}>
            <CalendarCheck className="w-4 h-4" /> Edit Deadline
          </Button>
        </div>
      </Card>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or message..."
          />
        </div>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-auto">
          <option value="all">All Statuses</option>
          <option value="attending">Attending</option>
          <option value="declined">Declined</option>
          <option value="pending">Pending</option>
        </Select>
      </div>

      {/* RSVP Table */}
      {!filtered.length ? (
        <EmptyState
          icon={<CalendarCheck className="w-12 h-12" />}
          title={search || statusFilter !== "all" ? "No matching RSVPs" : "No RSVPs yet"}
          description={search || statusFilter !== "all" ? "Try adjusting your filters." : "RSVPs will appear here once guests respond."}
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left text-xs font-medium uppercase tracking-wider text-gray-500 px-4 py-3">Guest</th>
                  <th className="text-left text-xs font-medium uppercase tracking-wider text-gray-500 px-4 py-3">Status</th>
                  <th className="text-left text-xs font-medium uppercase tracking-wider text-gray-500 px-4 py-3">Plus Ones</th>
                  <th className="text-left text-xs font-medium uppercase tracking-wider text-gray-500 px-4 py-3">Dietary</th>
                  <th className="text-left text-xs font-medium uppercase tracking-wider text-gray-500 px-4 py-3">Message</th>
                  <th className="text-left text-xs font-medium uppercase tracking-wider text-gray-500 px-4 py-3">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">{r.guest_name}</td>
                    <td className="px-4 py-3"><Badge variant={rsvpStatusBadge(r.status)}>{r.status}</Badge></td>
                    <td className="px-4 py-3 text-sm text-gray-600">{r.plus_ones || 0}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-[150px] truncate">{r.dietary || "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-[200px] truncate">{r.message || "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatDate(r.submitted_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Deadline Editor Modal */}
      <Modal open={showDeadline} onClose={() => setShowDeadline(false)} title="Edit RSVP Deadline">
        <div className="space-y-4">
          <FormField label="RSVP Deadline" hint="Guests cannot RSVP after this date/time. Leave blank to remove the deadline.">
            <input
              type="datetime-local"
              value={deadlineValue}
              onChange={(e) => setDeadlineValue(e.target.value)}
              className="w-full px-4 py-2.5 text-sm bg-white border border-gray-200 text-gray-900 focus:outline-none focus:border-gray-900 transition-colors rounded-md"
            />
          </FormField>
          <div className="flex gap-3 pt-2">
            <Button onClick={() => updateDeadlineMutation.mutate()} loading={updateDeadlineMutation.isPending}>
              Save Deadline
            </Button>
            <Button variant="ghost" onClick={() => setShowDeadline(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
