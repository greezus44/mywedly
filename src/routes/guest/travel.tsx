import { useCallback, useEffect, useMemo, useState } from "react";
import { MapPin, ExternalLink, Plane, Hotel, Car, Utensils, Compass } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { TravelItem, WebsiteContent } from "@/lib/supabase";
import { useGuestData } from "@/lib/use-guest-data";
import { getTheme, themeToCssVars } from "@/lib/theme";
import type { ThemeConfig } from "@/lib/theme";
import { Card, EmptyState } from "@/components/ui";

const KIND_ICONS: Record<string, React.ReactNode> = {
  hotel: <Hotel className="w-5 h-5" />,
  accommodation: <Hotel className="w-5 h-5" />,
  flight: <Plane className="w-5 h-5" />,
  transport: <Car className="w-5 h-5" />,
  restaurant: <Utensils className="w-5 h-5" />,
  dining: <Utensils className="w-5 h-5" />,
  attraction: <Compass className="w-5 h-5" />,
  other: <MapPin className="w-5 h-5" />,
};

const KIND_LABELS: Record<string, string> = {
  hotel: "Accommodation",
  accommodation: "Accommodation",
  flight: "Flights",
  transport: "Transportation",
  restaurant: "Dining",
  dining: "Dining",
  attraction: "Things to Do",
  other: "Information",
};

export function GuestTravel() {
  const { wedding, loading } = useGuestData();
  const theme: ThemeConfig = useMemo(() => getTheme(wedding), [wedding]);
  const cssVars = useMemo(() => themeToCssVars(theme), [theme]);

  const [travelItems, setTravelItems] = useState<TravelItem[]>([]);
  const [content, setContent] = useState<WebsiteContent | null>(null);
  const [fetching, setFetching] = useState(true);

  const weddingId = wedding?.id ?? "";

  const loadAll = useCallback(async () => {
    if (!weddingId) { setFetching(false); return; }
    setFetching(true);
    const [items, contentRes] = await Promise.all([
      supabase.from("travel_items").select("*").eq("wedding_id", weddingId).order("sort_order", { ascending: true }),
      supabase.from("website_content")
        .select("*")
        .eq("wedding_id", weddingId)
        .eq("section", "travel")
        .eq("is_published", true)
        .order("sort_order", { ascending: true })
        .limit(1)
        .maybeSingle(),
    ]);
    if (items.data) setTravelItems(items.data as TravelItem[]);
    if (contentRes.data) setContent(contentRes.data as WebsiteContent);
    setFetching(false);
  }, [weddingId]);

  useEffect(() => { if (weddingId) loadAll(); }, [weddingId, loadAll]);

  // ─── Group items by kind ───
  const groupedItems = useMemo(() => {
    const map = new Map<string, TravelItem[]>();
    for (const item of travelItems) {
      const key = item.kind || "other";
      const arr = map.get(key) ?? [];
      arr.push(item);
      map.set(key, arr);
    }
    return map;
  }, [travelItems]);

  if (loading || fetching) {
    return (
      <div className="flex items-center justify-center py-24 text-sepia">
        <div className="animate-pulse">Loading travel info…</div>
      </div>
    );
  }

  if (!wedding) {
    return <EmptyState title="No wedding found" />;
  }

  const hasContent = content?.body || content?.title;
  const hasItems = travelItems.length > 0;

  if (!hasContent && !hasItems) {
    return (
      <div style={cssVars as React.CSSProperties} className="animate-fade-in px-6 py-12">
        <div className="max-w-2xl mx-auto">
          <EmptyState
            title="Travel info coming soon"
            description="Check back later for accommodation and travel details."
          />
        </div>
      </div>
    );
  }

  return (
    <div style={cssVars as React.CSSProperties} className="animate-fade-in px-6 py-12">
      <div className="max-w-4xl mx-auto">
        {/* ─── Header ─── */}
        <div className="text-center mb-12">
          <Plane className="w-6 h-6 mx-auto mb-3" style={{ color: "var(--c-accent)" }} />
          <p className="text-xs uppercase tracking-[0.3em] mb-2" style={{ color: "var(--c-textMuted)" }}>
            Plan your trip
          </p>
          <h1 className="text-4xl font-serif" style={{ color: "var(--c-text)" }}>
            {content?.title || "Travel & Accommodation"}
          </h1>
          {wedding.location && (
            <p className="text-sm mt-2 flex items-center justify-center gap-1.5" style={{ color: "var(--c-textMuted)" }}>
              <MapPin className="w-4 h-4" /> {wedding.location}
            </p>
          )}
        </div>

        {/* ─── Intro content ─── */}
        {content?.body && (
          <div className="mb-12 text-center max-w-2xl mx-auto">
            <p
              className="whitespace-pre-line text-base leading-relaxed"
              style={{ color: "var(--c-textMuted)" }}
            >
              {content.body}
            </p>
          </div>
        )}

        {/* ─── Travel items grouped by kind ─── */}
        {hasItems && (
          <div className="space-y-10">
            {Array.from(groupedItems.entries()).map(([kind, items]) => (
              <div key={kind}>
                <div className="flex items-center gap-2 mb-4">
                  <span style={{ color: "var(--c-primary)" }}>
                    {KIND_ICONS[kind] ?? KIND_ICONS.other}
                  </span>
                  <h2 className="text-xl font-serif" style={{ color: "var(--c-text)" }}>
                    {KIND_LABELS[kind] ?? kind}
                  </h2>
                  <span className="h-px flex-1" style={{ background: "var(--c-secondary)" }} />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {items.map((item) => (
                    <Card key={item.id} className="p-5 flex flex-col">
                      <h3 className="text-lg font-serif mb-2" style={{ color: "var(--c-text)" }}>
                        {item.title}
                      </h3>

                      {item.description && (
                        <p className="text-sm mb-3 whitespace-pre-line" style={{ color: "var(--c-textMuted)" }}>
                          {item.description}
                        </p>
                      )}

                      {item.address && (
                        <div className="flex items-start gap-2 text-sm mb-2" style={{ color: "var(--c-textMuted)" }}>
                          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span>{item.address}</span>
                        </div>
                      )}

                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm mt-auto pt-2 transition-colors hover:underline"
                          style={{ color: "var(--c-link)" }}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Visit website
                        </a>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default GuestTravel;
