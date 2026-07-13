import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { CSSProperties, FormEvent } from "react";
import { supabase, type UserEvent, type EventRsvp, type ScheduleItem } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { formatDate, formatTime, isRsvpClosed, formatDeadline } from "../../lib/utils";
import type { Lang } from "./rusty-layout";

const CREAM = "#F5ECD7";
const CREAM_LIGHT = "#FAF3E0";
const GOLD = "#B8962E";
const TEXT = "#3D3528";
const TEXT_MUTED = "#8B7355";
const BORDER = "#D4C695";

interface OutletContext {
  event: UserEvent;
  eventId: string;
}

export function RustyRsvp() {
  const { event, eventId } = useOutletContext<OutletContext>();
  const { guestName } = useGuestAuth();
  const [lang, setLang] = useState<Lang>("en");
  const [status, setStatus] = useState<"attending" | "declined">("attending");
  const [plusOnes, setPlusOnes] = useState(0);
  const [dietary, setDietary] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const rsvpClosed = isRsvpClosed(event.rsvp_deadline);

  const { data: schedules } = useQuery<ScheduleItem[]>({
    queryKey: ["event-schedules", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_schedules")
        .select("*")
        .eq("event_id", eventId)
        .order("order_index", { ascending: true });
      if (error) throw error;
      return (data || []) as ScheduleItem[];
    },
  });

  const { data: existingRsvp } = useQuery<EventRsvp | null>({
    queryKey: ["event-rsvp", eventId, guestName],
    queryFn: async () => {
      if (!guestName) return null;
      const { data, error } = await supabase
        .from("event_rsvps")
        .select("*")
        .eq("event_id", eventId)
        .eq("guest_name", guestName)
        .order("submitted_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as EventRsvp | null;
    },
    enabled: !!guestName,
  });

  const { data: existingGuest } = useQuery<{
    rsvp_status: string;
    plus_ones: number;
    dietary: string;
    message: string;
  } | null>({
    queryKey: ["event-guest", eventId, guestName],
    queryFn: async () => {
      if (!guestName) return null;
      const { data, error } = await supabase
        .from("event_guests")
        .select("rsvp_status, plus_ones, dietary, message")
        .eq("event_id", eventId)
        .eq("name", guestName)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!guestName,
  });

  useEffect(() => {
    if (existingRsvp) {
      setStatus(existingRsvp.status === "declined" ? "declined" : "attending");
      setPlusOnes(existingRsvp.plus_ones || 0);
      setDietary(existingRsvp.dietary || "");
      setMessage(existingRsvp.message || "");
    } else if (existingGuest && existingGuest.rsvp_status !== "pending") {
      setStatus(existingGuest.rsvp_status === "declined" ? "declined" : "attending");
      setPlusOnes(existingGuest.plus_ones || 0);
      setDietary(existingGuest.dietary || "");
      setMessage(existingGuest.message || "");
    }
  }, [existingRsvp, existingGuest]);

  const mutation = useMutation<void, Error>({
    mutationFn: async () => {
      const { error: rsvpError } = await supabase.from("event_rsvps").insert({
        event_id: eventId,
        guest_name: guestName,
        status,
        plus_ones: status === "attending" ? plusOnes : 0,
        dietary,
        message,
      });
      if (rsvpError) throw rsvpError;

      const { error: guestError } = await supabase
        .from("event_guests")
        .update({
          rsvp_status: status,
          plus_ones: status === "attending" ? plusOnes : 0,
          dietary,
          message,
          rsvp_submitted_at: new Date().toISOString(),
        })
        .eq("event_id", eventId)
        .eq("name", guestName);
      if (guestError) throw guestError;
    },
    onSuccess: () => {
      setSubmitted(true);
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (rsvpClosed) return;
    mutation.mutate();
  };

  const t = {
    en: {
      title: "RSVP",
      schedule: "Schedule",
      attending: "Accept with pleasure",
      declined: "Decline with regret",
      plusOnes: "Plus Ones",
      dietary: "Dietary Requirements",
      dietaryPlaceholder: "Any allergies or dietary restrictions",
      message: "Message",
      messagePlaceholder: "Leave a message for the couple",
      submit: "Submit RSVP",
      submitted: "Thank you for your response",
      closed: (date: string) => `RSVPs closed on ${date}`,
    },
    bm: {
      title: "RSVP",
      schedule: "Jadual",
      attending: "Terima dengan gembira",
      declined: "Tolak dengan sesal",
      plusOnes: "Tetamu Tambahan",
      dietary: "Keperluan Diet",
      dietaryPlaceholder: "Sebarang alahan atau sekatan diet",
      message: "Mesej",
      messagePlaceholder: "Tinggalkan mesej untuk pasangan",
      submit: "Hantar RSVP",
      submitted: "Terima kasih atas jawapan anda",
      closed: (date: string) => `RSVP ditutup pada ${date}`,
    },
  }[lang];

  const dividerStyle: CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.75rem",
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center" style={{ fontFamily: '"Cormorant Garamond", serif', color: TEXT }}>
        <div style={dividerStyle} className="mb-6">
          <span className="block h-px w-12" style={{ backgroundColor: GOLD }} />
          <span className="text-xs tracking-[0.3em] uppercase" style={{ color: GOLD, fontFamily: '"Inter", sans-serif' }}>
            Thank You
          </span>
          <span className="block h-px w-12" style={{ backgroundColor: GOLD }} />
        </div>
        <p className="text-2xl md:text-3xl" style={{ color: TEXT }}>
          {t.submitted}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-6" style={{ fontFamily: '"Cormorant Garamond", serif', color: TEXT }}>
      <div className="flex justify-end mb-4">
        <div className="flex gap-2">
          {(["en", "bm"] as Lang[]).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className="px-3 py-1 text-xs tracking-wider uppercase transition-all"
              style={{
                fontFamily: '"Inter", sans-serif',
                color: lang === l ? CREAM : GOLD,
                backgroundColor: lang === l ? GOLD : "transparent",
                border: `1px solid ${GOLD}`,
              }}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <section className="text-center mb-8">
        <div style={dividerStyle} className="mb-4">
          <span className="block h-px w-12" style={{ backgroundColor: GOLD }} />
          <span className="text-xs tracking-[0.3em] uppercase" style={{ color: GOLD, fontFamily: '"Inter", sans-serif' }}>
            {t.title}
          </span>
          <span className="block h-px w-12" style={{ backgroundColor: GOLD }} />
        </div>
      </section>

      {rsvpClosed && (
        <div
          className="text-center py-4 px-6 mb-8 rounded-sm"
          style={{ backgroundColor: CREAM_LIGHT, border: `1px solid ${BORDER}` }}
        >
          <p className="text-base" style={{ color: TEXT_MUTED, fontFamily: '"Cormorant Garamond", serif' }}>
            {t.closed(formatDeadline(event.rsvp_deadline))}
          </p>
        </div>
      )}

      {schedules && schedules.length > 0 && (
        <section className="mb-8">
          <div style={dividerStyle} className="mb-4">
            <span className="block h-px w-8" style={{ backgroundColor: GOLD }} />
            <span className="text-xs tracking-[0.3em] uppercase" style={{ color: GOLD, fontFamily: '"Inter", sans-serif' }}>
              {t.schedule}
            </span>
            <span className="block h-px w-8" style={{ backgroundColor: GOLD }} />
          </div>
          <div className="space-y-4">
            {schedules.map((item) => (
              <div
                key={item.id}
                className="p-5 rounded-sm"
                style={{ backgroundColor: CREAM_LIGHT, border: `1px solid ${BORDER}` }}
              >
                <h3 className="text-xl mb-1" style={{ fontFamily: '"Cormorant Garamond", serif', color: TEXT }}>
                  {item.title}
                </h3>
                {item.description && (
                  <p className="text-sm mb-2" style={{ color: TEXT_MUTED }}>
                    {item.description}
                  </p>
                )}
                <div className="flex flex-wrap gap-4 text-sm" style={{ color: TEXT_MUTED }}>
                  {item.schedule_date && (
                    <span>{formatDate(item.schedule_date)}</span>
                  )}
                  {item.start_time && (
                    <span>{formatTime(item.start_time)}</span>
                  )}
                  {item.venue && (
                    <span>{item.venue}</span>
                  )}
                  {item.dress_code && (
                    <span style={{ color: GOLD }}>{item.dress_code}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <section>
          <div className="grid grid-cols-1 gap-3">
            <button
              type="button"
              onClick={() => !rsvpClosed && setStatus("attending")}
              disabled={rsvpClosed}
              className="py-4 text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: status === "attending" ? GOLD : "transparent",
                color: status === "attending" ? CREAM : TEXT,
                border: `1px solid ${status === "attending" ? GOLD : BORDER}`,
                fontFamily: '"Cormorant Garamond", serif',
              }}
            >
              {t.attending}
            </button>
            <button
              type="button"
              onClick={() => !rsvpClosed && setStatus("declined")}
              disabled={rsvpClosed}
              className="py-4 text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: status === "declined" ? GOLD : "transparent",
                color: status === "declined" ? CREAM : TEXT,
                border: `1px solid ${status === "declined" ? GOLD : BORDER}`,
                fontFamily: '"Cormorant Garamond", serif',
              }}
            >
              {t.declined}
            </button>
          </div>
        </section>

        {status === "attending" && (
          <section>
            <label className="block text-sm tracking-[0.2em] uppercase mb-3" style={{ color: GOLD, fontFamily: '"Inter", sans-serif' }}>
              {t.plusOnes}
            </label>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setPlusOnes(Math.max(0, plusOnes - 1))}
                disabled={rsvpClosed}
                className="w-10 h-10 flex items-center justify-center text-xl transition-all disabled:opacity-50"
                style={{ border: `1px solid ${BORDER}`, color: GOLD, backgroundColor: CREAM_LIGHT }}
              >
                −
              </button>
              <span className="text-2xl min-w-[2rem] text-center" style={{ fontFamily: '"Cormorant Garamond", serif', color: TEXT }}>
                {plusOnes}
              </span>
              <button
                type="button"
                onClick={() => setPlusOnes(Math.min(10, plusOnes + 1))}
                disabled={rsvpClosed}
                className="w-10 h-10 flex items-center justify-center text-xl transition-all disabled:opacity-50"
                style={{ border: `1px solid ${BORDER}`, color: GOLD, backgroundColor: CREAM_LIGHT }}
              >
                +
              </button>
            </div>
          </section>
        )}

        {status === "attending" && (
          <section>
            <label className="block text-sm tracking-[0.2em] uppercase mb-2" style={{ color: GOLD, fontFamily: '"Inter", sans-serif' }}>
              {t.dietary}
            </label>
            <Input
              type="text"
              value={dietary}
              onChange={(e) => setDietary(e.target.value)}
              placeholder={t.dietaryPlaceholder}
              disabled={rsvpClosed}
              style={{
                fontFamily: '"Cormorant Garamond", serif',
                fontSize: "1rem",
                backgroundColor: CREAM_LIGHT,
                borderColor: BORDER,
                color: TEXT,
              }}
            />
          </section>
        )}

        <section>
          <label className="block text-sm tracking-[0.2em] uppercase mb-2" style={{ color: GOLD, fontFamily: '"Inter", sans-serif' }}>
            {t.message}
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t.messagePlaceholder}
            disabled={rsvpClosed}
            rows={4}
            className="w-full px-3 py-2 text-sm rounded-lg border bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-colors resize-y min-h-[80px] disabled:opacity-50"
            style={{
              fontFamily: '"Cormorant Garamond", serif',
              fontSize: "1rem",
              backgroundColor: CREAM_LIGHT,
              borderColor: BORDER,
              color: TEXT,
            }}
          />
        </section>

        {(mutation as any).error && (
          <p className="text-sm text-center" style={{ color: "#dc2626" }}>
            {(mutation as any).error.message}
          </p>
        )}

        <div className="text-center pb-8">
          <Button
            type="submit"
            loading={mutation.isPending}
            disabled={rsvpClosed}
            className="px-12"
            style={{
              backgroundColor: GOLD,
              color: CREAM,
              fontFamily: '"Inter", sans-serif',
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              fontSize: "0.8rem",
              padding: "0.75rem 3rem",
              border: `1px solid ${GOLD}`,
            }}
          >
            {t.submit}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default RustyRsvp;
