import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type EventGuest, type GuestGroup } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

interface GuestFormProps {
  guest?: EventGuest | null;
  onSave: () => void;
  onCancel: () => void;
}

export function GuestForm({ guest, onSave, onCancel }: GuestFormProps) {
  const { eventId } = useParams<{ eventId: string }>();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [groupId, setGroupId] = useState("");
  const [side, setSide] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: groups } = useQuery({
    queryKey: ["groups", eventId],
    queryFn: async () => {
      const { data, error } = await supabase.from("guest_groups").select("*").eq("event_id", eventId!).order("sort_order", { ascending: true });
      if (error) throw error;
      return data as GuestGroup[];
    },
    enabled: !!eventId,
  });

  useEffect(() => {
    if (guest) {
      setName(guest.name);
      setUsername(guest.username ?? "");
      setGroupId(guest.group_id ?? "");
      setSide(guest.side ?? "");
    }
  }, [guest]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventId) return;
    setSaving(true);
    setError(null);

    const payload = {
      event_id: eventId,
      name,
      username: username || null,
      group_id: groupId || null,
      group_name: groups?.find((g) => g.id === groupId)?.name ?? null,
      side: side || null,
    };

    let err;
    if (guest) {
      const res = await supabase.from("event_guests").update(payload).eq("id", guest.id);
      err = res.error;
    } else {
      const res = await supabase.from("event_guests").insert(payload);
      err = res.error;
    }

    setSaving(false);
    if (err) {
      setError(err.message);
    } else {
      onSave();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white border border-gray-200 rounded-lg p-4">
      <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
      <Input label="Username (for guest sign-in)" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g. john.smith" />
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Group</label>
        <select value={groupId} onChange={(e) => setGroupId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
          <option value="">No group</option>
          {groups?.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Side</label>
        <select value={side} onChange={(e) => setSide(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
          <option value="">None</option>
          <option value="bride">Bride</option>
          <option value="groom">Groom</option>
          <option value="both">Both</option>
        </select>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={saving}>{saving ? "Saving…" : guest ? "Update" : "Add"} Guest</Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}
