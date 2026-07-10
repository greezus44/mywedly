import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getWeddingBySlug, type Wedding } from "@/lib/wedding-queries";
import couplePortrait from "@/assets/couple-portrait.jpg";

export const Route = createFileRoute("/w/$slug/")({
  head: ({ loaderData }) => {
    const w = (loaderData as { wedding: Wedding } | undefined)?.wedding;
    if (!w) {
      return { meta: [{ title: "Wedding not found — Aethel" }, { name: "robots", content: "noindex" }] };
    }
    const title = `${w.couple_name_one} & ${w.couple_name_two}`;
    const desc = w.wedding_date
      ? `Join us on ${new Date(w.wedding_date + "T00:00:00").toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}${w.location ? " in " + w.location : ""}.`
      : "The wedding of a lifetime.";
    return {
      meta: [
        { title: `${title} — Aethel` },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "website" },
        ...(w.hero_image_url ? [{ property: "og:image", content: w.hero_image_url }] : []),
      ],
    };
  },
  loader: async ({ params }) => {
    const wedding = await getWeddingBySlug(params.slug);
    if (!wedding) throw notFound();
    return { wedding };
  },
  component: PublicWeddingPage,
  notFoundComponent: () => (
    <div className="min-h-screen grid place-items-center bg-parchment px-4 text-center">
      <div>
        <p className="eyebrow mb-4">Not found</p>
        <h1 className="font-serif text-4xl italic mb-6">This site does not exist.</h1>
        <Link to="/" className="text-xs uppercase tracking-widest underline">Return to Aethel</Link>
      </div>
    </div>
  ),
});

function PublicWeddingPage() {
  const { wedding } = Route.useLoaderData();
  return <WeddingSite wedding={wedding} />;
}

