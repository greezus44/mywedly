import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import type { UserEvent, Json } from "../../lib/supabase";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { CoverPreview } from "../../components/preview/PreviewRenderers";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Input";
import { RangeInput, FormField, LoadingSpinner } from "../../components/ui";
import { uploadImage, removeImage } from "../../lib/upload";
import { cn } from "../../lib/utils";

interface LogoConfig {
  src: string | null;
  size: number;
  align: "left" | "center" | "right";
}

interface CoverConfig {
  overlay: number;
}

function parseLogoConfig(json: Json | null | undefined): LogoConfig {
  if (!json || typeof json !== "object") return { src: null, size: 120, align: "center" };
  const obj = json as Record<string, unknown>;
  return {
    src: (obj.src as string) ?? null,
    size: (obj.size as number) ?? 120,
    align: (obj.align as "left" | "center" | "right") ?? "center",
  };
}

function parseCoverConfig(json: Json | null | undefined): CoverConfig {
  if (!json || typeof json !== "object") return { overlay: 30 };
  const obj = json as Record<string, unknown>;
  return { overlay: (obj.overlay as number) ?? 30 };
}

export function CoverEditor() {
  const { event, eventId } = useOutletContext<{ event: UserEvent; eventId: string }>();
  const queryClient = useQueryClient();

  const [name, setName] = useState(event.draft_name || event.name);
  const [date, setDate] = useState(event.draft_event_date || event.event_date || "");
  const [time, setTime] = useState(event.draft_event_time || event.event_time || "");
  const [venue, setVenue] = useState(event.draft_venue || event.venue || "");
  const [coverImage, setCoverImage] = useState(event.draft_cover_image || event.cover_image);
  const [logoConfig, setLogoConfig] = useState<LogoConfig>(parseLogoConfig(event.draft_logo_config));
  const [coverConfig, setCoverConfig] = useState<CoverConfig>(parseCoverConfig(event.draft_cover_config));

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("user_events")
        .update({
          draft_name: name,
          draft_event_date: date || null,
          draft_event_time: time || null,
          draft_venue: venue,
          draft_cover_image: coverImage,
          draft_logo_config: logoConfig as unknown as Json,
          draft_cover_config: coverConfig as unknown as Json,
        })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-event", eventId] });
    },
  });

  const handleLogoUpload = async (file: File): Promise<string> => {
    const url = await uploadImage(file, eventId, "logo");
    setLogoConfig((prev) => ({ ...prev, src: url }));
    return url;
  };

  const handleLogoRemove = () => {
    if (logoConfig.src) {
      removeImage(logoConfig.src).catch(() => {});
    }
    setLogoConfig((prev) => ({ ...prev, src: null }));
  };

  const handleCoverUpload = async (file: File): Promise<string> => {
    const url = await uploadImage(file, eventId, "cover");
    setCoverImage(url);
    return url;
  };

  const handleCoverRemove = () => {
    if (coverImage) {
      removeImage(coverImage).catch(() => {});
    }
    setCoverImage(null);
  };

  const editor = (
    <div className="space-y-5">
      <h2 className="text-lg font-semibold text-dash-text">Cover Page</h2>

      <FormField label="Event Name">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Our Wedding" />
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Event Date">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </FormField>
        <FormField label="Event Time">
          <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </FormField>
      </div>

      <FormField label="Venue">
        <Input value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="Venue name" />
      </FormField>

      <div>
        <h3 className="text-sm font-semibold text-dash-text mb-3">Cover Image</h3>
        <ImageUpload
          value={coverImage}
          onUpload={handleCoverUpload}
          onRemove={handleCoverRemove}
          label="Background Image"
          aspectRatio="16/9"
        />
      </div>

      <div>
        <h3 className="text-sm font-semibold text-dash-text mb-3">Logo</h3>
        <ImageUpload
          value={logoConfig.src}
          onUpload={handleLogoUpload}
          onRemove={handleLogoRemove}
          label="Logo Image"
        />
        <div className="mt-4 space-y-3">
          <RangeInput
            label="Logo Size"
            value={logoConfig.size}
            min={40}
            max={300}
            step={10}
            onChange={(v) => setLogoConfig((prev) => ({ ...prev, size: v }))}
          />
          <div>
            <label className="block text-sm font-medium text-dash-text mb-1.5">Alignment</label>
            <div className="flex gap-2">
              {(["left", "center", "right"] as const).map((align) => (
                <button
                  key={align}
                  type="button"
                  onClick={() => setLogoConfig((prev) => ({ ...prev, align }))}
                  className={cn(
                    "flex-1 rounded-lg border px-3 py-1.5 text-sm font-medium capitalize transition-colors",
                    logoConfig.align === align
                      ? "border-dash-primary bg-dash-primary/10 text-dash-primary"
                      : "border-dash-border bg-dash-surface text-dash-muted hover:bg-dash-bg"
                  )}
                >
                  {align}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-dash-text mb-3">Overlay</h3>
        <RangeInput
          label="Dark Overlay"
          value={coverConfig.overlay}
          min={0}
          max={80}
          step={5}
          onChange={(v) => setCoverConfig((prev) => ({ ...prev, overlay: v }))}
        />
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button
          onClick={() => saveMutation.mutate()}
          loading={saveMutation.isPending}
        >
          Save Changes
        </Button>
        {saveMutation.isError && (
          <span className="text-sm text-dash-danger">
            {saveMutation.error instanceof Error ? saveMutation.error.message : "Save failed"}
          </span>
        )}
        {saveMutation.isSuccess && (
          <span className="text-sm text-green-600">Saved!</span>
        )}
      </div>
    </div>
  );

  const preview = (
    <div className="p-4">
      <CoverPreview
        eventName={name || "Our Wedding"}
        eventDate={date || null}
        eventTime={time || null}
        venue={venue || "Venue to be announced"}
        coverImage={coverImage}
        coverConfig={coverConfig as unknown as Json}
      />
      {logoConfig.src && (
        <div className="flex justify-center -mt-8 relative z-20">
          <img
            src={logoConfig.src}
            alt="Logo"
            style={{
              width: `${logoConfig.size}px`,
              height: "auto",
              objectFit: "contain",
            }}
            className="rounded-lg shadow-md bg-white/90 p-1"
          />
        </div>
      )}
    </div>
  );

  return (
    <div className="h-[calc(100vh-140px)]">
      <SplitEditor editor={editor} preview={preview} editorRatio={0.45} />
    </div>
  );
}
