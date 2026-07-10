import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { supabase } from "@/integrations/supabase/client";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <p className="eyebrow mb-6">404 — Not Found</p>
        <h1 className="font-serif text-6xl italic mb-4">Lost in the archive.</h1>
        <p className="text-sm text-muted-foreground mb-8">
          The page you were looking for could not be located.
        </p>
        <Link
          to="/"
          className="inline-flex items-center justify-center bg-onyx text-parchment px-6 py-3 text-xs uppercase tracking-widest hover:bg-ink transition-colors"
        >
          Return home
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <p className="eyebrow mb-6">Something went wrong</p>
        <h1 className="font-serif text-4xl italic mb-4">A quiet interruption.</h1>
        <p className="text-sm text-muted-foreground mb-8">
          The page didn't load. Refresh, or return home.
        </p>
        <div className="flex justify-center gap-3">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="bg-onyx text-parchment px-6 py-3 text-xs uppercase tracking-widest hover:bg-ink transition-colors"
          >
            Try again
          </button>
          <a
            href="/"
            className="border border-onyx px-6 py-3 text-xs uppercase tracking-widest hover:bg-onyx hover:text-parchment transition-colors"
          >
            Home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Aethel — Editorial wedding planning & websites" },
      {
        name: "description",
        content:
          "Aethel is a premium wedding planning platform for couples who value editorial clarity. Build a wedding site, manage guests, collect RSVPs, and host the day.",
      },
      { name: "author", content: "Aethel" },
      { property: "og:title", content: "Aethel — Editorial wedding planning" },
      {
        property: "og:description",
        content:
          "The modern curator's platform for weddings. Guests, RSVPs, gallery, registry, and a website worthy of the occasion.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
    });
    return () => sub.subscription.unsubscribe();
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster position="top-center" />
    </QueryClientProvider>
  );
}
