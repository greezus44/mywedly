import { useCallback, useEffect, useMemo, useState } from "react";
import { Hotel, Plane, Car, Bus, MapPin, ExternalLink, Compass, Utensils } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { TravelItem, WebsiteContent } from "@/lib/supabase";
import { useGuestData } from "@/lib/use-guest-data";
import { getTheme, themeToCssVars } from "@/lib/theme";
import { Card, EmptyState } from "@/components/ui";

const KIND_META: Record<string, { label: string; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }> }> = {
  hotel: { label: "Accommodation", icon: Hotel },
  airport: { label: "Airport", icon: Plane },
  parking: { label: "Parking", icon: Car },
  transport: { label: "Transportation", icon: Bus },
  attraction: { label: "Attractions", icon: Compass },
  restaurant: { label: "Dining", icon: Utensils },
};

const KIND_ORDER = ["hotel", "airport", "parking", "transport", "restaurant", "attraction"];

export function GuestTravel() {
  const { wedding, loading } = useGuestData();

  const [travelItems, setTravelItems] = useState<TravelItem[]>([]);
  const [content, setContent] = useState<WebsiteContent | null>(null);
  const [fetching, setFetching] = useState(true);

  const theme = useMemo(() => getTheme(wedding), [wedding]);
  const cssVars = useMemo(() => themeToCssVars(theme), [theme]);

  const weddingId = wedding?.id ?? null;

  const fetchAll = useCallback(async () => {
    if (!weddingId) return;
    setFetching(true);
    const [tRes, cRes] = await Promise.all([
      supabase.from("travel_items").select("*").eq("wedding_id", weddingId).order("sort_order", { ascending: true }),
      supabase.from("website_content").select("*").eq("wedding_id", weddingId).eq("section", "travel").maybeSingle(),
    ]);
    setTravelItems((tRes.data ?? []) as TravelItem[]);
    setContent((cRes.data as WebsiteContent) ?? null);
    setFetching(false);
  }, [weddingId]);

  useEffect(() => {
    if (weddingId) fetchAll();
  }, [weddingId, fetchAll]);

  if (loading || fetching) {
    return (
      <div className="flex items-center justify-center py-24 text-sepia animate-fade-in">
        Loading travel info…
      </div>
    );
  }

  if (!wedding) {
    return <EmptyState title="Wedding Not Found" description="We couldn't find the wedding you're looking for." />;
  }

  // Group items by kind
  const grouped = travelItems.reduce<Record<string, TravelItem[]>>((acc, item) => {
    (acc[item.kind] ??= []).push(item);
    return acc;
  }, {});

  const sectionTitle = content?.title ?? "Travel & Accommodation";
  const sectionBody = content?.body ?? null;

  if (travelItems.length === 0 && !sectionBody) {
    return (
      <div style={cssVars as React.CSSProperties} className="animate-fade-in">
        <section className="px-6 py-24 text-center" style={{ background: "var(--c-background)" }}>
          <EmptyState
            title="Travel info coming soon"
            description="Check back later for accommodation and travel details."
          />
        </section>
      </div>
    );
  }

  return (
    <div style={cssVars as React.CSSProperties} className="animate-fade-in">
      {/* ── Header ── */}
      <section className="px-6 pt-16 pb-8 text-center" style={{ background: "var(--c-background)" }}>
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-4" style={{ background: "var(--c-secondary)" }}>
          <MapPin className="w-6 h-6" style={{ color: "var(--c-accent)" }} />
        </div>
        <p className="text-xs uppercase tracking-[0.3em] mb-3" style={{ color: "var(--c-textMuted)", fontFamily: "var(--f-body)" }}>
          Plan your trip
        </p>
        <h1 className="text-4xl md:text-5xl font-serif" style={{ color: "var(--c-text)", fontFamily: "var(--f-heading)", fontStyle: "var(--f-style)" }}>
          {sectionTitle}
        </h1>
      </section>

      {/* ── Intro body ── */}
      {sectionBody && (
        <section className="px-6 pb-8" style={{ background: "var(--c-background)" }}>
          <div className="max-w-2xl mx-auto text-center">
            <p
              className="text-base leading-relaxed whitespace-pre-line"
              style={{ color: "var(--c-textMuted)", fontFamily: "var(--f-body)" }}
            >
              {sectionBody}
            </p>
          </div>
        </section>
      )}

      {/* ── Travel items grouped by kind ── */}
      <section className="px-6 pb-16 md:pb-24" style={{ background: "var(--c-background)" }}>
        <div className="max-w-5xl mx-auto space-y-10">
          {KIND_ORDER.filter((kind) => grouped[kind]?.length).map((kind) => {
            const meta = KIND_META[kind];
            const items = grouped[kind];
            const Icon = meta.icon;

            return (
              <div key={kind} className="animate-fade-in">
                {/* Kind header */}
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ background: "var(--c-secondary)" }}
                  >
                    <Icon className="w-5 h-5" style={{ color: "var(--c-primary)" }} />
                  </div>
                  <h2
                    className="text-2xl font-serif"
                    style={{ color: "var(--c-text)", fontFamily: "var(--f-heading)" }}
                  >
                    {meta.label}
                  </h2>
                </div>

                {/* Items grid */}
                <div className="grid gap-4 sm:grid-cols-2">
                  {items.map((item) => (
                    <Card
                      key={item.id}
                      className="p-5 flex flex-col"
                      style={{ borderColor: "var(--c-secondary)", background: "var(--c-card)" } as React.CSSProperties}
                    >
                      <h3
                        className="text-lg font-serif mb-2"
                        style={{ color: "var(--c-text)", fontFamily: "var(--f-heading)" }}
                      >
                        {item.title}
                      </h3>

                      {item.description && (
                        <p
                          className="text-sm leading-relaxed mb-3 flex-1"
                          style={{ color: "var(--c-textMuted)", fontFamily: "var(--f-body)" }}
                        >
                          {item.description}
                        </p>
                      )}

                      {item.address && (
                        <div className="flex items-start gap-2 text-sm mb-2" style={{ color: "var(--c-textMuted)", fontFamily: "var(--f-body)" }}>
                          <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                          <span>{item.address}</span>
                        </div>
                      )}

                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm hover:underline mt-auto"
                          style={{ color: "var(--c-link)", fontFamily: "var(--f-body)" }}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Visit website
                        </a>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
