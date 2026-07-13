import { useEffect, useMemo, useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { WebsiteContent } from "@/lib/supabase";
import { useGuestData } from "@/lib/use-guest-data";
import { getTheme, themeToCssVars } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { Card, EmptyState } from "@/components/ui";

type QAPair = { question: string; answer: string };

function parseFAQ(body: string): QAPair[] {
  const lines = body.split("\n");
  const pairs: QAPair[] = [];
  let currentQ = "";
  let currentA = "";
  let inAnswer = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.toLowerCase().startsWith("q:")) {
      if (currentQ && currentA) {
        pairs.push({ question: currentQ, answer: currentA.trim() });
      }
      currentQ = trimmed.slice(2).trim();
      currentA = "";
      inAnswer = false;
    } else if (trimmed.toLowerCase().startsWith("a:")) {
      currentA = trimmed.slice(2).trim();
      inAnswer = true;
    } else if (inAnswer && trimmed) {
      currentA += "\n" + trimmed;
    } else if (!inAnswer && trimmed && currentQ) {
      // Multi-line question (rare but handle it)
      currentQ += " " + trimmed;
    }
  }

  if (currentQ && currentA) {
    pairs.push({ question: currentQ, answer: currentA.trim() });
  }

  return pairs;
}

export function GuestFaq() {
  const { wedding, loading } = useGuestData();

  const [content, setContent] = useState<WebsiteContent | null>(null);
  const [fetching, setFetching] = useState(true);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const theme = useMemo(() => getTheme(wedding), [wedding]);
  const cssVars = useMemo(() => themeToCssVars(theme), [theme]);

  const weddingId = wedding?.id ?? null;

  useEffect(() => {
    if (!weddingId) return;
    setFetching(true);
    supabase
      .from("website_content")
      .select("*")
      .eq("wedding_id", weddingId)
      .eq("section", "faq")
      .maybeSingle()
      .then(({ data }) => {
        setContent((data as WebsiteContent) ?? null);
        setFetching(false);
      });
  }, [weddingId]);

  if (loading || fetching) {
    return (
      <div className="flex items-center justify-center py-24 text-sepia animate-fade-in">
        Loading FAQ…
      </div>
    );
  }

  if (!wedding) {
    return <EmptyState title="Wedding Not Found" description="We couldn't find the wedding you're looking for." />;
  }

  const title = content?.title ?? "Frequently Asked Questions";
  const body = content?.body ?? null;
  const faqs = body ? parseFAQ(body) : [];

  if (faqs.length === 0) {
    return (
      <div style={cssVars as React.CSSProperties} className="animate-fade-in">
        <section className="px-6 py-24 text-center" style={{ background: "var(--c-background)" }}>
          <EmptyState
            title="No FAQs yet"
            description="Check back soon for answers to common questions."
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
          <HelpCircle className="w-6 h-6" style={{ color: "var(--c-accent)" }} />
        </div>
        <p className="text-xs uppercase tracking-[0.3em] mb-3" style={{ color: "var(--c-textMuted)", fontFamily: "var(--f-body)" }}>
          Good to know
        </p>
        <h1 className="text-4xl md:text-5xl font-serif" style={{ color: "var(--c-text)", fontFamily: "var(--f-heading)", fontStyle: "var(--f-style)" }}>
          {title}
        </h1>
      </section>

      {/* ── FAQ accordion ── */}
      <section className="px-6 pb-16 md:pb-24" style={{ background: "var(--c-background)" }}>
        <div className="max-w-2xl mx-auto space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <Card
                key={index}
                className="overflow-hidden animate-fade-in"
                style={{ borderColor: "var(--c-secondary)", background: "var(--c-card)" } as React.CSSProperties}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <span
                    className="text-base font-serif pr-4"
                    style={{ color: "var(--c-text)", fontFamily: "var(--f-heading)" }}
                  >
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={cn(
                      "w-5 h-5 shrink-0 transition-transform duration-200",
                      isOpen && "rotate-180",
                    )}
                    style={{ color: "var(--c-textMuted)" }}
                  />
                </button>
                <div
                  className="overflow-hidden transition-all duration-200"
                  style={{ maxHeight: isOpen ? "500px" : "0px" }}
                >
                  <div className="px-5 pb-5">
                    <div
                      className="pt-3 border-t text-sm leading-relaxed whitespace-pre-line"
                      style={{ color: "var(--c-textMuted)", fontFamily: "var(--f-body)", borderColor: "var(--c-secondary)" }}
                    >
                      {faq.answer}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
