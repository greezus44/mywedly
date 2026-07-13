import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { motion } from "motion/react";
import { GuestLayout } from "@/components/guest/GuestChrome";
import type { Wedding } from "@/lib/wedding-queries";
import { getWeddingBySlug } from "@/lib/wedding-queries";
import { styleFor, getStyle } from "@/lib/text-styles";
import { PreserveText } from "@/components/guest/PreserveText";

export const Route = createFileRoute("/w/$slug/")({
  head: ({ loaderData }) => {
    const w = (loaderData as { wedding: Wedding } | undefined)?.wedding;
    if (!w) return { meta: [{ title: "Wedding" }, { name: "robots", content: "noindex" }] };
    const title = `${w.couple_name_one} & ${w.couple_name_two}`;
    return {
      meta: [
        { title },
        {
          name: "description",
          content: `The wedding of ${w.couple_name_one} & ${w.couple_name_two}.`,
        },
        { property: "og:title", content: title },
        ...(w.hero_image_url ? [{ property: "og:image", content: w.hero_image_url }] : []),
      ],
    };
  },
  loader: async ({ params }) => {
    const wedding = await getWeddingBySlug(params.slug);
    if (!wedding) throw notFound();
    return { wedding };
  },
  component: CoverPage,
});

function CoverPage() {
  const { wedding } = Route.useLoaderData();
  return (
    <GuestLayout
      slug={wedding.slug}
      weddingId={wedding.id}
      theme={wedding.theme}
      couple={{ one: wedding.couple_name_one, two: wedding.couple_name_two }}
    >
      <Cover wedding={wedding} />
    </GuestLayout>
  );
}

function Cover({ wedding }: { wedding: Wedding }) {
  const content = (wedding.content ?? {}) as Record<string, any>;
  const bg = content.cover_background_url as string | undefined;
  const logo = content.cover_logo_url as string | undefined;
  const heading =
    (content.cover_heading as string | undefined) ||
    `${wedding.couple_name_one} & ${wedding.couple_name_two}`;
  const subtitle = content.cover_subtitle as string | undefined;
  const welcome = content.cover_welcome as string | undefined;
  const ctaLabel = (content.cover_cta_label as string | undefined) || "OPEN INVITATION";

  const date = wedding.wedding_date ? new Date(wedding.wedding_date + "T00:00:00") : null;
  const monthYear = date
    ? date.toLocaleDateString("en-US", { month: "long", year: "numeric" }).toUpperCase()
    : subtitle
      ? subtitle.toUpperCase()
      : "COMING SOON";
  const [month, year] = monthYear.split(" ");

  const headingStyle = getStyle(content, "cover_heading");
  const subtitleStyle = getStyle(content, "cover_subtitle");
  const welcomeStyle = getStyle(content, "cover_welcome");
  const ctaStyle = getStyle(content, "cover_cta");

  const initialsStyle = {
    fontFamily: "var(--font-serif)",
    fontStyle: "italic",
    fontWeight: 500,
  } as React.CSSProperties;

  return (
    <div
      className="min-h-[80vh] flex flex-col items-center justify-center px-6 py-16 text-sepia relative"
      style={
        bg
          ? { backgroundImage: `url(${bg})`, backgroundSize: "cover", backgroundPosition: "center" }
          : undefined
      }
    >
      {bg && <div className="absolute inset-0 bg-parchment/70" aria-hidden />}
      <div className="relative">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.4, ease: [0.2, 0.65, 0.3, 0.95] }}
          className="mb-4 flex justify-center"
        >
          {logo ? (
            <img src={logo} alt="" className="max-h-40 md:max-h-56 object-contain" />
          ) : (
            <div
              className="text-[140px] md:text-[180px] leading-none tracking-tight text-sepia relative"
              style={initialsStyle}
            >
              <span className="relative inline-block">
                {wedding.couple_name_one[0]}
                <span className="absolute left-1/2 top-1/2 -translate-x-[35%] -translate-y-[45%] opacity-95">
                  {wedding.couple_name_two[0]}
                </span>
              </span>
            </div>
          )}
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
          className="text-sepia text-5xl md:text-6xl mb-8 text-center px-4"
          style={{ ...initialsStyle, ...styleFor(headingStyle) }}
        >
          <PreserveText>{heading}</PreserveText>
        </motion.h1>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="text-center mb-8"
        >
          <p
            className="text-sepia text-sm tracking-[0.35em] leading-loose font-medium"
            style={styleFor(subtitleStyle)}
          >
            <PreserveText>{subtitle || `${month}${year ? `\n${year}` : ""}`}</PreserveText>
          </p>
        </motion.div>

        {welcome && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.2 }}
            className="text-center max-w-md mx-auto italic text-sepia/80 mb-10"
            style={{ fontFamily: "var(--font-serif)", ...styleFor(welcomeStyle) }}
          >
            <PreserveText>{welcome}</PreserveText>
          </motion.p>
        )}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.4 }}
          className="flex justify-center"
        >
          <Link
            to="/w/$slug/signin"
            params={{ slug: wedding.slug }}
            aria-label="Enter invitation"
            className="inline-flex items-center justify-center border-2 border-sepia/70 rounded-md px-8 h-14 text-sepia text-sm tracking-[0.25em] font-medium hover:bg-sepia hover:text-parchment transition-colors"
            style={styleFor(ctaStyle)}
          >
            {ctaLabel}
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
