import React, { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type EventRsvp } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card, LoadingSpinner, ErrorState, EmptyState, Badge, Modal, Textarea } from "../../components/ui";
import { formatDate, cn } from "../../lib/utils";
import type { EventOutletContext } from "./event-layout";

const STATUS_FILTERS = ["all", "attending", "declined", "pending"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

export default function Rsvp(): React.ReactElement {
  const { eventId } = useOutletContext<EventOutletContext>();
  const queryClient = useQueryClient();

  const [filter, setFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [viewing, setViewing] = useState<EventRsvp | null>(null);

  const { data: rsvps, isLoading, error } = useQuery({
    queryKey: ["event-rsvps", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_rsvps")
        .select("*")
        .eq("event_id", eventId)
        .order("submitted_at", { ascending: false });
      if (error) throw error;
      return data as EventRsvp[];
    },
  });

  const stats = useMemo(() => {
    const total = rsvps?.length ?? 0;
    const attending = rsvps?.filter((r) => r.status === "attending").length ?? 0;
    const declined = rsvps?.filter((r) => r.status === "declined").length ?? 0;
    const pending = rsvps?.filter((r) => r.status === "pending" || !r.status).length ?? 0;
    const totalPlusOnes = rsvps?.reduce((sum, r) => sum + (r.plus_ones || 0), 0) ?? 0;
    const totalAttendees = attending + totalPlusOnes;
    return { total, attending, declined, pending, totalPlusOnes, totalAttendees };
  }, [rsvps]);

  const filtered = useMemo(() => {
    if (!rsvps) return [];
    return rsvps.filter((r) => {
      if (filter !== "all" && r.status !== filter) return false;
      if (search && !r.guest_name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [rsvps, filter, search]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("event_rsvps").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-rsvps", eventId] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error.message} />;
  }

  const statCards = [
    { label: "Total RSVPs", value: stats.total, color: "text-dash-text" },
    { label: "Attending", value: stats.attending, color: "text-green-600" },
    { label: "Declined", value: stats.declined, color: "text-red-600" },
    { label: "Pending", value: stats.pending, color: "text-amber-600" },
    { label: "Plus Ones", value: stats.totalPlusOnes, color: "text-dash-primary" },
    { label: "Total Attendees", value: stats.totalAttendees, color: "text-dash-primary" },
  ];

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-dash-text">RSVP Responses</h2>
        <p className="mt-1 text-sm text-dash-muted">
          View and manage RSVP responses from your guests
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6 mb-6">
        {statCards.map((stat) => (
          <Card key={stat.label} className="text-center">
            <div className={cn("text-2xl font-bold", stat.color)}>{stat.value}</div>
            <div className="text-xs text-dash-muted mt-1">{stat.label}</div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex gap-1">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors",
                filter === f
                  ? "bg-dash-primary text-dash-primary-fg"
                  : "bg-dash-surface border border-dash-border text-dash-muted hover:bg-dash-bg",
              )}
            >
              {f}
            </button>
          ))}
        </div>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name..."
          className="sm:max-w-xs"
        />
      </div>

      {/* List */}
      {filtered.length > 0 ? (
        <div className="space-y-2">
          {filtered.map((rsvp) => (
            <Card key={rsvp.id} className="flex items-center justify-between gap-4 py-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-dash-text">{rsvp.guest_name}</span>
                  <Badge
                    variant={
                      rsvp.status === "attending" ? "success" :
                      rsvp.status === "declined" ? "danger" : "warning"
                    }
                  >
                    {rsvp.status || "pending"}
                  </Badge>
                  {rsvp.plus_ones > 0 && (
                    <Badge>+{rsvp.plus_ones} guest{rsvp.plus_ones > 1 ? "s" : ""}</Badge>
                  )}
                </div>
                {rsvp.dietary && (
                  <p className="text-xs text-dash-muted mt-1">Dietary: {rsvp.dietary}</p>
                )}
                {rsvp.message && (
                  <p className="text-xs text-dash-muted mt-1 truncate">"{rsvp.message}"</p>
                )}
                <p className="text-xs text-dash-muted mt-1">{formatDate(rsvp.submitted_at)}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="sm" onClick={() => setViewing(rsvp)}>
                  View
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  loading={deleteMutation.isPending}
                  onClick={() => {
                    if (confirm("Delete this RSVP?")) {
                      deleteMutation.mutate(rsvp.id);
                    }
                  }}
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState
            title="No RSVP responses"
            description="RSVP responses from your guests will appear here."
          />
        </Card>
      )}

      {/* Detail modal */}
      <Modal open={!!viewing} onClose={() => setViewing(null)} title="RSVP Details" size="md">
        {viewing && (
          <div className="space-y-3">
            <div>
              <span className="text-xs font-medium text-dash-muted">Guest</span>
              <p className="text-sm text-dash-text">{viewing.guest_name}</p>
            </div>
            <div>
              <span className="text-xs font-medium text-dash-muted">Status</span>
              <p className="text-sm">
                <Badge
                  variant={
                    viewing.status === "attending" ? "success" :
                    viewing.status === "declined" ? "danger" : "warning"
                  }
                >
                  {viewing.status || "pending"}
                </Badge>
              </p>
            </div>
            <div>
              <span className="text-xs font-medium text-dash-muted">Plus Ones</span>
              <p className="text-sm text-dash-text">{viewing.plus_ones}</p>
            </div>
            {viewing.dietary && (
              <div>
                <span className="text-xs font-medium text-dash-muted">Dietary Requirements</span>
                <p className="text-sm text-dash-text">{viewing.dietary}</p>
              </div>
            )}
            {viewing.message && (
              <div>
                <span className="text-xs font-medium text-dash-muted">Message</span>
                <Textarea value={viewing.message} readOnly rows={3} />
              </div>
            )}
            <div>
              <span className="text-xs font-medium text-dash-muted">Submitted</span>
              <p className="text-sm text-dash-text">{formatDate(viewing.submitted_at)}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
