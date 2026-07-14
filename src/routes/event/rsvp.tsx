import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase, type EventRsvp } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import {
  Card,
  LoadingSpinner,
  ErrorState,
  EmptyState,
  Badge,
  Input,
} from "../../components/ui";
import { formatDate, formatTime12 } from "../../lib/utils";
import { useState } from "react";

export default function RsvpPage() {
  const { eventId } = useEventContext();
  const [search, setSearch] = useState("");

  const {
    data: rsvps,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
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

  const stats = useMemo(() => {
    const total = rsvps?.length ?? 0;
    const attending = rsvps?.filter((r) => r.status === "attending" || r.status === "yes").length ?? 0;
    const notAttending = rsvps?.filter((r) => r.status === "not_attending" || r.status === "no").length ?? 0;
    const maybe = rsvps?.filter((r) => r.status === "maybe").length ?? 0;
    const totalPlusOnes = rsvps?.reduce((sum, r) => sum + (r.plus_ones || 0), 0) ?? 0;
    return { total, attending, notAttending, maybe, totalPlusOnes };
  }, [rsvps]);

  const filtered = useMemo(() => {
    if (!rsvps) return [];
    if (!search.trim()) return rsvps;
    const q = search.toLowerCase();
    return rsvps.filter(
      (r) =>
        r.guest_name?.toLowerCase().includes(q) ||
        r.dietary?.toLowerCase().includes(q) ||
        r.message?.toLowerCase().includes(q)
    );
  }, [rsvps, search]);

  const statusBadge = (status: string) => {
    if (status === "attending" || status === "yes")
      return <Badge variant="success">Attending</Badge>;
    if (status === "not_attending" || status === "no")
      return <Badge variant="danger">Not Attending</Badge>;
    if (status === "maybe") return <Badge variant="warning">Maybe</Badge>;
    return <Badge>{status}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (isError) {
    return <ErrorState message={error?.message} onRetry={() => refetch()} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-dash-text">RSVP Responses</h1>
        <p className="text-sm text-dash-muted">View and manage guest RSVP responses.</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <p className="text-sm text-dash-muted">Total Responses</p>
          <p className="mt-1 text-3xl font-bold text-dash-text">{stats.total}</p>
        </Card>
        <Card>
          <p className="text-sm text-dash-muted">Attending</p>
          <p className="mt-1 text-3xl font-bold text-green-600">{stats.attending}</p>
        </Card>
        <Card>
          <p className="text-sm text-dash-muted">Not Attending</p>
          <p className="mt-1 text-3xl font-bold text-red-600">{stats.notAttending}</p>
        </Card>
        <Card>
          <p className="text-sm text-dash-muted">Maybe</p>
          <p className="mt-1 text-3xl font-bold text-amber-600">{stats.maybe}</p>
        </Card>
        <Card>
          <p className="text-sm text-dash-muted">Plus Ones</p>
          <p className="mt-1 text-3xl font-bold text-dash-text">{stats.totalPlusOnes}</p>
        </Card>
      </div>

      {/* Search */}
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name, dietary, or message..."
      />

      {/* Responses list */}
      {!filtered || filtered.length === 0 ? (
        <EmptyState
          title={search ? "No matching responses" : "No RSVP responses yet"}
          description={
            search
              ? "Try a different search term."
              : "RSVP responses from your guests will appear here."
          }
          icon={<span className="text-4xl">📋</span>}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((rsvp) => (
            <Card key={rsvp.id} className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-dash-text">
                      {rsvp.guest_name}
                    </h3>
                    {statusBadge(rsvp.status)}
                  </div>
                  <p className="mt-1 text-xs text-dash-muted">
                    Submitted: {formatDate(rsvp.submitted_at)}
                    {rsvp.submitted_at && ` at ${formatTime12(rsvp.submitted_at.split("T")[1]?.substring(0, 5) ?? null)}`}
                  </p>
                </div>
                {rsvp.plus_ones > 0 && (
                  <Badge variant="info">+{rsvp.plus_ones} guest{rsvp.plus_ones > 1 ? "s" : ""}</Badge>
                )}
              </div>
              {rsvp.dietary && (
                <div>
                  <span className="text-xs font-medium text-dash-muted">Dietary: </span>
                  <span className="text-sm text-dash-text">{rsvp.dietary}</span>
                </div>
              )}
              {rsvp.message && (
                <div className="rounded-md bg-dash-bg p-3">
                  <span className="text-xs font-medium text-dash-muted">Message: </span>
                  <p className="mt-1 text-sm text-dash-text">{rsvp.message}</p>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
