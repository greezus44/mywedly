import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Json } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { CoverPreview } from "../../components/preview/PreviewRenderers";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { Button } from "../../components/ui/Button";
import { Input, RangeInput, Card, LoadingSpinner } from "../../components/ui";
import { cn } from "../../lib/utils";

interface LogoConfig {
  url: string | null;
  size: number;
  align: "left" | "center" | "right";
}

interface CoverConfig {
  title?: string;
  subtitle?: string;
  date?: string;
  venue?: string;
  coverImage?: string;
}

const DEFAULT_LOGO: LogoConfig = { url: null, size: 120, align: "center" };

export function CoverEditor() {
  const { event, eventId } = useEventContext();
  const queryClient = useQueryClient();

  const [logoConfig, setLogoConfig] = useState<LogoConfig>(DEFAULT_LOGO);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [coverConfig, setCoverConfig] = useState<CoverConfig>({});

  useEffect(() => {
    const storedLogo = (event.draft_logo_config ?? event.logo_config ?? {}) as Record<string, unknown>;
    setLogoConfig({
      url: (storedLogo.url as string) ?? null,
      size: (storedLogo.size as number) ?? 120,
      align: (storedLogo.align as "left" | "center" | "right") ?? "center",
    });
    setCoverImage(event.draft_cover_image ?? event.cover_image ?? null);
    setCoverConfig(
      (event.draft_cover_config ?? event.cover_config ?? {}) as CoverConfig
    );
  }, [event]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("user_events")
        .update({
          draft_logo_config: logoConfig as unknown as Json,
          draft_cover_image: coverImage,
          draft_cover_config: coverConfig as unknown as Json,
        })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
    },
  });

  const alignments: { value: "left" | "center" | "right"; label: string }[] = [
    { value: "left", label: "Left" },
    { value: "center", label: "Center" },
    { value: "right", label: "Right" },
  ];

  const editor = (
    <div className="p-4 space-y-6">
      {/* Logo section */}
      <div>
        <h3 className="text-sm font-semibold text-dash-text mb-3">Logo</h3>
        <ImageUpload
          value={logoConfig.url}
          onChange={(url) => setLogoConfig({ ...logoConfig, url })}
          pathPrefix={`events/${eventId}/logo`}
          aspectRatio="square"
          label="Upload logo"
        />
        {logoConfig.url && (
          <>
            <div className="mt-3">
              <RangeInput
                label="Logo size"
                value={logoConfig.size}
                onChange={(size) => setLogoConfig({ ...logoConfig, size })}
                min={40}
                max={300}
                step={10}
              />
            </div>
            <div className="mt-3">
              <label className="block text-sm font-medium text-dash-text mb-1">
                Alignment
              </label>
              <div className="flex gap-1">
                {alignments.map((align) => (
                  <button
                    key={align.value}
                    type="button"
                    onClick={() => setLogoConfig({ ...logoConfig, align: align.value })}
                    className={cn(
                      "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                      logoConfig.align === align.value
                        ? "bg-dash-primary text-dash-primary-fg"
                        : "bg-dash-bg text-dash-text hover:bg-dash-border"
                    )}
                  >
                    {align.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Cover image */}
      <div>
        <h3 className="text-sm font-semibold text-dash-text mb-3">Cover Image</h3>
        <ImageUpload
          value={coverImage}
          onChange={(url) => setCoverImage(url)}
          pathPrefix={`events/${eventId}/cover`}
          aspectRatio="wide"
          label="Upload cover image"
        />
      </div>

      {/* Cover text */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-dash-text">Cover Text</h3>
        <Input
          label="Title"
          type="text"
          value={coverConfig.title ?? ""}
          onChange={(e) => setCoverConfig({ ...coverConfig, title: e.target.value })}
          placeholder="Our Wedding"
        />
        <Input
          label="Subtitle"
          type="text"
          value={coverConfig.subtitle ?? ""}
          onChange={(e) => setCoverConfig({ ...coverConfig, subtitle: e.target.value })}
          placeholder="We're getting married"
        />
        <Input
          label="Date"
          type="text"
          value={coverConfig.date ?? ""}
          onChange={(e) => setCoverConfig({ ...coverConfig, date: e.target.value })}
          placeholder="December 31, 2025"
        />
        <Input
          label="Venue"
          type="text"
          value={coverConfig.venue ?? ""}
          onChange={(e) => setCoverConfig({ ...coverConfig, venue: e.target.value })}
          placeholder="Garden Venue"
        />
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-dash-border">
        {saveMutation.isError && (
          <p className="text-sm text-dash-danger">
            {saveMutation.error instanceof Error ? saveMutation.error.message : "Save failed"}
          </p>
        )}
        {saveMutation.isSuccess && (
          <p className="text-sm text-green-600">Saved!</p>
        )}
        <Button
          onClick={() => saveMutation.mutate()}
          loading={saveMutation.isPending}
          className="ml-auto"
        >
          Save changes
        </Button>
      </div>
    </div>
  );

  const preview = (
    <div className="p-4">
      <Card className="overflow-hidden">
        <CoverPreview
          config={{ ...coverConfig, coverImage } as unknown as Json}
        />
      </Card>
      {logoConfig.url && (
        <div className="mt-4 flex justify-center">
          <img
            src={logoConfig.url}
            alt="Logo"
            style={{
              width: `${logoConfig.size}px`,
              height: "auto",
            }}
            className={cn(
              logoConfig.align === "left" && "mr-auto",
              logoConfig.align === "right" && "ml-auto",
              logoConfig.align === "center" && "mx-auto",
            )}
          />
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-dash-text">Cover Editor</h2>
          <p className="text-sm text-dash-muted">
            Customize the cover page of your invitation website
          </p>
        </div>
      </div>
      {saveMutation.isPending && (
        <div className="flex items-center gap-2 text-sm text-dash-muted">
          <LoadingSpinner className="h-4 w-4" /> Saving...
        </div>
      )}
      <div className="h-[calc(100vh-220px)] min-h-[500px]">
        <SplitEditor editor={editor} preview={preview} />
      </div>
    </div>
  );
}
