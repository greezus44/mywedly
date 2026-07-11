import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { GuestLayout } from "@/components/guest/GuestChrome";
import { getCustomPage, getWeddingBySlug, type CustomPage, type Wedding } from "@/lib/wedding-queries";

export const Route = createFileRoute("/w/$slug/p/$pageSlug")({
  head: ({ loaderData }) => {
    const p = (loaderData as { page: CustomPage } | undefined)?.page;
    return { meta: [{ title: p?.title ?? "Page" }] };
  },
  loader: async ({ params }) => {
    const wedding = await getWeddingBySlug(params.slug);
    if (!wedding) throw notFound();
    const page = await getCustomPage(wedding.id, params.pageSlug);
    if (!page) throw notFound();
    return { wedding, page };
  },
  component: PageView,
  notFoundComponent: () => (
    <div className="min-h-screen grid place-items-center bg-parchment p-8 text-center text-sepia">
      <div>
        <p className="text-2xl mb-4" style={{ fontFamily: "var(--font-serif)", fontStyle: "italic" }}>Page not found</p>
      </div>
    </div>
  ),
});

function PageView() {
  const { wedding, page } = Route.useLoaderData();
  return (
    <GuestLayout slug={wedding.slug} weddingId={wedding.id} theme={wedding.theme}
      couple={{ one: wedding.couple_name_one, two: wedding.couple_name_two }}>
      <Body wedding={wedding} page={page} />
    </GuestLayout>
  );
}

function Body({ wedding, page }: { wedding: Wedding; page: CustomPage }) {
  return (
    <div className="max-w-2xl mx-auto px-6 md:px-10 py-8 md:py-14 text-center text-sepia">
      {page.cover_image_url && (
        <img src={page.cover_image_url} alt="" className="w-full h-64 md:h-80 object-cover rounded-md mb-10" />
      )}
      <h1 className="text-sepia text-2xl md:text-3xl tracking-[0.3em] font-medium mb-10 uppercase">
        {page.title}
      </h1>
      {page.inline_image_url && (
        <img src={page.inline_image_url} alt="" className="max-w-full mx-auto mb-8 rounded-md" />
      )}
      {page.body && (
        <div className="text-sepia text-sm md:text-base tracking-wide leading-[2] whitespace-pre-line text-left"
             style={{ fontFamily: "var(--font-serif)" }}>
          {page.body}
        </div>
      )}
      <div className="mt-14">
        <Link to="/w/$slug" params={{ slug: wedding.slug }}
          className="inline-flex items-center justify-center border-2 border-sepia/70 rounded-md w-24 h-14 text-sepia text-2xl hover:bg-sepia hover:text-parchment transition-colors">
          &gt;
        </Link>
      </div>
    </div>
  );
}
