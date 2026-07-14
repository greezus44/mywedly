import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type EventGuest } from "../../lib/supabase";
import { Input } from "../../components/ui/Input";

const STATUS_STYLES: Record<string, string> = {
  attending: "bg-green-100 text-green-700",
  declined: "bg-red-100 text-red-700",
  pending: "bg-gray-100 text-gray-600",
  maybe: "bg-yellow-100 text-yellow-700",
};

export function RsvpPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const [search, setSearch] = useState("");

  const { data: guests, isLoading } = useQuery({
    queryKey: ["guests", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_guests")
        .select("*")
        .eq("event_id", eventId!)
        .order("name", { ascending: true });
      if (error) throw error;
      return data as EventGuest[];
    },
    enabled: !!eventId,
  });

  const filtered = guests?.filter((g) => g.name.toLowerCase().includes(search.toLowerCase())) ?? [];

  const counts = {
    attending: guests?.filter((g) => g.rsvp_status === "attending").length ?? 0,
    declined: guests?.filter((g) => g.rsvp_status === "declined").length ?? 0,
    pending: guests?.filter((g) => g.rsvp_status === "pending").length ?? 0,
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-1">RSVPs</h2>
        <p className="text-sm text-gray-500">Track your guests' responses.</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-semibold text-green-600">{counts.attending}</p>
          <p className="text-xs text-gray-500 mt-1">Attending</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-semibold text-red-600">{counts.declined}</p>
          <p className="text-xs text-gray-500 mt-1">Declined</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-semibold text-gray-500">{counts.pending}</p>
          <p className="text-xs text-gray-500 mt-1">Pending</p>
        </div>
      </div>

      <Input placeholder="Search guests…" value={search} onChange={(e) => setSearch(e.target.value)} />

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading RSVPs…</p>
      ) : filtered.length > 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Name</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">RSVP</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Plus Ones</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Dietary</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Message</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((g) => (
                <tr key={g.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-2 text-gray-800">{g.name}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-0.5 rounded text-xs ${STATUS_STYLES[g.rsvp_status] ?? STATUS_STYLES.pending}`}>
                      {g.rsvp_status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-gray-600">{g.plus_ones}</td>
                  <td className="px-4 py-2 text-gray-600">{g.dietary || "—"}</td>
                  <td className="px-4 py-2 text-gray-600 max-w-xs truncate">{g.message || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-gray-500">No guests found.</p>
      )}
    </div>
  );
}
