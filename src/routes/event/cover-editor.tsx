import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { CoverPreview } from "../../components/preview/PreviewRenderers";
import type { CoverConfig, LogoConfig } from "../../components/preview/PreviewRenderers";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { TypographyControls } from "../../components/ui/TypographyControls";
import { Button, RangeInput, ColorInput, Select, Toggle } from "../../components/ui";
import type { TypographyStyle } from "../../lib/typography";
import type { Json } from "../../lib/supabase";

function toCoverConfig(raw: Json): CoverConfig {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  return raw as CoverConfig;
}

function toLogoConfig(raw: Json): LogoConfig {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  return raw as LogoConfig;
}

export function CoverEditor() {
  const { event, eventId } = useOutletContext<{ event: UserEvent; eventId: string }>();
  const queryClient = useQueryClient();

  const [config, setConfig] = useState<CoverConfig>(() => toCoverConfig(event.draft_cover_config ?? event.cover_config));
  const [logo, setLogo] = useState<LogoConfig>(() => toLogoConfig(event.draft_logo_config ?? event.logo_config));
  const [saved, setSaved] = useState(false);

  function updateBg(patch: Partial<NonNullable<CoverConfig["background"]>>) {
    setConfig((c) => ({ ...c, background: { ...c.background, ...patch } }));
  }

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("user_events")
        .update({ draft_cover_config: config as Json, draft_logo_config: logo as Json })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const editor = (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-dash-text">Cover Page</h2>

      {/* Background */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-dash-text uppercase tracking-wide">Background</h3>
        <ImageUpload
          label="Background Image"
          value={config.background?.image ?? null}
          onChange={(url) => updateBg({ image: url })}
        />
        <ColorInput
          label="Background Colour"
          value={config.background?.color ?? "#ffffff"}
          onChange={(v) => updateBg({ color: v })}
        />
        <Select
          label="Image Position"
          value={config.background?.position ?? "center"}
          onChange={(e) => updateBg({ position: e.target.value })}
        >
          {["center", "top", "bottom", "left", "right"].map((p) => (
            <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
          ))}
        </Select>
        <Select
          label="Image Fit"
          value={config.background?.fit ?? "cover"}
          onChange={(e) => updateBg({ fit: e.target.value })}
        >
          <option value="cover">Cover</option>
          <option value="contain">Contain</option>
          <option value="fill">Fill</option>
        </Select>
        {config.background?.image && (
          <RangeInput
            label="Overlay Opacity"
            value={typeof config.overlayOpacity === "number" ? config.overlayOpacity : 30}
            onChange={(v) => setConfig((c) => ({ ...c, overlayOpacity: v }))}
            min={0}
            max={90}
            unit="%"
          />
        )}
      </section>

      {/* Logo */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-dash-text uppercase tracking-wide">Logo</h3>
        <ImageUpload
          label="Logo Image"
          value={logo.url ?? null}
          onChange={(url) => setLogo((l) => ({ ...l, url: url ?? undefined }))}
        />
        {logo.url && (
          <>
            <RangeInput
              label="Logo Size"
              value={typeof logo.size === "number" ? logo.size : 120}
              onChange={(v) => setLogo((l) => ({ ...l, size: v }))}
              min={40}
              max={400}
              unit="px"
            />
            <div>
              <label className="block text-sm font-medium text-dash-text mb-1">Logo Alignment</label>
              <div className="flex gap-2">
                {(["left", "center", "right"] as const).map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setLogo((l) => ({ ...l, align: a }))}
                    className={`flex-1 rounded border py-1.5 text-sm transition-colors ${
                      (logo.align ?? "center") === a
                        ? "border-dash-primary bg-dash-primary text-white"
                        : "border-dash-border bg-dash-surface text-dash-text hover:border-dash-primary/50"
                    }`}
                  >
                    {a.charAt(0).toUpperCase() + a.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </section>

      {/* Typography */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-dash-text uppercase tracking-wide">Eyebrow Text</h3>
        <TypographyControls
          value={(config.eyebrow as TypographyStyle) ?? {}}
          onChange={(v) => setConfig((c) => ({ ...c, eyebrow: v }))}
          showText
        />
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-dash-text uppercase tracking-wide">Heading</h3>
        <TypographyControls
          value={(config.heading as TypographyStyle) ?? {}}
          onChange={(v) => setConfig((c) => ({ ...c, heading: v }))}
          showText
        />
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-dash-text uppercase tracking-wide">Subheading</h3>
        <TypographyControls
          value={(config.subheading as TypographyStyle) ?? {}}
          onChange={(v) => setConfig((c) => ({ ...c, subheading: v }))}
          showText
        />
      </section>

      {/* CTA */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-dash-text uppercase tracking-wide">Button Label</h3>
        <input
          type="text"
          value={config.ctaText ?? ""}
          onChange={(e) => setConfig((c) => ({ ...c, ctaText: e.target.value }))}
          placeholder="Enter"
          className="w-full rounded-md border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text focus:outline-none focus:ring-2 focus:ring-dash-primary/50"
        />
      </section>

      <Button
        onClick={() => mutation.mutate()}
        loading={mutation.isPending}
        className="w-full"
      >
        {saved ? "Saved!" : "Save changes"}
      </Button>
    </div>
  );

  const preview = (
    <div className="w-full max-w-sm rounded-xl overflow-hidden border border-dash-border shadow-lg" style={{ minHeight: 480, backgroundColor: "var(--event-bg)" }}>
      <CoverPreview config={config} logo={logo} />
    </div>
  );

  return <SplitEditor editor={editor} preview={preview} />;
}
