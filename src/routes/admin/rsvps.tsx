import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Wedding, type Rsvp, type Guest, type WeddingEvent, type RsvpStatus } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { Button } from "../../components/ui/Button";
import { Input, Select } from "../../components/ui/Input";
import { Card, Badge, EmptyState, Toast } from "../../components/ui/index";
import { formatDate, formatTime } from "../../lib/utils";
import { Search, Heart, Check, X, Clock, Download } from "lucide-react";

export function RsvpsPage() {
  const queryClient = useQueryClient();
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [rsvps, setRsvps] = useState<Rsvp[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [events, setEvents] = useState<WeddingEvent[]>([]);
  const [filterStatus, setFilterStatus] = useState<"all" | RsvpStatus>("all");
  const [filterEvent, setFilterEvent] = useState<"all" | string>("all");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const { data: user } = useQuery({
    queryKey: ["auth-user"],
    queryFn: async () => { const { data: { user } } = await supabase.auth.getUser(); return user; },
  });

  const { data: wed, isLoading, error } = useQuery({
    queryKey: ["wedding", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("weddings").select("*").eq("created_by", user!.id).maybeSingle();
      if (error) throw error;
      return data as Wedding | null;
    },
  });

  const { data: rsvpData, refetch } = useQuery({
    queryKey: ["rsvps", wed?.id],
    enabled: !!wed,
    queryFn: async () => {
      const { data, error } = await supabase.from("rsvps").select("*").eq("wedding_id", wed!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Rsvp[];
    },
  });

  const { data: guestData } = useQuery({
    queryKey: ["guests-all", wed?.id],
    enabled: !!wed,
    queryFn: async () => {
      const { data, error } = await supabase.from("guests").select("*").eq("wedding_id", wed!.id);
      if (error) throw error;
      return (data || []) as Guest[];
    },
  });

  const { data: eventData } = useQuery({
    queryKey: ["events-all", wed?.id],
    enabled: !!wed,
    queryFn: async () => {
      const { data, error } = await supabase.from("events").select("*").eq("wedding_id", wed!.id).order("sort_order", { ascending: true });
      if (error) throw error;
      return (data || []) as WeddingEvent[];
    },
  });

  useEffect(() => { if (wed) setWedding(wed); }, [wed]);
  useEffect(() => { if (rsvpData) setRsvps(rsvpData); }, [rsvpData]);
  useEffect(() => { if (guestData) setGuests(guestData); }, [guestData]);
  useEffect(() => { if (eventData) setEvents(eventData); }, [eventData]);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: RsvpStatus }) => {
      const { error } = await supabase.from("rsvps").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { refetch(); queryClient.invalidateQueries({ queryKey: ["rsvps", wed?.id] }); setToast({ message: "RSVP updated", type: "success" }); },
    onError: (e) => setToast({ message: e.message, type: "error" }),
  });

  const guestMap = new Map(guests.map((g) => [g.id, g]));
  const eventMap = new Map(events.map((e) => [e.id, e]));

  const filtered = rsvps.filter((r) => {
    if (filterStatus !== "all" && r.status !== filterStatus) return false;
    if (filterEvent !== "all" && r.event_id !== filterEvent) return false;
    const q = search.toLowerCase();
    const guest = guestMap.get(r.guest_id);
    return (guest?.name || "").toLowerCase().includes(q) || (r.message || "").toLowerCase().includes(q);
  });

  const attending = rsvps.filter((r) => r.status === "attending").length;
  const declined = rsvps.filter((r) => r.status === "declined").length;
  const pending = rsvps.filter((r) => r.status === "pending").length;
  const totalGuests = rsvps.filter((r) => r.status === "attending").reduce((sum, r) => sum + r.number_of_guests, 0);

  if (isLoading) return <AdminLayout><div className="py-20 text-center text-gray-500">Loading…</div></AdminLayout>;
  if (error) return <AdminLayout><div className="py-20 text-center text-red-600">{error.message}</div></AdminLayout>;
  if (!wedding) return <AdminLayout><div className="py-20 text-center text-gray-500">No wedding found.</div></AdminLayout>;

  const summaryCards = [
    { label: "Attending", value: attending, icon: Check, color: "text-green-600", bg: "bg-green-50" },
    { label: "Declined", value: declined, icon: X, color: "text-red-600", bg: "bg-red-50" },
    { label: "Pending", value: pending, icon: Clock, color: "text-yellow-600", bg: "bg-yellow-50" },
    { label: "Total Guests", value: totalGuests, icon: Heart, color: "text-gray-900", bg: "bg-gray-100" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">RSVPs</h2>
          <p className="text-sm text-gray-500">Manage guest RSVP responses.</p>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {summaryCards.map((s) => (
            <Card key={s.label}>
              <div className="flex items-center gap-3">
                <div className={`rounded-lg p-2.5 ${s.bg}`}><s.icon className={`h-5 w-5 ${s.color}`} /></div>
                <div>
                  <p className="text-xs font-medium text-gray-500">{s.label}</p>
                  <p className="text-xl font-bold text-gray-900">{s.value}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Select className="w-auto" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as "all" | RsvpStatus)}>
            <option value="all">All Statuses</option>
            <option value="attending">Attending</option>
            <option value="declined">Declined</option>
            <option value="pending">Pending</option>
          </Select>
          <Select className="w-auto" value={filterEvent} onChange={(e) => setFilterEvent(e.target.value)}>
            <option value="all">All Events</option>
            {events.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </Select>
          <div className="relative ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input className="pl-10 w-64" placeholder="Search by guest or message…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        {filtered.length === 0 ? (
          <Card><EmptyState icon={<Heart className="h-10 w-10" />} title="No RSVPs found" description={search ? "Try a different search." : "RSVP responses will appear here."} /></Card>
        ) : (
          <Card className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase">
                    <th className="px-4 py-3">Guest</th>
                    <th className="px-4 py-3">Event</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Guests</th>
                    <th className="px-4 py-3">Message</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((r) => {
                    const guest = guestMap.get(r.guest_id);
                    const event = eventMap.get(r.event_id);
                    return (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{guest?.name || "Unknown"}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{event?.name || "—"}</td>
                        <td className="px-4 py-3">
                          <Badge variant={r.status === "attending" ? "success" : r.status === "declined" ? "error" : "warning"}>{r.status}</Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{r.number_of_guests}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">{r.message || "—"}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{formatDate(r.created_at)}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => updateStatusMutation.mutate({ id: r.id, status: "attending" })} title="Mark attending"><Check className="h-4 w-4 text-green-600" /></Button>
                            <Button variant="ghost" size="sm" onClick={() => updateStatusMutation.mutate({ id: r.id, status: "declined" })} title="Mark declined"><X className="h-4 w-4 text-red-500" /></Button>
                            <Button variant="ghost" size="sm" onClick={() => updateStatusMutation.mutate({ id: r.id, status: "pending" })} title="Mark pending"><Clock className="h-4 w-4 text-yellow-600" /></Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
      {toast && <Toast message={toast.message} type={toast.type} />}
    </AdminLayout>
  );
}
