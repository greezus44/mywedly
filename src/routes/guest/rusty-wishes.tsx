import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type EventMessage } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { Button } from "../../components/ui/Button";

export default function RustyWishes() {
  const { slug } = useParams<{ slug: string }>();
  const { guest } = useGuestAuth();
  const qc = useQueryClient();
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const { data: event } = useQuery({
    queryKey: ["event_by_slug", slug],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_events").select("*").eq("slug", slug!).single();
      if (error) throw error;
      return data as UserEvent;
    },
    enabled: !!slug,
  });

  const { data: messages } = useQuery({
    queryKey: ["event_messages", event?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_messages")
        .select("*")
        .eq("event_id", event!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as EventMessage[];
    },
    enabled: !!event?.id,
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("event_messages").insert({
        event_id: event!.id,
        guest_name: guest?.name || "Guest",
        message,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setMessage("");
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
      qc.invalidateQueries({ queryKey: ["event_messages", event?.id] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    submitMutation.mutate();
  };

  const pageContent = event?.content as Record<string, unknown> | null;
  const wishesIntro = pageContent?.wishes as string ?? "";

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-semibold text-[var(--event-text)] mb-3" style={{ fontFamily: "var(--event-heading-font)" }}>
        Wishes
      </h1>

      {wishesIntro && (
        <div className="mb-5 text-[var(--event-text-muted)] text-sm" dangerouslySetInnerHTML={{ __html: wishesIntro }} />
      )}

      <form onSubmit={handleSubmit} className="mb-6 space-y-3">
        <div>
          <label className="block text-sm font-medium text-[var(--event-text-muted)] mb-1">Your Name</label>
          <input
            type="text"
            value={guest?.name || ""}
            readOnly
            className="w-full px-3 py-2 border border-[var(--event-border)] rounded-lg text-sm bg-[var(--event-surface)] text-[var(--event-text)]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--event-text-muted)] mb-1">Your Wish</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write a heartfelt message for the couple…"
            rows={4}
            className="w-full px-3 py-2 border border-[var(--event-border)] rounded-lg text-sm bg-[var(--event-surface)] text-[var(--event-text)] focus:outline-none focus:ring-2 focus:ring-[var(--event-primary)]"
          />
        </div>
        <Button type="submit" disabled={submitMutation.isPending || !message.trim()}>
          {submitMutation.isPending ? "Sending…" : "Send Wish"}
        </Button>
        {submitted && <p className="text-sm text-green-600">Thank you! Your wish has been sent.</p>}
        {submitMutation.isError && <p className="text-sm text-red-500">Failed to send wish. Please try again.</p>}
      </form>

      <div className="space-y-3">
        <h2 className="text-lg font-medium text-[var(--event-text)]" style={{ fontFamily: "var(--event-heading-font)" }}>
          Recent Wishes
        </h2>
        {messages && messages.length > 0 ? (
          messages.map((msg) => (
            <div key={msg.id} className="bg-[var(--event-surface)] border border-[var(--event-border)] rounded-lg p-4">
              <p className="text-sm font-medium text-[var(--event-text)]">{msg.guest_name}</p>
              <p className="text-sm text-[var(--event-text-muted)] mt-1">{msg.message}</p>
              <p className="text-xs text-[var(--event-text-muted)] mt-2">{new Date(msg.created_at).toLocaleDateString()}</p>
            </div>
          ))
        ) : (
          <p className="text-sm text-[var(--event-text-muted)]">No wishes yet. Be the first to send one!</p>
        )}
      </div>
    </div>
  );
}
