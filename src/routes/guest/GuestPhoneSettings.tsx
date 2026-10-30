import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { buttonColorsToStyle, buttonColorsToHoverStyle, type ButtonColors } from "../../components/ui/ButtonColourEditor";
import { getTypographyStyle, type TypographyStyle } from "../../lib/typography";

interface PhoneSettings {
  registered: boolean;
  enabled?: boolean;
  question?: string | null;
  questionBm?: string | null;
  helper?: string | null;
  helperBm?: string | null;
  status?: string | null;
  phone?: string | null;
}

interface GuestPhoneSettingsProps {
  guestId: string;
  eventId: string;
  isBm: boolean;
  buttonColors?: ButtonColors;
  buttonTypography?: TypographyStyle;
}

export const guestPhoneSettingsQueryKey = (guestId: string, eventId: string) =>
  ["guest-phone-settings", guestId, eventId] as const;

export default function GuestPhoneSettings({ guestId, eventId, isBm, buttonColors, buttonTypography }: GuestPhoneSettingsProps) {
  const queryClient = useQueryClient();

  const { data: settings } = useQuery({
    queryKey: guestPhoneSettingsQueryKey(guestId, eventId),
    queryFn: async () => {
      const { data, error } = await supabase.rpc("guest_phone_settings", { p_guest_id: guestId, p_event_id: eventId });
      if (error) throw error;
      if (!data || typeof data !== "object") throw new Error("Unexpected phone settings response");
      return data as unknown as PhoneSettings;
    },
  });

  const [draft, setDraft] = useState("");
  const savedPhone = settings?.phone ?? "";

  useEffect(() => {
    setDraft(savedPhone);
  }, [savedPhone]);

  const saveMutation = useMutation({
    mutationFn: async (phone: string | null) => {
      const { error } = await supabase.rpc("guest_set_phone", { p_guest_id: guestId, p_event_id: eventId, p_phone: phone });
      if (error) {
        console.error("Phone save failed", error);
        if (error.message.includes("invalid_phone")) throw new Error(isBm ? "Sila masukkan nombor telefon yang sah." : "Please enter a valid phone number.");
        throw new Error(isBm ? "Kami tidak dapat menyimpan nombor telefon anda. Sila cuba lagi." : "We couldn't save your phone number. Please try again.");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: guestPhoneSettingsQueryKey(guestId, eventId) });
    },
  });

  if (!settings?.registered || !settings.enabled || settings.status !== "attending") return null;

  const question = (isBm ? settings.questionBm : settings.question)?.trim() || (isBm ? "Nombor telefon (pilihan)" : "Your phone number (optional)");
  const helper = (isBm ? settings.helperBm : settings.helper)?.trim() || (isBm ? "Untuk pengaturan tempat duduk" : "For seating arrangements");
  const trimmedDraft = draft.trim();
  const isUnchanged = trimmedDraft === savedPhone.trim();
  const errorMessage = saveMutation.error instanceof Error ? saveMutation.error.message : null;

  return (
    <div className="mx-auto mt-8 max-w-md text-center" style={{ fontFamily: "var(--event-font-body)" }}>
      <label htmlFor="guest-phone-settings" className="block text-sm" style={{ color: "var(--event-text)" }}>{question}</label>
      <p className="mt-1 text-xs" style={{ color: "var(--event-muted)" }}>{helper}</p>
      <input
        id="guest-phone-settings"
        type="tel"
        maxLength={30}
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          saveMutation.reset();
        }}
        className="mt-3 w-full rounded-md border px-3 py-2 text-center text-sm"
        style={{ borderColor: "var(--event-border)", color: "var(--event-text)", background: "transparent" }}
      />
      {errorMessage && <p role="alert" className="mt-2 text-sm" style={{ color: "#b91c1c" }}>{errorMessage}</p>}
      <div className="mt-3 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => saveMutation.mutate(trimmedDraft || null)}
          disabled={isUnchanged || saveMutation.isPending}
          className="event-btn-primary transition-opacity disabled:opacity-50"
          style={{ ...buttonColorsToStyle(buttonColors), ...getTypographyStyle(buttonTypography) }}
          onMouseEnter={(e) => Object.assign(e.currentTarget.style, { ...buttonColorsToStyle(buttonColors), ...getTypographyStyle(buttonTypography), ...buttonColorsToHoverStyle(buttonColors) })}
          onMouseLeave={(e) => Object.assign(e.currentTarget.style, { ...buttonColorsToStyle(buttonColors), ...getTypographyStyle(buttonTypography) })}
        >
          {saveMutation.isPending ? (isBm ? "Menyimpan..." : "Saving...") : (isBm ? "Simpan" : "Save")}
        </button>
        {savedPhone && (
          <button
            type="button"
            onClick={() => {
              setDraft("");
              saveMutation.mutate(null);
            }}
            disabled={saveMutation.isPending}
            className="text-sm underline disabled:opacity-50"
            style={{ color: "var(--event-muted)" }}
          >
            {isBm ? "Padam nombor" : "Remove number"}
          </button>
        )}
      </div>
    </div>
  );
}
