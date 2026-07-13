import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type EventRsvp } from "../../lib/supabase";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Card, Badge, Modal, EmptyState, LoadingSpinner, ErrorState } from "../../components/ui";
import { formatDateTime, cn } from "../../lib/utils";

export default function Rsvp() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<EventRsvp | null>(null);

  const { data: rsvps, isLoading, error, refetch } = useQuery({
    queryKey: ["event_rsvps", event.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_rsvps")
        .select("*")
        .eq("event_id", event.id)
        .order("submitted_at", { ascending: false });
      if (error) throw error;
      return data as EventRsvp[];
    },
  });

  const stats = {
    accepted: rsvps?.filter((r) => r.status === "accepted").length ?? 0,
    declined: rsvps?.filter((r) => r.status === "declined").length ?? 0,
    pending: rsvps?.filter((r) => r.status === "pending").length ?? 0,
    total: rsvps?.length ?? 0,
  };

  const filtered = (rsvps ?? []).filter((r) => {
    if (filter !== "all" && r.status !== filter) return false;
    if (search && !r.guest_name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const statCards = [
    { label: "Accepted", value: stats.accepted, variant: "success" as const, color: "text-green-600" },
    { label: "Declined", value: stats.declined, variant: "danger" as const, color: "text-red-600" },
    { label: "Pending", value: stats.pending, variant: "warning" as const, color: "text-amber-600" },
    { label: "Total", value: stats.total, variant: "default" as const, color: "text-dash-text" },
  ];

  if (isLoading) return <div className="flex justify-center py-12"><LoadingSpinner className="h-8 w-8" /></div>;
  if (error) return <ErrorState message="Failed to load RSVPs." onRetry={() => refetch()} />;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-dash-text">RSVP Responses</h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Card key={card.label} className="p-4">
            <div className={cn("text-2xl font-bold", card.color)}>{card.value}</div>
            <div className="text-sm text-dash-muted mt-1">{card.label}</div>
          </Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <div className="flex gap-2">
          {["all", "accepted", "declined", "pending"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-2 rounded-lg text-sm font-medium capitalize transition-colors",
                filter === f
                  ? "bg-dash-primary text-dash-primary-fg"
                  : "bg-dash-surface text-dash-text border border-dash-border hover:bg-dash-bg",
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {!filtered || filtered.length === 0 ? (
        <EmptyState title="No RSVP responses" description="Responses will appear here once guests submit their RSVPs." />
      ) : (
        <div className="space-y-2">
          {filtered.map((rsvp) => (
            <Card key={rsvp.id} className="p-4">
              <button
                onClick={() => setSelected(rsvp)}
                className="w-full text-left flex items-start justify-between gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-dash-text">{rsvp.guest_name}</h3>
                    <Badge
                      variant={
                        rsvp.status === "accepted" ? "success" :
                        rsvp.status === "declined" ? "danger" : "warning"
                      }
                    >
                      {rsvp.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-dash-muted">
                    {rsvp.plus_ones > 0 && `${rsvp.plus_ones} plus one${rsvp.plus_ones > 1 ? "s" : ""} • `}
                    {formatDateTime(rsvp.submitted_at)}
                  </p>
                </div>
                <svg className="h-5 w-5 text-dash-muted shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </Card>
          ))}
        </div>
      )}

      <Modal open={!!selected} onClose={() => setSelected(null)} title="RSVP Details" size="md">
        {selected && (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-dash-muted">Guest</label>
              <p className="text-sm text-dash-text">{selected.guest_name}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-dash-muted">Status</label>
              <div className="mt-1">
                <Badge variant={selected.status === "accepted" ? "success" : selected.status === "declined" ? "danger" : "warning"}>
                  {selected.status}
                </Badge>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-dash-muted">Plus Ones</label>
              <p className="text-sm text-dash-text">{selected.plus_ones}</p>
            </div>
            {selected.dietary && (
              <div>
                <label className="text-xs font-medium text-dash-muted">Dietary Requirements</label>
                <p className="text-sm text-dash-text">{selected.dietary}</p>
              </div>
            )}
            {selected.message && (
              <div>
                <label className="text-xs font-medium text-dash-muted">Message</label>
                <p className="text-sm text-dash-text whitespace-pre-wrap">{selected.message}</p>
              </div>
            )}
            <div>
              <label className="text-xs font-medium text-dash-muted">Submitted</label>
              <p className="text-sm text-dash-text">{formatDateTime(selected.submitted_at)}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
