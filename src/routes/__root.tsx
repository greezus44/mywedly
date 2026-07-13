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
      { title: "MyWedly — Editorial wedding planning & websites" },
      {
        name: "description",
        content:
          "The modern curator's platform for weddings. Build an editorial wedding website, manage guests and RSVPs, and host every event with quiet precision.",
      },
      { name: "author", content: "Aethel" },
      { property: "og:title", content: "MyWedly — Editorial wedding planning & websites" },
      {
        property: "og:description",
        content:
          "The modern curator's platform for weddings. Build an editorial wedding website, manage guests and RSVPs, and host every event with quiet precision.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "MyWedly — Editorial wedding planning & websites" },
      {
        name: "twitter:description",
        content:
          "The modern curator's platform for weddings. Build an editorial wedding website, manage guests and RSVPs, and host every event with quiet precision.",
      },
      {
        property: "og:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/897c7115-f7c8-4156-8f2f-f64560f35ca3/id-preview-fc586491--73a0769b-88d4-48e0-815d-a3e494a0c61b.lovable.app-1783647429553.png",
      },
      {
        name: "twitter:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/897c7115-f7c8-4156-8f2f-f64560f35ca3/id-preview-fc586491--73a0769b-88d4-48e0-815d-a3e494a0c61b.lovable.app-1783647429553.png",
      },
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
