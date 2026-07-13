import { useEffect, useState } from "react";
import {
  MapPin,
  ExternalLink,
  Hotel,
  Plane,
  Car,
  Bus,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { TravelItem, WebsiteContent } from "@/lib/supabase";
import { useGuestData } from "@/lib/use-guest-data";
import { Card, EmptyState } from "@/components/ui";
import { Button } from "@/components/ui/Button";

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

type TravelKind =
  | "hotel"
  | "airport"
  | "parking"
  | "transport"
  | "attraction"
  | "restaurant";

const KIND_META: Record<
  TravelKind,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  hotel: { label: "Accommodations", icon: Hotel },
  airport: { label: "Airports", icon: Plane },
  parking: { label: "Parking", icon: Car },
  transport: { label: "Transportation", icon: Bus },
  attraction: { label: "Attractions", icon: Sparkles },
  restaurant: { label: "Restaurants", icon: UtensilsCrossed },
};

const KIND_ORDER: TravelKind[] = [
  "hotel",
  "airport",
  "parking",
  "transport",
  "restaurant",
  "attraction",
];

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export function GuestTravel() {
  const { wedding, loading } = useGuestData();
  const [items, setItems] = useState<TravelItem[]>([]);
  const [content, setContent] = useState<WebsiteContent | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!wedding) return;
    Promise.all([
      supabase
        .from("travel_items")
        .select("*")
        .eq("wedding_id", wedding.id)
        .order("sort_order"),
      supabase
        .from("website_content")
        .select("*")
        .eq("wedding_id", wedding.id)
        .eq("section", "travel")
        .maybeSingle(),
    ]).then(([itemsRes, contentRes]) => {
      setItems((itemsRes.data as TravelItem[]) || []);
      setContent((contentRes.data as WebsiteContent) || null);
      setDataLoading(false);
    });
  }, [wedding]);

  if (loading || dataLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-sepia">
        Loading…
      </div>
    );
  }

  if (!wedding) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-sepia">
        Wedding not found.
      </div>
    );
  }

  // Group items by kind, preserving the canonical order
  const grouped = KIND_ORDER.map((kind) => ({
    kind,
    items: items.filter((i) => i.kind === kind),
  })).filter((g) => g.items.length > 0);

  const hasItems = grouped.length > 0;
  const hasContent = Boolean(content && content.body);

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <header className="text-center mb-12">
        <div className="flex items-center justify-center gap-3 text-sepia mb-4">
          <span className="h-px w-12 bg-sand" />
          <MapPin className="w-5 h-5" />
          <span className="h-px w-12 bg-sand" />
        </div>
        <h1 className="font-serif text-3xl md:text-4xl text-onyx mb-3">
          {content?.title || "Travel & Accommodations"}
        </h1>
        <p className="text-sepia text-sm tracking-widest uppercase">
          Everything you need to get here &amp; stay
        </p>
      </header>

      {/* Intro content from website_content */}
      {hasContent && (
        <div className="mb-12 text-center max-w-2xl mx-auto">
          <p className="text-ink leading-relaxed whitespace-pre-line font-serif">
            {content!.body}
          </p>
        </div>
      )}

      {/* Travel items grouped by kind */}
      {hasItems ? (
        <div className="space-y-12">
          {grouped.map(({ kind, items: groupItems }) => {
            const meta = KIND_META[kind];
            const Icon = meta.icon;
            return (
              <section key={kind}>
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex-shrink-0 w-9 h-9 rounded-full bg-mist flex items-center justify-center text-sepia">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h2 className="font-serif text-xl text-onyx">{meta.label}</h2>
                  <span className="flex-1 h-px bg-sand" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {groupItems.map((item) => (
                    <TravelCard key={item.id} item={item} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        !hasContent && (
          <EmptyState
            title="No travel details yet"
            description="Check back soon — the couple will share accommodation, transport, and local recommendations here."
          />
        )
      )}

      {/* Decorative footer */}
      <div className="flex items-center justify-center gap-3 text-sepia mt-12">
        <span className="h-px w-10 bg-sand" />
        <MapPin className="w-4 h-4" />
        <span className="h-px w-10 bg-sand" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Travel card                                                         */
/* ------------------------------------------------------------------ */

function TravelCard({ item }: { item: TravelItem }) {
  return (
    <Card className="flex flex-col h-full">
      <div className="flex-1">
        <h3 className="font-serif text-lg text-onyx mb-2">{item.title}</h3>
        {item.description && (
          <p className="text-sepia text-sm leading-relaxed mb-3 whitespace-pre-line">
            {item.description}
          </p>
        )}
        {item.address && (
          <div className="flex items-start gap-2 text-sepia/80 text-sm mb-3">
            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{item.address}</span>
          </div>
        )}
      </div>
      {item.url && (
        <div className="mt-auto pt-2">
          <a href={item.url} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm">
              <ExternalLink className="w-3.5 h-3.5" />
              Visit Website
            </Button>
          </a>
        </div>
      )}
    </Card>
  );
}

export default GuestTravel;
