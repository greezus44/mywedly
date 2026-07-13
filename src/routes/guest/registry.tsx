import { useCallback, useEffect, useMemo, useState } from "react";
import { ExternalLink, Gift, Heart, DollarSign } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { RegistryItem } from "@/lib/supabase";
import { useGuestData } from "@/lib/use-guest-data";
import { getTheme, themeToCssVars } from "@/lib/theme";
import type { ThemeConfig } from "@/lib/theme";
import { Card, EmptyState } from "@/components/ui";
import { Button } from "@/components/ui/Button";

export function GuestRegistry() {
  const { wedding, loading } = useGuestData();
  const theme: ThemeConfig = useMemo(() => getTheme(wedding), [wedding]);
  const cssVars = useMemo(() => themeToCssVars(theme), [theme]);

  const [items, setItems] = useState<RegistryItem[]>([]);
  const [fetching, setFetching] = useState(true);

  const weddingId = wedding?.id ?? "";

  const loadItems = useCallback(async () => {
    if (!weddingId) { setFetching(false); return; }
    setFetching(true);
    const { data } = await supabase
      .from("registry_items")
      .select("*")
      .eq("wedding_id", weddingId)
      .order("sort_order", { ascending: true });
    if (data) setItems(data as RegistryItem[]);
    setFetching(false);
  }, [weddingId]);

  useEffect(() => { if (weddingId) loadItems(); }, [weddingId, loadItems]);

  if (loading || fetching) {
    return (
      <div className="flex items-center justify-center py-24 text-sepia">
        <div className="animate-pulse">Loading registry…</div>
      </div>
    );
  }

  if (!wedding) {
    return <EmptyState title="No wedding found" />;
  }

  if (items.length === 0) {
    return (
      <div style={cssVars as React.CSSProperties} className="animate-fade-in px-6 py-12">
        <div className="max-w-2xl mx-auto">
          <EmptyState
            title="Registry coming soon"
            description="Check back later for our gift registry."
          />
        </div>
      </div>
    );
  }

  return (
    <div style={cssVars as React.CSSProperties} className="animate-fade-in px-6 py-12">
      <div className="max-w-5xl mx-auto">
        {/* ─── Header ─── */}
        <div className="text-center mb-12">
          <Gift className="w-6 h-6 mx-auto mb-3" style={{ color: "var(--c-accent)" }} />
          <p className="text-xs uppercase tracking-[0.3em] mb-2" style={{ color: "var(--c-textMuted)" }}>
            With gratitude
          </p>
          <h1 className="text-4xl font-serif" style={{ color: "var(--c-text)" }}>
            Registry
          </h1>
          <p className="text-sm mt-3 max-w-lg mx-auto" style={{ color: "var(--c-textMuted)" }}>
            Your presence is the greatest gift. If you'd like to give something more, here are a few
            things we'd love.
          </p>
        </div>

        {/* ─── Registry grid ─── */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const price = item.price_cents != null
              ? `$${(item.price_cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : null;

            return (
              <Card key={item.id} className="overflow-hidden flex flex-col">
                {item.image_url ? (
                  <div className="relative h-48 overflow-hidden">
                    <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                    {item.is_cash_fund && (
                      <span
                        className="absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                        style={{ background: "var(--c-button)", color: "var(--c-buttonText)" }}
                      >
                        <DollarSign className="w-3 h-3" /> Cash Fund
                      </span>
                    )}
                  </div>
                ) : (
                  <div
                    className="h-32 flex items-center justify-center"
                    style={{ background: "var(--c-secondary)" }}
                  >
                    <Gift className="w-10 h-10" style={{ color: "var(--c-primary)" }} />
                  </div>
                )}

                <div className="p-5 flex flex-col flex-1">
                  <h3 className="text-lg font-serif mb-1" style={{ color: "var(--c-text)" }}>
                    {item.title}
                  </h3>

                  {item.description && (
                    <p className="text-sm mb-3 line-clamp-3" style={{ color: "var(--c-textMuted)" }}>
                      {item.description}
                    </p>
                  )}

                  {price && (
                    <p className="text-lg font-serif mb-4" style={{ color: "var(--c-primary)" }}>
                      {price}
                    </p>
                  )}

                  <div className="mt-auto pt-2">
                    {item.url ? (
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="block">
                        <Button variant="primary" className="w-full">
                          {item.is_cash_fund ? (
                            <>
                              <Heart className="w-4 h-4" /> Contribute
                            </>
                          ) : (
                            <>
                              <ExternalLink className="w-4 h-4" /> View Item
                            </>
                          )}
                        </Button>
                      </a>
                    ) : item.is_cash_fund ? (
                      <Button variant="primary" className="w-full" disabled>
                        <Heart className="w-4 h-4" /> Contribute
                      </Button>
                    ) : null}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default GuestRegistry;
