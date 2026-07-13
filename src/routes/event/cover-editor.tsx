import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { supabase, type UserEvent, type CoverConfig } from "../../lib/supabase";
import { Input } from "../../components/ui/Input";
import { FormField, Toggle, useToast } from "../../components/ui";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { CoverPreview } from "../../components/preview/PreviewRenderers";

export default function CoverEditorPage() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [cfg, setCfg] = useState<CoverConfig>(event.draft_cover_config ?? event.cover_config ?? {});
  const [name, setName] = useState(event.draft_name ?? event.name ?? "");
  const [date, setDate] = useState(event.draft_event_date ?? event.event_date ?? "");
  const [time, setTime] = useState(event.draft_event_time ?? event.event_time ?? "");
  const [venue, setVenue] = useState(event.draft_venue ?? event.venue ?? "");
  const [address, setAddress] = useState(event.draft_address ?? event.address ?? "");

  useEffect(() => {
    setCfg(event.draft_cover_config ?? event.cover_config ?? {});
    setName(event.draft_name ?? event.name ?? "");
    setDate(event.draft_event_date ?? event.event_date ?? "");
    setTime(event.draft_event_time ?? event.event_time ?? "");
    setVenue(event.draft_venue ?? event.venue ?? "");
    setAddress(event.draft_address ?? event.address ?? "");
  }, [event]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("user_events")
        .update({
          draft_cover_config: cfg,
          draft_name: name,
          draft_event_date: date || null,
          draft_event_time: time || null,
          draft_venue: venue || null,
          draft_address: address || null,
        })
        .eq("id", event.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", event.id] });
      toast("Cover saved", "success");
    },
    onError: (err: Error) => toast(err.message, "error"),
  });

  // Auto-save on changes (debounced via effect)
  useEffect(() => {
    const timer = setTimeout(() => {
      saveMutation.mutate();
    }, 1500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfg, name, date, time, venue, address]);

  const previewEvent = {
    ...event,
    draft_cover_config: cfg,
    draft_name: name,
    draft_event_date: date,
    draft_event_time: time,
    draft_venue: venue,
    draft_address: address,
  } as UserEvent;

  return (
    <SplitEditor preview={<CoverPreview event={previewEvent} />}>
      <FormField label="Event name">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Event name" />
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Date">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </FormField>
        <FormField label="Time">
          <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </FormField>
      </div>
      <FormField label="Venue">
        <Input value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="Venue name" />
      </FormField>
      <FormField label="Address">
        <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address" />
      </FormField>

      <div className="border-t border-gray-100 pt-4">
        <h3 className="mb-3 text-sm font-semibold text-gray-900">Cover design</h3>
        <div className="flex flex-col gap-4">
          <FormField label="Background image">
            <ImageUpload
              value={cfg.bgImage || ""}
              onChange={(url) => setCfg((c) => ({ ...c, bgImage: url }))}
              eventId={event.id}
              aspectRatio="16 / 9"
            />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Background color">
              <Input
                type="color"
                value={cfg.bgColor || "#1a1a1a"}
                onChange={(e) => setCfg((c) => ({ ...c, bgColor: e.target.value }))}
                className="h-10"
              />
            </FormField>
            <FormField label="Text color">
              <Input
                type="color"
                value={cfg.textColor || "#ffffff"}
                onChange={(e) => setCfg((c) => ({ ...c, textColor: e.target.value }))}
                className="h-10"
              />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Button color">
              <Input
                type="color"
                value={cfg.buttonColor || "#ffffff"}
                onChange={(e) => setCfg((c) => ({ ...c, buttonColor: e.target.value }))}
                className="h-10"
              />
            </FormField>
            <FormField label="Button text">
              <Input
                value={cfg.buttonText || ""}
                onChange={(e) => setCfg((c) => ({ ...c, buttonText: e.target.value }))}
                placeholder="Enter"
              />
            </FormField>
          </div>
          <FormField label="Custom text (above title)">
            <Input
              value={cfg.customText || ""}
              onChange={(e) => setCfg((c) => ({ ...c, customText: e.target.value }))}
              placeholder="Together with their families..."
            />
          </FormField>
          <FormField label="Logo">
            <ImageUpload
              value={cfg.logo || ""}
              onChange={(url) => setCfg((c) => ({ ...c, logo: url }))}
              eventId={event.id}
              aspectRatio="4 / 1"
            />
          </FormField>
          <FormField label="Logo width (px)">
            <Input
              type="number"
              value={cfg.logoWidth ?? ""}
              onChange={(e) => setCfg((c) => ({ ...c, logoWidth: e.target.value ? Number(e.target.value) : undefined }))}
              placeholder="120"
            />
          </FormField>
          <div className="flex flex-col gap-2">
            <Toggle
              checked={cfg.showDate ?? true}
              onChange={(v) => setCfg((c) => ({ ...c, showDate: v }))}
              label="Show date"
            />
            <Toggle
              checked={cfg.showCountdown ?? false}
              onChange={(v) => setCfg((c) => ({ ...c, showCountdown: v }))}
              label="Show countdown"
            />
          </div>
        </div>
      </div>

      {saveMutation.isPending && (
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Loader2 className="h-3 w-3 animate-spin" />
          Saving...
        </div>
      )}
    </SplitEditor>
  );
}
