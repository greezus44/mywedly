import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type SubEvent, type ScheduleItem, type EventRsvp, type GuestEventInvite, type GroupEventInvite, type GuestGroupMember } from "../../lib/supabase";
import { cn, formatDate, formatTime, isRsvpClosed } from "../../lib/utils";
import { useGuestAuth } from "../../lib/guest-auth";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Input";
import { CalendarCheck, Check, X, Clock, Lock, CalendarDays, MapPin } from "lucide-react";

interface OutletContext {
  event: UserEvent;
  subEvents: SubEvent[];
  schedule: ScheduleItem[];
}

interface RsvpFormState {
  status: "attending" | "declined" | "pending";
  plus_ones: number;
  dietary: string;
  message: string;
}

const emptyForm: RsvpFormState = {
  status: "pending",
  plus_ones: 0,
  dietary: "",
  message: "",
};

export default function GuestRsvp() {
  const { event, subEvents } = useOutletContext<OutletContext>();
  const { guestName } = useGuestAuth();
  const queryClient = useQueryClient();

  // Determine which sub-events this guest is invited to (same logic as home)
  const { data: visibleSubEvents } = useQuery({
    queryKey: ["rsvp-visible-sub-events", event.id, guestName],
    queryFn: async () => {
      if (subEvents.length === 0) return [] as SubEvent[];

      const { data: guestRow } = await supabase
        .from("event_guests")
        .select("id")
        .ilike("name", guestName || "")
        .eq("event_id", event.id)
        .maybeSingle();

      let allowedIds: Set<string> | null = null;

      if (guestRow) {
        const { data: guestInvites } = await supabase
          .from("guest_event_invites")
          .select("*")
          .eq("guest_id", guestRow.id)
          .eq("event_id", event.id);
        if (guestInvites && guestInvites.length > 0) {
          allowedIds = new Set<string>();
          const hasNull = guestInvites.some((i: GuestEventInvite) => i.sub_event_id === null);
          if (hasNull) return subEvents;
          guestInvites.forEach((i: GuestEventInvite) => {
            if (i.sub_event_id) allowedIds!.add(i.sub_event_id);
          });
        }

        const { data: memberships } = await supabase
          .from("guest_group_members")
          .select("group_id")
          .eq("guest_id", guestRow.id);
        if (memberships && memberships.length > 0) {
          const groupIds = memberships.map((m) => m.group_id);
          const { data: groupInvites } = await supabase
            .from("group_event_invites")
            .select("*")
            .in("group_id", groupIds)
            .eq("event_id", event.id);
          if (groupInvites && groupInvites.length > 0) {
            if (!allowedIds) allowedIds = new Set<string>();
            const hasNull = groupInvites.some((i: GroupEventInvite) => i.sub_event_id === null);
            if (hasNull) return subEvents;
            groupInvites.forEach((i: GroupEventInvite) => {
              if (i.sub_event_id) allowedIds!.add(i.sub_event_id);
            });
          }
        }
      }

      if (!allowedIds || allowedIds.size === 0) return subEvents;
      return subEvents.filter((s) => allowedIds!.has(s.id));
    },
    enabled: subEvents.length > 0,
    initialData: subEvents,
  });

  const subEventsToRsvp = visibleSubEvents || subEvents;
  const hasSubEvents = subEventsToRsvp.length > 0;

  // Fetch existing RSVPs for this guest
  const { data: existingRsvps = [] } = useQuery({
    queryKey: ["guest-rsvps", event.id, guestName],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_rsvps")
        .select("*")
        .eq("event_id", event.id)
        .ilike("guest_name", guestName || "")
        .order("submitted_at", { ascending: false });
      if (error) throw error;
      return (data as EventRsvp[]) || [];
    },
    enabled: !!guestName,
  });

  // Form state: one per sub-event, plus one for null (no sub-events)
  const [forms, setForms] = useState<Record<string, RsvpFormState>>({});

  useEffect(() => {
    const newForms: Record<string, RsvpFormState> = {};
    const keys = hasSubEvents ? subEventsToRsvp.map((s) => s.id) : ["main"];
    keys.forEach((key) => {
      const existing = existingRsvps.find((r) => {
        if (key === "main") return r.sub_event_id === null;
        return r.sub_event_id === key;
      });
      newForms[key] = existing
        ? {
            status: existing.status,
            plus_ones: existing.plus_ones,
            dietary: existing.dietary || "",
            message: existing.message || "",
          }
        : { ...emptyForm };
    });
    setForms(newForms);
  }, [existingRsvps, hasSubEvents, subEventsToRsvp]);

  const submitMutation = useMutation({
    mutationFn: async (subEventId: string | null) => {
      const key = subEventId || "main";
      const form = forms[key];
      if (!form || form.status === "pending") throw new Error("Please choose Attending or Declined.");

      const payload = {
        event_id: event.id,
        sub_event_id: subEventId,
        guest_name: guestName || "Anonymous",
        status: form.status,
        plus_ones: form.plus_ones,
        dietary: form.dietary,
        message: form.message,
        submitted_at: new Date().toISOString(),
      };

      // Upsert: check if existing RSVP exists for this guest + sub_event
      const { data: existing } = await supabase
        .from("event_rsvps")
        .select("id")
        .eq("event_id", event.id)
        .ilike("guest_name", guestName || "")
        .is("sub_event_id", subEventId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase.from("event_rsvps").update(payload).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("event_rsvps").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest-rsvps", event.id, guestName] });
    },
  });

  const updateForm = (key: string, patch: Partial<RsvpFormState>) => {
    setForms((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  };

  const eventClosed = isRsvpClosed(event.rsvp_deadline);

  const renderRsvpForm = (subEvent: SubEvent | null, key: string) => {
    const form = forms[key];
    if (!form) return null;

    const deadline = subEvent?.rsvp_deadline || event.rsvp_deadline;
    const closed = isRsvpClosed(deadline);
    const alreadySubmitted = existingRsvps.some((r) => {
      if (key === "main") return r.sub_event_id === null;
      return r.sub_event_id === key;
    });

    return (
      <div
        key={key}
        className="border border-[var(--color-border)] p-6 md:p-8"
        style={{ borderRadius: "var(--radius)" }}
      >
        {subEvent && (
          <div className="mb-6">
            <h3 className="font-heading text-2xl mb-2">{subEvent.name}</h3>
            {subEvent.date && (
              <p className="text-sm text-[var(--color-text-muted)] flex items-center gap-2">
                <CalendarDays className="w-3.5 h-3.5" /> {formatDate(subEvent.date)}
                {subEvent.time && <> · {formatTime(subEvent.time)}</>}
              </p>
            )}
            {subEvent.venue && (
              <p className="text-sm text-[var(--color-text-muted)] flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5" /> {subEvent.venue}
              </p>
            )}
            {subEvent.description && (
              <p className="text-sm text-[var(--color-text-muted)] mt-2">{subEvent.description}</p>
            )}
          </div>
        )}

        {!subEvent && (
          <h3 className="font-heading text-2xl mb-6">RSVP</h3>
        )}

        {closed ? (
          <div className="text-center py-8">
            <Lock className="w-8 h-8 mx-auto mb-3 text-[var(--color-text-muted)]" />
            <p className="font-heading text-lg mb-1">RSVP Closed</p>
            <p className="text-sm text-[var(--color-text-muted)]">
              The deadline to respond{deadline ? ` was ${formatDate(deadline)}` : ""} has passed.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Attending / Declined */}
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
                Will you attend?
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => updateForm(key, { status: "attending" })}
                  className={cn(
                    "flex items-center justify-center gap-2 px-4 py-3 border-2 transition-all text-sm font-medium",
                    form.status === "attending"
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-bg)]"
                      : "border-[var(--color-border)] text-[var(--color-text)] hover:border-[var(--color-primary)]"
                  )}
                  style={{ borderRadius: "var(--radius)" }}
                >
                  <Check className="w-4 h-4" /> Attending
                </button>
                <button
                  type="button"
                  onClick={() => updateForm(key, { status: "declined" })}
                  className={cn(
                    "flex items-center justify-center gap-2 px-4 py-3 border-2 transition-all text-sm font-medium",
                    form.status === "declined"
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-bg)]"
                      : "border-[var(--color-border)] text-[var(--color-text)] hover:border-[var(--color-primary)]"
                  )}
                  style={{ borderRadius: "var(--radius)" }}
                >
                  <X className="w-4 h-4" /> Decline
                </button>
              </div>
            </div>

            {form.status === "attending" && (
              <>
                {/* Plus ones */}
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
                    Number of guests (including you)
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => updateForm(key, { plus_ones: Math.max(0, form.plus_ones - 1) })}
                      className="w-10 h-10 border border-[var(--color-border)] flex items-center justify-center hover:bg-[var(--color-bg-subtle)]"
                      style={{ borderRadius: "var(--radius)" }}
                    >
                      −
                    </button>
                    <span className="font-heading text-2xl w-12 text-center tabular-nums">{form.plus_ones + 1}</span>
                    <button
                      type="button"
                      onClick={() => updateForm(key, { plus_ones: form.plus_ones + 1 })}
                      className="w-10 h-10 border border-[var(--color-border)] flex items-center justify-center hover:bg-[var(--color-bg-subtle)]"
                      style={{ borderRadius: "var(--radius)" }}
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Dietary */}
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
                    Dietary requirements
                  </label>
                  <Input
                    type="text"
                    value={form.dietary}
                    onChange={(e) => updateForm(key, { dietary: e.target.value })}
                    placeholder="e.g. Vegetarian, gluten-free, allergies..."
                  />
                </div>
              </>
            )}

            {/* Message */}
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
                Message to host {subEvent ? `(for ${subEvent.name})` : ""}
              </label>
              <Textarea
                value={form.message}
                onChange={(e) => updateForm(key, { message: e.target.value })}
                placeholder="Share your wishes or notes..."
                rows={3}
              />
            </div>

            {alreadySubmitted && (
              <p className="text-xs text-[var(--color-text-muted)] flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" /> You've already responded. Submitting will update your RSVP.
              </p>
            )}

            <Button
              onClick={() => submitMutation.mutate(subEvent?.id || null)}
              loading={submitMutation.isPending}
              disabled={form.status === "pending"}
              size="lg"
              className="w-full justify-center"
            >
              <CalendarCheck className="w-4 h-4" />
              {alreadySubmitted ? "Update RSVP" : "Submit RSVP"}
            </Button>

            {submitMutation.isError && (
              <p className="text-sm text-red-600">
                {submitMutation.error instanceof Error ? submitMutation.error.message : "Failed to submit. Please try again."}
              </p>
            )}
            {submitMutation.isSuccess && (
              <p className="text-sm text-green-600 flex items-center gap-1.5">
                <Check className="w-4 h-4" /> RSVP submitted. Thank you!
              </p>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <p className="text-xs uppercase tracking-[0.25em] text-[var(--color-text-muted)] mb-2">RSVP</p>
          <h1 className="font-heading text-4xl md:text-5xl tracking-tight">
            {hasSubEvents ? "RSVP for Each Event" : "Will you join us?"}
          </h1>
          {guestName && (
            <p className="mt-3 text-sm text-[var(--color-text-muted)]">Responding as: {guestName}</p>
          )}
          {event.rsvp_deadline && !eventClosed && (
            <p className="mt-2 text-xs text-[var(--color-text-muted)] flex items-center justify-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Deadline: {formatDate(event.rsvp_deadline)}
            </p>
          )}
        </div>

        {eventClosed && hasSubEvents === false && (
          <div className="text-center py-12 border border-[var(--color-border)]" style={{ borderRadius: "var(--radius)" }}>
            <Lock className="w-10 h-10 mx-auto mb-4 text-[var(--color-text-muted)]" />
            <p className="font-heading text-xl mb-2">RSVP Closed</p>
            <p className="text-sm text-[var(--color-text-muted)]">
              The deadline to respond has passed.
            </p>
          </div>
        )}

        {!eventClosed && (
          <div className="space-y-6">
            {hasSubEvents
              ? subEventsToRsvp.map((sub) => renderRsvpForm(sub, sub.id))
              : renderRsvpForm(null, "main")}
          </div>
        )}
      </div>
    </div>
  );
}
