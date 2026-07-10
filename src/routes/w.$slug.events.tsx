import { createFileRoute, notFound } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Clock } from "lucide-react";
import { GuestLayout } from "@/components/guest/GuestChrome";
import { getGuestName, useLang, formatEventDate, formatEventTime } from "@/lib/wedding-guest";
import { getWeddingBySlug, type Wedding } from "@/lib/wedding-queries";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/w/$slug/events")({
  head: () => ({ meta: [{ title: "Events & RSVP" }] }),
  loader: async ({ params }) => {
    const wedding = await getWeddingBySlug(params.slug);
    if (!wedding) throw notFound();
    return { wedding };
  },
  component: EventsPage,
});

type EventRow = {
  id: string;
  wedding_id: string;
  name: string;
  starts_at: string | null;
  venue_name: string | null;
  venue_address: string | null;
  dress_code: string | null;
  notes: string | null;
};

type RsvpRow = {
  id: string;
  event_id: string | null;
  status: "accepted" | "declined" | "tentative";
  guest_name: string;
};

function EventsPage() {
  const { wedding } = Route.useLoaderData();
  return (
    <GuestLayout requireSignIn slug={wedding.slug} couple={{ one: wedding.couple_name_one, two: wedding.couple_name_two }}>
      <Inner wedding={wedding} />
    </GuestLayout>
  );
}

function Inner({ wedding }: { wedding: Wedding }) {
  const { t, lang } = useLang();
  const [guestName, setGuest] = useState<string | null>(null);
  useEffect(() => { setGuest(getGuestName(wedding.slug)); }, [wedding.slug]);

  const { data: events } = useQuery({
    queryKey: ["events-public", wedding.id],
    queryFn: async (): Promise<EventRow[]> => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("wedding_id", wedding.id)
        .eq("visibility", "public")
        .order("starts_at");
      if (error) throw error;
      return (data ?? []) as EventRow[];
    },
  });

  const { data: rsvps } = useQuery({
    queryKey: ["rsvps-mine", wedding.id, guestName],
    enabled: !!guestName,
    queryFn: async (): Promise<RsvpRow[]> => {
      const { data, error } = await supabase
        .from("rsvps")
        .select("id, event_id, status, guest_name")
        .eq("wedding_id", wedding.id)
        .ilike("guest_name", guestName!);
      if (error) throw error;
      return (data ?? []) as RsvpRow[];
    },
  });

  const rsvpDeadline = (wedding.content as any)?.rsvp_deadline as string | undefined;

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-10 pt-4 pb-24 text-sepia">
      <div className="text-center mb-4">
        <h1 className="text-sepia text-3xl md:text-4xl tracking-[0.2em] font-medium mb-2">RSVP</h1>
        {rsvpDeadline && (
          <p className="text-sepia text-[11px] tracking-[0.22em] font-medium">
            {t("BEFORE", "SEBELUM")} {new Date(rsvpDeadline + "T00:00:00").toLocaleDateString(lang === "ms" ? "ms-MY" : "en-GB", { day: "2-digit", month: "long", year: "numeric" }).toUpperCase()}
          </p>
        )}
      </div>

      {guestName && (
        <p className="text-center text-sepia text-lg tracking-[0.35em] font-medium mb-10 mt-8">
          {guestName.toUpperCase()}
        </p>
      )}

      <div>
        {(events ?? []).map((ev, idx) => {
          const rsvp = rsvps?.find((r) => r.event_id === ev.id) ?? null;
          return (
            <motion.div
              key={ev.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: idx * 0.05 }}
            >
              <EventCard wedding={wedding} event={ev} rsvp={rsvp} guestName={guestName} />
              <div className="border-t border-sepia/25 my-6" />
            </motion.div>
          );
        })}
        {(!events || events.length === 0) && (
          <p className="text-center text-sepia/60 italic py-16" style={{ fontFamily: "var(--font-serif)" }}>
            {t("Event details will be shared here soon.", "Butiran majlis akan dikongsi di sini tidak lama lagi.")}
          </p>
        )}
      </div>
    </div>
  );
}

