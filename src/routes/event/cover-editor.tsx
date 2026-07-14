import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase, type UserEvent, type Json } from "../../lib/supabase";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { CoverPreview } from "../../components/preview/PreviewRenderers";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Input";
import { RangeInput, FormField } from "../../components/ui";
import { cn } from "../../lib/utils";

interface LogoConfig {
  url: string | null;
  size: number;
  align: "left" | "center" | "right";
}

interface CoverConfig {
  overlayColor: string;
  overlayOpacity: number;
}

const DEFAULT_LOGO: LogoConfig = { url: null, size: 120, align: "center" };
const DEFAULT_COVER: CoverConfig = { overlayColor: "#000000", overlayOpacity: 0.3 };

function parseJson<T>(json: Json | null | undefined, fallback: T): T {
  if (!json || typeof json !== "object" || Array.isArray(json)) return fallback;
  return json as unknown as T;
}

export function CoverEditor() {
  const { event, eventId } = useOutletContext<{ event: UserEvent; eventId: string }>();
  const queryClient = useQueryClient();

  const [coverImage, setCoverImage] = useState(event.draft_cover_image);
  const [logoConfig, setLogoConfig] = useState<LogoConfig>(
    parseJson(event.draft_logo_config, DEFAULT_LOGO),
  );
  const [coverConfig, setCoverConfig] = useState<CoverConfig>(
    parseJson(event.draft_cover_config, DEFAULT_COVER),
  );
  const [coverName, setCoverName] = useState("");
  const [coverDate, setCoverDate] = useState("");
  const [coverVenue, setCoverVenue] = useState("");
  const [savedMsg, setSavedMsg] = useState(false);

  // Load content fields
  useEffect(() => {
    const content = parseJson<Record<string, unknown>>(event.draft_content, {});
    setCoverName((content.coverName as string) ?? "");
    setCoverDate((content.coverDate as string) ?? "");
    setCoverVenue((content.coverVenue as string) ?? "");
  }, [event.draft_content]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const content = parseJson<Record<string, unknown>>(event.draft_content, {});
      content.coverName = coverName;
      content.coverDate = coverDate;
      content.coverVenue = coverVenue;

      const { error } = await supabase
        .from("user_events")
        .update({
          draft_cover_image: coverImage,
          draft_logo_config: logoConfig as unknown as Json,
          draft_cover_config: coverConfig as unknown as Json,
          draft_content: content as unknown as Json,
        })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 2000);
    },
  });

  const previewEvent = {
    name: event.draft_name,
    event_type: event.draft_event_type,
    event_date: event.draft_event_date,
    event_time: event.draft_event_time,
    venue: event.draft_venue,
    address: event.draft_address,
    cover_image: coverImage,
    cover_config: coverConfig as unknown as Json,
    content: {
      coverName,
      coverDate,
      coverVenue,
    } as unknown as Json,
  };

  return (
    <SplitEditor
      editor={
        <div className="p-5 space-y-5">
          <h2 className="text-lg font-semibold text-dash-text">Cover Editor</h2>

          {/* Cover Image */}
          <FormField label="Cover Image">
            <ImageUpload
              value={coverImage}
              onChange={(url) => setCoverImage(url)}
              bucket="event-assets"
              path={`events/${eventId}/cover`}
              label=""
            />
          </FormField>

          {/* Overlay */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-dash-text">Overlay</h3>
            <div className="flex items-center gap-2">
              <span className="text-sm text-dash-text">Color</span>
              <input
                type="color"
                value={coverConfig.overlayColor}
                onChange={(e) =>
                  setCoverConfig({ ...coverConfig, overlayColor: e.target.value })
                }
                className="h-9 w-12 cursor-pointer rounded border border-dash-border bg-dash-surface p-0.5"
              />
              <RangeInput
                value={coverConfig.overlayOpacity}
                min={0}
                max={1}
                step={0.05}
                label="Opacity"
                onChange={(v) => setCoverConfig({ ...coverConfig, overlayOpacity: v })}
              />
            </div>
          </div>

          {/* Logo */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-dash-text">Logo</h3>
            <ImageUpload
              value={logoConfig.url}
              onChange={(url) => setLogoConfig({ ...logoConfig, url })}
              bucket="event-assets"
              path={`events/${eventId}/logo`}
              label="Logo Image"
            />
            <RangeInput
              value={logoConfig.size}
              min={40}
              max={300}
              step={5}
              label="Logo Size (px)"
              onChange={(v) => setLogoConfig({ ...logoConfig, size: v })}
            />
            <div>
              <span className="text-sm font-medium text-dash-text">Alignment</span>
              <div className="flex gap-2 mt-1.5">
                {(["left", "center", "right"] as const).map((align) => (
                  <button
                    key={align}
                    type="button"
                    onClick={() => setLogoConfig({ ...logoConfig, align })}
                    className={cn(
                      "px-3 py-1.5 text-sm rounded-md border transition-colors capitalize",
                      logoConfig.align === align
                        ? "bg-dash-primary text-dash-primary-fg border-transparent"
                        : "bg-dash-surface text-dash-text border-dash-border hover:bg-dash-bg",
                    )}
                  >
                    {align}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Cover Text */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-dash-text">Cover Text</h3>
            <Input
              label="Title Override"
              value={coverName}
              onChange={(e) => setCoverName(e.target.value)}
              placeholder="Uses event name if empty"
            />
            <Input
              label="Date Override"
              value={coverDate}
              onChange={(e) => setCoverDate(e.target.value)}
              placeholder="Uses event date if empty"
            />
            <Input
              label="Venue Override"
              value={coverVenue}
              onChange={(e) => setCoverVenue(e.target.value)}
              placeholder="Uses event venue if empty"
            />
          </div>

          {/* Save */}
          <div className="flex items-center gap-3 pt-2">
            <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>
              Save Changes
            </Button>
            {saveMutation.isError && (
              <span className="text-sm text-dash-danger">
                {saveMutation.error instanceof Error ? saveMutation.error.message : "Save failed"}
              </span>
            )}
            {savedMsg && <span className="text-sm text-green-600">Saved!</span>}
          </div>
        </div>
      }
      preview={
        <div className="p-5">
          {logoConfig.url && (
            <div
              className="mb-4 flex"
              style={{ justifyContent: logoConfig.align }}
            >
              <img
                src={logoConfig.url}
                alt="Logo"
                style={{ width: `${logoConfig.size}px`, height: "auto" }}
              />
            </div>
          )}
          <CoverPreview event={previewEvent} />
        </div>
      }
    />
  );
}
