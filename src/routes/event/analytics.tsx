import React from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";

export function AnalyticsPage() {
  const { eventId } = useParams<{ eventId: string }>();

  const { data: event } = useQuery({
    queryKey: ["event", eventId],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_events").select("*").eq("id", eventId!).single();
      if (error) throw error;
      return data as UserEvent;
    },
    enabled: !!eventId,
  });

  const { data: guestCount } = useQuery({
    queryKey: ["guest-count", eventId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("event_guests")
        .select("id", { count: "exact", head: true })
        .eq("event_id", eventId!);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!eventId,
  });

  const { data: rsvpCount } = useQuery({
    queryKey: ["rsvp-count", eventId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("event_guests")
        .select("id", { count: "exact", head: true })
        .eq("event_id", eventId!)
        .in("rsvp_status", ["attending", "declined"]);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!eventId,
  });

  const { data: wishesCount } = useQuery({
    queryKey: ["wishes-count", eventId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("event_messages")
        .select("id", { count: "exact", head: true })
        .eq("event_id", eventId!);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!eventId,
  });

  if (!event) return <div>Loading…</div>;

  const stats = [
    { label: "Page Views", value: "—", note: "Coming soon" },
    { label: "Guests", value: guestCount ?? "—" },
    { label: "RSVPs", value: rsvpCount ?? "—" },
    { label: "Wishes", value: wishesCount ?? "—" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-1">Analytics</h2>
        <p className="text-sm text-gray-500">An overview of your event's activity.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-3xl font-semibold text-gray-800">{stat.value}</p>
            <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
            {stat.note && <p className="text-xs text-gray-400 mt-1">{stat.note}</p>}
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
        <p className="text-sm text-gray-500">
          Detailed analytics — including traffic sources and visitor trends — will appear here soon.
        </p>
      </div>
    </div>
  );
}
