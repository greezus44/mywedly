import { useState, useEffect } from "react";
import { useGuestOutletContext } from "./guest-layout";
import { useGuestAuth } from "../../lib/guest-auth";
import { supabase, type SubEvent, type EventRsvp } from "../../lib/supabase";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDate, formatTime12, isRsvpClosed } from "../../lib/utils";
import { cn } from "../../lib/utils";

export default function GuestRsvp() {
  const { event, slug, invitedSubEventIds } = useGuestOutletContext();
  const { guest } = useGuestAuth();
  const queryClient = useQueryClient();

  const { data: subEvents, isLoading } = useQuery({
    queryKey: ["sub-events", event.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sub_events")
        .select("*")
        .eq("parent_event_id", event.id)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as SubEvent[];
    },
  });

  const { data: existingRsvps } = useQuery({
    queryKey: ["guest-rsvps", event.id, guest?.id],
    queryFn: async () => {
      if (!guest) return [];
      const { data, error } = await supabase
        .from("event_rsvps")
        .select("*")
        .eq("event_id", event.id)
        .eq("guest_id", guest.id);
      if (error) throw error;
      return data as EventRsvp[];
    },
    enabled: !!guest,
  });

  const invitedSubEvents = (subEvents ?? []).filter((se) => invitedSubEventIds.includes(se.id));
  const [responses, setResponses] = useState<Record<string, { status: string; plusOneNames: string[]; message: string }>>({});

  useEffect(() => {
    if (existingRsvps && invitedSubEvents.length > 0) {
      const map: Record<string, { status: string; plusOneNames: string[]; message: string }> = {};
      invitedSubEvents.forEach((se) => {
        const existing = existingRsvps.find((r) => r.sub_event_id === se.id);
        map[se.id] = {
          status: existing?.status ?? "pending",
          plusOneNames: existing?.plus_one_names ?? [],
          message: existing?.message ?? "",
        };
      });
      setResponses(map);
    }
  }, [existingRsvps, invitedSubEvents]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!guest) throw new Error("Not authenticated");
      for (const se of invitedSubEvents) {
        const resp = responses[se.id];
        if (!resp || resp.status === "pending") continue;
        const existing = existingRsvps?.find((r) => r.sub_event_id === se.id);
        const payload = {
          event_id: event.id,
          guest_id: guest.id,
          guest_name: guest.name,
          status: resp.status,
          plus_one_names: resp.plusOneNames,
          message: resp.message || null,
          sub_event_id: se.id,
        };
        if (existing) {
          const { error } = await supabase.from("event_rsvps").update(payload).eq("id", existing.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from("event_rsvps").insert(payload);
          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest-rsvps", event.id, guest?.id] });
      queryClient.invalidateQueries({ queryKey: ["event-rsvps", event.id] });
    },
  });

  const [saved, setSaved] = useState(false);
  const handleSave = async () => {
    await saveMutation.mutateAsync();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--event-primary)] border-t-transparent" />
      </div>
    );
  }

  if (invitedSubEvents.length === 0) {
    return (
      <div className="guest-section text-center">
        <div className="mx-auto max-w-md">
          <h1 className="guest-title mb-2">RSVP</h1>
          <p className="guest-subtitle">You have not been invited to any events yet.</p>
        </div>
      </div>
    );
  }

  const rsvpDeadline = event.rsvp_deadline ?? event.draft_rsvp_deadline;
  const closed = isRsvpClosed(rsvpDeadline);

  return (
    <div>
      <section className="guest-section">
        <div className="mx-auto max-w-2xl">
          <h1 className="guest-title mb-2 text-center">RSVP</h1>
          {closed && (
            <p className="mb-4 text-center text-sm" style={{ color: "var(--event-primary)" }}>
              RSVP deadline has passed.
            </p>
          )}

          <div className="space-y-6">
            {invitedSubEvents.map((se) => {
              const resp = responses[se.id] ?? { status: "pending", plusOneNames: [], message: "" };
              const closedForThis = isRsvpClosed(se.rsvp_deadline) || closed;
              return (
                <div key={se.id} className="event-card">
                  <h2 className="guest-title mb-1">{se.name}</h2>
                  {se.date && (
                    <p className="mb-3 text-sm" style={{ color: "var(--event-muted)" }}>
                      {formatDate(se.date)}{se.time ? ` at ${formatTime12(se.time)}` : ""}
                    </p>
                  )}
                  {se.venue && <p className="mb-3 text-sm" style={{ color: "var(--event-muted)" }}>{se.venue}</p>}

                  <div className="flex gap-3">
                    <button
                      type="button"
                      disabled={closedForThis}
                      onClick={() => setResponses((p) => ({ ...p, [se.id]: { ...resp, status: "attending" } }))}
                      className={cn("flex-1 rounded-lg border-2 px-4 py-2 text-sm font-medium transition-all", resp.status === "attending" ? "border-[var(--event-primary)] bg-[var(--event-primary)] text-[var(--event-primary-fg)]" : "border-[var(--event-border)] text-[var(--event-text)] hover:bg-[var(--event-surface-alt)]", closedForThis && "opacity-50 cursor-not-allowed")}
                    >
                      ✓ Attending
                    </button>
                    <button
                      type="button"
                      disabled={closedForThis}
                      onClick={() => setResponses((p) => ({ ...p, [se.id]: { ...resp, status: "declined" } }))}
                      className={cn("flex-1 rounded-lg border-2 px-4 py-2 text-sm font-medium transition-all", resp.status === "declined" ? "border-[var(--event-primary)] bg-[var(--event-surface-alt)] text-[var(--event-text)]" : "border-[var(--event-border)] text-[var(--event-text)] hover:bg-[var(--event-surface-alt)]", closedForThis && "opacity-50 cursor-not-allowed")}
                    >
                      ✗ Cannot Attend
                    </button>
                  </div>

                  {resp.status === "attending" && (
                    <div className="mt-4 space-y-3">
                      <div>
                        <label className="mb-1 block text-sm font-medium" style={{ color: "var(--event-text)" }}>
                          Plus-one names (one per line)
                        </label>
                        <textarea
                          value={resp.plusOneNames.join("\n")}
                          onChange={(e) => setResponses((p) => ({ ...p, [se.id]: { ...resp, plusOneNames: e.target.value.split("\n").filter(Boolean) } }))}
                          rows={2}
                          className="event-input"
                          placeholder="Enter names of your plus ones"
                        />
                      </div>
                    </div>
                  )}

                  <div className="mt-3">
                    <label className="mb-1 block text-sm font-medium" style={{ color: "var(--event-text)" }}>
                      Message (optional)
                    </label>
                    <textarea
                      value={resp.message}
                      onChange={(e) => setResponses((p) => ({ ...p, [se.id]: { ...resp, message: e.target.value } }))}
                      rows={2}
                      className="event-input"
                      placeholder="Leave a message for the hosts"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 text-center">
            {saved && <p className="mb-2 text-sm" style={{ color: "var(--event-primary)" }}>RSVP saved! Thank you.</p>}
            <button
              type="button"
              onClick={handleSave}
              disabled={saveMutation.isPending || closed}
              className="event-btn-primary"
              style={{ opacity: closed ? 0.5 : 1 }}
            >
              {saveMutation.isPending ? "Saving..." : "Submit RSVP"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
