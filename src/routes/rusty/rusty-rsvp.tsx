import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type SubEvent, type ScheduleItem, type EventRsvp, type GuestEventInvite, type GroupEventInvite, type GuestGroupMember } from "../../lib/supabase";
import { formatDate, formatTime, isRsvpClosed } from "../../lib/utils";
import { useGuestAuth } from "../../lib/guest-auth";
import { RUSTY_THEME } from "../../lib/theme";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Input";
import { Check, X, Lock, Clock, CalendarDays, MapPin } from "lucide-react";

export type Lang = "en" | "id";

interface OutletContext {
  event: UserEvent;
  subEvents: SubEvent[];
  schedule: ScheduleItem[];
  lang: Lang;
  setLang: (lang: Lang) => void;
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

function GoldDivider() {
  return (
    <div className="flex items-center justify-center gap-4 my-6">
      <div className="w-24 h-px" style={{ backgroundColor: RUSTY_THEME.primaryColor || "#B8962E" }} />
      <div className="w-2 h-2 rotate-45" style={{ backgroundColor: RUSTY_THEME.primaryColor || "#B8962E" }} />
      <div className="w-24 h-px" style={{ backgroundColor: RUSTY_THEME.primaryColor || "#B8962E" }} />
    </div>
  );
}

export default function RustyRsvp() {
  const { event, subEvents } = useOutletContext<OutletContext>();
  const { guestName } = useGuestAuth();
  const queryClient = useQueryClient();

  // Determine visible sub-events
  const { data: visibleSubEvents } = useQuery({
    queryKey: ["rusty-rsvp-visible-sub-events", event.id, guestName],
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

  const { data: existingRsvps = [] } = useQuery({
    queryKey: ["rusty-guest-rsvps", event.id, guestName],
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
      queryClient.invalidateQueries({ queryKey: ["rusty-guest-rsvps", event.id, guestName] });
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
        className="p-8 border"
        style={{
          borderColor: RUSTY_THEME.borderColor || "#D4C695",
          borderRadius: 2,
          backgroundColor: RUSTY_THEME.bgSubtleColor || "#FAF3E0",
        }}
      >
        {subEvent && (
          <div className="mb-6 text-center">
            <h3 className="font-heading text-2xl mb-3" style={{ fontFamily: '"Cormorant Garamond", serif' }}>
              {subEvent.name}
            </h3>
            {subEvent.date && (
              <p className="text-sm opacity-70 flex items-center justify-center gap-2">
                <CalendarDays className="w-3.5 h-3.5" style={{ color: RUSTY_THEME.primaryColor || "#B8962E" }} />
                {formatDate(subEvent.date)}
                {subEvent.time && <> · {formatTime(subEvent.time)}</>}
              </p>
            )}
            {subEvent.venue && (
              <p className="text-sm opacity-70 flex items-center justify-center gap-2">
                <MapPin className="w-3.5 h-3.5" style={{ color: RUSTY_THEME.primaryColor || "#B8962E" }} /> {subEvent.venue}
              </p>
            )}
            {subEvent.description && (
              <p className="text-sm opacity-70 mt-2 italic">{subEvent.description}</p>
            )}
          </div>
        )}

        {!subEvent && (
          <h3 className="font-heading text-2xl mb-6 text-center" style={{ fontFamily: '"Cormorant Garamond", serif' }}>
            RSVP
          </h3>
        )}

        {closed ? (
          <div className="text-center py-8">
            <Lock className="w-8 h-8 mx-auto mb-3 opacity-50" style={{ color: RUSTY_THEME.primaryColor || "#B8962E" }} />
            <p className="font-heading text-lg mb-1" style={{ fontFamily: '"Cormorant Garamond", serif' }}>
              RSVP Closed
            </p>
            <p className="text-sm opacity-60 italic">
              The deadline to respond has passed.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-medium uppercase tracking-[0.2em] opacity-60 mb-3">
                Will you attend?
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => updateForm(key, { status: "attending" })}
                  className="flex items-center justify-center gap-2 px-4 py-3 border-2 transition-all text-sm font-medium uppercase tracking-wider"
                  style={{
                    borderColor: form.status === "attending"
                      ? RUSTY_THEME.primaryColor || "#B8962E"
                      : RUSTY_THEME.borderColor || "#D4C695",
                    backgroundColor: form.status === "attending"
                      ? RUSTY_THEME.primaryColor || "#B8962E"
                      : "transparent",
                    color: form.status === "attending"
                      ? RUSTY_THEME.bgColor || "#F5ECD7"
                      : RUSTY_THEME.textColor || "#3D3528",
                    borderRadius: 2,
                  }}
                >
                  <Check className="w-4 h-4" /> Attending
                </button>
                <button
                  type="button"
                  onClick={() => updateForm(key, { status: "declined" })}
                  className="flex items-center justify-center gap-2 px-4 py-3 border-2 transition-all text-sm font-medium uppercase tracking-wider"
                  style={{
                    borderColor: form.status === "declined"
                      ? RUSTY_THEME.primaryColor || "#B8962E"
                      : RUSTY_THEME.borderColor || "#D4C695",
                    backgroundColor: form.status === "declined"
                      ? RUSTY_THEME.primaryColor || "#B8962E"
                      : "transparent",
                    color: form.status === "declined"
                      ? RUSTY_THEME.bgColor || "#F5ECD7"
                      : RUSTY_THEME.textColor || "#3D3528",
                    borderRadius: 2,
                  }}
                >
                  <X className="w-4 h-4" /> Decline
                </button>
              </div>
            </div>

            {form.status === "attending" && (
              <>
                <div>
                  <label className="block text-xs font-medium uppercase tracking-[0.2em] opacity-60 mb-2">
                    Number of guests (including you)
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => updateForm(key, { plus_ones: Math.max(0, form.plus_ones - 1) })}
                      className="w-10 h-10 border flex items-center justify-center transition-colors hover:opacity-70"
                      style={{
                        borderColor: RUSTY_THEME.borderColor || "#D4C695",
                        color: RUSTY_THEME.primaryColor || "#B8962E",
                        borderRadius: 2,
                      }}
                    >
                      −
                    </button>
                    <span
                      className="font-heading text-2xl w-12 text-center tabular-nums"
                      style={{ fontFamily: '"Cormorant Garamond", serif', color: RUSTY_THEME.primaryColor || "#B8962E" }}
                    >
                      {form.plus_ones + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateForm(key, { plus_ones: form.plus_ones + 1 })}
                      className="w-10 h-10 border flex items-center justify-center transition-colors hover:opacity-70"
                      style={{
                        borderColor: RUSTY_THEME.borderColor || "#D4C695",
                        color: RUSTY_THEME.primaryColor || "#B8962E",
                        borderRadius: 2,
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium uppercase tracking-[0.2em] opacity-60 mb-2">
                    Dietary requirements
                  </label>
                  <Input
                    type="text"
                    value={form.dietary}
                    onChange={(e) => updateForm(key, { dietary: e.target.value })}
                    placeholder="e.g. Vegetarian, gluten-free, allergies..."
                    style={{
                      backgroundColor: RUSTY_THEME.bgColor || "#F5ECD7",
                      borderColor: RUSTY_THEME.borderColor || "#D4C695",
                      borderRadius: 2,
                    }}
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-medium uppercase tracking-[0.2em] opacity-60 mb-2">
                Message to host {subEvent ? `(for ${subEvent.name})` : ""}
              </label>
              <Textarea
                value={form.message}
                onChange={(e) => updateForm(key, { message: e.target.value })}
                placeholder="Share your wishes or notes..."
                rows={3}
                style={{
                  backgroundColor: RUSTY_THEME.bgColor || "#F5ECD7",
                  borderColor: RUSTY_THEME.borderColor || "#D4C695",
                  borderRadius: 2,
                }}
              />
            </div>

            {alreadySubmitted && (
              <p className="text-xs opacity-60 flex items-center gap-1.5 italic">
                <Check className="w-3.5 h-3.5" /> You've already responded. Submitting will update your RSVP.
              </p>
            )}

            <Button
              onClick={() => submitMutation.mutate(subEvent?.id || null)}
              loading={submitMutation.isPending}
              disabled={form.status === "pending"}
              size="lg"
              className="w-full justify-center uppercase tracking-[0.2em]"
              style={{
                backgroundColor: RUSTY_THEME.primaryColor || "#B8962E",
                color: RUSTY_THEME.bgColor || "#F5ECD7",
                borderRadius: 2,
              }}
            >
              {alreadySubmitted ? "Update RSVP" : "Submit RSVP"}
            </Button>

            {submitMutation.isError && (
              <p className="text-sm" style={{ color: "#9c2a2a" }}>
                {submitMutation.error instanceof Error ? submitMutation.error.message : "Failed to submit. Please try again."}
              </p>
            )}
            {submitMutation.isSuccess && (
              <p className="text-sm flex items-center gap-1.5 italic" style={{ color: RUSTY_THEME.primaryColor || "#B8962E" }}>
                <Check className="w-4 h-4" /> RSVP submitted. Thank you!
              </p>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: RUSTY_THEME.bgColor || "#F5ECD7",
        color: RUSTY_THEME.textColor || "#3D3528",
      }}
    >
      <div className="max-w-2xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <GoldDivider />
          <p className="text-xs uppercase tracking-[0.3em] opacity-60 mb-2">RSVP</p>
          <h1
            className="font-heading text-4xl md:text-5xl tracking-tight"
            style={{ fontFamily: '"Cormorant Garamond", serif' }}
          >
            {hasSubEvents ? "RSVP for Each Event" : "Will you join us?"}
          </h1>
          {guestName && (
            <p className="mt-4 text-sm italic opacity-70" style={{ fontFamily: '"Cormorant Garamond", serif' }}>
              Responding as: {guestName}
            </p>
          )}
          {event.rsvp_deadline && !eventClosed && (
            <p className="mt-2 text-xs opacity-60 flex items-center justify-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Deadline: {formatDate(event.rsvp_deadline)}
            </p>
          )}
        </div>

        {eventClosed && !hasSubEvents && (
          <div
            className="text-center py-12 border"
            style={{ borderColor: RUSTY_THEME.borderColor || "#D4C695", borderRadius: 2 }}
          >
            <Lock className="w-10 h-10 mx-auto mb-4 opacity-50" style={{ color: RUSTY_THEME.primaryColor || "#B8962E" }} />
            <p className="font-heading text-xl mb-2" style={{ fontFamily: '"Cormorant Garamond", serif' }}>
              RSVP Closed
            </p>
            <p className="text-sm opacity-60 italic">The deadline to respond has passed.</p>
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
