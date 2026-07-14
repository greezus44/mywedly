import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { type ThemeConfig, jsonToTheme, THEME_PRESETS, HEADING_FONT_OPTIONS, RICH_FONT_OPTIONS } from "../../lib/theme";
import { Button } from "../../components/ui/Button";
import { FontSelect } from "../../components/ui/FontSelect";
import { PreviewFrame, PreviewButton, PreviewHeading } from "../../components/preview/PreviewRenderers";

interface ColourFieldDef {
  key: keyof ThemeConfig;
  label: string;
  description: string;
}

const COLOUR_FIELDS: ColourFieldDef[] = [
  { key: "primary", label: "Main Colour", description: "Used for buttons, links, and key highlights across your site." },
  { key: "primaryHover", label: "Button Hover Colour", description: "The colour buttons turn when guests hover over them." },
  { key: "secondary", label: "Secondary Colour", description: "Used for secondary buttons, tags, and subtle backgrounds." },
  { key: "secondaryHover", label: "Secondary Hover Colour", description: "The colour secondary buttons turn when hovered over." },
  { key: "accent", label: "Accent Colour", description: "A highlight colour used for decorative elements and details." },
  { key: "background", label: "Background Colour", description: "The main background colour of your guest-facing pages." },
  { key: "surface", label: "Card / Surface Colour", description: "The background colour of cards and content panels." },
  { key: "text", label: "Text Colour", description: "The main text colour used throughout your site." },
  { key: "textMuted", label: "Muted Text Colour", description: "Used for secondary, lighter text like captions and labels." },
  { key: "border", label: "Border Colour", description: "The colour of borders and dividers between sections." },
];

export function ThemeEditor() {
  const { eventId } = useParams<{ eventId: string }>();
  const qc = useQueryClient();
  const [theme, setTheme] = useState<ThemeConfig | null>(null);
  const [saving, setSaving] = useState(false);

  const { data: event } = useQuery({
    queryKey: ["event", eventId],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_events").select("*").eq("id", eventId!).single();
      if (error) throw error;
      return data as UserEvent;
    },
    enabled: !!eventId,
  });

  useEffect(() => {
    if (event) {
      setTheme(jsonToTheme((event.draft_theme ?? event.theme) as Record<string, unknown> | null));
    }
  }, [event]);

  const save = async () => {
    if (!event || !theme) return;
    setSaving(true);
    const { error } = await supabase
      .from("user_events")
      .update({ draft_theme: theme as unknown as Record<string, unknown> })
      .eq("id", event.id);
    setSaving(false);
    if (!error) qc.invalidateQueries({ queryKey: ["event", eventId] });
  };

  if (!theme) return <div>Loading…</div>;

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="flex-1 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-1">Theme</h2>
          <p className="text-sm text-gray-500">Customise the colours and fonts for your wedding site.</p>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Quick Presets</h3>
          <div className="flex flex-wrap gap-2">
            {THEME_PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => setTheme({ ...theme, ...preset.theme } as ThemeConfig)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Colours</h3>
          <div className="space-y-4">
            {COLOUR_FIELDS.map((field) => (
              <div key={field.key} className="flex items-start gap-3">
                <div className="flex flex-col items-center gap-1">
                  <input
                    type="color"
                    value={theme[field.key] as string}
                    onChange={(e) => setTheme({ ...theme, [field.key]: e.target.value })}
                    className="w-10 h-10 rounded cursor-pointer border border-gray-300"
                  />
                  <input
                    type="text"
                    value={theme[field.key] as string}
                    onChange={(e) => setTheme({ ...theme, [field.key]: e.target.value })}
                    className="w-20 text-xs px-1 py-0.5 border border-gray-300 rounded text-center"
                  />
                </div>
                <div className="flex-1 pt-1">
                  <label className="block text-sm font-medium text-gray-700">{field.label}</label>
                  <p className="text-xs text-gray-400 mt-0.5">{field.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Fonts</h3>
          <div className="space-y-3">
            <FontSelect
              label="Heading Font"
              value={theme.headingFont}
              onChange={(v) => setTheme({ ...theme, headingFont: v })}
              options={HEADING_FONT_OPTIONS}
            />
            <FontSelect
              label="Body Text Font"
              value={theme.bodyFont}
              onChange={(v) => setTheme({ ...theme, bodyFont: v })}
              options={RICH_FONT_OPTIONS}
            />
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Button Style</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Corner Radius</label>
              <select
                value={theme.buttonRadius}
                onChange={(e) => setTheme({ ...theme, buttonRadius: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="0px">Sharp</option>
                <option value="4px">Slightly Rounded</option>
                <option value="8px">Rounded</option>
                <option value="16px">Very Rounded</option>
                <option value="9999px">Pill</option>
              </select>
            </div>
          </div>
        </div>

        <Button onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save Theme"}
        </Button>
      </div>

      <div className="w-full lg:w-96">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Live Preview</h3>
        <PreviewFrame theme={theme}>
          <div className="p-6 space-y-4">
            <PreviewHeading theme={theme}>Our Wedding</PreviewHeading>
            <p style={{ color: theme.textMuted, fontFamily: theme.bodyFont, fontSize: "0.875rem" }}>
              Join us as we celebrate our special day
            </p>
            <div style={{ borderTop: `1px solid ${theme.border}`, margin: "1rem 0" }} />
            <div style={{ backgroundColor: theme.surface, padding: "1rem", borderRadius: "8px", border: `1px solid ${theme.border}` }}>
              <p style={{ color: theme.text, fontFamily: theme.bodyFont, fontSize: "0.875rem" }}>
                Saturday, June 14, 2025 at 4:00 PM
              </p>
              <p style={{ color: theme.textMuted, fontFamily: theme.bodyFont, fontSize: "0.75rem", marginTop: "0.25rem" }}>
                Garden Venue, 123 Rose Lane
              </p>
            </div>
            <PreviewButton theme={theme}>RSVP Now</PreviewButton>
          </div>
        </PreviewFrame>
      </div>
    </div>
  );
}
