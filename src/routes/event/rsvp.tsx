import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useOutletContext } from "react-router-dom";
import { CheckCircle2, XCircle, Clock, Users } from "lucide-react";
import { supabase, type UserEvent, type EventRsvp } from "../../lib/supabase";
import { formatDateShort, formatTime12 } from "../../lib/utils";
import {
  Card,
  Badge,
  EmptyState,
  ErrorState,
  LoadingSpinner,
} from "../../components/ui";

const STATUS_BADGE: Record<string, "success" | "error" | "warning"> = {
  attending: "success",
  declined: "error",
  pending: "warning",
};

export default function RsvpPage() {
  const { event } = useOutletContext<{ event: UserEvent }>();

  const { data: rsvps, isLoading, error, refetch } = useQuery<EventRsvp[]>({
    queryKey: ["event-rsvps", event.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_rsvps")
        .select("*")
        .eq("event_id", event.id)
        .order("submitted_at", { ascending: false });

      if (error) throw error;
      return (data || []) as EventRsvp[];
    },
  });

  const attending = (rsvps || []).filter((r) => r.status === "attending").length;
  const declined = (rsvps || []).filter((r) => r.status === "declined").length;
  const pending = (rsvps || []).filter((r) => r.status === "pending").length;
  const total = (rsvps || []).length;

  const stats = [
    {
      label: "Attending",
      value: attending,
      icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
      color: "text-green-600",
    },
    {
      label: "Declined",
      value: declined,
      icon: <XCircle className="h-5 w-5 text-red-500" />,
      color: "text-red-600",
    },
    {
      label: "Pending",
      value: pending,
      icon: <Clock className="h-5 w-5 text-amber-500" />,
      color: "text-amber-600",
    },
    {
      label: "Total",
      value: total,
      icon: <Users className="h-5 w-5 text-gray-500" />,
      color: "text-gray-900",
    },
  ];

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">RSVPs</h1>
        <p className="mt-1 text-sm text-gray-500">
          Track responses from your guests
        </p>
      </div>

      {/* Stats cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((stat, idx) => (
          <Card key={idx} className="p-4">
            <div className="flex items-center gap-2">
              {stat.icon}
              <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
                {stat.label}
              </span>
            </div>
            <p className={`mt-2 text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </Card>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner className="h-8 w-8" />
        </div>
      ) : error ? (
        <ErrorState
          message={error instanceof Error ? error.message : "Failed to load RSVPs"}
          onRetry={() => refetch()}
        />
      ) : !rsvps || rsvps.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Users className="h-12 w-12" />}
            title="No RSVPs yet"
            description="RSVP responses from your guests will appear here."
          />
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {rsvps.map((rsvp) => (
            <Card key={rsvp.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-gray-900">
                      {rsvp.guest_name || "Unknown Guest"}
                    </h3>
                    <Badge variant={STATUS_BADGE[rsvp.status] || "default"}>
                      {rsvp.status}
                    </Badge>
                  </div>
                  {rsvp.plus_ones > 0 && (
                    <p className="mt-1 text-xs text-gray-500">
                      +{rsvp.plus_ones} guest{rsvp.plus_ones !== 1 ? "s" : ""}
                    </p>
                  )}
                  {rsvp.dietary && (
                    <p className="mt-1 text-xs text-gray-500">
                      Dietary: {rsvp.dietary}
                    </p>
                  )}
                  {rsvp.message && (
                    <p className="mt-2 rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-600">
                      "{rsvp.message}"
                    </p>
                  )}
                  <p className="mt-2 text-xs text-gray-400">
                    Submitted: {formatDateShort(rsvp.submitted_at)} at{" "}
                    {formatTime12(rsvp.submitted_at?.substring(11, 16))}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
