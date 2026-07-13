import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Wedding, type Rsvp, type RsvpStatus, type WeddingEvent } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { Select } from "../../components/ui/Input";
import { Card, Badge, EmptyState, Toast } from "../../components/ui/index";
import { MailCheck } from "lucide-react";

const STATUS_VARIANTS: Record<string, "default" | "success" | "warning" | "error"> = {
  pending: "warning", accepted: "success", declined: "error", tentative: "default",
};

export function RsvpsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [eventFilter, setEventFilter] = useState<string>("all");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const { data: wedding, isLoading: wLoading, error: wError } = useQuery<Wedding>({
    queryKey: ["wedding"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { data, error } = await supabase.from("weddings").select("*").eq("created_by", user.user.id).single();
      if (error) throw error;
      return data as Wedding;
    },
  });

  const { data: events = [] } = useQuery<WeddingEvent[]>({
    queryKey: ["events", wedding?.id],
    queryFn: async () => {
      if (!wedding) return [];
      const { data } = await supabase.from("events").select("*").eq("wedding_id", wedding.id).order("sort_order", { ascending: true });
      return (data || []) as WeddingEvent[];
    },
    enabled: !!wedding,
  });

  const { data: rsvps = [], isLoading: rLoading } = useQuery<Rsvp[]>({
    queryKey: ["rsvps", wedding?.id],
    queryFn: async () => {
      if (!wedding) return [];
      const { data } = await supabase.from("rsvps").select("*").eq("wedding_id", wedding.id).order("created_at", { ascending: false });
      return (data || []) as Rsvp[];
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
      setToast({ message: "RSVP status updated", type: "success" });
    },
    onError: () => setToast({ message: "Failed to update RSVP", type: "error" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("rsvps").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rsvps", wedding?.id] });
      setToast({ message: "RSVP deleted", type: "success" });
    },
    onError: () => setToast({ message: "Failed to delete RSVP", type: "error" }),
  });

  const filtered = rsvps.filter((r) => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (eventFilter !== "all" && r.event_id !== eventFilter) return false;
    return true;
  });

  const statusCounts: Record<string, number> = { pending: 0, accepted: 0, declined: 0, tentative: 0 };
  rsvps.forEach((r) => { statusCounts[r.status] = (statusCounts[r.status] || 0) + 1; });

  if (wLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full p-8">
          <p className="font-ui text-sm text-gray-500">Loading RSVPs...</p>
        </div>
      </AdminLayout>
    );
  }

  if (wError || !wedding) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full p-8">
          <p className="font-ui text-sm text-red-500">Unable to load wedding data.</p>
        </div>
      </AdminLayout>
    );
  }

  const eventName = (eventId: string | null) => events.find((e) => e.id === eventId)?.name || "General";

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8 overflow-y-auto">
        <div className="mb-6">
          <h1 className="font-ui text-xl font-bold text-gray-900">RSVPs</h1>
          <p className="font-ui text-sm text-gray-500 mt-1">{rsvps.length} total responses</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {(["accepted", "pending", "declined", "tentative"] as const).map((s) => (
            <Card key={s} className="p-4">
              <p className="font-ui text-xs font-medium text-gray-500 uppercase tracking-wider">{s}</p>
              <p className="font-ui text-2xl font-bold text-gray-900 mt-1">{statusCounts[s]}</p>
            </Card>
          ))}
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-2">
            <label className="font-ui text-xs font-medium text-gray-500">Status</label>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-auto">
              <option value="all">All</option>
              <option value="accepted">Accepted</option>
              <option value="pending">Pending</option>
              <option value="declined">Declined</option>
              <option value="tentative">Tentative</option>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <label className="font-ui text-xs font-medium text-gray-500">Event</label>
            <Select value={eventFilter} onChange={(e) => setEventFilter(e.target.value)} className="w-auto">
              <option value="all">All Events</option>
              {events.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </Select>
          </div>
        </div>

        {rLoading ? (
          <p className="font-ui text-sm text-gray-500">Loading RSVPs...</p>
        ) : filtered.length === 0 ? (
          <Card className="p-0">
            <EmptyState
              icon={<MailCheck size={40} />}
              title="No RSVPs found"
              description={rsvps.length === 0 ? "RSVP responses from guests will appear here." : "Try adjusting your filters."}
            />
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((rsvp) => (
              <Card key={rsvp.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-ui text-sm font-semibold text-gray-900">{rsvp.guest_name || "Unknown Guest"}</h3>
                      <Badge variant={STATUS_VARIANTS[rsvp.status] || "default"}>{rsvp.status}</Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                      <p className="font-ui text-xs text-gray-500">{eventName(rsvp.event_id)}</p>
                      {rsvp.guest_email && <p className="font-ui text-xs text-gray-500">{rsvp.guest_email}</p>}
                      <p className="font-ui text-xs text-gray-400">{new Date(rsvp.created_at).toLocaleDateString()}</p>
                    </div>
                    {(rsvp.meal_choice || rsvp.dietary_restrictions || rsvp.plus_one_name || rsvp.song_request || rsvp.message) && (
                      <div className="mt-2 pt-2 border-t border-gray-100 space-y-1">
                        {rsvp.meal_choice && <p className="font-ui text-xs text-gray-600"><span className="text-gray-400">Meal:</span> {rsvp.meal_choice}</p>}
                        {rsvp.dietary_restrictions && <p className="font-ui text-xs text-gray-600"><span className="text-gray-400">Dietary:</span> {rsvp.dietary_restrictions}</p>}
                        {rsvp.plus_one_name && <p className="font-ui text-xs text-gray-600"><span className="text-gray-400">Plus One:</span> {rsvp.plus_one_name}</p>}
                        {rsvp.song_request && <p className="font-ui text-xs text-gray-600"><span className="text-gray-400">Song Request:</span> {rsvp.song_request}</p>}
                        {rsvp.message && <p className="font-ui text-xs text-gray-600"><span className="text-gray-400">Message:</span> {rsvp.message}</p>}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <Select
                      value={rsvp.status}
                      onChange={(e) => updateStatusMutation.mutate({ id: rsvp.id, status: e.target.value as RsvpStatus })}
                      className="w-auto text-xs py-1.5"
                    >
                      <option value="pending">Pending</option>
                      <option value="accepted">Accepted</option>
                      <option value="declined">Declined</option>
                      <option value="tentative">Tentative</option>
                    </Select>
                    <button
                      onClick={() => deleteMutation.mutate(rsvp.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors text-xs"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </AdminLayout>
  );
}
