import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase, type Wedding, type Rsvp, type RsvpStatus, type WeddingEvent, type Guest } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { Select } from "../../components/ui/Input";
import { Card, Badge, EmptyState, Toast } from "../../components/ui/index";
import { formatDate, formatTime } from "../../lib/utils";
import { CheckCircle2, X, Clock, Search, Calendar, Users } from "lucide-react";

export function RsvpsPage() {
  const [toast, setToast] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | RsvpStatus>("all");
  const [eventFilter, setEventFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const { data: wedding, isLoading } = useQuery({
    queryKey: ["wedding"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { data, error } = await supabase.from("weddings").select("*").eq("created_by", user.user.id).single();
      if (error) throw error;
      return data as Wedding;
    },
  });

  const { data: rsvps, isLoading: rsvpsLoading } = useQuery({
    queryKey: ["rsvps", wedding?.id],
    queryFn: async () => {
      if (!wedding) return [];
      const { data } = await supabase.from("rsvps").select("*").eq("wedding_id", wedding.id).order("created_at", { ascending: false });
      return (data || []) as Rsvp[];
    },
    enabled: !!wedding,
  });

  const { data: events } = useQuery({
    queryKey: ["events", wedding?.id],
    queryFn: async () => {
      if (!wedding) return [];
      const { data } = await supabase.from("events").select("*").eq("wedding_id", wedding.id).order("sort_order");
      return (data || []) as WeddingEvent[];
    },
    enabled: !!wedding,
  });

  const { data: guests } = useQuery({
    queryKey: ["guests", wedding?.id],
    queryFn: async () => {
      if (!wedding) return [];
      const { data } = await supabase.from("guests").select("*").eq("wedding_id", wedding.id);
      return (data || []) as Guest[];
    },
    enabled: !!wedding,
  });

  if (isLoading) return <AdminLayout><div className="flex items-center justify-center h-full"><div className="animate-pulse text-gray-400">Loading...</div></div></AdminLayout>;
  if (!wedding) return <AdminLayout><div className="p-6 text-gray-500">Wedding not found</div></AdminLayout>;

  const eventMap = new Map((events || []).map((e) => [e.id, e.name]));

  const filteredRsvps = (rsvps || []).filter((r) => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (eventFilter !== "all" && r.event_id !== eventFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (r.guest_name || "").toLowerCase().includes(q) || (r.guest_email || "").toLowerCase().includes(q);
    }
    return true;
  });

  const counts = {
    accepted: (rsvps || []).filter((r) => r.status === "accepted").length,
    declined: (rsvps || []).filter((r) => r.status === "declined").length,
    tentative: (rsvps || []).filter((r) => r.status === "tentative").length,
    pending: (rsvps || []).filter((r) => r.status === "pending").length,
  };

  return (
    <AdminLayout>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <CheckCircle2 size={18} className="text-indigo-600" />
            <h1 className="font-ui text-xl font-bold text-gray-900">RSVP Manager</h1>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: "Accepted", count: counts.accepted, color: "text-emerald-600", bg: "bg-emerald-50", icon: CheckCircle2 },
              { label: "Declined", count: counts.declined, color: "text-red-500", bg: "bg-red-50", icon: X },
              { label: "Tentative", count: counts.tentative, color: "text-amber-600", bg: "bg-amber-50", icon: Clock },
              { label: "Pending", count: counts.pending, color: "text-gray-500", bg: "bg-gray-50", icon: Clock },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <Card key={s.label} className="p-4">
                  <div className={`inline-flex p-2 rounded-lg ${s.bg} mb-2`}><Icon size={16} className={s.color} /></div>
                  <div className="font-ui text-2xl font-bold text-gray-900">{s.count}</div>
                  <div className="font-ui text-xs text-gray-500">{s.label}</div>
                </Card>
              );
            })}
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by guest name or email..." className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg font-ui text-sm text-gray-700 focus:outline-none focus:border-indigo-400" />
            </div>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="!bg-white !border-gray-200 !text-gray-700 sm:w-40">
              <option value="all">All Statuses</option>
              <option value="accepted">Accepted</option>
              <option value="declined">Declined</option>
              <option value="tentative">Tentative</option>
              <option value="pending">Pending</option>
            </Select>
            <Select value={eventFilter} onChange={(e) => setEventFilter(e.target.value)} className="!bg-white !border-gray-200 !text-gray-700 sm:w-48">
              <option value="all">All Events</option>
              {(events || []).map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </Select>
          </div>

          {/* RSVP list */}
          {rsvpsLoading ? (
            <div className="text-center py-8 text-gray-400 font-ui text-sm">Loading RSVPs...</div>
          ) : filteredRsvps.length > 0 ? (
            <div className="space-y-3">
              {filteredRsvps.map((rsvp) => (
                <Card key={rsvp.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-ui text-sm font-semibold text-gray-900">{rsvp.guest_name || "Unknown Guest"}</h3>
                        <Badge variant={rsvp.status === "accepted" ? "success" : rsvp.status === "declined" ? "error" : rsvp.status === "tentative" ? "warning" : "default"}>{rsvp.status}</Badge>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap font-ui text-xs text-gray-500">
                        {rsvp.guest_email && <span>{rsvp.guest_email}</span>}
                        {rsvp.event_id && eventMap.has(rsvp.event_id) && (
                          <span className="flex items-center gap-1"><Calendar size={11} />{eventMap.get(rsvp.event_id)}</span>
                        )}
                        <span>{formatDate(rsvp.created_at)}</span>
                      </div>
                      {(rsvp.meal_choice || rsvp.dietary_restrictions || rsvp.song_request || rsvp.plus_one_name || rsvp.message) && (
                        <div className="mt-2 pt-2 border-t border-gray-100 space-y-1">
                          {rsvp.meal_choice && <p className="font-ui text-xs text-gray-600"><span className="text-gray-400">Meal:</span> {rsvp.meal_choice}</p>}
                          {rsvp.dietary_restrictions && <p className="font-ui text-xs text-gray-600"><span className="text-gray-400">Dietary:</span> {rsvp.dietary_restrictions}</p>}
                          {rsvp.song_request && <p className="font-ui text-xs text-gray-600"><span className="text-gray-400">Song:</span> {rsvp.song_request}</p>}
                          {rsvp.plus_one_name && <p className="font-ui text-xs text-gray-600"><span className="text-gray-400">Plus one:</span> {rsvp.plus_one_name}</p>}
                          {rsvp.message && <p className="font-ui text-xs text-gray-600"><span className="text-gray-400">Message:</span> {rsvp.message}</p>}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState icon={<CheckCircle2 size={48} />} title={search || statusFilter !== "all" || eventFilter !== "all" ? "No RSVPs match your filters" : "No RSVPs yet"} description="RSVPs from your guests will appear here once they respond." />
          )}
        </div>
      </div>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </AdminLayout>
  );
}
