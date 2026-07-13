import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { supabase, type UserEvent, type CoverConfig } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Input";
import {
  Card,
  FormField,
  Toggle,
  Toast,
  type ToastType,
} from "../../components/ui";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { DatePicker, TimePicker } from "../../components/ui";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { CoverPreview } from "../../components/preview/PreviewRenderers";

export default function CoverEditorPage() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const config: CoverConfig = event.draft_cover_config ?? event.cover_config ?? {};
  const [bgImage, setBgImage] = useState<string | null>(config.bgImage ?? null);
  const [logo, setLogo] = useState<string | null>(config.logo ?? null);
  const [bgColor, setBgColor] = useState<string>(config.bgColor ?? "#ffffff");
  const [textColor, setTextColor] = useState<string>(config.textColor ?? "#1a1a1a");
  const [buttonColor, setButtonColor] = useState<string>(config.buttonColor ?? "#b08d57");
  const [buttonText, setButtonText] = useState<string>(config.buttonText ?? "View Invitation");
  const [customText, setCustomText] = useState<string>(config.customText ?? "");
  const [showDate, setShowDate] = useState<boolean>(config.showDate ?? true);
  const [showCountdown, setShowCountdown] = useState<boolean>(config.showCountdown ?? true);
  const [logoWidth, setLogoWidth] = useState<number>(config.logoWidth ?? 120);

  const [name, setName] = useState<string>(event.draft_name ?? event.name ?? "");
  const [eventDate, setEventDate] = useState<string | null>(
    event.draft_event_date ?? event.event_date,
  );
  const [eventTime, setEventTime] = useState<string | null>(
    event.draft_event_time ?? event.event_time,
  );
  const [venue, setVenue] = useState<string>(event.draft_venue ?? event.venue ?? "");
  const [address, setAddress] = useState<string>(event.draft_address ?? event.address ?? "");

  const updateMutation = useMutation({
    mutationFn: async (updates: Record<string, unknown>) => {
      const { error } = await supabase
        .from("user_events")
        .update(updates)
        .eq("id", event.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", event.id] });
      setToast({ message: "Saved!", type: "success" });
    },
    onError: (err: Error) => {
      setToast({ message: err.message, type: "error" });
    },
  });

  const handleSave = () => {
    const newConfig: CoverConfig = {
      ...config,
      bgImage,
      logo,
      bgColor,
      textColor,
      buttonColor,
      buttonText,
      customText,
      showDate,
      showCountdown,
      logoWidth,
    };
    updateMutation.mutate({
      draft_cover_config: newConfig,
      draft_name: name,
      draft_event_date: eventDate,
      draft_event_time: eventTime,
      draft_venue: venue,
      draft_address: address,
    });
  };

  // Build a live preview event with current edits
  const previewEvent: UserEvent = {
    ...event,
    draft_name: name,
    draft_event_date: eventDate,
    draft_event_time: eventTime,
    draft_venue: venue,
    draft_address: address,
    draft_cover_config: {
      ...config,
      bgImage,
      logo,
      bgColor,
      textColor,
      buttonColor,
      buttonText,
      customText,
      showDate,
      showCountdown,
      logoWidth,
    },
  };

  return (
    <div className="h-full overflow-y-auto p-4">
      <SplitEditor preview={<CoverPreview event={previewEvent} />}>
        <div className="space-y-6 p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-xl font-bold text-gray-900">
              Cover Page
            </h2>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </div>

          {/* Event details */}
          <Card className="space-y-4 p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
              Event Details
            </h3>
            <FormField label="Event name">
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </FormField>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DatePicker
                label="Event date"
                value={eventDate}
                onChange={(d) => setEventDate(d)}
              />
              <TimePicker
                label="Event time"
                value={eventTime}
                onChange={(t) => setEventTime(t)}
              />
            </div>
            <FormField label="Venue">
              <Input value={venue} onChange={(e) => setVenue(e.target.value)} />
            </FormField>
            <FormField label="Address">
              <Input value={address} onChange={(e) => setAddress(e.target.value)} />
            </FormField>
          </Card>

          {/* Cover config */}
          <Card className="space-y-4 p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
              Cover Design
            </h3>
            <FormField label="Background image">
              <ImageUpload
                value={bgImage}
                onChange={setBgImage}
                eventId={event.id}
                aspectRatio="16/9"
              />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Background color">
                <Input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="h-10 p-1"
                />
              </FormField>
              <FormField label="Text color">
                <Input
                  type="color"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="h-10 p-1"
                />
              </FormField>
            </div>
            <FormField label="Custom text (above title)">
              <Textarea
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="e.g. Together with their families"
                rows={2}
              />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Button text">
                <Input
                  value={buttonText}
                  onChange={(e) => setButtonText(e.target.value)}
                />
              </FormField>
              <FormField label="Button color">
                <Input
                  type="color"
                  value={buttonColor}
                  onChange={(e) => setButtonColor(e.target.value)}
                  className="h-10 p-1"
                />
              </FormField>
            </div>
            <div className="flex items-center gap-6">
              <Toggle
                checked={showDate}
                onChange={setShowDate}
                label="Show date"
              />
              <Toggle
                checked={showCountdown}
                onChange={setShowCountdown}
                label="Show countdown"
              />
            </div>
          </Card>

          {/* Logo */}
          <Card className="space-y-4 p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
              Logo
            </h3>
            <FormField label="Logo image">
              <ImageUpload
                value={logo}
                onChange={setLogo}
                eventId={event.id}
                aspectRatio="1/1"
              />
            </FormField>
            <FormField label={`Logo width: ${logoWidth}px`}>
              <input
                type="range"
                min={40}
                max={300}
                value={logoWidth}
                onChange={(e) => setLogoWidth(Number(e.target.value))}
                className="w-full accent-gray-900"
              />
            </FormField>
          </Card>
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
