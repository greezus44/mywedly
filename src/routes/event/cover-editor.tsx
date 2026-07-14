import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Json } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { CoverPreview } from "../../components/preview/PreviewRenderers";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Input";
import { RangeInput } from "../../components/ui";
import { cn } from "../../lib/utils";

interface LogoConfig {
  url: string | null;
  width: number;
  align: "left" | "center" | "right";
}

interface CoverField {
  text: string;
  align?: string;
  color?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number;
}

interface CoverConfig {
  title?: CoverField;
  subtitle?: CoverField;
  date?: CoverField;
  time?: CoverField;
  venue?: CoverField;
}

function toField(value: unknown): CoverField {
  if (typeof value === "string") return { text: value };
  if (value && typeof value === "object") return value as CoverField;
  return { text: "" };
}

export function CoverEditor() {
  const { event, eventId } = useEventContext();
  const queryClient = useQueryClient();

  const initialLogo = (event.draft_logo_config ?? event.logo_config) as LogoConfig | null;
  const initialCover = (event.draft_cover_config ?? event.cover_config) as CoverConfig | null;

  const [logoConfig, setLogoConfig] = useState<LogoConfig>({
    url: initialLogo?.url ?? null,
    width: initialLogo?.width ?? 120,
    align: initialLogo?.align ?? "center",
  });
  const [coverImage, setCoverImage] = useState<string | null>(
    event.draft_cover_image ?? event.cover_image
  );
  const [coverConfig, setCoverConfig] = useState<CoverConfig>({
    title: initialCover?.title,
    subtitle: initialCover?.subtitle,
    date: initialCover?.date,
    time: initialCover?.time,
    venue: initialCover?.venue,
  });

  useEffect(() => {
    setLogoConfig({
      url: initialLogo?.url ?? null,
      width: initialLogo?.width ?? 120,
      align: initialLogo?.align ?? "center",
    });
    setCoverImage(event.draft_cover_image ?? event.cover_image);
    setCoverConfig({
      title: initialCover?.title,
      subtitle: initialCover?.subtitle,
      date: initialCover?.date,
      time: initialCover?.time,
      venue: initialCover?.venue,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event.updated_at]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("user_events")
        .update({
          draft_logo_config: logoConfig as unknown as Json,
          draft_cover_image: coverImage,
          draft_cover_config: coverConfig as unknown as Json,
          updated_at: new Date().toISOString(),
        })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
    },
  });

  const updateField = (key: keyof CoverConfig, patch: Partial<CoverField>) => {
    setCoverConfig((prev) => ({
      ...prev,
      [key]: { ...toField(prev[key]), ...patch },
    }));
  };

  const renderFieldEditor = (key: keyof CoverConfig, label: string) => {
    const field = toField(coverConfig[key]);
    return (
      <div key={key} className="space-y-2 rounded-lg border border-dash-border p-3">
        <p className="text-sm font-medium text-dash-text">{label}</p>
        <Input
          type="text"
          value={field.text}
          onChange={(e) => updateField(key, { text: e.target.value })}
          placeholder={`${label} text`}
        />
        <div className="flex gap-2">
          <select
            value={field.align ?? "center"}
            onChange={(e) => updateField(key, { align: e.target.value })}
            className="rounded-lg border border-dash-border bg-dash-surface px-2 py-1.5 text-sm"
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
          <Input
            type="number"
            value={field.fontSize ?? 16}
            onChange={(e) => updateField(key, { fontSize: Number(e.target.value) })}
            placeholder="Size (px)"
            className="w-28"
          />
        </div>
      </div>
    );
  };

  return (
    <SplitEditor
      editor={
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-dash-text">Cover Editor</h2>

          {/* Logo section */}
          <div className="space-y-3 rounded-lg border border-dash-border p-3">
            <p className="text-sm font-medium text-dash-text">Logo</p>
            <ImageUpload
              bucket="event-assets"
              path={`${eventId}/logo`}
              value={logoConfig.url}
              onUpload={(url) => setLogoConfig((p) => ({ ...p, url }))}
              onRemove={() => setLogoConfig((p) => ({ ...p, url: null }))}
              aspectRatio="square"
            />
            {logoConfig.url && (
              <>
                <RangeInput
                  label="Size"
                  min={40}
                  max={300}
                  value={logoConfig.width}
                  onChange={(v) => setLogoConfig((p) => ({ ...p, width: v }))}
                />
                <div className="flex gap-2">
                  {(["left", "center", "right"] as const).map((align) => (
                    <button
                      key={align}
                      type="button"
                      onClick={() => setLogoConfig((p) => ({ ...p, align }))}
                      className={cn(
                        "flex-1 rounded-md border px-3 py-1.5 text-sm capitalize transition-colors",
                        logoConfig.align === align
                          ? "border-dash-primary bg-dash-primary/10 text-dash-primary"
                          : "border-dash-border text-dash-muted hover:text-dash-text"
                      )}
                    >
                      {align}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Cover image */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-dash-text">Cover Image</p>
            <ImageUpload
              bucket="event-assets"
              path={`${eventId}/cover`}
              value={coverImage}
              onUpload={setCoverImage}
              onRemove={() => setCoverImage(null)}
              aspectRatio="wide"
            />
          </div>

          {/* Text fields */}
          {renderFieldEditor("title", "Title")}
          {renderFieldEditor("subtitle", "Subtitle")}
          {renderFieldEditor("date", "Date")}
          {renderFieldEditor("time", "Time")}
          {renderFieldEditor("venue", "Venue")}

          <Button
            onClick={() => saveMutation.mutate()}
            loading={saveMutation.isPending}
            className="w-full"
          >
            Save Changes
          </Button>
          {saveMutation.isError && (
            <p className="text-sm text-dash-danger">
              {saveMutation.error instanceof Error ? saveMutation.error.message : "Save failed"}
            </p>
          )}
          {saveMutation.isSuccess && (
            <p className="text-sm text-green-600">Saved successfully!</p>
          )}
        </div>
      }
      preview={
        <div className="space-y-4">
          {logoConfig.url && (
            <div
              className="flex"
              style={{
                justifyContent:
                  logoConfig.align === "left"
                    ? "flex-start"
                    : logoConfig.align === "right"
                    ? "flex-end"
                    : "center",
              }}
            >
              <img
                src={logoConfig.url}
                alt="Logo"
                style={{ width: `${logoConfig.width}px` }}
                className="h-auto"
              />
            </div>
          )}
          <CoverPreview
            coverConfig={coverConfig as unknown as Json}
            eventName={event.draft_name || event.name}
            eventDate={event.draft_event_date}
            eventTime={event.draft_event_time}
            venue={event.draft_venue}
            coverImage={coverImage}
          />
        </div>
      }
    />
  );
}
