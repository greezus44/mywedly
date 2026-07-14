import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { CoverPreview } from "../../components/preview/PreviewRenderers";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { Input } from "../../components/ui";
import { Button } from "../../components/ui/Button";

type CoverConfig = {
  heading?: string;
  subheading?: string;
  layout?: "centered" | "split" | "minimal";
};

function parseConfig(json: unknown): CoverConfig {
  if (!json || typeof json !== "object") return {};
  return (json as Record<string, unknown>) as CoverConfig;
}

export default function CoverEditor() {
  const { event, eventId } = useEventContext();
  const queryClient = useQueryClient();

  const existingConfig = parseConfig(event.draft_cover_config ?? event.cover_config);
  const [coverImage, setCoverImage] = useState<string | null>(
    event.draft_cover_image ?? event.cover_image
  );
  const [heading, setHeading] = useState(existingConfig.heading ?? event.name ?? "");
  const [subheading, setSubheading] = useState(existingConfig.subheading ?? "");
  const [layout, setLayout] = useState<CoverConfig["layout"]>(
    existingConfig.layout ?? "centered"
  );
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const config: CoverConfig = { heading, subheading, layout };
      const { error } = await supabase
        .from("user_events")
        .update({
          draft_cover_image: coverImage,
          draft_cover_config: config,
          updated_at: new Date().toISOString(),
        })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      setSavedMsg("Saved successfully!");
      setTimeout(() => setSavedMsg(null), 3000);
    },
  });

  // Build a preview event with draft values
  const previewEvent = {
    ...event,
    cover_image: coverImage,
    cover_config: { heading, subheading, layout },
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-dash-text">Cover Editor</h1>
          <p className="text-sm text-dash-muted">Customize the cover page of your website.</p>
        </div>
        <div className="flex items-center gap-3">
          {savedMsg && (
            <span className="text-sm text-green-600">{savedMsg}</span>
          )}
          <Button
            loading={saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
          >
            Save Changes
          </Button>
        </div>
      </div>

      {saveMutation.isError && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-dash-danger">
          {saveMutation.error?.message}
        </p>
      )}

      <SplitEditor
        editor={
          <div className="flex flex-col gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-dash-text">
                Cover Image
              </label>
              <ImageUpload
                value={coverImage}
                onChange={setCoverImage}
                eventId={eventId}
                aspect="wide"
              />
            </div>

            <Input
              label="Heading"
              value={heading}
              onChange={(e) => setHeading(e.target.value)}
              placeholder={event.name || "Our Wedding"}
            />

            <Input
              label="Subheading"
              value={subheading}
              onChange={(e) => setSubheading(e.target.value)}
              placeholder="e.g. June 15, 2025"
            />

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-dash-text">Layout</label>
              <div className="flex gap-2">
                {(["centered", "split", "minimal"] as const).map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setLayout(l)}
                    className={`rounded-md border px-3 py-1.5 text-sm capitalize transition-colors ${
                      layout === l
                        ? "border-dash-primary bg-dash-primary text-dash-primary-fg"
                        : "border-dash-border bg-dash-surface text-dash-text hover:border-dash-primary/50"
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </div>
        }
        preview={<CoverPreview event={previewEvent} />}
      />
    </div>
  );
}
