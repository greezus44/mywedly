import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type EventRsvp } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { LoadingSpinner, ErrorState, EmptyState, Badge } from "../../components/ui";
import { formatDate, formatDateTime, isRsvpClosed } from "../../lib/utils";

interface EventContextValue { event: UserEvent; eventId: string; }

export function RsvpPage() {
  const { event, eventId } = useOutletContext<EventContextValue>();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<string>("all");

  const { data: rsvps, isLoading, isError, error } = useQuery({
    queryKey: ["event-rsvps-admin", eventId],
    queryFn: async () => {
      const { data, error } = await supabase.from("event_rsvps").select("*").eq("event_id", eventId).order("responded_at", { ascending: false });
      if (error) throw error;
      return data as EventRsvp[];
    },
  });

  const deadline = event.draft_rsvp_deadline ?? event.rsvp_deadline;
  const closed = isRsvpClosed(deadline);

  const filtered = (rsvps ?? []).filter((r) => filter === "all" || r.status === filter);

  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("event_rsvps").update({ status, responded_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["event-rsvps-admin", eventId] }),
  });

  if (isLoading) return <div className="flex justify-center py-12"><LoadingSpinner /></div>;
  if (isError) return <ErrorState title="Failed to load RSVPs" message={error instanceof Error ? error.message : "Unknown error"} />;

  const counts = {
    attending: (rsvps ?? []).filter((r) => r.status === "attending").length,
    declined: (rsvps ?? []).filter((r) => r.status === "declined").length,
    pending: (rsvps ?? []).filter((r) => r.status === "pending").length,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-dash-text">RSVP</h2>
        {deadline && <Badge variant={closed ? "danger" : "warning"}>{closed ? "Closed" : `Closes ${formatDate(deadline)}`}</Badge>}
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-dash-border bg-dash-surface p-3 text-center"><p className="text-xl font-bold text-green-600">{counts.attending}</p><p className="text-xs text-dash-muted">Attending</p></div>
        <div className="rounded-lg border border-dash-border bg-dash-surface p-3 text-center"><p className="text-xl font-bold text-red-600">{counts.declined}</p><p className="text-xs text-dash-muted">Declined</p></div>
        <div className="rounded-lg border border-dash-border bg-dash-surface p-3 text-center"><p className="text-xl font-bold text-gray-600">{counts.pending}</p><p className="text-xs text-dash-muted">Pending</p></div>
      </div>
      <div className="flex gap-2">
        {["all", "attending", "declined", "pending"].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors ${filter === f ? "bg-dash-primary/10 text-dash-primary" : "text-dash-muted hover:text-dash-text"}`}>{f}</button>
        ))}
      </div>
      {!filtered || filtered.length === 0 ? (
        <EmptyState title="No RSVPs" description="No responses match this filter." />
      ) : (
        <div className="overflow-hidden rounded-lg border border-dash-border">
          <table className="w-full">
            <thead className="bg-dash-bg"><tr><th className="px-4 py-2 text-left text-xs font-medium text-dash-muted">Guest</th><th className="px-4 py-2 text-left text-xs font-medium text-dash-muted">Status</th><th className="px-4 py-2 text-left text-xs font-medium text-dash-muted">Plus Ones</th><th className="px-4 py-2 text-left text-xs font-medium text-dash-muted">Message</th><th className="px-4 py-2 text-left text-xs font-medium text-dash-muted">Responded</th><th className="px-4 py-2 text-right text-xs font-medium text-dash-muted">Actions</th></tr></thead>
            <tbody className="divide-y divide-dash-border bg-dash-surface">
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-2 text-sm text-dash-text">{r.guest_name ?? "—"}</td>
                  <td className="px-4 py-2"><Badge variant={r.status === "attending" ? "success" : r.status === "declined" ? "danger" : "default"}>{r.status}</Badge></td>
                  <td className="px-4 py-2 text-sm text-dash-muted">{r.plus_ones}</td>
                  <td className="px-4 py-2 text-sm text-dash-muted max-w-xs truncate">{r.message ?? "—"}</td>
                  <td className="px-4 py-2 text-xs text-dash-muted">{r.responded_at ? formatDateTime(r.responded_at) : "—"}</td>
                  <td className="px-4 py-2 text-right">
                    <select value={r.status} onChange={(e) => updateMutation.mutate({ id: r.id, status: e.target.value })} className="rounded border border-dash-border bg-dash-bg px-2 py-1 text-xs text-dash-text">
                      <option value="pending">Pending</option><option value="attending">Attending</option><option value="declined">Declined</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
