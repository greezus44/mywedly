import React, { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type EventRsvp } from "../../lib/supabase";
import {
  Card,
  Badge,
  Input,
  LoadingSpinner,
  ErrorState,
  EmptyState,
} from "../../components/ui";
import { formatDate, formatDateTime } from "../../lib/utils";
import type { EventOutletContext } from "./event-layout";

type StatusFilter = "all" | "yes" | "no" | "maybe";

export default function Rsvp() {
  const { event, eventId } = useOutletContext<EventOutletContext>();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");

  const { data: rsvps, isLoading, error, refetch } = useQuery({
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
    const attending = (rsvps ?? []).filter((r) => r.status === "yes").length;
    const notAttending = (rsvps ?? []).filter((r) => r.status === "no").length;
    const maybe = (rsvps ?? []).filter((r) => r.status === "maybe").length;
    const totalPlusOnes = (rsvps ?? [])
      .filter((r) => r.status === "yes")
      .reduce((sum, r) => sum + (r.plus_ones ?? 0), 0);
    return { total, attending, notAttending, maybe, totalPlusOnes };
  }, [rsvps]);

  const filtered = useMemo(() => {
    let list = rsvps ?? [];
    if (filter !== "all") {
      list = list.filter((r) => r.status === filter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.guest_name.toLowerCase().includes(q) ||
          (r.dietary ?? "").toLowerCase().includes(q) ||
          (r.message ?? "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [rsvps, filter, search]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <ErrorState
          title="Failed to load RSVPs"
          message={error.message}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl space-y-6 p-4">
        <div>
          <h2 className="text-lg font-semibold text-dash-text">RSVP Responses</h2>
          <p className="mt-1 text-sm text-dash-muted">
            Track and manage RSVP responses for {event.draft_name ?? event.name}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card className="p-4">
            <p className="text-xs font-medium text-dash-muted">Total RSVPs</p>
            <p className="mt-1 text-2xl font-bold text-dash-text">
              {stats.total}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-medium text-dash-muted">Attending</p>
            <p className="mt-1 text-2xl font-bold text-green-600">
              {stats.attending}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-medium text-dash-muted">Maybe</p>
            <p className="mt-1 text-2xl font-bold text-amber-600">
              {stats.maybe}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-medium text-dash-muted">Total Guests</p>
            <p className="mt-1 text-2xl font-bold text-dash-text">
              {stats.attending + stats.totalPlusOnes}
            </p>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, dietary, or message..."
            className="flex-1"
          />
          <div className="flex gap-1">
            {(["all", "yes", "no", "maybe"] as StatusFilter[]).map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`rounded-lg px-3 py-2 text-sm font-medium capitalize transition-colors ${
                  filter === s
                    ? "bg-dash-primary text-dash-primary-fg"
                    : "border border-dash-border text-dash-text hover:bg-dash-bg"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* RSVP list */}
        {filtered.length > 0 ? (
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
                          rsvp.status === "yes"
                            ? "success"
                            : rsvp.status === "no"
                            ? "danger"
                            : "warning"
                        }
                      >
                        {rsvp.status}
                      </Badge>
                      {rsvp.plus_ones != null && rsvp.plus_ones > 0 && (
                        <Badge>+{rsvp.plus_ones} guests</Badge>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-dash-muted">
                      Submitted {formatDateTime(rsvp.submitted_at)}
                    </p>
                    {rsvp.dietary && (
                      <p className="mt-2 text-sm text-dash-text">
                        <span className="font-medium">Dietary:</span>{" "}
                        {rsvp.dietary}
                      </p>
                    )}
                    {rsvp.message && (
                      <p className="mt-2 text-sm text-dash-text">
                        <span className="font-medium">Message:</span>{" "}
                        {rsvp.message}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            title={search || filter !== "all" ? "No matching RSVPs" : "No RSVPs yet"}
            description={
              search || filter !== "all"
                ? "Try adjusting your search or filter."
                : "RSVP responses will appear here once guests start responding."
            }
          />
        )}
      </div>
    </div>
  );
}
