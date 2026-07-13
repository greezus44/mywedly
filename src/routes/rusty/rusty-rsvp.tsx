import { useState, useEffect } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase, type EventRsvp, type ScheduleItem, type EventGuest } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { Button } from "../../components/ui/Button";
import { Textarea } from "../../components/ui/Input";
import { EmptyState } from "../../components/ui/index";
import { CalendarDays, Clock, MapPin, Check, X, Minus, Plus } from "lucide-react";
import { formatDate, formatTime, isRsvpClosed, formatDeadline } from "../../lib/utils";
import type { Lang } from "./rusty-layout";
import type { RustyOutletContext } from "./rusty-layout";
import type { CSSProperties, FormEvent } from "react";

const translations = {
  en: {
    title: "RSVP",
    subtitle: "Kindly respond by the deadline",
    schedule: "Event Schedule",
    attending: "Joyfully Accepts",
    declined: "Regretfully Declines",
    plusOnes: "Plus Ones",
    dietary: "Dietary Requirements",
    dietaryPlaceholder: "Any allergies or dietary restrictions...",
    message: "Message to the Couple",
    messagePlaceholder: "Share your well wishes...",
    submit: "Submit RSVP",
    submitting: "Submitting...",
    closed: "RSVPs are now closed",
    closedOn: "RSVPs closed on",
    noSchedule: "No schedule details available yet",
    loading: "Loading...",
    error: "Failed to load RSVP details",
    success: "Thank you! Your RSVP has been submitted.",
    errorSubmit: "Failed to submit RSVP. Please try again.",
  },
  bm: {
    title: "RSVP",
    subtitle: "Sila maklumkan sebelum tarikh tamat",
    schedule: "Jadual Acara",
    attending: "Dengan Gembira Menerima",
    declined: "Dengan Sesal Menolak",
    plusOnes: "Tetamu Tambahan",
    dietary: "Keperluan Diet",
    dietaryPlaceholder: "Sebarang alahan atau had pemakanan...",
    message: "Mesej Untuk Pasangan",
    messagePlaceholder: "Kongsi ucapan tahniah anda...",
    submit: "Hantar RSVP",
    submitting: "Menghantar...",
    closed: "RSVP telah ditutup",
    closedOn: "RSVP ditutup pada",
    noSchedule: "Maklumat jadual belum tersedia",
    loading: "Memuatkan...",
    error: "Gagal memuatkan butiran RSVP",
    success: "Terima kasih! RSVP anda telah dihantar.",
    errorSubmit: "Gagal menghantar RSVP. Sila cuba lagi.",
  },
};

