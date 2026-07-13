import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase, type Wedding, type Rsvp, type WeddingEvent, type Guest, type RsvpStatus } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { Card, Badge, EmptyState } from "../../components/ui/index";
import { Input, Select } from "../../components/ui/Input";
import { formatDate } from "../../lib/utils";
import { Search, Heart, Check, X, Clock } from "lucide-react";

export function RsvpsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | RsvpStatus>("all");
  const [eventFilter, setEventFilter] = useState("all");
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

  const { data: rsvps, isLoading } = useQuery({
    queryKey: ["rsvps"],
    queryFn: async () => {
      if (!wedding) return [];
      const { data } = await supabase.from("rsvps").select("*").eq("wedding_id", wedding.id).order("created_at", { ascending: false });
      return (data || []) as Rsvp[];
    },
    enabled: !!wedding,
  });

  const { data: events } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      if (!wedding) return [];
      const { data } = await supabase.from("events").select("*").eq("wedding_id", wedding.id);
      return (data || []) as WeddingEvent[];
    },
    enabled: !!wedding,
  });

  const { data: guests } = useQuery({
    queryKey: ["guests"],
    queryFn: async () => {
      if (!wedding) return [];
      const { data } = await supabase.from("guests").select("*").eq("wedding_id", wedding.id);
      return (data || []) as Guest[];
    },
    enabled: !!wedding,
  });

  const guestMap = new Map((guests || []).map((g) => [g.id, g]));
  const eventMap = new Map((events || []).map((e) => [e.id, e]));

  const filtered = (rsvps || []).filter((r) => {
    const guest = guestMap.get(r.guest_id);
    const matchesSearch = !search ||
      (guest?.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (guest?.email || "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    const matchesEvent = eventFilter === "all" || r.event_id === eventFilter;
    return matchesSearch && matchesStatus && matchesEvent;
  });

  const attending = (rsvps || []).filter((r) => r.status === "attending").length;
  const declined = (rsvps || []).filter((r) => r.status === "declined").length;
  const pending = (rsvps || []).filter((r) => r.status === "pending").length;
  const totalGuests = (rsvps || []).filter((r) => r.status === "attending").reduce((sum, r) => sum + r.number_of_guests, 0);

  const statusBadge = (status: RsvpStatus) => {
    if (status === "attending") return <Badge variant="success"><Check className="mr-1 h-3 w-3" /> Attending</Badge>;
    if (status === "declined") return <Badge variant="error"><X className="mr-1 h-3 w-3" /> Declined</Badge>;
    return <Badge variant="warning"><Clock className="mr-1 h-3 w-3" /> Pending</Badge>;
  };

  return (
    <AdminLayout>
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-900">RSVPs</h2>
        <p className="mt-1 text-sm text-gray-500">Track and manage guest RSVP responses.</p>
      </div>

      {/* Summary Cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
              <Check className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{attending}</p>
              <p className="text-sm text-gray-500">Attending</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50">
              <X className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{declined}</p>
              <p className="text-sm text-gray-500">Declined</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-50">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{pending}</p>
              <p className="text-sm text-gray-500">Pending</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50">
              <Heart className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{totalGuests}</p>
              <p className="text-sm text-gray-500">Total Guests</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as "all" | RsvpStatus)}>
            <option value="all">All Statuses</option>
            <option value="attending">Attending</option>
            <option value="declined">Declined</option>
            <option value="pending">Pending</option>
          </Select>
          <Select value={eventFilter} onChange={(e) => setEventFilter(e.target.value)}>
            <option value="all">All Events</option>
            {(events || []).map((event) => (
              <option key={event.id} value={event.id}>{event.name}</option>
            ))}
          </Select>
        </div>
      </Card>

      {/* RSVP List */}
      <Card>
        {isLoading ? (
          <div className="py-8 text-center text-gray-500">Loading RSVPs...</div>
        ) : filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase text-gray-500">
                  <th className="pb-3 pr-4">Guest</th>
                  <th className="pb-3 pr-4">Event</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 pr-4">Guests</th>
                  <th className="pb-3 pr-4">Message</th>
                  <th className="pb-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((rsvp) => {
                  const guest = guestMap.get(rsvp.guest_id);
                  const event = eventMap.get(rsvp.event_id);
                  return (
                    <tr key={rsvp.id} className="text-sm">
                      <td className="py-3 pr-4 font-medium text-gray-900">{guest?.name || "Unknown"}</td>
                      <td className="py-3 pr-4 text-gray-600">{event?.name || "—"}</td>
                      <td className="py-3 pr-4">{statusBadge(rsvp.status)}</td>
                      <td className="py-3 pr-4 text-gray-600">{rsvp.number_of_guests}</td>
                      <td className="py-3 pr-4 text-gray-500 max-w-xs truncate">{rsvp.message || "—"}</td>
                      <td className="py-3 text-gray-500">{formatDate(rsvp.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon={<Heart className="h-10 w-10" />} title="No RSVPs found" description={search || statusFilter !== "all" || eventFilter !== "all" ? "Try different filters." : "RSVPs will appear here once guests respond."} />
        )}
      </Card>
    </AdminLayout>
  );
}
