import { useState, CSSProperties } from "react";
import { useOutletContext, useNavigate, useParams } from "react-router-dom";
import { supabase, Wedding, Rsvp, RsvpQuestion } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { useLang } from "../../lib/lang-context";
import { themeToCssVars, DEFAULT_THEME } from "../../lib/theme";
import { cn } from "../../lib/utils";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Input";
import { Toast, ErrorState } from "../../components/ui/index";

interface OutletContext {
  wedding: Wedding;
}

type RsvpStatus = "attending" | "not_attending" | "maybe";

/**
 * GuestRsvp — the RSVP form page.
 *
 * Renders the RSVP questions defined in the wedding content (plus a status
 * selector, plus_ones, dietary, and message field). On submit it inserts a
 * row into the `rsvps` table and updates the guest's `rsvp_status`.
 */
export default function GuestRsvp() {
  const { wedding } = useOutletContext<OutletContext>();
  const { guestId, guestName, weddingId: authWeddingId } = useGuestAuth();
  const { weddingId: paramWeddingId } = useParams<{ weddingId: string }>();
  const navigate = useNavigate();
  const { t } = useLang();

  const weddingId = authWeddingId || paramWeddingId || wedding.id;
  const themeVars = themeToCssVars(wedding.theme || DEFAULT_THEME) as CSSProperties;
  const content = wedding.content;

  const questions: RsvpQuestion[] = content?.rsvp_questions || [];

  const [status, setStatus] = useState<RsvpStatus>("attending");
  const [plusOnes, setPlusOnes] = useState(0);
  const [dietary, setDietary] = useState("");
  const [message, setMessage] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const handleAnswerChange = (id: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const validate = (): string | null => {
    for (const q of questions) {
      if (q.required && !answers[q.id]?.trim()) {
        return `Please answer: ${q.text}`;
      }
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!guestId) {
      setError("You must be signed in to submit an RSVP");
      return;
    }

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);

    try {
      // Insert into rsvps table
      const rsvpRecord: Omit<Rsvp, "id" | "submitted_at"> = {
        wedding_id: weddingId,
        guest_id: guestId,
        guest_name: guestName || "",
        status,
        plus_ones: status === "attending" ? plusOnes : 0,
        dietary,
        message,
        answers,
      };

      const { error: insertError } = await supabase.from("rsvps").insert(rsvpRecord);
      if (insertError) throw insertError;

      // Update guest rsvp_status
      const { error: updateError } = await supabase
        .from("guests")
        .update({
          rsvp_status: status,
          rsvp_submitted_at: new Date().toISOString(),
          plus_ones: status === "attending" ? plusOnes : 0,
          dietary,
          message,
        })
        .eq("id", guestId);

      if (updateError) throw updateError;

      setToast(t("rsvpSubmitted"));
      setTimeout(() => {
        navigate(`/${weddingId}/home`);
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to submit RSVP");
    } finally {
      setSubmitting(false);
    }
  };

  if (!guestId) {
    return (
      <div style={themeVars} className="min-h-[60vh] flex items-center justify-center px-4">
        <ErrorState
          message="You must be signed in to view this page"
          onRetry={() => navigate(`/${weddingId}`)}
        />
      </div>
    );
  }

  return (
    <div style={themeVars} className="pb-12">
      <section className="py-12 px-4" style={{ paddingBlock: "var(--wed-section-padding)" }}>
        <div className="max-w-xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1
              className="text-3xl sm:text-4xl mb-3"
              style={{ fontFamily: "var(--wed-heading-font)", color: "var(--wed-heading-color)" }}
            >
              {content?.rsvp_title || t("rsvp")}
            </h1>
            {content?.rsvp_description && (
              <p className="text-sm opacity-70" style={{ color: "var(--wed-body-color)" }}>
                {content.rsvp_description}
              </p>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 px-4 py-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-600">
              {error}
            </div>
          )}

          <div
            className="bg-white rounded-xl border shadow-sm p-6 sm:p-8"
            style={{
              background: "var(--wed-bg)",
              border: "1px solid color-mix(in srgb, var(--wed-primary) 25%, transparent)",
              borderRadius: "12px",
            }}
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Status selector */}
              <div>
                <label
                  className="block text-sm font-medium mb-3"
                  style={{ color: "var(--wed-heading-color)" }}
                >
                  Will you be attending?
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["attending", "maybe", "not_attending"] as RsvpStatus[]).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStatus(s)}
                      className={cn(
                        "py-2.5 px-3 rounded-lg text-sm font-medium transition-all border",
                        status === s ? "border-transparent text-white" : "border-gray-200"
                      )}
                      style={
                        status === s
                          ? { background: "var(--wed-primary)", color: "var(--wed-button-text)" }
                          : { color: "var(--wed-body-color)" }
                      }
                    >
                      {t(s as any)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Plus ones (only if attending) */}
              {status === "attending" && (
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: "var(--wed-heading-color)" }}
                  >
                    Number of guests (including yourself)
                  </label>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={plusOnes + 1}
                    onChange={(e) => setPlusOnes(Math.max(0, parseInt(e.target.value, 10) - 1))}
                    style={{
                      borderColor: "color-mix(in srgb, var(--wed-primary) 30%, transparent)",
                      borderRadius: "8px",
                    }}
                  />
                </div>
              )}

              {/* Dietary requirements */}
              {status === "attending" && (
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: "var(--wed-heading-color)" }}
                  >
                    Dietary requirements
                  </label>
                  <Input
                    type="text"
                    value={dietary}
                    onChange={(e) => setDietary(e.target.value)}
                    placeholder="Any allergies or preferences?"
                    style={{
                      borderColor: "color-mix(in srgb, var(--wed-primary) 30%, transparent)",
                      borderRadius: "8px",
                    }}
                  />
                </div>
              )}

              {/* Custom questions */}
              {questions.map((q) => (
                <div key={q.id}>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: "var(--wed-heading-color)" }}
                  >
                    {q.text}
                    {q.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  {renderQuestion(q, answers[q.id] || "", (val) => handleAnswerChange(q.id, val))}
                </div>
              ))}

              {/* Message */}
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: "var(--wed-heading-color)" }}
                >
                  {t("yourMessage")}
                </label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Leave a message for the couple..."
                  rows={4}
                  style={{
                    borderColor: "color-mix(in srgb, var(--wed-primary) 30%, transparent)",
                    borderRadius: "8px",
                  }}
                />
              </div>

              {/* Submit */}
              <div className="flex items-center gap-3">
                <Button
                  type="submit"
                  size="lg"
                  loading={submitting}
                  className="flex-1"
                  style={{
                    background: "var(--wed-button-bg)",
                    color: "var(--wed-button-text)",
                    borderRadius: "var(--wed-button-radius)",
                    border: "none",
                  }}
                >
                  {t("submit")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => navigate(`/${weddingId}/home`)}
                  style={{
                    borderColor: "color-mix(in srgb, var(--wed-primary) 30%, transparent)",
                    color: "var(--wed-body-color)",
                  }}
                >
                  {t("backToHome")}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {toast && <Toast message={toast} type="success" onClose={() => setToast(null)} />}
    </div>
  );
}

