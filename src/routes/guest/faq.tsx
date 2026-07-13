import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { WebsiteContent } from "@/lib/supabase";
import { useGuestData } from "@/lib/use-guest-data";
import { getTheme, themeToCssVars } from "@/lib/theme";
import type { ThemeConfig } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui";

type QA = { question: string; answer: string };

export function GuestFaq() {
  const { wedding, loading } = useGuestData();
  const theme: ThemeConfig = useMemo(() => getTheme(wedding), [wedding]);
  const cssVars = useMemo(() => themeToCssVars(theme), [theme]);

  const [content, setContent] = useState<WebsiteContent | null>(null);
  const [fetching, setFetching] = useState(true);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const weddingId = wedding?.id ?? "";

  const loadContent = useCallback(async () => {
    if (!weddingId) { setFetching(false); return; }
    setFetching(true);
    const { data } = await supabase
      .from("website_content")
      .select("*")
      .eq("wedding_id", weddingId)
      .eq("section", "faq")
      .eq("is_published", true)
      .order("sort_order", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (data) setContent(data as WebsiteContent);
    setFetching(false);
  }, [weddingId]);

  useEffect(() => { if (weddingId) loadContent(); }, [weddingId, loadContent]);

  // ─── Parse Q&A pairs from body ───
  const faqs = useMemo<QA[]>(() => {
    const body = content?.body;
    if (!body) return [];

    const lines = body.split("\n");
    const pairs: QA[] = [];
    let currentQ: string | null = null;
    let currentA: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("Q:") || trimmed.startsWith("Q：")) {
        if (currentQ !== null) {
          pairs.push({ question: currentQ, answer: currentA.join("\n").trim() });
        }
        currentQ = trimmed.slice(2).trim();
        currentA = [];
      } else if (trimmed.startsWith("A:") || trimmed.startsWith("A：")) {
        currentA.push(trimmed.slice(2).trim());
      } else if (currentQ !== null && trimmed) {
        currentA.push(trimmed);
      }
    }
    if (currentQ !== null) {
      pairs.push({ question: currentQ, answer: currentA.join("\n").trim() });
    }

    return pairs;
  }, [content]);

  if (loading || fetching) {
    return (
      <div className="flex items-center justify-center py-24 text-sepia">
        <div className="animate-pulse">Loading…</div>
      </div>
    );
  }

  if (!wedding) {
    return <EmptyState title="No wedding found" />;
  }

  if (faqs.length === 0) {
    return (
      <div style={cssVars as React.CSSProperties} className="animate-fade-in px-6 py-12">
        <div className="max-w-2xl mx-auto">
          <EmptyState
            title="FAQ coming soon"
            description="Check back later for answers to common questions."
          />
        </div>
      </div>
    );
  }

  return (
    <div style={cssVars as React.CSSProperties} className="animate-fade-in px-6 py-12">
      <div className="max-w-2xl mx-auto">
        {/* ─── Header ─── */}
        <div className="text-center mb-12">
          <HelpCircle className="w-6 h-6 mx-auto mb-3" style={{ color: "var(--c-accent)" }} />
          <p className="text-xs uppercase tracking-[0.3em] mb-2" style={{ color: "var(--c-textMuted)" }}>
            Good to know
          </p>
          <h1 className="text-4xl font-serif" style={{ color: "var(--c-text)" }}>
            {content?.title || "Frequently Asked Questions"}
          </h1>
        </div>

        {/* ─── Accordion ─── */}
        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className="overflow-hidden border rounded-lg transition-all"
                style={{
                  borderColor: "var(--c-secondary)",
                  borderRadius: "var(--ui-radius)",
                  background: "var(--c-card)",
                }}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:opacity-80"
                >
                  <span className="font-serif text-base" style={{ color: "var(--c-text)" }}>
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={cn(
                      "w-5 h-5 flex-shrink-0 transition-transform duration-200",
                      isOpen && "rotate-180"
                    )}
                    style={{ color: "var(--c-textMuted)" }}
                  />
                </button>

                <div
                  className={cn(
                    "grid transition-all duration-200",
                    isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  )}
                >
                  <div className="overflow-hidden">
                    <p
                      className="px-5 pb-4 text-sm whitespace-pre-line leading-relaxed"
                      style={{ color: "var(--c-textMuted)" }}
                    >
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default GuestFaq;
