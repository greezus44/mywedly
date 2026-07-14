import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type Json } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { CoverPreview } from "../../components/preview/PreviewRenderers";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, Select } from "../../components/ui";
import { RangeInput, FormField, LoadingSpinner } from "../../components/ui";
import { cn } from "../../lib/utils";

interface LogoConfig {
  src: string | null;
  size: number;
  align: "left" | "center" | "right";
}

interface CoverConfig {
  title?: Json;
  subtitle?: Json;
  overlay?: number;
  align?: string;
}

export function CoverEditor() {
  const { event, eventId } = useEventContext();
  const queryClient = useQueryClient();

  const [coverImage, setCoverImage] = useState<string | null>(
    event.draft_cover_image ?? null
  );
  const [coverConfig, setCoverConfig] = useState<CoverConfig>(
    (event.draft_cover_config as unknown as CoverConfig) ?? {}
  );
  const [logoConfig, setLogoConfig] = useState<LogoConfig>(
    (event.draft_logo_config as unknown as LogoConfig) ?? {
      src: null,
      size: 120,
      align: "center",
    }
  );

  useEffect(() => {
    setCoverImage(event.draft_cover_image ?? null);
    setCoverConfig((event.draft_cover_config as unknown as CoverConfig) ?? {});
    setLogoConfig(
      (event.draft_logo_config as unknown as LogoConfig) ?? {
        src: null,
        size: 120,
        align: "center",
      }
    );
  }, [event]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("user_events")
        .update({
          draft_cover_image: coverImage,
          draft_cover_config: coverConfig as unknown as Json,
          draft_logo_config: logoConfig as unknown as Json,
        })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-dash-text">Cover Editor</h2>
        <Button
          onClick={() => saveMutation.mutate()}
          loading={saveMutation.isPending}
        >
          Save Changes
        </Button>
      </div>

      {saveMutation.isError && (
        <p className="text-sm text-red-600">
          {saveMutation.error instanceof Error
            ? saveMutation.error.message
            : "Failed to save"}
        </p>
      )}
      {saveMutation.isSuccess && (
        <p className="text-sm text-green-600">Saved successfully!</p>
      )}

      <SplitEditor
        editorRatio={0.5}
        editor={
          <div className="space-y-6">
            {/* Cover Image */}
            <FormField label="Cover Image">
              <ImageUpload
                bucket="event-assets"
                pathPrefix={`events/${eventId}/cover`}
                value={coverImage}
                onChange={setCoverImage}
                aspectRatio="16/9"
              />
            </FormField>

            {/* Overlay */}
            <RangeInput
              label="Overlay Opacity"
              value={Math.round((coverConfig.overlay ?? 0.3) * 100)}
              onChange={(v) =>
                setCoverConfig({ ...coverConfig, overlay: v / 100 })
              }
              min={0}
              max={90}
              step={5}
            />

            {/* Alignment */}
            <FormField label="Text Alignment">
              <div className="flex gap-2">
                {(["left", "center", "right"] as const).map((a) => (
                  <Button
                    key={a}
                    variant={
                      (coverConfig.align ?? "center") === a
                        ? "primary"
                        : "secondary"
                    }
                    size="sm"
                    onClick={() => setCoverConfig({ ...coverConfig, align: a })}
                  >
                    {a.charAt(0).toUpperCase() + a.slice(1)}
                  </Button>
                ))}
              </div>
            </FormField>

            {/* Title Text */}
            <Input
              label="Title Text"
              value={
                typeof coverConfig.title === "string"
                  ? coverConfig.title
                  : (coverConfig.title as { text?: string })?.text ?? ""
              }
              onChange={(e) =>
                setCoverConfig({
                  ...coverConfig,
                  title: e.target.value,
                })
              }
              placeholder="Our Wedding"
            />

            {/* Subtitle Text */}
            <Input
              label="Subtitle Text"
              value={
                typeof coverConfig.subtitle === "string"
                  ? coverConfig.subtitle
                  : (coverConfig.subtitle as { text?: string })?.text ?? ""
              }
              onChange={(e) =>
                setCoverConfig({
                  ...coverConfig,
                  subtitle: e.target.value,
                })
              }
              placeholder="e.g. We're getting married!"
            />

            {/* Logo Section */}
            <div className="border-t border-dash-border pt-4">
              <h3 className="mb-3 text-sm font-semibold text-dash-text">
                Logo
              </h3>
              <ImageUpload
                bucket="event-assets"
                pathPrefix={`events/${eventId}/logo`}
                value={logoConfig.src}
                onChange={(src) =>
                  setLogoConfig({ ...logoConfig, src })
                }
                label="Logo Image"
                aspectRatio="1/1"
              />

              <div className="mt-4">
                <RangeInput
                  label="Logo Size"
                  value={logoConfig.size}
                  onChange={(v) =>
                    setLogoConfig({ ...logoConfig, size: v })
                  }
                  min={40}
                  max={300}
                  step={10}
                />
              </div>

              <div className="mt-4">
                <FormField label="Logo Alignment">
                  <div className="flex gap-2">
                    {(["left", "center", "right"] as const).map((a) => (
                      <Button
                        key={a}
                        variant={
                          logoConfig.align === a ? "primary" : "secondary"
                        }
                        size="sm"
                        onClick={() =>
                          setLogoConfig({ ...logoConfig, align: a })
                        }
                      >
                        {a.charAt(0).toUpperCase() + a.slice(1)}
                      </Button>
                    ))}
                  </div>
                </FormField>
              </div>
            </div>
          </div>
        }
        preview={
          <div className="relative">
            {/* Logo preview overlay */}
            {logoConfig.src && (
              <div
                className={cn(
                  "absolute z-20 p-4",
                  logoConfig.align === "left" && "left-0",
                  logoConfig.align === "center" && "left-1/2 -translate-x-1/2",
                  logoConfig.align === "right" && "right-0"
                )}
              >
                <img
                  src={logoConfig.src}
                  alt="Logo"
                  style={{
                    width: `${logoConfig.size}px`,
                    height: "auto",
                  }}
                />
              </div>
            )}
            <CoverPreview
              coverImage={coverImage}
              coverConfig={coverConfig as unknown as Json}
              name={event.draft_name || event.name}
              eventType={event.draft_event_type || event.event_type}
              eventDate={event.draft_event_date}
              eventTime={event.draft_event_time}
              venue={event.draft_venue}
            />
          </div>
        }
      />
    </div>
  );
}
