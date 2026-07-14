import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type EventMessage } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { useGuestOutletContext } from "./guest-layout";
import { LoadingSpinner, ErrorState } from "../../components/ui";

export default function Wishes(): React.ReactElement {
  const { event } = useGuestOutletContext();
  const { guestName } = useGuestAuth();
  const queryClient = useQueryClient();
  const [name, setName] = useState(guestName ?? "");
  const [message, setMessage] = useState("");

  const { data: messages, isLoading, error } = useQuery({
    queryKey: ["guest-messages", event.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_messages")
        .select("*")
        .eq("event_id", event.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as EventMessage[];
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!message.trim() || !name.trim()) return;
      const { error } = await supabase.from("event_messages").insert({
        event_id: event.id,
        guest_name: name.trim(),
        message: message.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest-messages", event.id] });
      setMessage("");
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="guest-section">
        <ErrorState message={error.message} />
      </div>
    );
  }

  return (
    <div className="guest-section">
      {/* Header */}
      <div className="mx-auto max-w-2xl text-center animate-fadeIn">
        <p className="guest-eyebrow">Wishes</p>
        <h2 className="guest-title">Share Your Wishes</h2>
        <p className="guest-subtitle mt-2 mx-auto">
          Leave a message for the hosts and other guests to see.
        </p>
      </div>

      {/* Form */}
      <div className="mx-auto mt-12 max-w-xl">
        <div className="event-card animate-slideUp">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-event-muted mb-1.5">
                Your Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="event-input"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-event-muted mb-1.5">
                Your Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="event-input"
                rows={4}
                placeholder="Write your wish..."
              />
            </div>
            <button
              onClick={() => submitMutation.mutate()}
              disabled={!message.trim() || !name.trim() || submitMutation.isPending}
              className="event-btn-primary w-full disabled:opacity-50"
            >
              {submitMutation.isPending ? "Sending…" : "Send Wish"}
            </button>
            {submitMutation.isError && (
              <p className="text-sm text-red-500">Failed to send. Please try again.</p>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      {(messages ?? []).length > 0 && (
        <div className="mx-auto mt-12 max-w-2xl">
          <div className="grid gap-4">
            {(messages ?? []).map((msg, i) => (
              <div
                key={msg.id}
                className="event-card animate-slideUpStagger"
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                <p className="text-event-text">{msg.message}</p>
                <p className="mt-3 text-sm font-medium text-event-muted">— {msg.guest_name}</p>
                <p className="mt-1 text-xs text-event-muted">
                  {new Date(msg.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