function WeddingSite({ wedding }: { wedding: Wedding }) {
  const { data: events } = useQuery({
    queryKey: ["public-events", wedding.id],
    queryFn: async () => (await supabase.from("events").select("*").eq("wedding_id", wedding.id).eq("visibility", "public").order("starts_at")).data ?? [],
  });
  const { data: gallery } = useQuery({
    queryKey: ["public-gallery", wedding.id],
    queryFn: async () => (await supabase.from("gallery_items").select("*").eq("wedding_id", wedding.id).eq("is_approved", true).order("created_at", { ascending: false })).data ?? [],
  });
  const { data: guestbook } = useQuery({
    queryKey: ["public-guestbook", wedding.id],
    queryFn: async () => (await supabase.from("guestbook_entries").select("*").eq("wedding_id", wedding.id).eq("is_approved", true).order("created_at", { ascending: false })).data ?? [],
  });
  const { data: registry } = useQuery({
    queryKey: ["public-registry", wedding.id],
    queryFn: async () => (await supabase.from("registry_items").select("*").eq("wedding_id", wedding.id).order("sort_order")).data ?? [],
  });
  const { data: travel } = useQuery({
    queryKey: ["public-travel", wedding.id],
    queryFn: async () => (await supabase.from("travel_items").select("*").eq("wedding_id", wedding.id).order("sort_order")).data ?? [],
  });

  const dateStr = wedding.wedding_date
    ? new Date(wedding.wedding_date + "T00:00:00").toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })
    : "Date TBD";
  const days = wedding.wedding_date
    ? Math.ceil((new Date(wedding.wedding_date + "T00:00:00").getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const heroSrc = wedding.hero_image_url || couplePortrait;

  return (
    <div className="min-h-screen bg-parchment text-onyx">
      {/* Site nav */}
      <nav className="flex justify-between items-center px-6 md:px-10 py-6 border-b border-onyx/5">
        <span className="serif-italic text-xl">
          {wedding.couple_name_one[0]}
          <span className="opacity-40 mx-1">&amp;</span>
          {wedding.couple_name_two[0]}
        </span>
        <div className="hidden md:flex gap-8 text-xs uppercase tracking-widest text-onyx/60">
          <a href="#schedule" className="hover:text-onyx">Schedule</a>
          <a href="#gallery" className="hover:text-onyx">Gallery</a>
          <a href="#travel" className="hover:text-onyx">Travel</a>
          <a href="#registry" className="hover:text-onyx">Registry</a>
          <a href="#guestbook" className="hover:text-onyx">Guestbook</a>
        </div>
        <Link
          to="/w/$slug/rsvp"
          params={{ slug: wedding.slug }}
          className="bg-onyx text-parchment px-5 py-2 text-xs uppercase tracking-widest hover:bg-ink transition-colors"
        >
          RSVP
        </Link>
      </nav>

      {/* Hero */}
      <header className="max-w-5xl mx-auto px-6 md:px-10 pt-20 pb-24 text-center">
        <p className="eyebrow mb-6 text-sepia">The Record</p>
        <h1 className="font-serif text-6xl md:text-8xl italic leading-[0.95] mb-6">
          {wedding.couple_name_one}
          <span className="mx-4 text-sepia">&amp;</span>
          {wedding.couple_name_two}
        </h1>
        <p className="uppercase tracking-[0.3em] text-xs mb-2">{dateStr}</p>
        {wedding.location && <p className="uppercase tracking-[0.2em] text-xs text-onyx/50">{wedding.location}</p>}
        {days !== null && days > 0 && (
          <p className="serif-italic text-3xl mt-10">{days} days</p>
        )}
      </header>

      <div className="max-w-6xl mx-auto px-6 md:px-10">
        <img src={heroSrc} alt={`${wedding.couple_name_one} and ${wedding.couple_name_two}`} className="w-full aspect-[16/9] object-cover grayscale border-8 border-card shadow-editorial" />
      </div>

      {/* Story */}
      {wedding.story && (
        <section className="max-w-3xl mx-auto px-6 md:px-10 py-24 text-center">
          <p className="eyebrow mb-6">Our story</p>
          <p className="font-serif text-2xl italic leading-relaxed">{wedding.story}</p>
        </section>
      )}

      {/* Schedule */}
      <section id="schedule" className="max-w-5xl mx-auto px-6 md:px-10 py-24">
        <div className="border-b border-onyx pb-4 mb-12 flex justify-between items-baseline flex-wrap gap-2">
          <h2 className="font-serif text-4xl italic">The Schedule</h2>
          <p className="eyebrow">Ceremony · Reception · Celebration</p>
        </div>
        <div className="grid md:grid-cols-2 gap-10">
          {(events ?? []).map((e: any) => (
            <div key={e.id} className="border-t border-onyx/15 pt-6">
              <p className="serif-italic text-3xl mb-1">
                {e.starts_at ? new Date(e.starts_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "TBD"}
              </p>
              <p className="eyebrow mb-3">{e.name}</p>
              {e.venue_name && <p className="text-sm">{e.venue_name}</p>}
              {e.venue_address && <p className="text-xs text-onyx/60">{e.venue_address}</p>}
              {e.dress_code && <p className="text-xs italic mt-2">{e.dress_code}</p>}
              {e.notes && <p className="text-sm text-onyx/70 mt-2 leading-relaxed">{e.notes}</p>}
            </div>
          ))}
          {(!events || events.length === 0) && (
            <p className="text-onyx/50 col-span-2">Details forthcoming.</p>
          )}
        </div>
        <div className="text-center mt-16">
          <Link to="/w/$slug/rsvp" params={{ slug: wedding.slug }} className="inline-flex bg-onyx text-parchment px-8 py-4 text-xs uppercase tracking-widest hover:bg-ink transition-colors">
            RSVP to the wedding
          </Link>
        </div>
      </section>

      {/* Gallery */}
      {gallery && gallery.length > 0 && (
        <section id="gallery" className="max-w-6xl mx-auto px-6 md:px-10 py-24">
          <div className="border-b border-onyx pb-4 mb-12">
            <h2 className="font-serif text-4xl italic">Gallery</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {gallery.slice(0, 12).map((g: any) => (
              <img key={g.id} src={g.image_url} alt={g.caption || ""} className="w-full aspect-square object-cover grayscale hover:grayscale-0 transition-all" loading="lazy" />
            ))}
          </div>
        </section>
      )}

      {/* Travel */}
      {travel && travel.length > 0 && (
        <section id="travel" className="max-w-5xl mx-auto px-6 md:px-10 py-24">
          <div className="border-b border-onyx pb-4 mb-12">
            <h2 className="font-serif text-4xl italic">Travel &amp; Lodging</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {travel.map((t: any) => (
              <div key={t.id} className="border-t border-onyx/15 pt-6">
                <p className="eyebrow mb-2">{t.kind}</p>
                <p className="font-serif text-2xl italic">{t.title}</p>
                {t.address && <p className="text-xs text-onyx/60 mt-1">{t.address}</p>}
                {t.description && <p className="text-sm mt-3 leading-relaxed">{t.description}</p>}
                {t.url && <a href={t.url} target="_blank" rel="noopener noreferrer" className="text-xs uppercase tracking-widest underline mt-3 inline-block">Visit</a>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Registry */}
      {registry && registry.length > 0 && (
        <section id="registry" className="max-w-5xl mx-auto px-6 md:px-10 py-24">
          <div className="border-b border-onyx pb-4 mb-12">
            <h2 className="font-serif text-4xl italic">Registry</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {registry.map((r: any) => (
              <a key={r.id} href={r.url || "#"} target="_blank" rel="noopener noreferrer" className="block bg-card border border-onyx/10 p-6 hover:shadow-soft transition-shadow">
                <p className="font-serif text-2xl italic mb-2">{r.title}</p>
                {r.description && <p className="text-sm text-onyx/60 mb-3">{r.description}</p>}
                <span className="eyebrow text-sepia">{r.is_cash_fund ? "Contribute" : "View gift"} →</span>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Guestbook */}
      <section id="guestbook" className="max-w-4xl mx-auto px-6 md:px-10 py-24">
        <div className="border-b border-onyx pb-4 mb-12 flex justify-between items-baseline">
          <h2 className="font-serif text-4xl italic">Guestbook</h2>
          <Link to="/w/$slug/rsvp" params={{ slug: wedding.slug }} className="eyebrow text-sepia hover:text-onyx">
            Leave a note →
          </Link>
        </div>
        {(!guestbook || guestbook.length === 0) ? (
          <p className="text-onyx/50 italic">Be the first to leave a message.</p>
        ) : (
          <ul className="space-y-8">
            {guestbook.map((g: any) => (
              <li key={g.id} className="border-t border-onyx/10 pt-6">
                <p className="font-serif text-xl italic mb-2">"{g.message}"</p>
                <p className="eyebrow">— {g.author_name}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <footer className="border-t border-onyx/5 py-16 text-center">
        <p className="serif-italic text-2xl mb-2">
          {wedding.couple_name_one} &amp; {wedding.couple_name_two}
        </p>
        <p className="eyebrow opacity-50">Made with Aethel</p>
      </footer>
    </div>
  );
}