function EventCard({
  wedding, event, rsvp, guestName,
}: {
  wedding: Wedding;
  event: EventRow;
  rsvp: RsvpRow | null;
  guestName: string | null;
}) {
  const { t, lang } = useLang();
  const qc = useQueryClient();
  const date = formatEventDate(event.starts_at, lang);
  const time = formatEventTime(event.starts_at);
  const programme = ((wedding.content as any)?.event_programmes?.[event.id] as string | undefined) ?? null;

  const mut = useMutation({
    mutationFn: async (status: "accepted" | "declined") => {
      if (!guestName) throw new Error("Sign in first");
      if (rsvp) {
        const { error } = await supabase.from("rsvps").update({ status }).eq("id", rsvp.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("rsvps").insert({
          wedding_id: wedding.id,
          event_id: event.id,
          guest_name: guestName,
          status,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rsvps-mine", wedding.id] });
      toast.success(t("Response saved.", "Jawapan disimpan."));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const accepted = rsvp?.status === "accepted";
  const declined = rsvp?.status === "declined";

  return (
    <article className="grid grid-cols-[80px_minmax(0,1fr)] md:grid-cols-[110px_minmax(0,1fr)] gap-4 md:gap-8">
      <div className="text-center text-sepia text-[11px] md:text-xs tracking-[0.22em] leading-loose font-medium pt-1">
        <div>{date.dow}</div>
        <div className="text-3xl md:text-4xl my-1 font-normal tracking-normal">{date.day}</div>
        <div>{date.mon}</div>
        <div>{date.year}</div>
      </div>

      <div className="min-w-0">
        <h3 className="text-sepia text-base md:text-xl tracking-[0.2em] font-medium mb-4 leading-snug">
          {event.name.toUpperCase()}
        </h3>

        {time && (
          <p className="text-sepia text-sm tracking-[0.2em] font-medium mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4" strokeWidth={2} />
            {time}
          </p>
        )}

        {(event.venue_name || event.venue_address) && (
          <div className="text-sepia text-[11px] md:text-xs tracking-[0.18em] leading-[2] font-medium mb-4 whitespace-pre-line">
            {event.venue_name && <div>{event.venue_name.toUpperCase()}</div>}
            {event.venue_address && <div>{event.venue_address.toUpperCase()}</div>}
          </div>
        )}

        {programme && (
          <div className="mb-4">
            <p className="text-sepia text-sm tracking-[0.22em] font-medium mb-2">
              {t("PROGRAMME", "ATURCARA")}
            </p>
            <div className="text-sepia text-[11px] tracking-[0.15em] leading-[2] font-medium whitespace-pre-line">
              {programme}
            </div>
          </div>
        )}

        {event.dress_code && (
          <div className="mb-4">
            <p className="text-sepia text-sm tracking-[0.22em] font-medium mb-2">
              {t("ATTIRE", "PAKAIAN")}
            </p>
            <p className="text-sepia text-[11px] tracking-[0.18em] font-medium">
              {event.dress_code.toUpperCase()}
            </p>
          </div>
        )}

        {event.notes && (
          <p className="text-sepia/80 text-xs italic leading-relaxed mb-4" style={{ fontFamily: "var(--font-serif)" }}>
            {event.notes}
          </p>
        )}

        <div className="flex gap-3 mt-4">
          <button
            onClick={() => mut.mutate("accepted")}
            disabled={mut.isPending}
            className={`px-6 h-11 rounded-md border-2 text-xs tracking-[0.22em] font-medium transition-colors ${
              accepted
                ? "bg-[color-mix(in_oklab,var(--success)_25%,var(--parchment))] border-[color-mix(in_oklab,var(--success)_60%,var(--sepia))] text-sepia"
                : "border-sepia/70 text-sepia hover:bg-sepia/5"
            }`}
          >
            {t("ACCEPT", "TERIMA")}
          </button>
          <button
            onClick={() => mut.mutate("declined")}
            disabled={mut.isPending}
            className={`px-6 h-11 rounded-md border-2 text-xs tracking-[0.22em] font-medium transition-colors ${
              declined
                ? "bg-[color-mix(in_oklab,var(--destructive)_20%,var(--parchment))] border-[color-mix(in_oklab,var(--destructive)_50%,var(--sepia))] text-sepia"
                : "border-sepia/70 text-sepia hover:bg-sepia/5"
            }`}
          >
            {t("DECLINE", "TOLAK")}
          </button>
        </div>
      </div>
    </article>
  );
}
