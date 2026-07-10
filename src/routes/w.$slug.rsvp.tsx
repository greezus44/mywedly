import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getWeddingBySlug, type Wedding } from "@/lib/wedding-queries";
import { toast } from "sonner";

export const Route = createFileRoute("/w/$slug/rsvp")({
  head: ({ params }) => ({
    meta: [
      { title: `RSVP — ${params.slug}` },
      { name: "robots", content: "noindex" },
    ],
  }),
  loader: async ({ params }) => {
    const wedding = await getWeddingBySlug(params.slug);
    if (!wedding) throw notFound();
    return { wedding };
  },
  component: RsvpPage,
});

function RsvpPage() {
  const { wedding } = Route.useLoaderData();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"accepted" | "declined" | "tentative">("accepted");
  const [plusOne, setPlusOne] = useState("");
  const [meal, setMeal] = useState("");
  const [dietary, setDietary] = useState("");
  const [song, setSong] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const submit = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("rsvps").insert({
        wedding_id: wedding.id,
        guest_name: name.trim(),
        guest_email: email.trim() || null,
        status,
        plus_one_name: plusOne.trim() || null,
        meal_choice: meal.trim() || null,
        dietary_restrictions: dietary.trim() || null,
        song_request: song.trim() || null,
        message: message.trim() || null,
      });
      if (error) throw error;
      // Also add to guestbook if there's a message
      if (message.trim()) {
        await supabase.from("guestbook_entries").insert({
          wedding_id: wedding.id,
          author_name: name.trim(),
          message: message.trim(),
        });
      }
    },
    onSuccess: () => { setSubmitted(true); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="min-h-screen bg-parchment text-onyx">
      <nav className="flex justify-between items-center px-6 md:px-10 py-6 border-b border-onyx/5">
        <Link to="/w/$slug" params={{ slug: wedding.slug }} className="serif-italic text-xl">
          {wedding.couple_name_one[0]} <span className="opacity-40">&amp;</span> {wedding.couple_name_two[0]}
        </Link>
        <Link to="/w/$slug" params={{ slug: wedding.slug }} className="text-xs uppercase tracking-widest text-onyx/60 hover:text-onyx">
          ← Back to site
        </Link>
      </nav>

      <main className="max-w-2xl mx-auto px-6 md:px-10 py-16">
        {submitted ? (
          <ThankYou wedding={wedding} onAgain={() => { setSubmitted(false); setName(""); setEmail(""); setPlusOne(""); setMeal(""); setDietary(""); setSong(""); setMessage(""); }} />
        ) : (
          <>
            <p className="eyebrow mb-4 text-sepia">RSVP</p>
            <h1 className="font-serif text-5xl md:text-6xl italic leading-none mb-4">
              A response, kindly.
            </h1>
            <p className="text-onyx/60 mb-12 max-w-md leading-relaxed">
              {wedding.couple_name_one} &amp; {wedding.couple_name_two} would love to know if you'll join them{wedding.wedding_date ? ` on ${new Date(wedding.wedding_date + "T00:00:00").toLocaleDateString(undefined, { month: "long", day: "numeric" })}` : ""}.
            </p>

            <form
              onSubmit={(e) => { e.preventDefault(); if (name.trim()) submit.mutate(); }}
              className="space-y-8"
            >
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="eyebrow block mb-2">Your name</label>
                  <input required value={name} onChange={(e) => setName(e.target.value)} className="w-full border-b border-onyx/20 bg-transparent py-2 outline-none focus:border-onyx" />
                </div>
                <div>
                  <label className="eyebrow block mb-2">Email</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border-b border-onyx/20 bg-transparent py-2 outline-none focus:border-onyx" />
                </div>
              </div>

              <div>
                <label className="eyebrow block mb-3">Will you attend?</label>
                <div className="grid grid-cols-3 gap-3">
                  {(["accepted", "tentative", "declined"] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStatus(s)}
                      className={`py-4 text-xs uppercase tracking-widest border transition-colors ${
                        status === s ? "bg-onyx text-parchment border-onyx" : "border-onyx/20 text-onyx hover:border-onyx"
                      }`}
                    >
                      {s === "accepted" ? "Joyfully accept" : s === "declined" ? "Regretfully decline" : "Tentative"}
                    </button>
                  ))}
                </div>
              </div>

              {status !== "declined" && (
                <>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="eyebrow block mb-2">Plus one name</label>
                      <input value={plusOne} onChange={(e) => setPlusOne(e.target.value)} placeholder="Optional" className="w-full border-b border-onyx/20 bg-transparent py-2 outline-none focus:border-onyx" />
                    </div>
                    <div>
                      <label className="eyebrow block mb-2">Meal choice</label>
                      <input value={meal} onChange={(e) => setMeal(e.target.value)} placeholder="Fish / Beef / Vegetarian" className="w-full border-b border-onyx/20 bg-transparent py-2 outline-none focus:border-onyx" />
                    </div>
                  </div>
                  <div>
                    <label className="eyebrow block mb-2">Dietary restrictions</label>
                    <input value={dietary} onChange={(e) => setDietary(e.target.value)} placeholder="Allergies, preferences" className="w-full border-b border-onyx/20 bg-transparent py-2 outline-none focus:border-onyx" />
                  </div>
                  <div>
                    <label className="eyebrow block mb-2">Song request</label>
                    <input value={song} onChange={(e) => setSong(e.target.value)} placeholder="Something to keep us dancing" className="w-full border-b border-onyx/20 bg-transparent py-2 outline-none focus:border-onyx" />
                  </div>
                </>
              )}

              <div>
                <label className="eyebrow block mb-2">A note to the couple</label>
                <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} placeholder="Congratulations, wishes, or a private message" className="w-full border border-onyx/20 bg-transparent p-3 outline-none focus:border-onyx" />
                <p className="text-[10px] text-onyx/40 mt-1">Notes may appear in the public guestbook.</p>
              </div>

              <button type="submit" disabled={submit.isPending} className="w-full bg-onyx text-parchment py-4 text-xs uppercase tracking-widest hover:bg-ink transition-colors disabled:opacity-50">
                {submit.isPending ? "Submitting…" : "Submit RSVP"}
              </button>
            </form>
          </>
        )}
      </main>
    </div>
  );
}

function ThankYou({ wedding, onAgain }: { wedding: Wedding; onAgain: () => void }) {
  return (
    <div className="text-center py-16">
      <p className="eyebrow mb-6 text-sepia">Received</p>
      <h1 className="font-serif text-6xl italic mb-6">Thank you.</h1>
      <p className="text-onyx/60 mb-10 max-w-md mx-auto leading-relaxed">
        Your response has been recorded. {wedding.couple_name_one} &amp; {wedding.couple_name_two} can't wait to celebrate.
      </p>
      <div className="flex justify-center gap-3">
        <Link to="/w/$slug" params={{ slug: wedding.slug }} className="bg-onyx text-parchment px-6 py-3 text-xs uppercase tracking-widest hover:bg-ink transition-colors">
          Back to the site
        </Link>
        <button onClick={onAgain} className="border border-onyx px-6 py-3 text-xs uppercase tracking-widest hover:bg-onyx hover:text-parchment transition-colors">
          Submit another
        </button>
      </div>
    </div>
  );
}
