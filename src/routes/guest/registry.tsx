import { useEffect, useState } from "react";
import { Gift, ExternalLink, Heart } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { RegistryItem } from "@/lib/supabase";
import { useGuestData } from "@/lib/use-guest-data";
import { Card, EmptyState } from "@/components/ui";
import { Button } from "@/components/ui/Button";

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatPrice(cents: number | null): string | null {
  if (cents === null || cents === undefined) return null;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  }).format(cents / 100);
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export function GuestRegistry() {
  const { wedding, loading } = useGuestData();
  const [items, setItems] = useState<RegistryItem[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!wedding) return;
    supabase
      .from("registry_items")
      .select("*")
      .eq("wedding_id", wedding.id)
      .order("sort_order")
      .then(({ data }) => {
        setItems((data as RegistryItem[]) || []);
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

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <header className="text-center mb-12">
        <div className="flex items-center justify-center gap-3 text-sepia mb-4">
          <span className="h-px w-12 bg-sand" />
          <Gift className="w-5 h-5" />
          <span className="h-px w-12 bg-sand" />
        </div>
        <h1 className="font-serif text-3xl md:text-4xl text-onyx mb-3">
          Registry
        </h1>
        <p className="text-sepia text-sm tracking-widest uppercase">
          Your love is the greatest gift
        </p>
      </header>

      {/* Registry grid */}
      {items.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <RegistryCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No registry items yet"
          description="The couple will share their gift registry here soon. Thank you for thinking of them!"
        />
      )}

      {/* Decorative footer */}
      <div className="flex items-center justify-center gap-3 text-sepia mt-12">
        <span className="h-px w-10 bg-sand" />
        <Heart className="w-4 h-4" />
        <span className="h-px w-10 bg-sand" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Registry card                                                       */
/* ------------------------------------------------------------------ */

function RegistryCard({ item }: { item: RegistryItem }) {
  const price = formatPrice(item.price_cents);
  const isCashFund = item.is_cash_fund;

  return (
    <Card className="flex flex-col h-full p-0 overflow-hidden">
      {/* Image */}
      {item.image_url ? (
        <div className="aspect-[4/3] overflow-hidden bg-mist">
          <img
            src={item.image_url}
            alt={item.title}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="aspect-[4/3] bg-mist flex items-center justify-center">
          <Gift className="w-10 h-10 text-sepia/40" />
        </div>
      )}

      {/* Body */}
      <div className="flex flex-col flex-1 p-5">
        <h3 className="font-serif text-lg text-onyx mb-1">{item.title}</h3>
        {item.description && (
          <p className="text-sepia text-sm leading-relaxed mb-3 line-clamp-3">
            {item.description}
          </p>
        )}
        {price && (
          <p className="text-sepia font-medium text-sm mb-4">{price}</p>
        )}

        {item.url && (
          <div className="mt-auto pt-2">
            <a href={item.url} target="_blank" rel="noopener noreferrer">
              <Button
                variant={isCashFund ? "primary" : "outline"}
                size="sm"
                className="w-full"
              >
                {isCashFund ? (
                  <>
                    <Heart className="w-3.5 h-3.5" />
                    Contribute
                  </>
                ) : (
                  <>
                    <ExternalLink className="w-3.5 h-3.5" />
                    View Item
                  </>
                )}
              </Button>
            </a>
          </div>
        )}
      </div>
    </Card>
  );
}

export default GuestRegistry;
