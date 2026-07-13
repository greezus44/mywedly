import { useState, CSSProperties } from "react";
import { useOutletContext, useNavigate, useParams } from "react-router-dom";
import { supabase, Wedding, GuestbookEntry } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { useLang } from "../../lib/lang-context";
import { themeToCssVars, DEFAULT_THEME } from "../../lib/theme";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Input";
import { Toast, ErrorState } from "../../components/ui/index";

interface OutletContext {
  wedding: Wedding;
}

/**
 * GuestDoa — the Doa & Wishes page.
 *
 * Displays the doa title and description from the wedding content, and a form
 * for guests to submit a wish/prayer. Submissions are inserted into the
 * `guestbook_entries` table. Shows a success toast on submit.
 */
export default function GuestDoa() {
  const { wedding } = useOutletContext<OutletContext>();
  const { guestName, weddingId: authWeddingId } = useGuestAuth();
  const { weddingId: paramWeddingId } = useParams<{ weddingId: string }>();
  const navigate = useNavigate();
  const { t } = useLang();

  const weddingId = authWeddingId || paramWeddingId || wedding.id;
  const themeVars = themeToCssVars(wedding.theme || DEFAULT_THEME) as CSSProperties;
  const content = wedding.content;

  const [name, setName] = useState(guestName || "");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !message.trim()) {
      setError("Please enter your name and a message");
      return;
    }

    setSubmitting(true);

    try {
      const entry: Omit<GuestbookEntry, "id" | "created_at"> = {
        wedding_id: weddingId,
        guest_name: name.trim(),
        message: message.trim(),
      };

      const { error: insertError } = await supabase.from("guestbook_entries").insert(entry);
      if (insertError) throw insertError;

      setToast(t("messageSent"));
      setMessage("");
      setTimeout(() => setToast(null), 4000);
    } catch (err: any) {
      setError(err.message || "Failed to submit your wish");
    } finally {
      setSubmitting(false);
    }
  };

  if (!content?.doa_enabled) {
    return (
      <div style={themeVars} className="min-h-[60vh] flex items-center justify-center px-4">
        <ErrorState
          message="This page is not available"
          onRetry={() => navigate(`/${weddingId}/home`)}
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
              {content?.doa_title || t("doa")}
            </h1>
            {content?.doa_description && (
              <p
                className="text-sm opacity-70 max-w-md mx-auto"
                style={{ color: "var(--wed-body-color)" }}
              >
                {content.doa_description}
              </p>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 px-4 py-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Form */}
          <div
            className="bg-white rounded-xl border shadow-sm p-6 sm:p-8"
            style={{
              background: "var(--wed-bg)",
              border: "1px solid color-mix(in srgb, var(--wed-primary) 25%, transparent)",
              borderRadius: "12px",
            }}
          >
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: "var(--wed-heading-color)" }}
                >
                  Your Name
                </label>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  required
                  style={{
                    borderColor: "color-mix(in srgb, var(--wed-primary) 30%, transparent)",
                    borderRadius: "8px",
                  }}
                />
              </div>

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
                  placeholder="Share your wishes and prayers for the happy couple..."
                  rows={6}
                  required
                  style={{
                    borderColor: "color-mix(in srgb, var(--wed-primary) 30%, transparent)",
                    borderRadius: "8px",
                  }}
                />
              </div>

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
