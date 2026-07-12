import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { GuestLayout } from "@/components/guest/GuestChrome";
import { setGuestSession } from "@/lib/wedding-guest";
import { getWeddingBySlug, type Wedding } from "@/lib/wedding-queries";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { styleFor, getStyle } from "@/lib/text-styles";

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
    <GuestLayout slug={wedding.slug} weddingId={wedding.id} theme={wedding.theme} couple={{ one: wedding.couple_name_one, two: wedding.couple_name_two }}>
      <SignInInner wedding={wedding} />
    </GuestLayout>
  );
}

function SignInInner({ wedding }: { wedding: Wedding }) {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();
  const lang = (typeof window !== "undefined" && localStorage.getItem("mywedly:lang")) === "ms" ? "ms" : "en";
  const t = (en: string, ms: string) => (lang === "ms" ? ms : en);
  const needsPw = wedding.password_mode !== "none";

  const content = (wedding.content ?? {}) as Record<string, any>;
  const heading = (content.signin_heading as string | undefined) || t("SIGN IN", "DAFTAR MASUK");
  const namePh = (content.signin_name_placeholder as string | undefined) || t("ENTER YOUR NAME", "MASUKKAN NAMA ANDA");
  const pwPh = (content.signin_password_placeholder as string | undefined) || t("PASSWORD", "KATA LALUAN");
  const helper = (wedding.signin_helper && wedding.signin_helper.trim())
    || (content.signin_helper as string | undefined)
    || t("AS STATED ON YOUR INVITATION", "SEPERTI TERTERA PADA JEMPUTAN");

  const headingStyle = getStyle(content, "signin_heading");
  const helperStyle = getStyle(content, "signin_helper");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanPw = password.trim();
    if (!cleanName || (needsPw && !cleanPw)) return;
    setBusy(true);
    try {
      const { data, error } = await supabase.rpc("guest_signin", {
        p_slug: wedding.slug,
        p_name: cleanName,
        p_password: cleanPw,
      });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : null;
      if (!row) {
        toast.error(t("Name or password not recognised. Please try again.", "Nama atau kata laluan tidak sah. Sila cuba lagi."));
        return;
      }
      setGuestSession(wedding.slug, {
        guestId: row.guest_id,
        weddingId: row.wedding_id,
        name: row.full_name,
        password: cleanPw,
      });
      nav({ to: "/w/$slug/invitation", params: { slug: wedding.slug } });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-6 pb-24">
      <h2
        className="text-sepia text-4xl md:text-5xl tracking-[0.15em] font-medium mb-14"
        style={{ letterSpacing: "0.18em", ...styleFor(headingStyle) }}
      >
        {heading}
      </h2>
      <form onSubmit={submit} className="w-full max-w-md flex flex-col items-center gap-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={namePh}
          autoComplete="name"
          className="w-full border-2 border-sepia/70 rounded-md bg-transparent text-sepia placeholder:text-sepia/50 text-center py-4 px-6 text-sm tracking-[0.15em] outline-none focus:border-sepia transition-colors"
        />
        {needsPw && (
          <div className="w-full relative">
            <input
              type={show ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={pwPh}
              autoComplete="current-password"
              className="w-full border-2 border-sepia/70 rounded-md bg-transparent text-sepia placeholder:text-sepia/50 text-center py-4 px-12 text-sm tracking-[0.15em] outline-none focus:border-sepia transition-colors"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              aria-label={show ? t("Hide password", "Sembunyi kata laluan") : t("Show password", "Tunjuk kata laluan")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-sepia/70 hover:text-sepia p-1"
            >
              {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        )}
        <p
          className="text-sepia text-[11px] tracking-[0.18em] mt-2 mb-10 font-medium text-center max-w-sm"
          style={styleFor(helperStyle)}
        >
          {helper}
        </p>
        <button
          type="submit"
          disabled={busy || !name.trim() || (needsPw && !password.trim())}
          className="inline-flex items-center justify-center border-2 border-sepia/70 rounded-md w-24 h-14 text-sepia text-2xl hover:bg-sepia hover:text-parchment transition-colors disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-sepia"
        >
          &gt;
        </button>
      </form>
    </div>
  );
}
