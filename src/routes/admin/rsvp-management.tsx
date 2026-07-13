import { useState, useMemo, useCallback } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Download, Search, Mail, CheckCircle2, XCircle, HelpCircle, Clock } from "lucide-react";
import { supabase, Wedding, Rsvp } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input, Select } from "../../components/ui/Input";
import { Card, Badge, EmptyState, Toast, ErrorState, Skeleton } from "../../components/ui/index";
import { formatDate, formatTime } from "../../lib/utils";

type OutletContext = { wedding: Wedding | null };

const STATUS_CONFIG: Record<string, { color: "green" | "red" | "yellow"; icon: React.ReactNode; label: string }> = {
  attending: { color: "green", icon: <CheckCircle2 className="w-4 h-4" />, label: "Attending" },
  not_attending: { color: "red", icon: <XCircle className="w-4 h-4" />, label: "Not Attending" },
  maybe: { color: "yellow", icon: <HelpCircle className="w-4 h-4" />, label: "Maybe" },
};

export default function RsvpManagementPage() {
  const { wedding } = useOutletContext<OutletContext>();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const { data: rsvps, isLoading, isError, refetch } = useQuery<Rsvp[]>({
    queryKey: ["rsvps", wedding?.id],
    queryFn: async () => {
      if (!wedding) return [];
      const { data, error } = await supabase.from("rsvps").select("*").eq("wedding_id", wedding.id).order("submitted_at", { ascending: false });
      if (error) throw error;
      return data as Rsvp[];
    },
    enabled: !!wedding,
  });

  const filteredRsvps = useMemo(() => {
    if (!rsvps) return [];
    return rsvps.filter((r) => {
      const matchesSearch = !search || r.guest_name?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [rsvps, search, statusFilter]);

  const stats = useMemo(() => {
    if (!rsvps) return { total: 0, attending: 0, notAttending: 0, maybe: 0 };
    return {
      total: rsvps.length,
      attending: rsvps.filter((r) => r.status === "attending").length,
      notAttending: rsvps.filter((r) => r.status === "not_attending").length,
      maybe: rsvps.filter((r) => r.status === "maybe").length,
    };
  }, [rsvps]);

  const handleExportCsv = useCallback(() => {
    if (filteredRsvps.length === 0) {
      setToast({ msg: "No RSVPs to export", type: "error" });
      setTimeout(() => setToast(null), 3000);
      return;
    }
    const headers = ["Guest Name", "Status", "Plus Ones", "Dietary", "Message", "Submitted At"];
    const rows = filteredRsvps.map((r) => [
      r.guest_name || "",
      r.status,
      String(r.plus_ones || 0),
      r.dietary || "",
      (r.message || "").replace(/"/g, '""'),
      r.submitted_at ? formatDate(r.submitted_at) : "",
    ]);
    const csv = [headers, ...rows].map((row) => row.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `rsvps-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setToast({ msg: "CSV exported!", type: "success" });
    setTimeout(() => setToast(null), 3000);
  }, [filteredRsvps]);

  if (!wedding) return <ErrorState message="Could not load wedding data" onRetry={() => navigate("/admin")} />;
  if (isError) return <ErrorState message="Failed to load RSVPs" onRetry={() => refetch()} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">RSVP Management</h1>
          <p className="text-sm text-gray-500">View and manage guest RSVP responses</p>
        </div>
        <Button variant="outline" onClick={handleExportCsv}><Download className="w-4 h-4" /> Export CSV</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          <><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /></>
        ) : (
          <>
            <Card className="p-4"><div className="flex items-center gap-2 mb-2"><Mail className="w-4 h-4 text-gray-400" /><span className="text-xs text-gray-500">Total RSVPs</span></div><p className="text-2xl font-bold text-gray-900">{stats.total}</p></Card>
            <Card className="p-4"><div className="flex items-center gap-2 mb-2"><CheckCircle2 className="w-4 h-4 text-green-500" /><span className="text-xs text-gray-500">Attending</span></div><p className="text-2xl font-bold text-green-600">{stats.attending}</p></Card>
            <Card className="p-4"><div className="flex items-center gap-2 mb-2"><XCircle className="w-4 h-4 text-red-500" /><span className="text-xs text-gray-500">Not Attending</span></div><p className="text-2xl font-bold text-red-600">{stats.notAttending}</p></Card>
            <Card className="p-4"><div className="flex items-center gap-2 mb-2"><HelpCircle className="w-4 h-4 text-yellow-500" /><span className="text-xs text-gray-500">Maybe</span></div><p className="text-2xl font-bold text-yellow-600">{stats.maybe}</p></Card>
          </>
        )}
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by guest name..." className="pl-9" />
          </div>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="sm:w-40">
            <option value="all">All Status</option>
            <option value="attending">Attending</option>
            <option value="not_attending">Not Attending</option>
            <option value="maybe">Maybe</option>
          </Select>
        </div>
      </Card>

      {/* RSVP List */}
      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3"><Skeleton className="h-16" /><Skeleton className="h-16" /><Skeleton className="h-16" /></div>
        ) : filteredRsvps.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Guest</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Plus Ones</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Dietary</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Message</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRsvps.map((rsvp) => {
                  const cfg = STATUS_CONFIG[rsvp.status] || STATUS_CONFIG.maybe;
                  return (
                    <tr key={rsvp.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3"><p className="text-sm font-medium text-gray-900">{rsvp.guest_name || "Unknown"}</p></td>
                      <td className="px-4 py-3"><Badge color={cfg.color}>{cfg.icon}<span className="ml-1">{cfg.label}</span></Badge></td>
                      <td className="px-4 py-3 hidden md:table-cell text-sm text-gray-600">{rsvp.plus_ones || 0}</td>
                      <td className="px-4 py-3 hidden lg:table-cell text-sm text-gray-600">{rsvp.dietary || "—"}</td>
                      <td className="px-4 py-3 hidden lg:table-cell text-sm text-gray-600 max-w-xs truncate">{rsvp.message || "—"}</td>
                      <td className="px-4 py-3 hidden sm:table-cell text-sm text-gray-500">{rsvp.submitted_at ? formatDate(rsvp.submitted_at) : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon={<Mail className="w-10 h-10" />} title={search || statusFilter !== "all" ? "No RSVPs found" : "No RSVPs yet"} description={search || statusFilter !== "all" ? "Try adjusting your filters" : "RSVPs will appear here once guests respond"} />
        )}
      </Card>

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