function renderQuestion(
  q: RsvpQuestion,
  value: string,
  onChange: (val: string) => void
): React.ReactNode {
  const inputStyle: CSSProperties = {
    borderColor: "color-mix(in srgb, var(--wed-primary) 30%, transparent)",
    borderRadius: "8px",
  };

  switch (q.type) {
    case "text":
      return (
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={q.required}
          style={inputStyle}
        />
      );

    case "radio":
      return (
        <div className="flex flex-col gap-2">
          {q.options.map((opt) => (
            <label key={opt} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name={q.id}
                value={opt}
                checked={value === opt}
                onChange={(e) => onChange(e.target.value)}
                required={q.required}
                className="text-gray-900"
              />
              <span className="text-sm" style={{ color: "var(--wed-body-color)" }}>{opt}</span>
            </label>
          ))}
        </div>
      );

    case "checkbox":
      return (
        <div className="flex flex-col gap-2">
          {q.options.map((opt) => {
            const selected = value ? value.split(", ").includes(opt) : false;
            return (
              <label key={opt} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  value={opt}
                  checked={selected}
                  onChange={(e) => {
                    const current = value ? value.split(", ") : [];
                    const next = e.target.checked
                      ? [...current, opt]
                      : current.filter((v) => v !== opt);
                    onChange(next.join(", "));
                  }}
                  className="rounded text-gray-900"
                />
                <span className="text-sm" style={{ color: "var(--wed-body-color)" }}>{opt}</span>
              </label>
            );
          })}
        </div>
      );

    case "select":
      return (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={q.required}
          className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2"
          style={{
            ...inputStyle,
            background: "var(--wed-bg)",
            color: "var(--wed-body-color)",
          }}
        >
          <option value="">Select an option...</option>
          {q.options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      );

    default:
      return (
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={q.required}
          style={inputStyle}
        />
      );
  }
}
