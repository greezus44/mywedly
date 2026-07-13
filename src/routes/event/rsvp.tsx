import { useState, useMemo } from "react";
import { useOutletContext, useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Download, CheckCircle, XCircle, Clock, Mail, MessageSquare } from "lucide-react";
import { supabase, UserEvent, EventRsvp } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Card, Badge, EmptyState, Skeleton, ErrorState } from "../../components/ui/index";
import { formatDateShort, formatTime } from "../../lib/utils";

type Ctx = { event: UserEvent | null };

const STATUS_COLORS: Record<string, "green" | "red" | "yellow"> = {
  attending: "green",
  not_attending: "red",
  maybe: "yellow",
};

const STATUS_LABELS: Record<string, string> = {
  attending: "Attending",
  not_attending: "Declined",
  maybe: "Maybe",
};

type StatusFilter = "all" | "attending" | "not_attending" | "maybe";

export default function RsvpPage() {
  const { event } = useOutletContext<Ctx>();
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const { data: rsvps, isLoading, error, refetch } = useQuery<EventRsvp[]>({
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
    staleTime: 30000,
  });

  const summary = useMemo(() => {
    if (!rsvps) return { total: 0, attending: 0, declined: 0, maybe: 0, plusOnes: 0 };
    return rsvps.reduce(
      (acc, r) => {
        acc.total++;
        acc.plusOnes += r.plus_ones || 0;
        if (r.status === "attending") acc.attending++;
        else if (r.status === "not_attending") acc.declined++;
        else acc.maybe++;
        return acc;
      },
      { total: 0, attending: 0, declined: 0, maybe: 0, plusOnes: 0 }
    );
  }, [rsvps]);

  const filteredRsvps = useMemo(() => {
    if (!rsvps) return [];
    if (statusFilter === "all") return rsvps;
    return rsvps.filter((r) => r.status === statusFilter);
  }, [rsvps, statusFilter]);

  const handleExportCsv = () => {
    if (!rsvps || rsvps.length === 0) return;
    const headers = ["Guest Name", "Status", "Plus Ones", "Dietary", "Message", "Submitted At"];
    const rows = rsvps.map((r) => [
      r.guest_name,
      STATUS_LABELS[r.status] || r.status,
      String(r.plus_ones || 0),
      r.dietary || "",
      (r.message || "").replace(/"/g, '""'),
      r.submitted_at ? new Date(r.submitted_at).toISOString() : "",
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `rsvps-${event?.name || "event"}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!event) return <ErrorState message="Could not load event data" onRetry={() => navigate("/dashboard")} />;
  if (error) return <ErrorState message={error.message} onRetry={() => refetch()} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">RSVP Responses</h1>
          <p className="text-sm text-gray-500">View guest RSVP submissions</p>
        </div>
        <Button variant="outline" onClick={handleExportCsv} disabled={!rsvps || rsvps.length === 0}>
          <Download className="w-4 h-4" /> Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-gray-400" />
            <p className="text-xs text-gray-500">Total Responses</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{summary.total}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <p className="text-xs text-gray-500">Attending</p>
          </div>
          <p className="text-2xl font-bold text-green-600">{summary.attending}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <XCircle className="w-4 h-4 text-red-500" />
            <p className="text-xs text-gray-500">Declined</p>
          </div>
          <p className="text-2xl font-bold text-red-600">{summary.declined}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-yellow-500" />
            <p className="text-xs text-gray-500">Maybe</p>
          </div>
          <p className="text-2xl font-bold text-yellow-600">{summary.maybe}</p>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          {(["all", "attending", "not_attending", "maybe"] as StatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors " +
                (statusFilter === s ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200")
              }
            >
              {s === "all" ? "All" : STATUS_LABELS[s]}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        ) : filteredRsvps.length === 0 ? (
          <EmptyState
            icon={<Mail className="w-12 h-12" />}
            title="No RSVP responses yet"
            description="Guest RSVP submissions will appear here once they respond on the guest site"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 text-left">
                  <th className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">Guest Name</th>
                  <th className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide text-center">Plus Ones</th>
                  <th className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">Dietary</th>
                  <th className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">Message</th>
                  <th className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRsvps.map((rsvp) => (
                  <tr key={rsvp.id} className="hover:bg-gray-50">
                    <td className="px-3 py-3 text-sm font-medium text-gray-900">{rsvp.guest_name}</td>
                    <td className="px-3 py-3">
                      <Badge color={STATUS_COLORS[rsvp.status] || "gray"}>{STATUS_LABELS[rsvp.status] || rsvp.status}</Badge>
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-600 text-center">{rsvp.plus_ones || 0}</td>
                    <td className="px-3 py-3 text-sm text-gray-600 max-w-[200px]">
                      {rsvp.dietary ? <span className="truncate block">{rsvp.dietary}</span> : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-600 max-w-[250px]">
                      {rsvp.message ? (
                        <span className="flex items-start gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                          <span className="truncate block">{rsvp.message}</span>
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-500 whitespace-nowrap">
                      {rsvp.submitted_at ? formatDateShort(rsvp.submitted_at) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <p className="text-xs text-gray-400 text-center">
        RSVP responses are read-only. Guests submit their responses on the guest-facing site.
      </p>
    </div>
  );
}
