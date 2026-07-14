import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type EventGuest, type GuestGroup } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { GuestForm } from "./guest-form";

export function GuestsPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingGuest, setEditingGuest] = useState<EventGuest | null>(null);
  const [search, setSearch] = useState("");

  const { data: guests, isLoading } = useQuery({
    queryKey: ["guests", eventId],
    queryFn: async () => {
      const { data, error } = await supabase.from("event_guests").select("*").eq("event_id", eventId!).order("name", { ascending: true });
      if (error) throw error;
      return data as EventGuest[];
    },
    enabled: !!eventId,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("event_guests").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["guests", eventId] }),
  });

  const filtered = guests?.filter((g) => g.name.toLowerCase().includes(search.toLowerCase())) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Guests</h2>
          <p className="text-sm text-gray-500">{guests?.length ?? 0} total guests</p>
        </div>
        <Button onClick={() => { setEditingGuest(null); setShowForm(!showForm); }}>
          {showForm ? "Cancel" : "Add Guest"}
        </Button>
      </div>

      {showForm && (
        <GuestForm
          guest={editingGuest}
          onSave={() => { setShowForm(false); setEditingGuest(null); qc.invalidateQueries({ queryKey: ["guests", eventId] }); }}
          onCancel={() => { setShowForm(false); setEditingGuest(null); }}
        />
      )}

      <Input placeholder="Search guests…" value={search} onChange={(e) => setSearch(e.target.value)} />

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading guests…</p>
      ) : filtered.length > 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Name</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Username</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Group</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Side</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">RSVP</th>
                <th className="text-right px-4 py-2 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((g) => (
                <tr key={g.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-2 text-gray-800">{g.name}</td>
                  <td className="px-4 py-2 text-gray-600">{g.username || "—"}</td>
                  <td className="px-4 py-2 text-gray-600">{g.group_name || "—"}</td>
                  <td className="px-4 py-2 text-gray-600">{g.side || "—"}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      g.rsvp_status === "attending" ? "bg-green-100 text-green-700" :
                      g.rsvp_status === "declined" ? "bg-red-100 text-red-700" :
                      "bg-gray-100 text-gray-600"
                    }`}>
                      {g.rsvp_status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button onClick={() => { setEditingGuest(g); setShowForm(true); }} className="text-xs text-[var(--event-primary,#8B7355)] hover:underline mr-2">Edit</button>
                    <button onClick={() => { if (confirm("Delete this guest?")) deleteMutation.mutate(g.id); }} className="text-xs text-red-500 hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-gray-500">No guests yet. Add your first guest to get started.</p>
      )}
    </div>
  );
}
