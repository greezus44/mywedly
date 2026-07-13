import { useCallback, useEffect, useMemo, useState } from "react";
import { Calendar, Clock, MapPin, User, Utensils, MessageSquare, Check, X, HelpCircle, Shirt, ExternalLink } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { WeddingEvent, Rsvp, GuestGroup } from "@/lib/supabase";
import { useGuestData } from "@/lib/use-guest-data";
import { getTheme, themeToCssVars } from "@/lib/theme";
import { formatDate, formatTime, cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Label, Select } from "@/components/ui/Input";
import { Card, Badge, Modal, EmptyState } from "@/components/ui";

type RsvpForm = {
  status: "accepted" | "declined" | "tentative";
  meal_choice: string;
  dietary_restrictions: string;
  plus_one_name: string;
  message: string;
};

type EventWithRsvp = {
  event: WeddingEvent;
  rsvp: Rsvp | null;
};

const STATUS_LABELS: Record<string, string> = {
  accepted: "Attending",
  declined: "Not Attending",
  tentative: "Maybe",
  pending: "Pending",
};

const STATUS_VARIANTS: Record<string, "success" | "danger" | "warning" | "default"> = {
  accepted: "success",
  declined: "danger",
  tentative: "warning",
  pending: "default",
};

const KIND_COLORS: Record<string, "success" | "info" | "warning" | "default" | "danger"> = {
  ceremony: "info",
  reception: "success",
  welcome: "default",
  rehearsal: "warning",
  brunch: "default",
  cultural: "danger",
  other: "default",
};

const MEAL_OPTIONS = ["Chicken", "Beef", "Fish", "Vegetarian", "Vegan"];

function emptyRsvpForm(): RsvpForm {
  return {
    status: "accepted",
    meal_choice: "",
    dietary_restrictions: "",
    plus_one_name: "",
    message: "",
  };
}

