import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { GuestLayout } from "@/components/guest/GuestChrome";
import { useLang } from "@/lib/wedding-guest";
import { getWeddingBySlug, type Wedding } from "@/lib/wedding-queries";

export const Route = createFileRoute("/w/$slug/info")({
  head: () => ({ meta: [{ title: "Information" }] }),
  loader: async ({ params }) => {
    const wedding = await getWeddingBySlug(params.slug);
    if (!wedding) throw notFound();
    return { wedding };
  },
  component: InfoPage,
});

function InfoPage() {
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
  const doaTitle = (content.info_heading as string | undefined) ?? t("DOA", "DOA");
  const doaBody = (content.info_body as string | undefined) ?? "";
  const infoImage = (content.info_image_url as string | undefined) ?? "";

  return (
    <div className="max-w-2xl mx-auto px-6 md:px-10 py-8 md:py-14 text-center text-sepia">
      <h1 className="text-sepia text-2xl md:text-3xl tracking-[0.35em] font-medium mb-12">
        {doaTitle.toUpperCase()}
      </h1>

      {infoImage && (
        <img src={infoImage} alt="" className="max-w-full mx-auto mb-10 rounded-md" />
      )}

      {doaBody ? (
        <div className="text-sepia text-[11px] md:text-xs tracking-[0.18em] leading-[2.4] font-medium whitespace-pre-line mb-16">
          {doaBody}
        </div>
      ) : (
        <p className="text-sepia/60 italic mb-16" style={{ fontFamily: "var(--font-serif)" }}>
          {t("Additional information can be added from the dashboard.", "Maklumat tambahan boleh ditambah dari papan pemuka.")}
        </p>
      )}

      <Link
        to="/w/$slug"
        params={{ slug: wedding.slug }}
        className="inline-flex items-center justify-center border-2 border-sepia/70 rounded-md w-24 h-14 text-sepia text-2xl hover:bg-sepia hover:text-parchment transition-colors"
      >
        &gt;
      </Link>
    </div>
  );
}
