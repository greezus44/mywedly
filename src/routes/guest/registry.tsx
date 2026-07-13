import { useCallback, useEffect, useMemo, useState } from "react";
import { Gift, ExternalLink, DollarSign } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { RegistryItem } from "@/lib/supabase";
import { useGuestData } from "@/lib/use-guest-data";
import { getTheme, themeToCssVars } from "@/lib/theme";
import { Button } from "@/components/ui/Button";
import { Card, Badge, EmptyState } from "@/components/ui";

function formatPrice(cents: number | null): string | null {
  if (cents === null || cents === undefined) return null;
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function GuestRegistry() {
  const { wedding, loading } = useGuestData();

  const [items, setItems] = useState<RegistryItem[]>([]);
  const [fetching, setFetching] = useState(true);

  const theme = useMemo(() => getTheme(wedding), [wedding]);
  const cssVars = useMemo(() => themeToCssVars(theme), [theme]);

  const weddingId = wedding?.id ?? null;

  const fetchItems = useCallback(async () => {
    if (!weddingId) return;
    setFetching(true);
    const { data } = await supabase
      .from("registry_items")
      .select("*")
      .eq("wedding_id", weddingId)
      .order("sort_order", { ascending: true });
    setItems((data ?? []) as RegistryItem[]);
    setFetching(false);
  }, [weddingId]);

  useEffect(() => {
    if (weddingId) fetchItems();
  }, [weddingId, fetchItems]);

  if (loading || fetching) {
    return (
      <div className="flex items-center justify-center py-24 text-sepia animate-fade-in">
        Loading registry…
      </div>
    );
  }

  if (!wedding) {
    return <EmptyState title="Wedding Not Found" description="We couldn't find the wedding you're looking for." />;
  }

  if (items.length === 0) {
    return (
      <div style={cssVars as React.CSSProperties} className="animate-fade-in">
        <section className="px-6 py-24 text-center" style={{ background: "var(--c-background)" }}>
          <EmptyState
            title="Registry coming soon"
            description="Check back soon for our gift registry."
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
          <Gift className="w-6 h-6" style={{ color: "var(--c-accent)" }} />
        </div>
        <p className="text-xs uppercase tracking-[0.3em] mb-3" style={{ color: "var(--c-textMuted)", fontFamily: "var(--f-body)" }}>
          With gratitude
        </p>
        <h1 className="text-4xl md:text-5xl font-serif mb-3" style={{ color: "var(--c-text)", fontFamily: "var(--f-heading)", fontStyle: "var(--f-style)" }}>
          Gift Registry
        </h1>
        <p className="text-sm max-w-xl mx-auto" style={{ color: "var(--c-textMuted)", fontFamily: "var(--f-body)" }}>
          Your presence is the greatest gift. For those who wish to celebrate with something more, here are a few things we'd love.
        </p>
      </section>

      {/* ── Registry items grid ── */}
      <section className="px-6 pb-16 md:pb-24" style={{ background: "var(--c-background)" }}>
        <div className="max-w-5xl mx-auto">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => {
              const price = formatPrice(item.price_cents);
              return (
                <Card
                  key={item.id}
                  className="overflow-hidden flex flex-col animate-fade-in"
                  style={{ borderColor: "var(--c-secondary)", background: "var(--c-card)" } as React.CSSProperties}
                >
                  {/* Image */}
                  {item.image_url ? (
                    <div className="relative h-44 overflow-hidden">
                      <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                      {item.is_cash_fund && (
                        <div className="absolute top-2 right-2">
                          <Badge variant="warning">
                            <DollarSign className="w-3 h-3 mr-0.5" />
                            Cash Fund
                          </Badge>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      className="relative h-44 flex items-center justify-center"
                      style={{ background: "linear-gradient(135deg, var(--c-secondary), var(--c-accent))" }}
                    >
                      <Gift className="w-10 h-10" style={{ color: "var(--c-primary)", opacity: 0.5 }} />
                      {item.is_cash_fund && (
                        <div className="absolute top-2 right-2">
                          <Badge variant="warning">
                            <DollarSign className="w-3 h-3 mr-0.5" />
                            Cash Fund
                          </Badge>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="text-lg font-serif mb-2" style={{ color: "var(--c-text)", fontFamily: "var(--f-heading)" }}>
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

                    {price && (
                      <p
                        className="text-lg font-serif mb-4"
                        style={{ color: "var(--c-primary)", fontFamily: "var(--f-heading)" }}
                      >
                        {price}
                      </p>
                    )}

                    {/* Action button */}
                    {item.url && (
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="mt-auto">
                        <Button
                          variant={item.is_cash_fund ? "primary" : "outline"}
                          className="w-full"
                          style={
                            item.is_cash_fund
                              ? { background: "var(--c-button)", color: "var(--c-buttonText)" }
                              : { borderColor: "var(--c-secondary)", color: "var(--c-text)" }
                          }
                        >
                          {item.is_cash_fund ? (
                            <>
                              <DollarSign className="w-4 h-4" />
                              Contribute
                            </>
                          ) : (
                            <>
                              <ExternalLink className="w-4 h-4" />
                              View Item
                            </>
                          )}
                        </Button>
                      </a>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
