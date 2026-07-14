import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type EventRsvp } from "../../lib/supabase";
import { Input, Select } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import {
  Card,
  Badge,
  EmptyState,
  LoadingSpinner,
  ErrorState,
} from "../../components/ui";
import { formatDateTime, cn } from "../../lib/utils";

const STATUS_CONFIG: Record<string, { label: string; variant: "success" | "danger" | "warning" | "default" }> = {
  attending: { label: "Attending", variant: "success" },
  not_attending: { label: "Not Attending", variant: "danger" },
  maybe: { label: "Maybe", variant: "warning" },
  pending: { label: "Pending", variant: "default" },
};

export default function RsvpPage() {
  const { event, eventId } = useOutletContext<{ event: UserEvent; eventId: string }>();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: rsvps, isLoading, isError, error } = useQuery({
    queryKey: ["rsvps", eventId],
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

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("event_rsvps").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rsvps", eventId] });
    },
  });

  const stats = {
    total: rsvps?.length ?? 0,
    attending: rsvps?.filter((r) => r.status === "attending").length ?? 0,
    notAttending: rsvps?.filter((r) => r.status === "not_attending").length ?? 0,
    maybe: rsvps?.filter((r) => r.status === "maybe").length ?? 0,
    totalPlusOnes: rsvps?.reduce((sum, r) => sum + (r.plus_ones ?? 0), 0) ?? 0,
  };

  const filtered = rsvps?.filter((r) => {
    const matchSearch = !search ||
      r.guest_name.toLowerCase().includes(search.toLowerCase()) ||
      (r.message ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-20">
        <ErrorState message={error?.message} />
      </div>
    );
  }

  const statCards = [
    { label: "Total RSVPs", value: stats.total, color: "text-dash-text" },
    { label: "Attending", value: stats.attending, color: "text-green-600" },
    { label: "Not Attending", value: stats.notAttending, color: "text-red-600" },
    { label: "Maybe", value: stats.maybe, color: "text-amber-600" },
    { label: "Plus Ones", value: stats.totalPlusOnes, color: "text-dash-primary" },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4">
      <div>
        <h2 className="text-lg font-semibold text-dash-text">RSVP Responses</h2>
        <p className="mt-1 text-sm text-dash-muted">
          View and manage RSVP responses for {event.name}.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {statCards.map((stat) => (
          <Card key={stat.label} className="p-4 text-center">
            <p className={cn("text-2xl font-bold", stat.color)}>{stat.value}</p>
            <p className="mt-1 text-xs text-dash-muted">{stat.label}</p>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          placeholder="Search by name or message..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="sm:w-40"
        >
          <option value="all">All statuses</option>
          <option value="attending">Attending</option>
          <option value="not_attending">Not Attending</option>
          <option value="maybe">Maybe</option>
          <option value="pending">Pending</option>
        </Select>
      </div>

      {/* List */}
      {filtered && filtered.length === 0 ? (
        <EmptyState
          title={rsvps && rsvps.length > 0 ? "No matching RSVPs" : "No RSVPs yet"}
          description={
            rsvps && rsvps.length > 0
              ? "Try adjusting your search or filter."
              : "RSVP responses will appear here once guests submit them."
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered?.map((rsvp) => {
            const statusCfg = STATUS_CONFIG[rsvp.status] ?? STATUS_CONFIG.pending;
            return (
              <Card key={rsvp.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <h3 className="text-base font-semibold text-dash-text">{rsvp.guest_name}</h3>
                      <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
                      {rsvp.plus_ones > 0 && (
                        <Badge variant="info">+{rsvp.plus_ones} guests</Badge>
                      )}
                    </div>
                    <p className="text-xs text-dash-muted">
                      Submitted: {formatDateTime(rsvp.submitted_at)}
                    </p>
                    {rsvp.dietary && (
                      <p className="mt-2 text-sm text-dash-text">
                        <span className="font-medium">Dietary:</span> {rsvp.dietary}
                      </p>
                    )}
                    {rsvp.message && (
                      <p className="mt-1 text-sm text-dash-text">
                        <span className="font-medium">Message:</span> {rsvp.message}
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteMutation.mutate(rsvp.id)}
                  >
                    Delete
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
