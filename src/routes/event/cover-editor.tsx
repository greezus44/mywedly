import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useOutletContext } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase, type UserEvent, type CoverConfig } from "../../lib/supabase";
import {
  Button,
  FormField,
  Input,
  Textarea,
  Toggle,
  ImageUpload,
  ColorInput,
  RangeInput,
  Toast,
} from "../../components/ui";
import { DatePicker, TimePicker } from "../../components/ui";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { CoverPreview } from "../../components/preview/PreviewRenderers";

export default function CoverEditorPage() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const [name, setName] = useState(event.draft_name || "");
  const [eventDate, setEventDate] = useState<string | null>(event.draft_event_date || null);
  const [eventTime, setEventTime] = useState<string | null>(event.draft_event_time || null);
  const [venue, setVenue] = useState(event.draft_venue || "");
  const [address, setAddress] = useState(event.draft_address || "");
  const [coverImage, setCoverImage] = useState<string | null>(event.draft_cover_image || null);
  const [config, setConfig] = useState<CoverConfig>(
    event.draft_cover_config || {
      bgColor: "#1a1a2e",
      textColor: "#ffffff",
      buttonColor: "#ffffff",
      buttonText: "Enter",
      customText: null,
      showDate: true,
      showCountdown: false,
      bgImage: null,
      logo: null,
      logoWidth: 120,
    }
  );

  useEffect(() => {
    setName(event.draft_name || "");
    setEventDate(event.draft_event_date || null);
    setEventTime(event.draft_event_time || null);
    setVenue(event.draft_venue || "");
    setAddress(event.draft_address || "");
    setCoverImage(event.draft_cover_image || null);
    setConfig(
      event.draft_cover_config || {
        bgColor: "#1a1a2e",
        textColor: "#ffffff",
        buttonColor: "#ffffff",
        buttonText: "Enter",
        customText: null,
        showDate: true,
        showCountdown: false,
        bgImage: null,
        logo: null,
        logoWidth: 120,
      }
    );
  }, [event]);

  // Build a preview event object with current draft values
  const previewEvent: UserEvent = {
    ...event,
    draft_name: name,
    draft_event_date: eventDate,
    draft_event_time: eventTime,
    draft_venue: venue,
    draft_address: address,
    draft_cover_image: coverImage,
    draft_cover_config: { ...config, bgImage: config.bgImage || coverImage },
  };

  const updateConfig = (patch: Partial<CoverConfig>) => {
    setConfig((prev) => ({ ...prev, ...patch }));
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("user_events")
        .update({
          draft_name: name,
          draft_event_date: eventDate,
          draft_event_time: eventTime,
          draft_venue: venue,
          draft_address: address,
          draft_cover_image: coverImage,
          draft_cover_config: { ...config, bgImage: config.bgImage || coverImage },
        })
        .eq("id", event.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", event.id] });
      setToast({ message: "Cover saved", type: "success" });
    },
    onError: (err: Error) => {
      setToast({ message: err.message, type: "error" });
    },
  });

  return (
    <div className="h-full p-4">
      <SplitEditor preview={<CoverPreview event={previewEvent} />}>
        <div className="flex flex-col gap-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
            Cover Page Editor
          </h2>

          <FormField label="Event Name">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Event name"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <DatePicker
              value={eventDate}
              onChange={(d) => setEventDate(d || null)}
              label="Event Date"
            />
            <TimePicker
              value={eventTime}
              onChange={(t) => setEventTime(t || null)}
              label="Event Time"
            />
          </div>

          <FormField label="Venue">
            <Input
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="Venue name"
            />
          </FormField>

          <FormField label="Address">
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Full address"
            />
          </FormField>

          <hr className="border-gray-100" />

          <h3 className="text-sm font-semibold text-gray-700">Cover Design</h3>

          <ImageUpload
            value={coverImage}
            onChange={(url) => setCoverImage(url)}
            eventId={event.id}
            label="Background Image"
            aspectRatio="16/9"
          />

          <ImageUpload
            value={config.logo || null}
            onChange={(url) => updateConfig({ logo: url })}
            eventId={event.id}
            label="Logo"
            aspectRatio="auto"
          />

          {config.logo && (
            <RangeInput
              value={config.logoWidth || 120}
              onChange={(v) => updateConfig({ logoWidth: v })}
              min={40}
              max={300}
              step={10}
              label="Logo Width"
            />
          )}

          <div className="grid grid-cols-2 gap-4">
            <ColorInput
              value={config.bgColor || "#1a1a2e"}
              onChange={(v) => updateConfig({ bgColor: v })}
              label="Background Color"
            />
            <ColorInput
              value={config.textColor || "#ffffff"}
              onChange={(v) => updateConfig({ textColor: v })}
              label="Text Color"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <ColorInput
              value={config.buttonColor || "#ffffff"}
              onChange={(v) => updateConfig({ buttonColor: v })}
              label="Button Color"
            />
            <FormField label="Button Text">
              <Input
                value={config.buttonText || ""}
                onChange={(e) => updateConfig({ buttonText: e.target.value })}
                placeholder="Enter"
              />
            </FormField>
          </div>

          <FormField label="Custom Text (optional)">
            <Textarea
              value={config.customText || ""}
              onChange={(e) => updateConfig({ customText: e.target.value })}
              placeholder="Additional text on cover"
              rows={2}
            />
          </FormField>

          <div className="flex flex-col gap-3">
            <Toggle
              checked={config.showDate ?? true}
              onChange={(v) => updateConfig({ showDate: v })}
              label="Show date on cover"
            />
            <Toggle
              checked={config.showCountdown ?? false}
              onChange={(v) => updateConfig({ showCountdown: v })}
              label="Show countdown timer"
            />
          </div>

          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </SplitEditor>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
