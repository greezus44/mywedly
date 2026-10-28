import { useParams, Navigate } from "react-router-dom";
import { useGuestOutletContext } from "./guest-layout";
import { isValidSlug } from "../../lib/utils";
import GuestWishes from "./wishes";

export function EGuestWishesResolver() {
  const { event } = useGuestOutletContext();
  const { wishesSlug } = useParams<{ wishesSlug: string }>();

  const wishesConfig = (event.content as Record<string, unknown> | null)?.wishes as Record<string, unknown> | null;
  const raw = typeof wishesConfig?.pageSlug === "string" ? wishesConfig.pageSlug.trim() : "";
  const customSlug = raw && isValidSlug(raw) ? raw : null;
  const effectiveSlug = customSlug ?? "wishes";

  if (wishesSlug === effectiveSlug) return <GuestWishes />;
  return <Navigate to={`/e/${event.slug}/home`} replace />;
}

export function RGuestWishesResolver() {
  const { event } = useGuestOutletContext();
  const { wishesSlug } = useParams<{ wishesSlug: string }>();

  const wishesConfig = (event.content as Record<string, unknown> | null)?.wishes as Record<string, unknown> | null;
  const raw = typeof wishesConfig?.pageSlug === "string" ? wishesConfig.pageSlug.trim() : "";
  const customSlug = raw && isValidSlug(raw) ? raw : null;
  const effectiveSlug = customSlug ?? "wishes";

  if (wishesSlug === effectiveSlug) return <GuestWishes />;
  return <Navigate to={`/r/${event.slug}/home`} replace />;
}
