import { useEffect, useState } from "react";
import { HelpCircle, ChevronDown } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { WebsiteContent } from "@/lib/supabase";
import { useGuestData } from "@/lib/use-guest-data";
import { EmptyState } from "@/components/ui";

/* ------------------------------------------------------------------ */
/* Types & helpers                                                    */
/* ------------------------------------------------------------------ */

type QA = { question: string; answer: string };

/**
 * Parse a website_content body into Q&A pairs.
 * Questions start with "Q:" and answers start with "A:".
 * Lines that don't match are appended to the previous answer.
 */
function parseFaq(body: string): QA[] {
  const lines = body.split("\n");
  const pairs: QA[] = [];
  let current: QA | null = null;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    if (/^Q[:.]\s*/i.test(line)) {
      if (current) pairs.push(current);
      current = {
        question: line.replace(/^Q[:.]\s*/i, "").trim(),
        answer: "",
      };
    } else if (/^A[:.]\s*/i.test(line)) {
      if (!current) current = { question: "", answer: "" };
      const text = line.replace(/^A[:.]\s*/i, "").trim();
      current.answer = current.answer
        ? `${current.answer}\n${text}`
        : text;
    } else if (current) {
      // continuation line — append to current answer
      current.answer = current.answer
        ? `${current.answer}\n${line}`
        : line;
    }
  }
  if (current) pairs.push(current);

  return pairs.filter((p) => p.question || p.answer);
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export function GuestFaq() {
  const { wedding, loading } = useGuestData();
  const [content, setContent] = useState<WebsiteContent | null>(null);
  const [contentLoading, setContentLoading] = useState(true);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!wedding) return;
    supabase
      .from("website_content")
      .select("*")
      .eq("wedding_id", wedding.id)
      .eq("section", "faq")
      .maybeSingle()
      .then(({ data }) => {
        setContent((data as WebsiteContent) || null);
        setContentLoading(false);
      });
  }, [wedding]);

  if (loading || contentLoading) {
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

  const faqs = content?.body ? parseFaq(content.body) : [];
  const title = content?.title || "Frequently Asked Questions";

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      {/* Header */}
      <header className="text-center mb-12">
        <div className="flex items-center justify-center gap-3 text-sepia mb-4">
          <span className="h-px w-12 bg-sand" />
          <HelpCircle className="w-5 h-5" />
          <span className="h-px w-12 bg-sand" />
        </div>
        <h1 className="font-serif text-3xl md:text-4xl text-onyx mb-3">
          {title}
        </h1>
        <p className="text-sepia text-sm tracking-widest uppercase">
          Answers to common questions
        </p>
      </header>

      {/* Accordion */}
      {faqs.length > 0 ? (
        <div className="space-y-3">
          {faqs.map((qa, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={i}
                className="bg-card border border-sand rounded-lg overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-sand/30 transition-colors"
                  aria-expanded={isOpen}
                >
                  <span className="font-serif text-base text-onyx">
                    {qa.question}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 flex-shrink-0 text-sepia transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <div
                  className={`grid transition-all duration-200 ease-in-out ${
                    isOpen
                      ? "grid-rows-[1fr] opacity-100"
                      : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="px-5 pb-5 text-sepia leading-relaxed whitespace-pre-line text-sm">
                      {qa.answer}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No FAQs yet"
          description="The couple hasn't added any frequently asked questions. Check back closer to the wedding day."
        />
      )}

      {/* Decorative footer */}
      <div className="flex items-center justify-center gap-3 text-sepia mt-12">
        <span className="h-px w-10 bg-sand" />
        <HelpCircle className="w-4 h-4" />
        <span className="h-px w-10 bg-sand" />
      </div>
    </div>
  );
}

export default GuestFaq;