export function GuestEvents() {
  const { wedding, guest, loading } = useGuestData();

  const [events, setEvents] = useState<WeddingEvent[]>([]);
  const [rsvps, setRsvps] = useState<Rsvp[]>([]);
  const [invitedEventIds, setInvitedEventIds] = useState<Set<string>>(new Set());
  const [fetching, setFetching] = useState(true);
  const [rsvpModalEvent, setRsvpModalEvent] = useState<WeddingEvent | null>(null);
  const [rsvpForm, setRsvpForm] = useState<RsvpForm>(emptyRsvpForm());
  const [existingRsvp, setExistingRsvp] = useState<Rsvp | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const theme = useMemo(() => getTheme(wedding), [wedding]);
  const cssVars = useMemo(() => themeToCssVars(theme), [theme]);

  const weddingId = wedding?.id ?? null;
  const guestId = guest?.id ?? null;

  const fetchAll = useCallback(async () => {
    if (!weddingId) return;
    setFetching(true);

    const [evRes, rsvpRes] = await Promise.all([
      supabase.from("events").select("*").eq("wedding_id", weddingId).order("starts_at", { ascending: true }),
      guestId
        ? supabase.from("rsvps").select("*").eq("wedding_id", weddingId).eq("guest_id", guestId)
        : Promise.resolve({ data: null, error: null }),
    ]);

    const eventList = (evRes.data ?? []) as WeddingEvent[];
    const rsvpList = (rsvpRes.data ?? []) as Rsvp[];
    setEvents(eventList);
    setRsvps(rsvpList);

    // ── Determine which events this guest is invited to ──
    if (guestId) {
      // 1. Fetch all group IDs this guest belongs to
      const groupMemberRes = await supabase
        .from("guest_group_members")
        .select("group_id")
        .eq("guest_id", guestId);
      const groupIds = (groupMemberRes.data ?? []).map((r: { group_id: string }) => r.group_id);

      // Also check the guest.group_id field as a fallback
      if (guest?.group_id && !groupIds.includes(guest.group_id)) {
        groupIds.push(guest.group_id);
      }

      // 2. Fetch group event invites for those groups
      const groupInviteSet = new Set<string>();
      if (groupIds.length > 0) {
        const giRes = await supabase
          .from("group_event_invites")
          .select("event_id")
          .in("group_id", groupIds);
        (giRes.data ?? []).forEach((gi: { event_id: string }) => groupInviteSet.add(gi.event_id));
      }

      // 3. Fetch guest-specific event invites (overrides)
      const guestInviteMap = new Map<string, "include" | "exclude">();
      const gviRes = await supabase
        .from("guest_event_invites")
        .select("event_id, invite_type")
        .eq("guest_id", guestId);
      (gviRes.data ?? []).forEach((gi: { event_id: string; invite_type: string }) => {
        guestInviteMap.set(gi.event_id, gi.invite_type as "include" | "exclude");
      });

      // 4. Compute invited events using precedence:
      //    manual exclude > manual include > group invite > not invited
      const invited = new Set<string>();
      for (const event of eventList) {
        const override = guestInviteMap.get(event.id);
        if (override === "exclude") continue; // manual exclude wins
        if (override === "include") {
          invited.add(event.id);
          continue;
        }
        // No override — check group invite
        if (groupInviteSet.has(event.id)) {
          invited.add(event.id);
        }
      }
      setInvitedEventIds(invited);
    }

    setFetching(false);
  }, [weddingId, guestId, guest?.group_id]);

  useEffect(() => {
    if (weddingId) fetchAll();
  }, [weddingId, fetchAll]);

  // ── Build list of invited events with their RSVPs ──
  const eventsWithRsvps: EventWithRsvp[] = useMemo(() => {
    return events
      .filter((e) => invitedEventIds.has(e.id))
      .map((event) => ({
        event,
        rsvp: rsvps.find((r) => r.event_id === event.id) ?? null,
      }));
  }, [events, invitedEventIds, rsvps]);

  const openRsvpModal = (event: WeddingEvent) => {
    const existing = rsvps.find((r) => r.event_id === event.id) ?? null;
    setExistingRsvp(existing);
    setRsvpForm(
      existing
        ? {
            status: (existing.status as RsvpForm["status"]) || "accepted",
            meal_choice: existing.meal_choice ?? "",
            dietary_restrictions: existing.dietary_restrictions ?? "",
            plus_one_name: existing.plus_one_name ?? "",
            message: existing.message ?? "",
          }
        : emptyRsvpForm(),
    );
    setRsvpModalEvent(event);
  };

  const closeRsvpModal = () => {
    setRsvpModalEvent(null);
    setExistingRsvp(null);
    setRsvpForm(emptyRsvpForm());
  };

  const saveRsvp = async () => {
    if (!weddingId || !guestId || !rsvpModalEvent) return;
    setSaving(true);

    const row = {
      wedding_id: weddingId,
      guest_id: guestId,
      guest_name: guest?.full_name ?? "",
      guest_email: guest?.email ?? null,
      event_id: rsvpModalEvent.id,
      status: rsvpForm.status,
      meal_choice: rsvpForm.meal_choice || null,
      dietary_restrictions: rsvpForm.dietary_restrictions || null,
      plus_one_name: rsvpForm.plus_one_name || null,
      message: rsvpForm.message || null,
    };

    if (existingRsvp) {
      const { error } = await supabase.from("rsvps").update(row).eq("id", existingRsvp.id);
      setSaving(false);
      if (error) {
        setToast({ message: "Failed to update RSVP", type: "error" });
      } else {
        setToast({ message: "RSVP updated!", type: "success" });
        closeRsvpModal();
        await fetchAll();
      }
    } else {
      const { error } = await supabase.from("rsvps").insert(row);
      setSaving(false);
      if (error) {
        setToast({ message: "Failed to submit RSVP", type: "error" });
      } else {
        setToast({ message: "RSVP submitted!", type: "success" });
        closeRsvpModal();
        await fetchAll();
      }
    }
  };

  if (loading || fetching) {
    return (
      <div className="flex items-center justify-center py-24 text-sepia animate-fade-in">
        Loading events…
      </div>
    );
  }

  if (!wedding) {
    return <EmptyState title="Wedding Not Found" description="We couldn't find the wedding you're looking for." />;
  }

  return (
    <div style={cssVars as React.CSSProperties} className="animate-fade-in">
      {/* ── Header ── */}
      <section className="px-6 pt-16 pb-8 text-center" style={{ background: "var(--c-background)" }}>
        <p className="text-xs uppercase tracking-[0.3em] mb-3" style={{ color: "var(--c-textMuted)", fontFamily: "var(--f-body)" }}>
          Schedule
        </p>
        <h1 className="text-4xl md:text-5xl font-serif mb-3" style={{ color: "var(--c-text)", fontFamily: "var(--f-heading)", fontStyle: "var(--f-style)" }}>
          Wedding Events
        </h1>
        <p className="text-sm max-w-xl mx-auto" style={{ color: "var(--c-textMuted)", fontFamily: "var(--f-body)" }}>
          {guest ? `${guest.first_name || guest.full_name}, here are the events you're invited to. Please RSVP for each.` : "Here are the events for our celebration."}
        </p>
      </section>

      {/* ── Events grid ── */}
      <section className="px-6 pb-16 md:pb-24" style={{ background: "var(--c-background)" }}>
        <div className="max-w-5xl mx-auto">
          {eventsWithRsvps.length === 0 ? (
            <EmptyState
              title="No events available"
              description="Check back later for event details and RSVP."
            />
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {eventsWithRsvps.map(({ event, rsvp }) => (
                <Card
                  key={event.id}
                  className="overflow-hidden flex flex-col animate-fade-in"
                  style={{ borderColor: "var(--c-secondary)", background: "var(--c-card)" } as React.CSSProperties}
                >
                  {/* Event image or gradient header */}
                  {event.image_url ? (
                    <div className="relative h-40 overflow-hidden">
                      <img src={event.image_url} alt="" className="w-full h-full object-cover" />
                      <div className="absolute top-3 right-3">
                        <Badge variant={KIND_COLORS[event.kind] ?? "default"}>
                          {event.kind}
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="relative h-40 flex items-center justify-center"
                      style={{ background: "linear-gradient(135deg, var(--c-secondary), var(--c-accent))" }}
                    >
                      <Calendar className="w-10 h-10" style={{ color: "var(--c-primary)", opacity: 0.5 }} />
                      <div className="absolute top-3 right-3">
                        <Badge variant={KIND_COLORS[event.kind] ?? "default"}>
                          {event.kind}
                        </Badge>
                      </div>
                    </div>
                  )}

                  <div className="p-6 flex-1 flex flex-col">
                    <h3 className="text-xl font-serif mb-3" style={{ color: "var(--c-text)", fontFamily: "var(--f-heading)" }}>
                      {event.name}
                    </h3>

                    {event.description && (
                      <p className="text-sm mb-4 leading-relaxed" style={{ color: "var(--c-textMuted)", fontFamily: "var(--f-body)" }}>
                        {event.description}
                      </p>
                    )}

                    <div className="space-y-2 text-sm flex-1" style={{ fontFamily: "var(--f-body)" }}>
                      {event.starts_at && (
                        <div className="flex items-center gap-2" style={{ color: "var(--c-textMuted)" }}>
                          <Calendar className="w-4 h-4 shrink-0" />
                          <span>{formatDate(event.starts_at)}</span>
                        </div>
                      )}
                      {event.starts_at && (
                        <div className="flex items-center gap-2" style={{ color: "var(--c-textMuted)" }}>
                          <Clock className="w-4 h-4 shrink-0" />
                          <span>{formatTime(event.starts_at)}</span>
                        </div>
                      )}
                      {event.venue_name && (
                        <div className="flex items-center gap-2" style={{ color: "var(--c-textMuted)" }}>
                          <MapPin className="w-4 h-4 shrink-0" />
                          <span>{event.venue_name}</span>
                        </div>
                      )}
                      {event.venue_address && (
                        <div className="flex items-start gap-2" style={{ color: "var(--c-textMuted)" }}>
                          <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                          <span>{event.venue_address}</span>
                        </div>
                      )}
                      {event.dress_code && (
                        <div className="flex items-center gap-2" style={{ color: "var(--c-textMuted)" }}>
                          <Shirt className="w-4 h-4 shrink-0" />
                          <span>{event.dress_code}</span>
                        </div>
                      )}
                      {event.maps_url && (
                        <a
                          href={event.maps_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm hover:underline"
                          style={{ color: "var(--c-link)" }}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          View on map
                        </a>
                      )}
                    </div>

                    {/* RSVP status badge */}
                    {rsvp && (
                      <div className="mt-4 pt-4 border-t" style={{ borderColor: "var(--c-secondary)" }}>
                        <div className="flex items-center justify-between">
                          <span className="text-xs" style={{ color: "var(--c-textMuted)", fontFamily: "var(--f-body)" }}>
                            Your RSVP:
                          </span>
                          <Badge variant={STATUS_VARIANTS[rsvp.status] ?? "default"}>
                            {STATUS_LABELS[rsvp.status] ?? rsvp.status}
                          </Badge>
                        </div>
                      </div>
                    )}

                    {/* RSVP button */}
                    <div className="mt-4">
                      <Button
                        onClick={() => openRsvpModal(event)}
                        variant={rsvp ? "outline" : "primary"}
                        className="w-full"
                        style={
                          rsvp
                            ? { borderColor: "var(--c-secondary)", color: "var(--c-text)" }
                            : { background: "var(--c-button)", color: "var(--c-buttonText)" }
                        }
                      >
                        {rsvp ? "Update RSVP" : "RSVP Now"}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── RSVP Modal ── */}
      <Modal
        open={!!rsvpModalEvent}
        onClose={closeRsvpModal}
        title={`RSVP — ${rsvpModalEvent?.name ?? ""}`}
      >
        <div className="space-y-5">
          {/* Event quick info */}
          {rsvpModalEvent?.starts_at && (
            <div className="flex items-center gap-2 text-sm" style={{ color: "var(--c-textMuted)", fontFamily: "var(--f-body)" }}>
              <Calendar className="w-4 h-4" />
              <span>{formatDate(rsvpModalEvent.starts_at)} at {formatTime(rsvpModalEvent.starts_at)}</span>
            </div>
          )}

          {/* Status */}
          <div>
            <Label>Will you attend?</Label>
            <Select
              value={rsvpForm.status}
              onChange={(e) => setRsvpForm((f) => ({ ...f, status: e.target.value as RsvpForm["status"] }))}
            >
              <option value="accepted">Attending</option>
              <option value="declined">Not Attending</option>
              <option value="tentative">Maybe</option>
            </Select>
          </div>

          {/* Meal choice — only if attending or tentative */}
          {rsvpForm.status !== "declined" && (
            <>
              <div>
                <Label>Meal Choice</Label>
                <Select
                  value={rsvpForm.meal_choice}
                  onChange={(e) => setRsvpForm((f) => ({ ...f, meal_choice: e.target.value }))}
                >
                  <option value="">Select a meal…</option>
                  {MEAL_OPTIONS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </Select>
              </div>

              <div>
                <Label>Dietary Restrictions</Label>
                <Input
                  value={rsvpForm.dietary_restrictions}
                  onChange={(e) => setRsvpForm((f) => ({ ...f, dietary_restrictions: e.target.value }))}
                  placeholder="e.g. Gluten-free, nut allergy…"
                />
              </div>

              {/* Plus one — only if allowed */}
              {guest?.plus_one_allowed && (
                <div>
                  <Label>Plus One Name</Label>
                  <Input
                    value={rsvpForm.plus_one_name}
                    onChange={(e) => setRsvpForm((f) => ({ ...f, plus_one_name: e.target.value }))}
                    placeholder="Guest's full name"
                  />
                </div>
              )}
            </>
          )}

          {/* Message */}
          <div>
            <Label>Message to the couple (optional)</Label>
            <Textarea
              value={rsvpForm.message}
              onChange={(e) => setRsvpForm((f) => ({ ...f, message: e.target.value }))}
              placeholder="Share your excitement or a note for the couple…"
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={closeRsvpModal} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={saveRsvp} disabled={saving}>
              {saving ? "Saving…" : existingRsvp ? "Update RSVP" : "Submit RSVP"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Toast ── */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
          <div
            className={cn(
              "flex items-center gap-3 rounded-lg px-4 py-3 shadow-lg",
              toast.type === "success" ? "bg-onyx text-parchment" : "bg-red-600 text-white",
            )}
          >
            <span className="text-sm">{toast.message}</span>
            <button onClick={() => setToast(null)} className="opacity-60 hover:opacity-100">&times;</button>
          </div>
        </div>
      )}
    </div>
  );
}
