import { useState, useEffect } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, UserEvent, ScheduleItem, EventRsvp } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Input";
import { EmptyState, ErrorState, Skeleton } from "../../components/ui/index";
import { formatDate, formatTime, isRsvpClosed, formatDeadline } from "../../lib/utils";
import { Loader2, Calendar, Clock, MapPin, Shirt, Check } from "lucide-react";
import type { Lang } from "./rusty-layout";
import type { CSSProperties, FormEvent } from "react";

interface OutletContext {
  event: UserEvent;
  lang: Lang;
}

const content = {
  en: {
    title: "RSVP",
    subtitle: "Kindly respond to our invitation",
    schedule: "Event Schedule",
    attending: "Joyfully Accept",
    decline: "Regretfully Decline",
    plusOnes: "Plus Ones",
    dietary: "Dietary Requirements",
    dietaryPlaceholder: "Please share any dietary requirements or allergies",
    message: "Message to the Couple",
    messagePlaceholder: "Leave a message for the happy couple",
    submit: "Send RSVP",
    submitting: "Sending...",
    thankYou: "Thank You",
    thankYouAttending: "We look forward to celebrating with you",
    thankYouDeclined: "Thank you for letting us know. You will be missed.",
    edit: "Edit Response",
    closed: "RSVPs closed",
    closedOn: "RSVPs closed on",
    noSchedule: "No schedule items available",
    date: "Date",
    time: "Time",
    venue: "Venue",
    address: "Address",
    dressCode: "Dress Code",
    loading: "Loading...",
    error: "Unable to load event details",
    guestName: "Your Name",
  },
  bm: {
    title: "RSVP",
    subtitle: "Sila maklum balas kepada jemputan kami",
    schedule: "Jadual Acara",
    attending: "Terima dengan Gembira",
    decline: "Tidak Hadir",
    plusOnes: "Tetamu Tambahan",
    dietary: "Keperluan Diet",
    dietaryPlaceholder: "Sila nyatakan sebarang keperluan diet atau alahan",
    message: "Mesej kepada Pasangan",
    messagePlaceholder: "Tinggalkan mesej untuk pasangan bahagia",
    submit: "Hantar RSVP",
    submitting: "Menghantar...",
    thankYou: "Terima Kasih",
    thankYouAttending: "Kami menantikan sambutan bersama anda",
    thankYouDeclined: "Terima kasih atas makluman. Anda akan dirindui.",
    edit: "Ubah Jawapan",
    closed: "RSVP Ditutup",
    closedOn: "RSVP ditutup pada",
    noSchedule: "Tiada item jadual tersedia",
    date: "Tarikh",
    time: "Masa",
    venue: "Tempat",
    address: "Alamat",
    dressCode: "Pakaian",
    loading: "Memuatkan...",
    error: "Tidak dapat memuatkan butiran acara",
    guestName: "Nama Anda",
  },
};

