import { useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Check, X, Clock, Users, MessageSquare } from "lucide-react";
import { supabase, type UserEvent, type EventRsvp } from "../../lib/supabase";
import { formatDateShort, formatTime12 } from "../../lib/utils";
import {
  Card,
  Badge,
  EmptyState,
  Skeleton,
  ErrorState,
} from "../../components/ui";

async function fetchRsvps(eventId: string): Promise<EventRsvp[]> {
  const { data, error } = await supabase
    .from("event_rsvps")
    .select("*")
    .eq("event_id", eventId)
    .order("submitted_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as EventRsvp[];
}

const STATUS_VARIANT: Record<string, "success" | "error" | "warning"> = {
  attending: "success",
  declined: "error",
  pending: "warning",
};

export default function RsvpPage() {
  const { event } = useOutletContext<{ event: UserEvent }>();

  const { data: rsvps, isLoading, error, refetch } = useQuery({
    queryKey: ["rsvps", event.id],
    queryFn: () => fetchRsvps(event.id),
  });

  const attending = rsvps?.filter((r) => r.status === "attending").length ?? 0;
  const declined = rsvps?.filter((r) => r.status === "declined").length ?? 0;
  const pending = rsvps?.filter((r) => r.status === "pending").length ?? 0;
  const total = rsvps?.length ?? 0;

  const stats = [
    { label: "Attending", value: attending, icon: Check, color: "text-green-600", bg: "bg-green-50" },
    { label: "Declined", value: declined, icon: X, color: "text-red-600", bg: "bg-red-50" },
    { label: "Pending", value: pending, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Total", value: total, icon: Users, color: "text-gray-900", bg: "bg-gray-50" },
  ];

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="mx-auto max-w-4xl space-y-6 p-4">
        <div>
          <h2 className="font-heading text-xl font-bold text-gray-900">
            RSVP Responses
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Track who's coming and who's not.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="p-4">
              <div className={`mb-2 inline-flex rounded-lg ${stat.bg} p-2`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-500">{stat.label}</p>
            </Card>
          ))}
        </div>

        {/* List */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        ) : error ? (
          <ErrorState
            message={error instanceof Error ? error.message : "Failed to load RSVPs"}
            onRetry={() => refetch()}
          />
        ) : !rsvps || rsvps.length === 0 ? (
          <EmptyState
            icon={<MessageSquare className="h-12 w-12" />}
            title="No RSVPs yet"
            description="RSVP responses will appear here once guests start responding."
          />
        ) : (
          <div className="space-y-3">
            {rsvps.map((rsvp) => (
              <Card key={rsvp.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-900">
                        {rsvp.guest_name}
                      </h3>
                      <Badge variant={STATUS_VARIANT[rsvp.status]}>
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
                      {formatDateShort(rsvp.submitted_at)} at{" "}
                      {formatTime12(
                        rsvp.submitted_at?.slice(11, 16) ?? null,
                      )}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
