import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { GuestLayout } from "@/components/guest/GuestChrome";
import { useLang } from "@/lib/wedding-guest";
import { getWeddingBySlug, type Wedding } from "@/lib/wedding-queries";

export const Route = createFileRoute("/w/$slug/invitation")({
  head: () => ({ meta: [{ title: "Invitation" }] }),
  loader: async ({ params }) => {
    const wedding = await getWeddingBySlug(params.slug);
    if (!wedding) throw notFound();
    return { wedding };
  },
  component: InvitationPage,
});

function InvitationPage() {
  const { wedding } = Route.useLoaderData();
  return (
    <GuestLayout requireSignIn slug={wedding.slug} weddingId={wedding.id} theme={wedding.theme}
      couple={{ one: wedding.couple_name_one, two: wedding.couple_name_two }}>
      <Body wedding={wedding} />
    </GuestLayout>
  );
}

function Body({ wedding }: { wedding: Wedding }) {
  const { t } = useLang();
  const content = (wedding.content ?? {}) as Record<string, any>;
  const invitationTitle = (content.invitation_heading as string | undefined) ?? "YA-QADHI AL-HAJAT";
  const bismillah = (content.invitation_bismillah as string | undefined) ?? "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ";
  const parentsBlock = (content.parents as string | undefined) ?? "";
  const invitationText = (content.invitation_text as string | undefined) ??
    t("With the utmost respect and joy, we cordially invite you to celebrate the wedding of our beloved children.",
      "Dengan penuh hormat dan takzim sukacita menjunjung / mempersilakan hadir ke Majlis Perkahwinan bagi anakanda kami.");
  const closingText = (content.closing_text as string | undefined) ??
    t("On your gracious attendance, we extend our deepest thanks.",
      "Di atas kehadiran para tetamu, terlebih dahulu kami mengucapkan ribuan terima kasih.");
  const ctaLabel = (content.invitation_cta_label as string | undefined) ?? "RSVP";

  return (
    <div className="max-w-2xl mx-auto px-6 md:px-10 py-10 md:py-16 text-center text-sepia">
      {bismillah && (
        <div className="text-4xl md:text-5xl mb-4" style={{ fontFamily: "var(--font-serif)", direction: "rtl" }}>
          {bismillah}
        </div>
      )}
      <p className="text-sepia text-sm tracking-[0.22em] font-medium mb-10">{invitationTitle}</p>

      {parentsBlock ? (
        <div className="whitespace-pre-line text-[11px] md:text-xs tracking-[0.18em] leading-[2.2] font-medium mb-10">
          {parentsBlock}
        </div>
      ) : (
        <p className="text-[11px] md:text-xs tracking-[0.15em] leading-loose mb-10 text-sepia/70 italic">
          {t("Parents' names can be added from the dashboard.", "Nama ibu bapa boleh ditambah dari papan pemuka.")}
        </p>
      )}

      <p className="text-sm italic leading-relaxed mb-10 max-w-lg mx-auto" style={{ fontFamily: "var(--font-serif)" }}>
        {invitationText}
      </p>

      <div className="mb-3">
        <p className="text-sepia text-lg md:text-xl tracking-[0.22em] font-medium">
          {wedding.couple_name_one.toUpperCase()}
        </p>
        <p className="text-sepia text-[11px] tracking-[0.35em] my-3 font-medium">
          {t("WITH", "DENGAN")}
        </p>
        <p className="text-sepia text-lg md:text-xl tracking-[0.22em] font-medium">
          {wedding.couple_name_two.toUpperCase()}
        </p>
      </div>

      <p className="text-sm italic leading-relaxed my-10 max-w-lg mx-auto" style={{ fontFamily: "var(--font-serif)" }}>
        {closingText}
      </p>

      <Link
        to="/w/$slug/events"
        params={{ slug: wedding.slug }}
        className="inline-flex items-center justify-center border-2 border-sepia/70 rounded-md px-10 h-12 text-sepia text-sm tracking-[0.25em] font-medium hover:bg-sepia hover:text-parchment transition-colors"
      >
        {ctaLabel}
      </Link>
    </div>
  );
}
