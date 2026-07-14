import { useState, useEffect } from "react";
import { useGuestOutletContext } from "./guest-layout";
import { useGuestAuth } from "../../lib/guest-auth";
import { supabase, type SubEvent, type EventRsvp } from "../../lib/supabase";
import { LoadingSpinner } from "../../components/ui";
import { Button } from "../../components/ui/Button";
import { isRsvpClosed, formatDateTime } from "../../lib/utils";

export default function GuestRsvp() {
  const { event, invitedSubEventIds } = useGuestOutletContext();
  const { guest } = useGuestAuth();
  const [subEvents, setSubEvents] = useState<SubEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [rsvps, setRsvps] = useState<Record<string, { status: string; plus_ones: number; plus_one_names: string[]; message: string }>>({});

  useEffect(() => {
    (async () => {
      if (!guest || invitedSubEventIds.length === 0) { setLoading(false); return; }
      try {
        const { data, error } = await supabase.from("sub_events").select("*").in("id", invitedSubEventIds).order("display_order", { ascending: true });
        if (error) throw error;
        setSubEvents((data ?? []) as SubEvent[]);

        const { data: existingRsvps } = await supabase.from("event_rsvps").select("*").eq("guest_id", guest.id).eq("event_id", event.id);
        const rsvpMap: Record<string, { status: string; plus_ones: number; plus_one_names: string[]; message: string }> = {};
        (existingRsvps ?? []).forEach((r) => {
          rsvpMap[r.sub_event_id ?? "main"] = { status: r.status, plus_ones: r.plus_ones, plus_one_names: r.plus_one_names ?? [], message: r.message ?? "" };
        });
        setRsvps(rsvpMap);
      } catch (e) { setError(e instanceof Error ? e.message : "Failed to load"); }
      finally { setLoading(false); }
    })();
  }, [guest, event.id, invitedSubEventIds]);

  const deadline = event.rsvp_deadline;
  const closed = isRsvpClosed(deadline);

  const updateRsvp = (subEventId: string, patch: Partial<{ status: string; plus_ones: number; plus_one_names: string[]; message: string }>) => {
    setRsvps((p) => ({ ...p, [subEventId]: { ...(p[subEventId] ?? { status: "pending", plus_ones: 0, plus_one_names: [], message: "" }), ...patch } }));
  };

  const handleSubmit = async () => {
    if (!guest) return;
    setSubmitting(true); setError(null); setSuccess(false);
    try {
      for (const se of subEvents) {
        const r = rsvps[se.id];
        if (!r || r.status === "pending") continue;
        const { data: existing } = await supabase.from("event_rsvps").select("id").eq("guest_id", guest.id).eq("sub_event_id", se.id).maybeSingle();
        const payload = { event_id: event.id, guest_id: guest.id, guest_name: guest.name, status: r.status, plus_ones: r.plus_ones, plus_one_names: r.plus_one_names, message: r.message || null, sub_event_id: se.id, submitted_at: new Date().toISOString(), responded_at: new Date().toISOString(), answers: {} };
        if (existing) { const { error } = await supabase.from("event_rsvps").update(payload).eq("id", existing.id); if (error) throw error; }
        else { const { error } = await supabase.from("event_rsvps").insert(payload); if (error) throw error; }
      }
      setSuccess(true);
    } catch (e) { setError(e instanceof Error ? e.message : "Failed to submit"); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div className="flex justify-center py-12"><LoadingSpinner /></div>;

  if (closed) return (
    <section className="guest-section text-center">
      <div className="mx-auto max-w-md">
        <h2 className="guest-title mb-3">RSVP Closed</h2>
        <p className="guest-subtitle">The RSVP deadline ({deadline ? formatDateTime(deadline) : ""}) has passed.</p>
      </div>
    </section>
  );

  if (subEvents.length === 0) return (
    <section className="guest-section text-center">
      <div className="mx-auto max-w-md">
        <h2 className="guest-title mb-3">No Events to RSVP</h2>
        <p className="guest-subtitle">There are no events requiring your RSVP at this time.</p>
      </div>
    </section>
  );

  return (
    <div>
      <section className="guest-section">
        <div className="mx-auto max-w-2xl">
          <h2 className="guest-title mb-6 text-center">RSVP</h2>
          {success && <p className="mb-4 text-center text-sm" style={{ color: "var(--event-primary)" }}>Your RSVP has been submitted. Thank you!</p>}
          {error && <p className="mb-4 text-center text-sm" style={{ color: "var(--event-primary)" }}>{error}</p>}
          <div className="space-y-6">
            {subEvents.map((se) => {
              const r = rsvps[se.id] ?? { status: "pending", plus_ones: 0, plus_one_names: [], message: "" };
              return (
                <div key={se.id} className="event-card">
                  <h3 className="mb-2" style={{ fontFamily: "var(--event-font-heading)", color: "var(--event-heading)" }}>{se.name}</h3>
                  <div className="mb-3 flex gap-2">
                    <button onClick={() => updateRsvp(se.id, { status: "attending" })} className={r.status === "attending" ? "event-btn-primary flex-1" : "event-btn-secondary flex-1"}>Attending</button>
                    <button onClick={() => updateRsvp(se.id, { status: "declined" })} className={r.status === "declined" ? "event-btn-primary flex-1" : "event-btn-secondary flex-1"}>Decline</button>
                  </div>
                  {r.status === "attending" && (
                    <div className="space-y-3">
                      <div>
                        <label className="mb-1 block text-sm" style={{ color: "var(--event-text)" }}>Number of plus ones</label>
                        <input type="number" min={0} max={5} value={r.plus_ones} onChange={(e) => updateRsvp(se.id, { plus_ones: Number(e.target.value) })} className="event-input" />
                      </div>
                      {r.plus_ones > 0 && Array.from({ length: r.plus_ones }).map((_, i) => (
                        <div key={i}>
                          <label className="mb-1 block text-sm" style={{ color: "var(--event-text)" }}>Plus one {i + 1} name</label>
                          <input value={r.plus_one_names[i] ?? ""} onChange={(e) => { const names = [...r.plus_one_names]; names[i] = e.target.value; updateRsvp(se.id, { plus_one_names: names }); }} className="event-input" placeholder="Name" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-4">
            <label className="mb-1 block text-sm" style={{ color: "var(--event-text)" }}>Message (optional)</label>
            <textarea value={rsvps[subEvents[0]?.id]?.message ?? ""} onChange={(e) => updateRsvp(subEvents[0]?.id ?? "", { message: e.target.value })} rows={3} className="event-input" placeholder="Leave a message for the couple..." />
          </div>
          <div className="mt-6 text-center">
            <Button onClick={handleSubmit} loading={submitting}>Submit RSVP</Button>
          </div>
        </div>
      </section>
    </div>
  );
}
