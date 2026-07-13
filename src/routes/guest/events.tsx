import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type {
  WeddingEvent,
  Rsvp,
  RsvpStatus,
  GuestEventInvite,
  EventKind,
} from "@/lib/supabase";
import { useGuestData } from "@/lib/use-guest-data";
import { Button } from "@/components/ui/Button";
import { Badge, Card, Modal, EmptyState } from "@/components/ui";
import { Input, Textarea, Label, Select } from "@/components/ui/Input";
import { formatDate, formatTime, formatDateShort } from "@/lib/utils";
import {
  Calendar,
  MapPin,
  Clock,
  Check,
  X,
  MinusCircle,
  UserPlus,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

const KIND_BADGE: Record<
  EventKind,
  { label: string; variant: "default" | "success" | "warning" | "danger" | "info" }
> = {
  ceremony: { label: "Ceremony", variant: "info" },
  reception: { label: "Reception", variant: "success" },
  welcome: { label: "Welcome", variant: "warning" },
  rehearsal: { label: "Rehearsal", variant: "default" },
  brunch: { label: "Brunch", variant: "warning" },
  cultural: { label: "Cultural", variant: "info" },
  other: { label: "Other", variant: "default" },
};

const RSVP_BADGE: Record<
  RsvpStatus,
  { label: string; variant: "default" | "success" | "warning" | "danger" | "info" }
> = {
  pending: { label: "Not Responded", variant: "default" },
  accepted: { label: "Attending", variant: "success" },
  declined: { label: "Not Attending", variant: "danger" },
  tentative: { label: "Maybe", variant: "warning" },
};

const STATUS_OPTIONS: { value: RsvpStatus; label: string }[] = [
  { value: "accepted", label: "Attending" },
  { value: "declined", label: "Not Attending" },
  { value: "tentative", label: "Maybe" },
];

type RsvpForm = {
  status: RsvpStatus;
  meal_choice: string;
  dietary_restrictions: string;
  plus_one_name: string;
  message: string;
};

/* ------------------------------------------------------------------ */
/* Main component                                                      */
/* ------------------------------------------------------------------ */

export function GuestEvents() {
  const { wedding, guest, loading } = useGuestData();

  const [events, setEvents] = useState<WeddingEvent[]>([]);
  const [invitedEvents, setInvitedEvents] = useState<WeddingEvent[]>([]);
  const [rsvps, setRsvps] = useState<Record<string, Rsvp>>({});
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // RSVP modal
  const [rsvpEvent, setRsvpEvent] = useState<WeddingEvent | null>(null);
  const [form, setForm] = useState<RsvpForm>({
    status: "pending",
    meal_choice: "",
    dietary_restrictions: "",
    plus_one_name: "",
    message: "",
  });
  const [saving, setSaving] = useState(false);

  /* ---------------------------------------------------------------- */
  /* Data fetching                                                    */
  /* ---------------------------------------------------------------- */

  const fetchData = useCallback(async () => {
    if (!wedding || !guest) return;
    setPageLoading(true);
    setError(null);

    try {
      // 1. All events for the wedding
      const { data: eventRows, error: evErr } = await supabase
        .from("events")
        .select("*")
        .eq("wedding_id", wedding.id)
        .order("sort_order");
      if (evErr) throw evErr;
      const allEvents = (eventRows ?? []) as WeddingEvent[];

      // 2. Guest's group memberships
      const { data: memberRows, error: mErr } = await supabase
        .from("guest_group_members")
        .select("group_id")
        .eq("guest_id", guest.id);
      if (mErr) throw mErr;
      const groupIds = (memberRows ?? []).map((m) => m.group_id);

      // 3. Group event invites
      let groupEventIds: string[] = [];
      if (groupIds.length > 0) {
        const { data: groupInvRows, error: giErr } = await supabase
          .from("group_event_invites")
          .select("event_id")
          .in("group_id", groupIds);
        if (giErr) throw giErr;
        groupEventIds = (groupInvRows ?? []).map((g) => g.event_id);
      }

      // 4. Guest event invites (manual include/exclude)
      const { data: guestInvRows, error: gErr } = await supabase
        .from("guest_event_invites")
        .select("*")
        .eq("guest_id", guest.id);
      if (gErr) throw gErr;
      const guestInvites = (guestInvRows ?? []) as GuestEventInvite[];

      // 5. Existing RSVPs
      const { data: rsvpRows, error: rErr } = await supabase
        .from("rsvps")
        .select("*")
        .eq("guest_id", guest.id);
      if (rErr) throw rErr;
      const rsvpMap: Record<string, Rsvp> = {};
      for (const r of (rsvpRows ?? []) as Rsvp[]) {
        if (r.event_id) rsvpMap[r.event_id] = r;
      }

      setEvents(allEvents);
      setRsvps(rsvpMap);

      // 6. Filter events using invitation precedence
      const invited = allEvents.filter((ev) => {
        const manual = guestInvites.find((gi) => gi.event_id === ev.id);
        if (manual) {
          // Manual exclude wins — not invited
          if (manual.invite_type === "exclude") return false;
          // Manual include — invited
          if (manual.invite_type === "include") return true;
        }
        // Group invite — invited
        if (groupEventIds.includes(ev.id)) return true;
        // Otherwise — not invited
        return false;
      });

      setInvitedEvents(invited);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load events.";
      setError(msg);
    } finally {
      setPageLoading(false);
    }
  }, [wedding, guest]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ---------------------------------------------------------------- */
  /* RSVP modal helpers                                               */
  /* ---------------------------------------------------------------- */

  const openRsvp = (ev: WeddingEvent) => {
    const existing = rsvps[ev.id];
    setRsvpEvent(ev);
    setForm({
      status: existing?.status ?? "pending",
      meal_choice: existing?.meal_choice ?? "",
      dietary_restrictions: existing?.dietary_restrictions ?? "",
      plus_one_name: existing?.plus_one_name ?? "",
      message: existing?.message ?? "",
    });
  };

  const closeRsvp = () => {
    setRsvpEvent(null);
    setSaving(false);
  };

  /* ---------------------------------------------------------------- */
  /* RSVP save (insert or update)                                      */
  /* ---------------------------------------------------------------- */

  const handleSaveRsvp = async () => {
    if (!rsvpEvent || !guest || !wedding) return;
    setSaving(true);
    setError(null);

    const existing = rsvps[rsvpEvent.id];
    const payload = {
      wedding_id: wedding.id,
      guest_id: guest.id,
      guest_name: guest.full_name,
      guest_email: guest.email,
      event_id: rsvpEvent.id,
      status: form.status,
      meal_choice: form.meal_choice.trim() || null,
      dietary_restrictions: form.dietary_restrictions.trim() || null,
      plus_one_name:
        guest.plus_one_allowed ? form.plus_one_name.trim() || null : null,
      message: form.message.trim() || null,
    };

    try {
      let result: Rsvp | null = null;

      if (existing) {
        // Update existing RSVP
        const { data, error: uErr } = await supabase
          .from("rsvps")
          .update(payload)
          .eq("guest_id", guest.id)
          .eq("event_id", rsvpEvent.id)
          .select()
          .single();
        if (uErr) throw uErr;
        result = data as Rsvp;
      } else {
        // Insert new RSVP
        const { data, error: iErr } = await supabase
          .from("rsvps")
          .insert(payload)
          .select()
          .single();
        if (iErr) throw iErr;
        result = data as Rsvp;
      }

      if (result) {
        setRsvps((prev) => ({ ...prev, [rsvpEvent.id]: result }));
      }
      closeRsvp();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save RSVP.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  /* ---------------------------------------------------------------- */
  /* Render: loading / error guards                                   */
  /* ---------------------------------------------------------------- */

  if (loading || pageLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-sepia">
        Loading events…
      </div>
    );
  }

  if (!wedding || !guest) {
    return (
      <div className="text-sepia text-sm">Unable to load your invitation.</div>
    );
  }

  /* ---------------------------------------------------------------- */
  /* Render: main                                                      */
  /* ---------------------------------------------------------------- */

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="text-center">
        <h1 className="text-3xl md:text-4xl font-serif text-onyx">Events</h1>
        <p className="text-sm text-sepia/70 mt-2 max-w-md mx-auto">
          Your invitation details and RSVP for each event in our celebration.
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-rose/40 bg-rose/10 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* ---------------------------------------------------------- */}
      {/* Event cards                                                */}
      {/* ---------------------------------------------------------- */}
      {invitedEvents.length === 0 ? (
        <Card>
          <EmptyState
            title="No events to show"
            description="You haven't been invited to any events yet, or invitations are still being prepared. Please check back soon."
          />
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {invitedEvents.map((ev) => {
            const kindBadge = KIND_BADGE[ev.kind] ?? KIND_BADGE.other;
            const rsvp = rsvps[ev.id];
            const rsvpBadge = rsvp
              ? RSVP_BADGE[rsvp.status] ?? RSVP_BADGE.pending
              : RSVP_BADGE.pending;
            const deadlinePassed =
              ev.rsvp_deadline != null &&
              new Date(ev.rsvp_deadline).getTime() <
                new Date().setHours(0, 0, 0, 0);

            return (
              <Card
                key={ev.id}
                className="group flex flex-col overflow-hidden p-0 transition-shadow hover:shadow-lg"
              >
                {/* Image header */}
                {ev.image_url ? (
                  <div className="relative h-40 overflow-hidden">
                    <img
                      src={ev.image_url}
                      alt={ev.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-onyx/50 via-onyx/10 to-transparent" />
                    <div className="absolute top-3 right-3">
                      <Badge variant={kindBadge.variant}>{kindBadge.label}</Badge>
                    </div>
                    {rsvp && (
                      <div className="absolute bottom-3 left-3">
                        <Badge variant={rsvpBadge.variant}>
                          {rsvpBadge.label}
                        </Badge>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between px-5 pt-5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sepia/10 text-sepia">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div className="flex items-center gap-2">
                      {rsvp && (
                        <Badge variant={rsvpBadge.variant}>
                          {rsvpBadge.label}
                        </Badge>
                      )}
                      <Badge variant={kindBadge.variant}>{kindBadge.label}</Badge>
                    </div>
                  </div>
                )}

                {/* Body */}
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="font-serif text-xl text-onyx">{ev.name}</h3>

                  <div className="mt-3 space-y-2 text-sm text-sepia/80">
                    {ev.starts_at && (
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 shrink-0 text-sepia/60" />
                          {formatDate(ev.starts_at)}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 shrink-0 text-sepia/60" />
                          {formatTime(ev.starts_at)}
                        </span>
                      </div>
                    )}
                    {ev.venue_name && (
                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 shrink-0 text-sepia/60 mt-0.5" />
                        <span className="min-w-0">
                          {ev.venue_name}
                          {ev.venue_address && (
                            <span className="block text-xs text-sepia/60">
                              {ev.venue_address}
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                    {ev.dress_code && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs uppercase tracking-widest text-sepia/50">
                          Dress Code
                        </span>
                        <span className="capitalize">{ev.dress_code}</span>
                      </div>
                    )}
                  </div>

                  {ev.description && (
                    <p className="mt-3 text-sm text-sepia/70 leading-relaxed">
                      {ev.description}
                    </p>
                  )}

                  {/* Meta row */}
                  <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-sepia/60">
                    {ev.rsvp_deadline && (
                      <span
                        className={
                          deadlinePassed ? "text-rose-600 font-medium" : ""
                        }
                      >
                        RSVP by {formatDateShort(ev.rsvp_deadline)}
                      </span>
                    )}
                    {ev.maps_url && (
                      <a
                        href={ev.maps_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sepia hover:text-onyx underline-offset-2 hover:underline"
                      >
                        <MapPin className="w-3 h-3" />
                        View on Map
                      </a>
                    )}
                  </div>

                  {/* Action */}
                  <div className="mt-5 flex items-center gap-2 border-t border-sand pt-4">
                    <Button
                      onClick={() => openRsvp(ev)}
                      variant={rsvp ? "outline" : "primary"}
                      size="sm"
                    >
                      {rsvp ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          Update RSVP
                        </>
                      ) : (
                        <>
                          <Calendar className="w-3.5 h-3.5" />
                          Respond to Invite
                        </>
                      )}
                    </Button>
                    {rsvp?.status === "accepted" && (
                      <span className="inline-flex items-center gap-1 text-xs text-green-700">
                        <Check className="w-3.5 h-3.5" />
                        You're going
                      </span>
                    )}
                    {rsvp?.status === "declined" && (
                      <span className="inline-flex items-center gap-1 text-xs text-red-600">
                        <X className="w-3.5 h-3.5" />
                        You declined
                      </span>
                    )}
                    {rsvp?.status === "tentative" && (
                      <span className="inline-flex items-center gap-1 text-xs text-yellow-700">
                        <MinusCircle className="w-3.5 h-3.5" />
                        Tentative
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ---------------------------------------------------------- */}
      {/* RSVP modal                                                 */}
      {/* ---------------------------------------------------------- */}
      <Modal
        open={!!rsvpEvent}
        onClose={closeRsvp}
        title={rsvpEvent ? `RSVP — ${rsvpEvent.name}` : "RSVP"}
        className="max-w-xl"
      >
        {rsvpEvent && (
          <div className="space-y-5">
            {/* Event summary */}
            <div className="rounded-md bg-mist px-4 py-3 text-sm text-sepia/80">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                {rsvpEvent.starts_at && (
                  <>
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-sepia/60" />
                      {formatDate(rsvpEvent.starts_at)}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-sepia/60" />
                      {formatTime(rsvpEvent.starts_at)}
                    </span>
                  </>
                )}
                {rsvpEvent.venue_name && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-sepia/60" />
                    {rsvpEvent.venue_name}
                  </span>
                )}
              </div>
              {rsvpEvent.rsvp_deadline && (
                <p className="mt-2 text-xs text-sepia/60">
                  Please respond by {formatDateShort(rsvpEvent.rsvp_deadline)}.
                </p>
              )}
            </div>

            {/* Status */}
            <div>
              <Label>Will you be attending?</Label>
              <Select
                value={form.status}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    status: e.target.value as RsvpStatus,
                  }))
                }
              >
                <option value="pending" disabled>
                  Select a response…
                </option>
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </div>

            {/* Meal choice */}
            <div>
              <Label>Meal Choice</Label>
              <Input
                value={form.meal_choice}
                onChange={(e) =>
                  setForm((p) => ({ ...p, meal_choice: e.target.value }))
                }
                placeholder="e.g. Beef, Chicken, Vegetarian"
              />
            </div>

            {/* Dietary restrictions */}
            <div>
              <Label>Dietary Restrictions</Label>
              <Textarea
                rows={2}
                value={form.dietary_restrictions}
                onChange={(e) =>
                  setForm((p) => ({ ...p, dietary_restrictions: e.target.value }))
                }
                placeholder="e.g. Gluten-free, nut allergy, vegan…"
              />
            </div>

            {/* Plus one (only if allowed) */}
            {guest.plus_one_allowed && (
              <div>
                <Label>
                  <span className="inline-flex items-center gap-1.5">
                    <UserPlus className="w-3.5 h-3.5" />
                    Plus One Name
                  </span>
                </Label>
                <Input
                  value={form.plus_one_name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, plus_one_name: e.target.value }))
                  }
                  placeholder="Your guest's full name"
                />
              </div>
            )}

            {/* Message */}
            <div>
              <Label>Message to the Couple</Label>
              <Textarea
                rows={3}
                value={form.message}
                onChange={(e) =>
                  setForm((p) => ({ ...p, message: e.target.value }))
                }
                placeholder="Share a note, song request, or well wishes…"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={closeRsvp} disabled={saving}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveRsvp}
                disabled={saving || form.status === "pending"}
              >
                {saving
                  ? "Saving…"
                  : rsvps[rsvpEvent.id]
                    ? "Update RSVP"
                    : "Send RSVP"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default GuestEvents;
