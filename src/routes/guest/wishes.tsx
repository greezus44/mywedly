import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type EventMessage } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { Button } from "../../components/ui/Button";
import { Textarea } from "../../components/ui";
import { timeAgo } from "../../lib/utils";

export default function GuestWishes() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const { guestName } = useGuestAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");

  const { data: messages } = useQuery({
    queryKey: ["messages", event.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("event_messages").select("*").eq("event_id", event.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data as EventMessage[];
    },
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("event_messages").insert({ event_id: event.id, guest_name: guestName || "Anonymous", message });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["messages", event.id] }); setMessage(""); },
    onError: (err: any) => alert("Failed to send: " + (err.message || "Unknown error")),
  });

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-serif text-center mb-6" style={{ color: "var(--event-primary)" }}>Guest Wishes</h2>
        <div className="mb-6">
          <Textarea placeholder="Write your wishes..." value={message} onChange={(e) => setMessage(e.target.value)} rows={3} />
          <Button onClick={() => sendMutation.mutate()} loading={sendMutation.isPending} disabled={!message.trim()} className="mt-2">Send Wish</Button>
        </div>
        <div className="space-y-3">
          {messages?.map((m) => (
            <div key={m.id} className="p-4 rounded-lg border" style={{ borderColor: "var(--event-border)", background: "var(--event-surface)" }}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium">{m.guest_name}</span>
                <span className="text-xs" style={{ color: "var(--event-muted)" }}>{timeAgo(m.created_at)}</span>
              </div>
              <p className="text-sm" style={{ color: "var(--event-text)" }}>{m.message}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
