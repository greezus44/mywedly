import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase, type EventRsvp } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import {
  LoadingSpinner,
  ErrorState,
  Card,
  Badge,
  EmptyState,
} from "../../components/ui";
import { Input } from "../../components/ui/Input";
import { formatDateTime, cn } from "../../lib/utils";

async function fetchRsvps(eventId: string): Promise<EventRsvp[]> {
  const { data, error } = await supabase
    .from("event_rsvps")
    .select("*")
    .eq("event_id", eventId)
    .order("submitted_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as EventRsvp[];
}

export default function Rsvp() {
  const { eventId } = useEventContext();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "attending" | "declined" | "pending">("all");

  const { data: rsvps, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["event_rsvps", eventId],
    queryFn: () => fetchRsvps(eventId),
  });

  const stats = useMemo(() => {
    if (!rsvps) return { total: 0, attending: 0, declined: 0, pending: 0, plusOnes: 0 };
    const attending = rsvps.filter((r) => r.status === "attending").length;
    const declined = rsvps.filter((r) => r.status === "declined").length;
    const pending = rsvps.filter(
      (r) => r.status !== "attending" && r.status !== "declined"
    ).length;
    const plusOnes = rsvps.reduce((sum, r) => sum + (r.plus_ones ?? 0), 0);
    return { total: rsvps.length, attending, declined, pending, plusOnes };
  }, [rsvps]);

  const filtered = useMemo(() => {
    if (!rsvps) return [];
    return rsvps.filter((r) => {
      const matchesSearch =
        !search ||
        r.guest_name.toLowerCase().includes(search.toLowerCase()) ||
        (r.dietary ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (r.message ?? "").toLowerCase().includes(search.toLowerCase());
      const matchesFilter =
        filter === "all" ||
        (filter === "attending" && r.status === "attending") ||
        (filter === "declined" && r.status === "declined") ||
        (filter === "pending" &&
          r.status !== "attending" &&
          r.status !== "declined");
      return matchesSearch && matchesFilter;
    });
  }, [rsvps, search, filter]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8">
        <ErrorState
          message={error instanceof Error ? error.message : "Failed to load RSVPs"}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const statCards = [
    { label: "Total RSVPs", value: stats.total, color: "text-dash-primary" },
    { label: "Attending", value: stats.attending, color: "text-green-600" },
    { label: "Declined", value: stats.declined, color: "text-red-600" },
    { label: "Pending", value: stats.pending, color: "text-amber-600" },
    { label: "Plus Ones", value: stats.plusOnes, color: "text-purple-600" },
  ];

  return (
    <div className="mx-auto max-w-4xl p-4 lg:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-dash-text">RSVP Responses</h1>
        <p className="mt-1 text-sm text-dash-muted">
          View and manage RSVP submissions from your guests.
        </p>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {statCards.map((stat) => (
          <Card key={stat.label} className="p-4">
            <p className="text-xs font-medium text-dash-muted">{stat.label}</p>
            <p className={cn("mt-1 text-2xl font-bold", stat.color)}>
              {stat.value}
            </p>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, dietary, or message..."
          className="flex-1"
        />
        <div className="flex gap-1 rounded-lg border border-dash-border bg-dash-surface p-1">
          {(["all", "attending", "declined", "pending"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                filter === f
                  ? "bg-dash-primary text-dash-primary-fg"
                  : "text-dash-muted hover:text-dash-text"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
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
          {filtered.map((rsvp) => (
            <Card key={rsvp.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-dash-text">
                      {rsvp.guest_name}
                    </h3>
                    <Badge
                      variant={
                        rsvp.status === "attending"
                          ? "success"
                          : rsvp.status === "declined"
                          ? "danger"
                          : "warning"
                      }
                    >
                      {rsvp.status}
                    </Badge>
                    {rsvp.plus_ones > 0 && (
                      <Badge variant="info">+{rsvp.plus_ones}</Badge>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-dash-muted">
                    {formatDateTime(rsvp.submitted_at)}
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
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
