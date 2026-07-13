import { useState, useMemo } from "react";
import { useOutletContext, useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, UserEvent, EventRsvp } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Select } from "../../components/ui/Input";
import { Badge, EmptyState, ErrorState, Skeleton, Toast } from "../../components/ui/index";
import { formatDateShort, formatTime } from "../../lib/utils";
import { ClipboardList, Download, Check, X, HelpCircle } from "lucide-react";

type Ctx = { event: UserEvent | null };

type StatusFilter = "all" | "attending" | "declined" | "maybe";

export default function Rsvp() {
  const { event } = useOutletContext<Ctx>();
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [toast, setToast] = useState<string | null>(null);

  const { data: rsvps = [], isLoading, isError, refetch } = useQuery<EventRsvp[]>({
    queryKey: ["rsvps", eventId],
    queryFn: async () => {
      const { data, error } = await supabase.from("event_rsvps").select("*").eq("event_id", eventId).order("submitted_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!eventId,
    staleTime: 30000,
  });

  const summary = useMemo(() => ({
    total: rsvps.length,
    attending: rsvps.filter(r => r.status === "attending").length,
    declined: rsvps.filter(r => r.status === "declined").length,
    maybe: rsvps.filter(r => r.status === "maybe").length,
  }), [rsvps]);

  const filtered = useMemo(() => {
    if (filter === "all") return rsvps;
    return rsvps.filter(r => r.status === filter);
  }, [rsvps, filter]);

  const exportCsv = () => {
    const headers = ["Guest Name", "Status", "Plus Ones", "Dietary", "Message", "Submitted At"];
    const rows = filtered.map(r => [
      r.guest_name,
      r.status,
      String(r.plus_ones),
      r.dietary || "",
      (r.message || "").replace(/"/g, '""'),
      r.submitted_at ? formatDateShort(r.submitted_at) : "",
    ]);
    const csv = [headers, ...rows].map(row => row.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `rsvps-${event?.name?.replace(/\s+/g, "-").toLowerCase() || "event"}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setToast("CSV exported");
    setTimeout(() => setToast(null), 3000);
  };

  if (!event) return <ErrorState message="Could not load event data" onRetry={() => navigate("/dashboard")} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">RSVPs</h1>
          <p className="text-sm text-gray-500">View RSVP submissions</p>
        </div>
        <Button variant="secondary" onClick={exportCsv} disabled={rsvps.length === 0}><Download className="w-4 h-4" /> Export CSV</Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500">Total</p>
          <p className="text-2xl font-bold text-gray-900">{summary.total}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500">Attending</p>
          <p className="text-2xl font-bold text-green-600">{summary.attending}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500">Declined</p>
          <p className="text-2xl font-bold text-red-600">{summary.declined}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500">Maybe</p>
          <p className="text-2xl font-bold text-yellow-600">{summary.maybe}</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-3">
          <span className="text-sm text-gray-600">Filter:</span>
          <Select value={filter} onChange={(e) => setFilter(e.target.value as StatusFilter)} className="max-w-40">
            <option value="all">All</option>
            <option value="attending">Attending</option>
            <option value="declined">Declined</option>
            <option value="maybe">Maybe</option>
          </Select>
        </div>

        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : isError ? (
          <ErrorState message="Failed to load RSVPs" onRetry={() => refetch()} />
        ) : filtered.length === 0 ? (
          <EmptyState icon={<ClipboardList className="w-12 h-12" />} title={filter !== "all" ? "No RSVPs for this filter" : "No RSVPs yet"} description={filter !== "all" ? "Try a different filter" : "RSVP submissions will appear here"} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs text-gray-500 uppercase">
                  <th className="px-4 py-3 font-medium">Guest Name</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Plus Ones</th>
                  <th className="px-4 py-3 font-medium">Dietary</th>
                  <th className="px-4 py-3 font-medium">Message</th>
                  <th className="px-4 py-3 font-medium">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{r.guest_name}</td>
                    <td className="px-4 py-3">
                      {r.status === "attending" ? <Badge variant="success"><Check className="w-3 h-3 mr-1" />Attending</Badge>
                        : r.status === "declined" ? <Badge variant="error"><X className="w-3 h-3 mr-1" />Declined</Badge>
                        : <Badge variant="warning"><HelpCircle className="w-3 h-3 mr-1" />Maybe</Badge>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{r.plus_ones}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-32 truncate">{r.dietary || "—"}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-48 truncate">{r.message || "—"}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {r.submitted_at ? `${formatDateShort(r.submitted_at)} ${formatTime(r.submitted_at.split("T")[1]?.substring(0, 5) || null)}` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
