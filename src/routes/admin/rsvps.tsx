import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Wedding, type Rsvp, type WeddingEvent, type Guest, type RsvpStatus } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { Button } from "../../components/ui/Button";
import { Input, Select } from "../../components/ui/Input";
import { Card, Badge, EmptyState } from "../../components/ui/index";
import { formatDate } from "../../lib/utils";
import { Search, Heart, Check, X, Clock, Users } from "lucide-react";

export function RsvpsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | RsvpStatus>("all");
  const [eventFilter, setEventFilter] = useState<string>("all");
  const [toast, setToast] = useState<string | null>(null);

  const { data: user } = useQuery({
    queryKey: ["auth-user"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user;
    },
  });

  const { data: wedding } = useQuery({
    queryKey: ["wedding", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from("weddings").select("*").eq("created_by", user.id).maybeSingle();
      return data as Wedding | null;
    },
    enabled: !!user,
  });

  const { data: rsvps, isLoading } = useQuery({
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
      const { data } = await supabase.from("events").select("*").eq("wedding_id", wedding.id);
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

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: RsvpStatus }) => {
      const { error } = await supabase.from("rsvps").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rsvps", wedding?.id] });
      setToast("RSVP updated");
      setTimeout(() => setToast(null), 2000);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("rsvps").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rsvps", wedding?.id] });
      setToast("RSVP deleted");
      setTimeout(() => setToast(null), 2000);
    },
  });

  const guestMap = new Map((guests || []).map((g) => [g.id, g]));
  const eventMap = new Map((events || []).map((e) => [e.id, e]));

  const filteredRsvps = (rsvps || []).filter((r) => {
    const guest = guestMap.get(r.guest_id);
    const matchesSearch = !search || (guest?.name || "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    const matchesEvent = eventFilter === "all" || r.event_id === eventFilter;
    return matchesSearch && matchesStatus && matchesEvent;
  });

  const attendingCount = (rsvps || []).filter((r) => r.status === "attending").length;
  const declinedCount = (rsvps || []).filter((r) => r.status === "declined").length;
  const pendingCount = (rsvps || []).filter((r) => r.status === "pending").length;
  const totalGuests = (rsvps || []).filter((r) => r.status === "attending").reduce((sum, r) => sum + r.number_of_guests, 0);

  if (!wedding) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <div className="text-gray-500">Loading RSVPs...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">RSVPs</h1>
          <p className="mt-1 text-sm text-gray-500">Track and manage RSVP responses from your guests.</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Card>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-2">
                <Check className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Attending</p>
                <p className="text-xl font-bold text-gray-900">{attendingCount}</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-red-100 p-2">
                <X className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Declined</p>
                <p className="text-xl font-bold text-gray-900">{declinedCount}</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-yellow-100 p-2">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Pending</p>
                <p className="text-xl font-bold text-gray-900">{pendingCount}</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-gray-100 p-2">
                <Users className="h-5 w-5 text-gray-900" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Guests</p>
                <p className="text-xl font-bold text-gray-900">{totalGuests}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by guest name..."
              className="pl-10"
            />
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | RsvpStatus)}
          >
            <option value="all">All Statuses</option>
            <option value="attending">Attending</option>
            <option value="declined">Declined</option>
            <option value="pending">Pending</option>
          </Select>
          <Select
            value={eventFilter}
            onChange={(e) => setEventFilter(e.target.value)}
          >
            <option value="all">All Events</option>
            {(events || []).map((ev) => (
              <option key={ev.id} value={ev.id}>{ev.name}</option>
            ))}
          </Select>
        </div>

        {/* RSVP List */}
        {isLoading ? (
          <div className="text-gray-500">Loading RSVPs...</div>
        ) : filteredRsvps.length === 0 ? (
          <Card>
            <EmptyState icon={<Heart className="h-8 w-8" />} title={search ? "No RSVPs found" : "No RSVPs yet"} description={search ? "Try a different search." : "RSVP responses will appear here."} />
          </Card>
        ) : (
          <div className="space-y-2">
            {filteredRsvps.map((rsvp) => {
              const guest = guestMap.get(rsvp.guest_id);
              const event = eventMap.get(rsvp.event_id);
              return (
                <Card key={rsvp.id}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{guest?.name || "Unknown Guest"}</h3>
                        <Badge variant={rsvp.status === "attending" ? "success" : rsvp.status === "declined" ? "error" : "warning"}>
                          {rsvp.status}
                        </Badge>
                      </div>
                      <div className="mt-1 space-y-0.5 text-sm text-gray-500">
                        <p>Event: {event?.name || "Unknown Event"}</p>
                        <p>Guests: {rsvp.number_of_guests}</p>
                        {rsvp.message && <p className="mt-1 italic text-gray-600">"{rsvp.message}"</p>}
                        <p className="text-xs text-gray-400">{formatDate(rsvp.created_at)}</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <select
                        value={rsvp.status}
                        onChange={(e) => updateStatusMutation.mutate({ id: rsvp.id, status: e.target.value as RsvpStatus })}
                        className="rounded-lg border border-gray-300 px-2 py-1 text-sm text-gray-900 focus:border-gray-900 outline-none"
                      >
                        <option value="attending">Attending</option>
                        <option value="declined">Declined</option>
                        <option value="pending">Pending</option>
                      </select>
                      <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(rsvp.id)}>
                        <X className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {toast && (
          <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-gray-900 px-4 py-2 text-sm text-white shadow-lg">
            {toast}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
