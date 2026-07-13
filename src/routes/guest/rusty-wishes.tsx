import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type EventMessage } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { formatDateShort } from "../../lib/utils";

export default function RustyWishes() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const { guestName } = useGuestAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");

  const { data: messages } = useQuery({
    queryKey: ["wishes", event.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("event_messages").select("*").eq("event_id", event.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data as EventMessage[];
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("event_messages").insert({ event_id: event.id, guest_name: guestName || "Guest", message });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["wishes", event.id] }); setMessage(""); },
    onError: (err: any) => alert("Failed to post wish: " + (err.message || "Unknown error")),
  });

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-serif text-center mb-6" style={{ color: "var(--event-primary)" }}>Wishes</h2>
      <div className="mb-6 p-4 rounded-xl" style={{ background: "var(--event-surface)", border: "2px solid var(--event-border)" }}>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Write a wish..." rows={3} className="w-full px-4 py-2.5 rounded-lg border bg-white mb-2" style={{ borderColor: "var(--event-border)" }} />
        <button onClick={() => submitMutation.mutate()} disabled={!message.trim()} className="px-6 py-2 rounded-lg text-white font-medium disabled:opacity-50" style={{ background: "var(--event-primary)" }}>Post Wish</button>
      </div>
      <div className="space-y-3">
        {messages?.map((m) => (
          <div key={m.id} className="p-4 rounded-lg" style={{ background: "var(--event-surface)", border: "1px solid var(--event-border)" }}>
            <p className="text-sm mb-1">{m.message}</p>
            <p className="text-xs event-muted-text">— {m.guest_name} on {formatDateShort(m.created_at)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
