import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { GuestLayout } from "@/components/guest/GuestChrome";
import { setGuestName } from "@/lib/wedding-guest";
import { getWeddingBySlug, type Wedding } from "@/lib/wedding-queries";
import { notFound } from "@tanstack/react-router";

export const Route = createFileRoute("/w/$slug/signin")({
  head: () => ({ meta: [{ title: "Sign in" }, { name: "robots", content: "noindex" }] }),
  loader: async ({ params }) => {
    const wedding = await getWeddingBySlug(params.slug);
    if (!wedding) throw notFound();
    return { wedding };
  },
  component: SignInPage,
});

function SignInPage() {
  const { wedding } = Route.useLoaderData();
  return (
    <GuestLayout slug={wedding.slug} couple={{ one: wedding.couple_name_one, two: wedding.couple_name_two }}>
      <SignInInner wedding={wedding} />
    </GuestLayout>
  );
}

function SignInInner({ wedding }: { wedding: Wedding }) {
  const [name, setName] = useState("");
  const nav = useNavigate();
  const lang = (typeof window !== "undefined" && localStorage.getItem("mywedly:lang")) === "ms" ? "ms" : "en";
  const t = (en: string, ms: string) => (lang === "ms" ? ms : en);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setGuestName(wedding.slug, name.trim());
    nav({ to: "/w/$slug/invitation", params: { slug: wedding.slug } });
  };

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-6 pb-24">
      <h2
        className="text-sepia text-4xl md:text-5xl tracking-[0.15em] font-medium mb-16"
        style={{ letterSpacing: "0.18em" }}
      >
        {t("SIGN IN", "DAFTAR MASUK")}
      </h2>
      <form onSubmit={submit} className="w-full max-w-md flex flex-col items-center">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("ENTER YOUR NAME", "MASUKKAN NAMA ANDA")}
          className="w-full border-2 border-sepia/70 rounded-md bg-transparent text-sepia placeholder:text-sepia/50 text-center py-4 px-6 text-sm tracking-[0.15em] outline-none focus:border-sepia transition-colors"
        />
        <p className="text-sepia text-[11px] tracking-[0.18em] mt-4 mb-14 font-medium">
          {t("AS STATED ON YOUR INVITATION", "SEPERTI TERTERA PADA JEMPUTAN")}
        </p>
        <button
          type="submit"
          disabled={!name.trim()}
          className="inline-flex items-center justify-center border-2 border-sepia/70 rounded-md w-24 h-14 text-sepia text-2xl hover:bg-sepia hover:text-parchment transition-colors disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-sepia"
        >
          &gt;
        </button>
      </form>
    </div>
  );
}
