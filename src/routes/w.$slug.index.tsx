import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import type { Wedding } from "@/lib/wedding-queries";
import { getWeddingBySlug } from "@/lib/wedding-queries";
import { notFound } from "@tanstack/react-router";

export const Route = createFileRoute("/w/$slug/")({
  head: ({ loaderData }) => {
    const w = (loaderData as { wedding: Wedding } | undefined)?.wedding;
    if (!w) return { meta: [{ title: "Wedding — MyWedly" }, { name: "robots", content: "noindex" }] };
    const title = `${w.couple_name_one} & ${w.couple_name_two}`;
    return {
      meta: [
        { title },
        { name: "description", content: `The wedding of ${w.couple_name_one} & ${w.couple_name_two}.` },
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
  const date = wedding.wedding_date ? new Date(wedding.wedding_date + "T00:00:00") : null;
  const monthYear = date
    ? date.toLocaleDateString("en-US", { month: "long", year: "numeric" }).toUpperCase()
    : "COMING SOON";
  const [month, year] = monthYear.split(" ");

  return (
    <div className="min-h-screen bg-parchment text-sepia flex flex-col items-center justify-center px-6 py-16">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.4, ease: [0.2, 0.65, 0.3, 0.95] }}
        className="relative mb-4"
        style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 500 }}
      >
        <div className="text-[140px] md:text-[180px] leading-none tracking-tight text-sepia relative">
          <span className="relative inline-block">
            {wedding.couple_name_one[0]}
            <span className="absolute left-1/2 top-1/2 -translate-x-[35%] -translate-y-[45%] opacity-95">
              {wedding.couple_name_two[0]}
            </span>
          </span>
        </div>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
        className="text-sepia text-5xl md:text-6xl mb-14 text-center px-4"
        style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 500 }}
      >
        {wedding.couple_name_one} <span className="mx-2">&amp;</span> {wedding.couple_name_two}
      </motion.h1>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1 }}
        className="text-center mb-16"
      >
        <p className="text-sepia text-sm tracking-[0.35em] leading-loose font-medium">
          {month}
          <br />
          {year}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.4 }}
      >
        <Link
          to="/w/$slug/signin"
          params={{ slug: wedding.slug }}
          aria-label="Enter invitation"
          className="inline-flex items-center justify-center border-2 border-sepia/70 rounded-md w-24 h-14 text-sepia text-2xl hover:bg-sepia hover:text-parchment transition-colors"
        >
          &gt;
        </Link>
      </motion.div>
    </div>
  );
}