export default function RustyRsvp() {
  const { event, lang } = useOutletContext<RustyOutletContext>();
  const { eventId } = useParams<{ eventId: string }>();
  const { guestName } = useGuestAuth();
  const t = translations[lang];

  const [status, setStatus] = useState<"attending" | "declined" | "">("");
  const [plusOnes, setPlusOnes] = useState(0);
  const [dietary, setDietary] = useState("");
  const [message, setMessage] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const guestId = eventId && guestName ? `${eventId}-${guestName}` : null;

  const { data: schedule } = useQuery<ScheduleItem[], Error>({
    queryKey: ["rusty-schedule", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("schedule_items")
        .select("*")
        .eq("event_id", eventId!)
        .order("order_index", { ascending: true });
      if (error) throw error;
      return (data || []) as ScheduleItem[];
    },
    enabled: !!eventId,
  });

  const { data: existingRsvp } = useQuery<EventRsvp | null, Error>({
    queryKey: ["rusty-rsvp", eventId, guestName],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_rsvps")
        .select("*")
        .eq("event_id", eventId!)
        .eq("guest_name", guestName!)
        .maybeSingle();
      if (error) throw error;
      return data as EventRsvp | null;
    },
    enabled: !!eventId && !!guestName,
  });

  const { data: existingGuest } = useQuery<EventGuest | null, Error>({
    queryKey: ["rusty-guest", eventId, guestName],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_guests")
        .select("*")
        .eq("event_id", eventId!)
        .eq("name", guestName!)
        .maybeSingle();
      if (error) throw error;
      return data as EventGuest | null;
    },
    enabled: !!eventId && !!guestName,
  });

  useEffect(() => {
    if (existingRsvp) {
      setStatus(existingRsvp.status as "attending" | "declined" | "");
      setPlusOnes(existingRsvp.plus_ones || 0);
      setDietary(existingRsvp.dietary || "");
      setMessage(existingRsvp.message || "");
    } else if (existingGuest) {
      setStatus(existingGuest.rsvp_status === "pending" ? "" : existingGuest.rsvp_status);
      setPlusOnes(existingGuest.plus_ones || 0);
      setDietary(existingGuest.dietary || "");
      setMessage(existingGuest.message || "");
    }
  }, [existingRsvp, existingGuest]);

  const mutation = useMutation<void, Error>({
    mutationFn: async () => {
      if (!eventId || !guestName) throw new Error("Missing event or guest info");

      const rsvpPayload = {
        event_id: eventId,
        guest_name: guestName,
        status,
        plus_ones: status === "attending" ? plusOnes : 0,
        dietary: status === "attending" ? dietary : "",
        message,
        submitted_at: new Date().toISOString(),
      };

      const { data: existing } = await supabase
        .from("event_rsvps")
        .select("id")
        .eq("event_id", eventId)
        .eq("guest_name", guestName)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("event_rsvps")
          .update(rsvpPayload)
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("event_rsvps")
          .insert({ ...rsvpPayload, answers: null });
        if (error) throw error;
      }

      if (existingGuest) {
        const { error } = await supabase
          .from("event_guests")
          .update({
            rsvp_status: status,
            rsvp_submitted_at: new Date().toISOString(),
            plus_ones: status === "attending" ? plusOnes : 0,
            dietary: status === "attending" ? dietary : "",
            message,
          })
          .eq("id", existingGuest.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 5000);
    },
  });

  const deadline = event?.rsvp_deadline || event?.draft_rsvp_deadline || null;
  const rsvpClosed = isRsvpClosed(deadline);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!status || rsvpClosed) return;
    mutation.mutate();
  };

  if (!event) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="font-serif text-lg text-[#8B7355]">{t.error}</p>
      </div>
    );
  }

  const cssVars = {} as CSSProperties;

  return (
    <div style={cssVars} className="animate-fade-in px-6 py-10 max-w-2xl mx-auto">
      <div className="text-center mb-10">
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="h-px w-12" style={{ backgroundColor: "#B8962E" }} />
          <div className="w-2 h-2 rotate-45" style={{ backgroundColor: "#B8962E" }} />
          <div className="h-px w-12" style={{ backgroundColor: "#B8962E" }} />
        </div>
        <h1
          className="font-serif text-4xl font-light mb-2"
          style={{ color: "#3D3528", fontFamily: '"Cormorant Garamond", serif' }}
        >
          {t.title}
        </h1>
        <p className="text-sm" style={{ color: "#8B7355" }}>
          {t.subtitle}
        </p>
      </div>

      {rsvpClosed && (
        <div
          className="text-center py-6 px-4 rounded-lg mb-8 border"
          style={{
            backgroundColor: "#FAF3E0",
            borderColor: "#D4C695",
          }}
        >
          <p className="font-serif text-lg" style={{ color: "#B8962E" }}>
            {t.closed}
          </p>
          {deadline && (
            <p className="text-sm mt-1" style={{ color: "#8B7355" }}>
              {t.closedOn} {formatDeadline(deadline)}
            </p>
          )}
        </div>
      )}

      {schedule && schedule.length > 0 && (
        <section className="mb-10">
          <h2
            className="font-serif text-xl font-light text-center mb-6 tracking-wide"
            style={{ color: "#3D3528", fontFamily: '"Cormorant Garamond", serif' }}
          >
            {t.schedule}
          </h2>
          <div className="space-y-4">
            {schedule.map((item) => (
              <div
                key={item.id}
                className="rounded-lg p-5 border"
                style={{
                  backgroundColor: "#FAF3E0",
                  borderColor: "#D4C695",
                }}
              >
                <h3
                  className="font-serif text-lg mb-2"
                  style={{ color: "#3D3528", fontFamily: '"Cormorant Garamond", serif' }}
                >
                  {item.title}
                </h3>
                {item.description && (
                  <p className="text-sm mb-3" style={{ color: "#8B7355" }}>
                    {item.description}
                  </p>
                )}
                <div className="flex flex-wrap gap-4 text-xs" style={{ color: "#8B7355" }}>
                  {item.schedule_date && (
                    <span className="flex items-center gap-1.5">
                      <CalendarDays className="w-3.5 h-3.5" />
                      {formatDate(item.schedule_date)}
                    </span>
                  )}
                  {item.start_time && (
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {formatTime(item.start_time)}
                      {item.end_time && ` — ${formatTime(item.end_time)}`}
                    </span>
                  )}
                  {item.venue && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" />
                      {item.venue}
                    </span>
                  )}
                </div>
                {item.dress_code && (
                  <p className="text-xs mt-2" style={{ color: "#B8962E" }}>
                    Dress code: {item.dress_code}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {schedule && schedule.length === 0 && (
        <div className="mb-8">
          <EmptyState title={t.noSchedule} />
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setStatus("attending")}
            disabled={rsvpClosed}
            className="flex flex-col items-center justify-center gap-2 py-6 rounded-lg border-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              borderColor: status === "attending" ? "#B8962E" : "#D4C695",
              backgroundColor: status === "attending" ? "#B8962E" : "#FAF3E0",
              color: status === "attending" ? "#FAF3E0" : "#3D3528",
            }}
          >
            <Check className="w-6 h-6" />
            <span className="font-serif text-base tracking-wide">{t.attending}</span>
          </button>

          <button
            type="button"
            onClick={() => setStatus("declined")}
            disabled={rsvpClosed}
            className="flex flex-col items-center justify-center gap-2 py-6 rounded-lg border-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              borderColor: status === "declined" ? "#B8962E" : "#D4C695",
              backgroundColor: status === "declined" ? "#B8962E" : "#FAF3E0",
              color: status === "declined" ? "#FAF3E0" : "#3D3528",
            }}
          >
            <X className="w-6 h-6" />
            <span className="font-serif text-base tracking-wide">{t.declined}</span>
          </button>
        </div>

        {status === "attending" && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <label
                className="block font-serif text-sm tracking-[0.15em] uppercase mb-3"
                style={{ color: "#B8962E" }}
              >
                {t.plusOnes}
              </label>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setPlusOnes(Math.max(0, plusOnes - 1))}
                  disabled={rsvpClosed || plusOnes === 0}
                  className="w-10 h-10 rounded-full border flex items-center justify-center transition-colors disabled:opacity-40"
                  style={{ borderColor: "#B8962E", color: "#B8962E" }}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span
                  className="font-serif text-3xl min-w-[3rem] text-center"
                  style={{ color: "#3D3528" }}
                >
                  {plusOnes}
                </span>
                <button
                  type="button"
                  onClick={() => setPlusOnes(Math.min(10, plusOnes + 1))}
                  disabled={rsvpClosed || plusOnes >= 10}
                  className="w-10 h-10 rounded-full border flex items-center justify-center transition-colors disabled:opacity-40"
                  style={{ borderColor: "#B8962E", color: "#B8962E" }}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <label
                className="block font-serif text-sm tracking-[0.15em] uppercase mb-3"
                style={{ color: "#B8962E" }}
              >
                {t.dietary}
              </label>
              <Textarea
                value={dietary}
                onChange={(e) => setDietary(e.target.value)}
                placeholder={t.dietaryPlaceholder}
                disabled={rsvpClosed}
                rows={3}
                className="border-[#D4C695] bg-white/60 focus:border-[#B8962E]"
                style={{ color: "#3D3528" }}
              />
            </div>
          </div>
        )}

        <div>
          <label
            className="block font-serif text-sm tracking-[0.15em] uppercase mb-3"
            style={{ color: "#B8962E" }}
          >
            {t.message}
          </label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t.messagePlaceholder}
            disabled={rsvpClosed}
            rows={4}
            className="border-[#D4C695] bg-white/60 focus:border-[#B8962E]"
            style={{ color: "#3D3528" }}
          />
        </div>

        {submitSuccess && (
          <div
            className="text-center py-4 px-4 rounded-lg border animate-fade-in"
            style={{ backgroundColor: "#FAF3E0", borderColor: "#B8962E" }}
          >
            <p className="font-serif text-lg" style={{ color: "#B8962E" }}>
              {t.success}
            </p>
          </div>
        )}

        {(mutation as any).error && (
          <div
            className="text-center py-4 px-4 rounded-lg border"
            style={{ backgroundColor: "#FAF3E0", borderColor: "#dc2626" }}
          >
            <p className="text-sm" style={{ color: "#dc2626" }}>
              {t.errorSubmit}
            </p>
          </div>
        )}

        <div className="text-center pt-4">
          <Button
            type="submit"
            disabled={!status || rsvpClosed || mutation.isPending}
            loading={mutation.isPending}
            size="lg"
            className="px-16 py-4 font-serif text-lg tracking-[0.3em] uppercase"
            style={{
              backgroundColor: "#B8962E",
              color: "#FAF3E0",
              border: "1px solid #B8962E",
            }}
          >
            {mutation.isPending ? t.submitting : t.submit}
          </Button>
        </div>
      </form>
    </div>
  );
}
