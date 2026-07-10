import { createFileRoute, Outlet, notFound } from "@tanstack/react-router";
import { getWeddingBySlug } from "@/lib/wedding-queries";

export const Route = createFileRoute("/w/$slug")({
  loader: async ({ params }) => {
    const wedding = await getWeddingBySlug(params.slug);
    if (!wedding) throw notFound();
    return { wedding };
  },
  component: () => <Outlet />,
});