export default function RustyRsvp() {
  const { event, lang } = useOutletContext<OutletContext>();
  const { eventId } = useParams<{ eventId: string }>();
  const auth = useGuestAuth();
  const queryClient = useQueryClient();
  const t = content[lang];

  const [status, setStatus] = useState<"attending" | "declined" | null>(null);
  const [plusOnes, setPlusOnes] = useState(0);
  const [dietary, setDietary] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const deadline = event.draft_rsvp_deadline || event.rsvp_deadline;
  const rsvpClosed = isRsvpClosed(deadline);

  const { data: schedule, isLoading: scheduleLoading, error: scheduleError } = useQuery<ScheduleItem[]>({
    queryKey: ["event-schedule", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_schedule")
        .select("*")
        .eq("event_id", eventId)
        .order("order_index", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!eventId,
    staleTime: 30000,
  });

  const { data: existingRsvp, isLoading: rsvpLoading } = useQuery<EventRsvp | null>({
    queryKey: ["existing-rsvp", eventId, auth.guestId],
    queryFn: async () => {
      if (!auth.guestId) return null;
      const { data, error } = await supabase
        .from("event_rsvps")
        .select("*")
        .eq("event_id", eventId)
        .eq("guest_id", auth.guestId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!eventId && !!auth.guestId,
    staleTime: 30000,
  });

  useEffect(() => {
    if (existingRsvp) {
      setStatus(existingRsvp.status === "maybe" ? null : existingRsvp.status);
      setPlusOnes(existingRsvp.plus_ones || 0);
      setDietary(existingRsvp.dietary || "");
      setMessage(existingRsvp.message || "");
      setSubmitted(true);
    }
  }, [existingRsvp]);

  const mutation = useMutation<void, Error>({
    mutationFn: async () => {
      if (!eventId || !auth.guestId || !status) throw new Error("Missing required fields");

      const payload = {
        event_id: eventId,
        guest_id: auth.guestId,
        guest_name: auth.guestName || "Guest",
        status,
        plus_ones: status === "attending" ? plusOnes : 0,
        dietary: dietary || null,
        message: message || null,
      };

      if (existingRsvp) {
        const { error } = await supabase
          .from("event_rsvps")
          .update({ ...payload, submitted_at: new Date().toISOString() })
          .eq("id", existingRsvp.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("event_rsvps").insert({
          ...payload,
          submitted_at: new Date().toISOString(),
        });
        if (error) throw error;
      }

      const { error: guestError } = await supabase
        .from("event_guests")
        .update({
          rsvp_status: status,
          rsvp_submitted_at: new Date().toISOString(),
          dietary: dietary || null,
          message: message || null,
        })
        .eq("id", auth.guestId);
      if (guestError) throw guestError;
    },
    onSuccess: () => {
      setSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ["existing-rsvp", eventId, auth.guestId] });
      queryClient.invalidateQueries({ queryKey: ["event-guest", auth.guestId] });
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!status || rsvpClosed) return;
    mutation.mutate();
  };

  const handleEdit = () => {
    setSubmitted(false);
  };

  const sectionStyle: CSSProperties = {
    maxWidth: "var(--max-width)",
    margin: "0 auto",
    paddingTop: "var(--section-padding)",
    paddingBottom: "var(--section-padding)",
    marginLeft: "auto",
    marginRight: "auto",
    paddingLeft: "24px",
    paddingRight: "24px",
    width: "100%",
  };

  const headingStyle: CSSProperties = {
    color: "var(--heading-color)",
    fontFamily: "var(--heading-font)",
  };

  const cardStyle: CSSProperties = {
    borderColor: "#C4A44A",
    borderWidth: "1px",
    borderStyle: "solid",
    backgroundColor: "rgba(250, 243, 224, 0.6)",
  };

  if (scheduleLoading || rsvpLoading) {
    return (
      <div style={sectionStyle} className="text-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#B8962E] mx-auto" />
        <p className="text-sm text-[#8B7355] mt-3">{t.loading}</p>
      </div>
    );
  }

  if (scheduleError) {
    return (
      <div style={sectionStyle}>
        <ErrorState message={t.error} />
      </div>
    );
  }

  if (submitted && existingRsvp) {
    return (
      <div style={sectionStyle} className="text-center">
        <div
          className="rounded-lg p-8 mx-auto max-w-md"
          style={cardStyle}
        >
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="h-px w-8 bg-[#C4A44A]" />
            <span className="text-[10px] uppercase tracking-[0.3em] text-[#C4A44A]">✦</span>
            <span className="h-px w-8 bg-[#C4A44A]" />
          </div>

          <div className="w-16 h-16 rounded-full border border-[#C4A44A] flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-[#B8962E]" />
          </div>

          <h2 className="text-3xl font-medium mb-3" style={headingStyle}>
            {t.thankYou}
          </h2>
          <p className="text-sm text-[#8B7355] mb-6 italic" style={{ fontFamily: "var(--script-font)" }}>
            {status === "attending" ? t.thankYouAttending : t.thankYouDeclined}
          </p>

          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="h-px w-8 bg-[#C4A44A]" />
            <span className="text-[10px] uppercase tracking-[0.3em] text-[#C4A44A]">✦</span>
            <span className="h-px w-8 bg-[#C4A44A]" />
          </div>

          {!rsvpClosed && (
            <button
              onClick={handleEdit}
              className="text-[11px] tracking-[0.15em] uppercase text-[#8B7355] hover:text-[#B8962E] transition-colors underline underline-offset-4"
            >
              {t.edit}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <section style={sectionStyle} className="text-center">
        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="h-px w-10 bg-[#C4A44A]" />
          <span className="text-[10px] uppercase tracking-[0.3em] text-[#C4A44A]">✦</span>
          <span className="h-px w-10 bg-[#C4A44A]" />
        </div>

        <h1 className="text-3xl sm:text-4xl font-medium mb-3" style={headingStyle}>
          {t.title}
        </h1>
        <p className="text-sm text-[#A07820] italic" style={{ fontFamily: "var(--script-font)" }}>
          {t.subtitle}
        </p>

        <div className="flex items-center justify-center gap-2 mt-6">
          <span className="h-px w-10 bg-[#C4A44A]" />
          <span className="text-[10px] uppercase tracking-[0.3em] text-[#C4A44A]">✦</span>
          <span className="h-px w-10 bg-[#C4A44A]" />
        </div>
      </section>

      {rsvpClosed && (
        <section style={{ ...sectionStyle, paddingTop: 0, paddingBottom: 0 }}>
          <div
            className="rounded-lg p-6 mx-auto max-w-md text-center"
            style={cardStyle}
          >
            <p className="text-sm text-[#8B7355] mb-2" style={{ fontFamily: "var(--script-font)" }}>
              {t.closed}
            </p>
            <p className="text-xs text-[#8B7355]">
              {t.closedOn} {formatDeadline(deadline)}
            </p>
          </div>
        </section>
      )}

      {schedule && schedule.length > 0 && (
        <section style={{ ...sectionStyle, paddingTop: 0, paddingBottom: 0 }}>
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="h-px w-8 bg-[#C4A44A]/50" />
            <span className="text-[10px] uppercase tracking-[0.3em] text-[#C4A44A]">{t.schedule}</span>
            <span className="h-px w-8 bg-[#C4A44A]/50" />
          </div>

          <div className="space-y-4">
            {schedule.map((item) => (
              <div
                key={item.id}
                className="rounded-lg p-6"
                style={cardStyle}
              >
                <h3 className="text-xl font-medium mb-4 text-center" style={headingStyle}>
                  {item.title}
                </h3>

                {item.cover_image && (
                  <img
                    src={item.cover_image}
                    alt={item.title}
                    className="w-full h-40 object-cover rounded-md mb-4"
                    style={{ border: "1px solid #C4A44A" }}
                  />
                )}

                {item.description && (
                  <p className="text-xs text-[#8B7355] text-center mb-4 italic">
                    {item.description}
                  </p>
                )}

                <div className="space-y-3">
                  {item.schedule_date && (
                    <div className="flex items-start gap-3">
                      <Calendar className="w-4 h-4 text-[#C4A44A] mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.25em] text-[#C4A44A]">{t.date}</p>
                        <p className="text-sm" style={headingStyle}>{formatDate(item.schedule_date)}</p>
                      </div>
                    </div>
                  )}

                  {item.start_time && (
                    <div className="flex items-start gap-3">
                      <Clock className="w-4 h-4 text-[#C4A44A] mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.25em] text-[#C4A44A]">{t.time}</p>
                        <p className="text-sm" style={headingStyle}>
                          {formatTime(item.start_time)}
                          {item.end_time && ` — ${formatTime(item.end_time)}`}
                        </p>
                      </div>
                    </div>
                  )}

                  {item.venue && (
                    <div className="flex items-start gap-3">
                      <MapPin className="w-4 h-4 text-[#C4A44A] mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.25em] text-[#C4A44A]">{t.venue}</p>
                        <p className="text-sm" style={headingStyle}>{item.venue}</p>
                      </div>
                    </div>
                  )}

                  {item.address && (
                    <div className="flex items-start gap-3">
                      <MapPin className="w-4 h-4 text-[#C4A44A] mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.25em] text-[#C4A44A]">{t.address}</p>
                        <p className="text-sm text-[#8B7355]">{item.address}</p>
                      </div>
                    </div>
                  )}

                  {item.dress_code && (
                    <div className="flex items-start gap-3">
                      <Shirt className="w-4 h-4 text-[#C4A44A] mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.25em] text-[#C4A44A]">{t.dressCode}</p>
                        <p className="text-sm text-[#8B7355]">{item.dress_code}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {schedule && schedule.length === 0 && (
        <section style={{ ...sectionStyle, paddingTop: 0, paddingBottom: 0 }}>
          <EmptyState title={t.noSchedule} />
        </section>
      )}

      <section style={{ ...sectionStyle, paddingTop: 0 }}>
        <form onSubmit={handleSubmit} className="mx-auto max-w-md">
          <div
            className="rounded-lg p-6 space-y-6"
            style={cardStyle}
          >
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-[#C4A44A] text-center mb-3">
                {t.guestName}
              </p>
              <p className="text-sm text-center" style={headingStyle}>
                {auth.guestName}
              </p>
            </div>

            <div className="flex items-center justify-center gap-2">
              <span className="h-px w-8 bg-[#C4A44A]/50" />
              <span className="text-[10px] uppercase tracking-[0.3em] text-[#C4A44A]">✦</span>
              <span className="h-px w-8 bg-[#C4A44A]/50" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setStatus("attending")}
                disabled={rsvpClosed}
                className="py-3 text-xs tracking-[0.15em] uppercase transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: status === "attending" ? "var(--button-bg)" : "transparent",
                  color: status === "attending" ? "var(--button-text)" : "var(--heading-color)",
                  border: `1px solid ${status === "attending" ? "var(--button-bg)" : "#C4A44A"}`,
                  borderRadius: "var(--button-radius)",
                }}
              >
                {t.attending}
              </button>
              <button
                type="button"
                onClick={() => setStatus("declined")}
                disabled={rsvpClosed}
                className="py-3 text-xs tracking-[0.15em] uppercase transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: status === "declined" ? "var(--button-bg)" : "transparent",
                  color: status === "declined" ? "var(--button-text)" : "var(--heading-color)",
                  border: `1px solid ${status === "declined" ? "var(--button-bg)" : "#C4A44A"}`,
                  borderRadius: "var(--button-radius)",
                }}
              >
                {t.decline}
              </button>
            </div>

            {status === "attending" && (
              <div>
                <label className="block text-[10px] uppercase tracking-[0.25em] text-[#C4A44A] mb-2">
                  {t.plusOnes}
                </label>
                <div className="flex items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={() => setPlusOnes(Math.max(0, plusOnes - 1))}
                    disabled={rsvpClosed}
                    className="w-10 h-10 rounded-full border border-[#C4A44A] text-[#B8962E] hover:bg-[#C4A44A]/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    −
                  </button>
                  <span className="text-2xl font-medium" style={headingStyle}>
                    {plusOnes}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPlusOnes(Math.min(10, plusOnes + 1))}
                    disabled={rsvpClosed}
                    className="w-10 h-10 rounded-full border border-[#C4A44A] text-[#B8962E] hover:bg-[#C4A44A]/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {status === "attending" && (
              <div>
                <label className="block text-[10px] uppercase tracking-[0.25em] text-[#C4A44A] mb-2">
                  {t.dietary}
                </label>
                <Textarea
                  value={dietary}
                  onChange={(e) => setDietary(e.target.value)}
                  placeholder={t.dietaryPlaceholder}
                  rows={2}
                  disabled={rsvpClosed}
                  className="bg-white/60 border-[#C4A44A]/40 text-[#8B7355] placeholder:text-[#8B7355]/40 focus:border-[#B8962E]"
                />
              </div>
            )}

            <div>
              <label className="block text-[10px] uppercase tracking-[0.25em] text-[#C4A44A] mb-2">
                {t.message}
              </label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t.messagePlaceholder}
                rows={3}
                maxLength={500}
                disabled={rsvpClosed}
                className="bg-white/60 border-[#C4A44A]/40 text-[#8B7355] placeholder:text-[#8B7355]/40 focus:border-[#B8962E]"
              />
            </div>

            {(mutation as any).error && (
              <p className="text-xs text-red-600 text-center">
                {(mutation as any).error.message || "Unable to submit RSVP. Please try again."}
              </p>
            )}

            <Button
              type="submit"
              size="lg"
              loading={mutation.isPending}
              disabled={!status || rsvpClosed}
              className="w-full tracking-[0.2em] uppercase"
              style={{
                backgroundColor: "var(--button-bg)",
                color: "var(--button-text)",
                borderColor: "var(--button-bg)",
                borderRadius: "var(--button-radius)",
              }}
            >
              {mutation.isPending ? t.submitting : t.submit}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
