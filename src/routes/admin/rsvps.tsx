import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase, type Wedding, type Rsvp, type WeddingEvent, type Guest, type RsvpStatus } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { Button } from "../../components/ui/Button";
import { Input, Select } from "../../components/ui/Input";
import { Card, Badge, EmptyState } from "../../components/ui/index";
import { formatDate } from "../../lib/utils";
import { Search, Heart, CheckCircle, XCircle, Clock } from "lucide-react";

type StatusFilter = "all" | RsvpStatus;

export function RsvpsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [eventFilter, setEventFilter] = useState<string>("all");
  const qc = useQueryClient();

  const { data: wedding } = useQuery({
    queryKey: ["wedding"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { data } = await supabase.from("weddings").select("*").eq("created_by", user.user.id).maybeSingle();
      return data as Wedding | null;
    },
  });

  const { data: events } = useQuery({
    queryKey: ["events", wedding?.id],
    queryFn: async () => {
      if (!wedding) return [];
      const { data } = await supabase.from("events").select("*").eq("wedding_id", wedding.id).order("starts_at", { ascending: true });
      return (data || []) as WeddingEvent[];
    },
    enabled: !!wedding,
  });

  const { data: guests } = useQuery({
    queryKey: ["guests-all", wedding?.id],
    queryFn: async () => {
      if (!wedding) return [];
      const { data } = await supabase.from("guests").select("*").eq("wedding_id", wedding.id);
      return (data || []) as Guest[];
    },
    enabled: !!wedding,
  });

  const { data: rsvps, isLoading } = useQuery({
    queryKey: ["rsvps", wedding?.id, statusFilter, eventFilter, search],
    queryFn: async () => {
      if (!wedding) return [];
      let q = supabase.from("rsvps").select("*").eq("wedding_id", wedding.id).order("created_at", { ascending: false });
      if (statusFilter !== "all") q = q.eq("status", statusFilter);
      if (eventFilter !== "all") q = q.eq("event_id", eventFilter);
      const { data } = await q;
      let results = (data || []) as Rsvp[];
      if (search.trim()) {
        const s = search.trim().toLowerCase();
        const guestMap = new Map((guests || []).map((g) => [g.id, g]));
        results = results.filter((r) => {
          const g = guestMap.get(r.guest_id);
          return g?.name.toLowerCase().includes(s) || g?.email?.toLowerCase().includes(s);
        });
      }
      return results;
    },
    enabled: !!wedding && !!guests,
  });

  const guestMap = new Map((guests || []).map((g) => [g.id, g]));
  const eventMap = new Map((events || []).map((e) => [e.id, e]));

  const summary = {
    total: rsvps?.length || 0,
    attending: rsvps?.filter((r) => r.status === "attending").length || 0,
    declined: rsvps?.filter((r) => r.status === "declined").length || 0,
    pending: rsvps?.filter((r) => r.status === "pending").length || 0,
  };

  const summaryCards = [
    { label: "Total RSVPs", value: summary.total, icon: Heart, color: "text-gray-900" },
    { label: "Attending", value: summary.attending, icon: CheckCircle, color: "text-green-600" },
    { label: "Declined", value: summary.declined, icon: XCircle, color: "text-red-600" },
    { label: "Pending", value: summary.pending, icon: Clock, color: "text-yellow-600" },
  ];

  return (
    <AdminLayout>
      <h2 className="mb-6 text-xl font-semibold text-gray-900">RSVP Manager</h2>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {summaryCards.map((s) => (
          <Card key={s.label} className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">{s.label}</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{s.value}</p>
            </div>
            <div className="rounded-lg bg-gray-100 p-3"><s.icon className="h-6 w-6 text-gray-700" /></div>
          </Card>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by guest name or email..." className="pl-10" />
        </div>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)} className="w-auto">
          <option value="all">All Statuses</option>
          <option value="attending">Attending</option>
          <option value="declined">Declined</option>
          <option value="pending">Pending</option>
        </Select>
        <Select value={eventFilter} onChange={(e) => setEventFilter(e.target.value)} className="w-auto">
          <option value="all">All Events</option>
          {events?.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
        </Select>
      </div>

      <Card>
        {isLoading && <p className="text-sm text-gray-500">Loading...</p>}
        {rsvps && rsvps.length === 0 && !isLoading && (
          <EmptyState icon={<Heart className="h-8 w-8" />} title="No RSVPs found" />
        )}
        {rsvps && rsvps.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500">
                  <th className="pb-2 pr-4 font-medium">Guest</th>
                  <th className="pb-2 pr-4 font-medium">Event</th>
                  <th className="pb-2 pr-4 font-medium">Status</th>
                  <th className="pb-2 pr-4 font-medium">Guests</th>
                  <th className="pb-2 pr-4 font-medium">Message</th>
                  <th className="pb-2 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {rsvps.map((r) => {
                  const g = guestMap.get(r.guest_id);
                  const e = eventMap.get(r.event_id);
                  return (
                    <tr key={r.id} className="border-b border-gray-100 last:border-0">
                      <td className="py-3 pr-4 font-medium text-gray-900">{g?.name || "Unknown"}</td>
                      <td className="py-3 pr-4 text-gray-500">{e?.name || "—"}</td>
                      <td className="py-3 pr-4"><Badge variant={r.status === "attending" ? "success" : r.status === "declined" ? "error" : "warning"}>{r.status}</Badge></td>
                      <td className="py-3 pr-4 text-gray-500">{r.number_of_guests}</td>
                      <td className="py-3 pr-4 text-gray-500 max-w-xs truncate">{r.message || "—"}</td>
                      <td className="py-3 text-gray-400">{formatDate(r.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </AdminLayout>
  );
}
