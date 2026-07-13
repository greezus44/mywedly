import { useState, useEffect, type FormEvent } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Calendar, Clock, MapPin, Check, X, Minus, Plus, AlertCircle } from "lucide-react";
import { supabase, type UserEvent, type ScheduleItem, type EventRsvp } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { RUSTY_THEME } from "../../lib/theme";
import { formatDate, formatTime, isRsvpClosed, formatDeadline } from "../../lib/utils";
import type { Lang } from "./rusty-layout";

const LANG_STORAGE_KEY = "guest-lang";

interface OutletContext {
  event: UserEvent;
  lang: Lang;
}

export default function RustyRsvp() {
  const { event } = useOutletContext<OutletContext>();
  const { guestName } = useGuestAuth();
  const queryClient = useQueryClient();

  const [lang, setLang] = useState<Lang>("en");
  const [status, setStatus] = useState<"attending" | "declined" | null>(null);
  const [plusOnes, setPlusOnes] = useState(0);
  const [dietary, setDietary] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(LANG_STORAGE_KEY);
    if (saved === "en" || saved === "bm") setLang(saved);
  }, []);

  const { data: schedule, isLoading: scheduleLoading } = useQuery<ScheduleItem[], Error>({
    queryKey: ["event-schedule", event.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_schedule")
        .select("*")
        .eq("event_id", event.id)
        .order("order_index", { ascending: true });
      if (error) throw error;
      return (data || []) as ScheduleItem[];
    },
  });

  const { data: existingRsvp } = useQuery<EventRsvp | null, Error>({
    queryKey: ["existing-rsvp", event.id, guestName],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_rsvps")
        .select("*")
        .eq("event_id", event.id)
        .eq("guest_name", guestName!)
        .maybeSingle();
      if (error) throw error;
      return data as EventRsvp | null;
    },
    enabled: !!guestName,
  });

  useEffect(() => {
    if (existingRsvp) {
      setStatus(existingRsvp.status === "pending" ? null : existingRsvp.status);
      setPlusOnes(existingRsvp.plus_ones || 0);
      setDietary(existingRsvp.dietary || "");
      setMessage(existingRsvp.message || "");
    }
  }, [existingRsvp]);

  const rsvpClosed = isRsvpClosed(event.rsvp_deadline);

  const t = {
    en: {
      title: "RSVP",
      subtitle: "Will you join us?",
      schedule: "Event Schedule",
      attending: "Accept with Joy",
      decline: "Sadly Decline",
      plusOnes: "Plus Ones",
      dietary: "Dietary Requirements",
      dietaryPlaceholder: "Any allergies or dietary preferences?",
      message: "Message to the Couple",
      messagePlaceholder: "Leave a note for the hosts...",
      submit: "Submit RSVP",
      thankYou: "Thank You!",
      thankYouMsg: "Your response has been received. We look forward to celebrating with you.",
      closed: "RSVPs closed on",
      guest: "Guest",
    },
    bm: {
      title: "RSVP",
      subtitle: "Adakah anda akan hadir?",
      schedule: "Jadual Acara",
      attending: "Terima dengan Gembira",
      decline: "Harap Maaf Tidak Hadir",
      plusOnes: "Tetamu Tambahan",
      dietary: "Keperluan Diet",
      dietaryPlaceholder: "Sebarang alahan atau keutamaan diet?",
      message: "Mesej kepada Pasangan",
      messagePlaceholder: "Tinggalkan nota untuk tuan rumah...",
      submit: "Hantar RSVP",
      thankYou: "Terima Kasih!",
      thankYouMsg: "Jawapan anda telah diterima. Kami menantikan untuk meraikan bersama anda.",
      closed: "RSVP ditutup pada",
      guest: "Tetamu",
    },
  }[lang];

  const submitMutation = useMutation<void, Error>({
    mutationFn: async () => {
      const rsvpPayload = {
        event_id: event.id,
        guest_name: guestName!,
        status: status || "pending",
        plus_ones: plusOnes,
        dietary,
        message,
      };

      const { data: existing } = await supabase
        .from("event_rsvps")
        .select("id")
        .eq("event_id", event.id)
        .eq("guest_name", guestName!)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("event_rsvps")
          .update({ ...rsvpPayload, submitted_at: new Date().toISOString() })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("event_rsvps")
          .insert({ ...rsvpPayload, submitted_at: new Date().toISOString() });
        if (error) throw error;
      }

      const { data: guest } = await supabase
        .from("event_guests")
        .select("id")
        .eq("event_id", event.id)
        .eq("name", guestName!)
        .maybeSingle();

      if (guest) {
        await supabase
          .from("event_guests")
          .update({
            rsvp_status: status || "pending",
            rsvp_submitted_at: new Date().toISOString(),
            plus_ones: plusOnes,
            dietary,
            message,
          })
          .eq("id", guest.id);
      }
    },
    onSuccess: () => {
      setSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ["existing-rsvp", event.id, guestName] });
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!status || !guestName) return;
    submitMutation.mutate();
  };

  const theme = event.theme || RUSTY_THEME;
  const headingFont = theme.headingFont || "Cormorant Garamond";
  const scriptFont = theme.scriptFont || "Cormorant Garamond";

  if (submitted) {
    return (
      <div className="py-16 text-center animate-fade-in-up">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full border-2 border-rusty-gold-dark flex items-center justify-center">
          <Check className="w-8 h-8 text-rusty-gold-dark" />
        </div>
        <h2 className="font-serif text-3xl text-rusty-text mb-3" style={{ fontFamily: `"${headingFont}", serif` }}>
          {t.thankYou}
        </h2>
        <p className="text-sm text-rusty-text-light max-w-xs mx-auto leading-relaxed">
          {t.thankYouMsg}
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in py-6">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="h-px w-10 bg-rusty-gold-dark/40" />
          <span className="w-1.5 h-1.5 rounded-full bg-rusty-gold-dark" />
          <span className="h-px w-10 bg-rusty-gold-dark/40" />
        </div>
        <h1 className="font-serif text-3xl text-rusty-text mb-1" style={{ fontFamily: `"${headingFont}", serif` }}>
          {t.title}
        </h1>
        <p className="text-sm italic text-rusty-text-light" style={{ fontFamily: `"${scriptFont}", serif` }}>
          {t.subtitle}
        </p>
      </div>

      {rsvpClosed && (
        <div className="mb-6 p-4 rounded-lg bg-rusty-cream border border-rusty-gold-dark/30 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rusty-gold-dark flex-shrink-0 mt-0.5" />
          <p className="text-xs text-rusty-text-light">
            {t.closed} {formatDeadline(event.rsvp_deadline)}
          </p>
        </div>
      )}

      {schedule && schedule.length > 0 && (
        <div className="mb-8">
          <h2 className="font-serif text-lg text-rusty-text text-center mb-4" style={{ fontFamily: `"${headingFont}", serif` }}>
            {t.schedule}
          </h2>
          <div className="space-y-3">
            {scheduleLoading ? (
              [1, 2].map((i) => (
                <div key={i} className="h-20 rounded-lg bg-rusty-cream/50 animate-pulse" />
              ))
            ) : (
              schedule.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-rusty-border bg-rusty-cream/50 p-4"
                >
                  <h3 className="font-serif text-base text-rusty-text mb-1" style={{ fontFamily: `"${headingFont}", serif` }}>
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className="text-xs text-rusty-text-light mb-2">{item.description}</p>
                  )}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-rusty-text-light">
                    {item.schedule_date && (
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(item.schedule_date)}
                      </span>
                    )}
                    {item.start_time && (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTime(item.start_time)}
                        {item.end_time && ` – ${formatTime(item.end_time)}`}
                      </span>
                    )}
                    {item.venue && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {item.venue}
                      </span>
                    )}
                  </div>
                  {item.dress_code && (
                    <p className="text-[10px] tracking-[0.15em] uppercase text-rusty-gold-dark mt-2">
                      Dress Code: {item.dress_code}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => !rsvpClosed && setStatus("attending")}
              disabled={rsvpClosed}
              className={`flex items-center justify-center gap-2 py-3.5 rounded-md border-2 text-sm font-medium tracking-wide transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                status === "attending"
                  ? "border-rusty-gold-dark bg-rusty-gold-dark text-rusty-cream"
                  : "border-rusty-border text-rusty-text hover:border-rusty-gold-dark/50"
              }`}
            >
              <Check className="w-4 h-4" />
              {t.attending}
            </button>
            <button
              type="button"
              onClick={() => !rsvpClosed && setStatus("declined")}
              disabled={rsvpClosed}
              className={`flex items-center justify-center gap-2 py-3.5 rounded-md border-2 text-sm font-medium tracking-wide transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                status === "declined"
                  ? "border-rusty-gold-dark bg-rusty-gold-dark text-rusty-cream"
                  : "border-rusty-border text-rusty-text hover:border-rusty-gold-dark/50"
              }`}
            >
              <X className="w-4 h-4" />
              {t.decline}
            </button>
          </div>
        </div>

        {status === "attending" && (
          <>
            <div className="animate-fade-in">
              <label className="block text-xs tracking-[0.15em] uppercase text-rusty-text-light mb-2">
                {t.plusOnes}
              </label>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setPlusOnes(Math.max(0, plusOnes - 1))}
                  disabled={rsvpClosed || plusOnes === 0}
                  className="w-9 h-9 rounded-full border border-rusty-border flex items-center justify-center text-rusty-text hover:border-rusty-gold-dark transition-colors disabled:opacity-40"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="font-serif text-2xl text-rusty-text w-8 text-center" style={{ fontFamily: `"${headingFont}", serif` }}>
                  {plusOnes}
                </span>
                <button
                  type="button"
                  onClick={() => setPlusOnes(Math.min(10, plusOnes + 1))}
                  disabled={rsvpClosed}
                  className="w-9 h-9 rounded-full border border-rusty-border flex items-center justify-center text-rusty-text hover:border-rusty-gold-dark transition-colors disabled:opacity-40"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="animate-fade-in">
              <label className="block text-xs tracking-[0.15em] uppercase text-rusty-text-light mb-2">
                {t.dietary}
              </label>
              <input
                type="text"
                value={dietary}
                onChange={(e) => setDietary(e.target.value)}
                placeholder={t.dietaryPlaceholder}
                disabled={rsvpClosed}
                className="w-full px-4 py-2.5 text-sm rounded-md border border-rusty-border bg-white/60 focus:outline-none focus:ring-2 focus:ring-rusty-gold-dark/20 focus:border-rusty-gold-dark transition-colors text-rusty-text"
              />
            </div>
          </>
        )}

        <div>
          <label className="block text-xs tracking-[0.15em] uppercase text-rusty-text-light mb-2">
            {t.message}
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t.messagePlaceholder}
            rows={3}
            disabled={rsvpClosed}
            className="w-full px-4 py-2.5 text-sm rounded-md border border-rusty-border bg-white/60 focus:outline-none focus:ring-2 focus:ring-rusty-gold-dark/20 focus:border-rusty-gold-dark transition-colors resize-none text-rusty-text"
          />
        </div>

        {(submitMutation as any).error && (
          <p className="text-xs text-red-600 text-center">
            {(submitMutation as any).error.message}
          </p>
        )}

        <button
          type="submit"
          disabled={!status || rsvpClosed || submitMutation.isPending}
          className="w-full py-3 text-sm tracking-[0.2em] uppercase font-medium transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: theme.primaryColor || "#B8962E",
            color: "#FAF3E0",
            borderRadius: "4px",
          }}
        >
          {submitMutation.isPending ? "..." : t.submit}
        </button>
      </form>
    </div>
  );
}
