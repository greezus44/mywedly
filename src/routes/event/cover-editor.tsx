import { useState, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type Json } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Card, LoadingSpinner, ErrorState } from "../../components/ui";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { EventThemeProvider } from "../../lib/theme-context";
import { jsonToTheme, DEFAULT_THEME, HEADING_FONT_OPTIONS, RICH_FONT_OPTIONS, type ThemeConfig } from "../../lib/theme";
import { cn, formatDate } from "../../lib/utils";
import { uploadImage, removeImage, extractPathFromUrl } from "../../lib/upload";

// === Cover config types ===
interface TextStyle {
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  color: string;
  letterSpacing: number;
  lineHeight: number;
  align: "left" | "center" | "right";
}

interface LogoConfig {
  url: string | null;
  size: "sm" | "md" | "lg";
  align: "left" | "center" | "right";
}

interface BackgroundConfig {
  image: string | null;
  color: string;
  overlayOpacity: number;
  position: "top" | "center" | "bottom";
  fit: "cover" | "contain" | "fill";
}

interface ButtonConfig {
  text: string;
  fontSize: number;
  color: string;
}

interface CoverConfig {
  title: TextStyle;
  subtitle: TextStyle;
  body: TextStyle;
  dateLocation: TextStyle;
  button: ButtonConfig;
  logo: LogoConfig;
  background: BackgroundConfig;
}

type DevicePreview = "mobile" | "tablet" | "desktop";

// === Defaults from theme ===
function defaultCoverConfig(theme: ThemeConfig): CoverConfig {
  return {
    logo: { url: null, size: "md", align: "center" },
    title: {
      text: "", fontFamily: theme.fontHeading, fontSize: 48, fontWeight: 700,
      color: "#ffffff", letterSpacing: 0, lineHeight: 1.2, align: "center",
    },
    subtitle: {
      text: "", fontFamily: theme.fontBody, fontSize: 20, fontWeight: 400,
      color: "#ffffff", letterSpacing: 0, lineHeight: 1.5, align: "center",
    },
    body: {
      text: "", fontFamily: theme.fontBody, fontSize: 16, fontWeight: 400,
      color: "#ffffff", letterSpacing: 0, lineHeight: 1.7, align: "center",
    },
    dateLocation: {
      text: "", fontFamily: theme.fontBody, fontSize: 18, fontWeight: 500,
      color: "#ffffff", letterSpacing: 0.05, lineHeight: 1.5, align: "center",
    },
    button: { text: "Open Invitation", fontSize: 14, color: "#ffffff" },
    background: {
      image: null, color: theme.bg, overlayOpacity: 0.3, position: "center", fit: "cover",
    },
  };
}

function parseCoverConfig(raw: Json | null, theme: ThemeConfig): CoverConfig {
  const defaults = defaultCoverConfig(theme);
  if (!raw || typeof raw !== "object") return defaults;
  const r = raw as Record<string, unknown>;
  const merge = <T,>(key: string, def: T): T => ({ ...def, ...((r[key] as Record<string, unknown>) || {}) }) as T;
  return {
    logo: merge("logo", defaults.logo),
    title: merge("title", defaults.title),
    subtitle: merge("subtitle", defaults.subtitle),
    body: merge("body", defaults.body),
    dateLocation: merge("dateLocation", defaults.dateLocation),
    button: merge("button", defaults.button),
    background: merge("background", defaults.background),
  };
}

// === Collapsible Section ===
function Section({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-dash-border">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-dash-text hover:bg-dash-bg"
      >
        {title}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={cn("transition-transform", open && "rotate-180")}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && <div className="px-4 pb-4 pt-1 space-y-3">{children}</div>}
    </div>
  );
}

// === Typography controls ===
function TextControls({ label, value, onChange, theme }: { label: string; value: TextStyle; onChange: (v: TextStyle) => void; theme: ThemeConfig }) {
  return (
    <>
      <div>
        <label className="mb-1 block text-xs font-medium text-dash-muted">{label} Text</label>
        <input
          type="text"
          value={value.text}
          onChange={(e) => onChange({ ...value, text: e.target.value })}
          className="w-full rounded-lg border border-dash-border px-3 py-2 text-sm outline-none focus:border-dash-primary"
          placeholder={`Enter ${label.toLowerCase()} text...`}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-dash-muted">Font</label>
          <select
            value={value.fontFamily}
            onChange={(e) => onChange({ ...value, fontFamily: e.target.value })}
            className="w-full rounded-lg border border-dash-border px-2 py-2 text-sm outline-none focus:border-dash-primary"
          >
            <optgroup label="Heading Fonts">
              {HEADING_FONT_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
            </optgroup>
            <optgroup label="Body Fonts">
              {RICH_FONT_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
            </optgroup>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-dash-muted">Weight</label>
          <select
            value={value.fontWeight}
            onChange={(e) => onChange({ ...value, fontWeight: parseInt(e.target.value) })}
            className="w-full rounded-lg border border-dash-border px-2 py-2 text-sm outline-none focus:border-dash-primary"
          >
            <option value={300}>Light (300)</option>
            <option value={400}>Regular (400)</option>
            <option value={500}>Medium (500)</option>
            <option value={600}>Semibold (600)</option>
            <option value={700}>Bold (700)</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-dash-muted">Size: {value.fontSize}px</label>
          <input type="range" min={10} max={80} value={value.fontSize} onChange={(e) => onChange({ ...value, fontSize: parseInt(e.target.value) })} className="w-full accent-dash-primary" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-dash-muted">Letter Spacing: {value.letterSpacing}em</label>
          <input type="range" min={-0.05} max={0.3} step={0.01} value={value.letterSpacing} onChange={(e) => onChange({ ...value, letterSpacing: parseFloat(e.target.value) })} className="w-full accent-dash-primary" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-dash-muted">Line Height: {value.lineHeight}</label>
          <input type="range" min={1} max={2.5} step={0.1} value={value.lineHeight} onChange={(e) => onChange({ ...value, lineHeight: parseFloat(e.target.value) })} className="w-full accent-dash-primary" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-dash-muted">Colour</label>
          <input type="color" value={value.color} onChange={(e) => onChange({ ...value, color: e.target.value })} className="h-9 w-full rounded-lg border border-dash-border" />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-dash-muted">Alignment</label>
        <div className="flex gap-2">
          {(["left", "center", "right"] as const).map((a) => (
            <button
              key={a}
              onClick={() => onChange({ ...value, align: a })}
              className={cn("flex-1 rounded-lg border py-1.5 text-xs font-medium capitalize transition-colors", value.align === a ? "border-dash-primary bg-dash-primary text-dash-primary-fg" : "border-dash-border text-dash-muted hover:border-dash-primary")}
            >
              {a}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

// === Alignment buttons ===
function AlignmentButtons({ value, onChange }: { value: "left" | "center" | "right"; onChange: (v: "left" | "center" | "right") => void }) {
  return (
    <div className="flex gap-2">
      {(["left", "center", "right"] as const).map((a) => (
        <button key={a} onClick={() => onChange(a)} className={cn("flex-1 rounded-lg border py-1.5 text-xs font-medium capitalize transition-colors", value === a ? "border-dash-primary bg-dash-primary text-dash-primary-fg" : "border-dash-border text-dash-muted hover:border-dash-primary")}>
          {a}
        </button>
      ))}
    </div>
  );
}

// === Live Preview ===
function CoverPreview({ config, event, device }: { config: CoverConfig; event: UserEvent; device: DevicePreview }) {
  const theme = jsonToTheme(event.theme);
  const bgStyle: React.CSSProperties = {};
  if (config.background.image) {
    bgStyle.backgroundImage = `url(${config.background.image})`;
    bgStyle.backgroundSize = config.background.fit === "fill" ? "100% 100%" : config.background.fit;
    bgStyle.backgroundPosition = config.background.position;
    bgStyle.backgroundRepeat = "no-repeat";
  } else {
    bgStyle.backgroundColor = config.background.color;
  }

  const logoHeight = config.logo.size === "sm" ? 40 : config.logo.size === "lg" ? 80 : 60;

  const textStyle = (ts: TextStyle): React.CSSProperties => ({
    fontFamily: ts.fontFamily,
    fontSize: `${ts.fontSize}px`,
    fontWeight: ts.fontWeight,
    color: ts.color,
    letterSpacing: `${ts.letterSpacing}em`,
    lineHeight: ts.lineHeight,
    textAlign: ts.align,
  });

  const deviceWidth = device === "mobile" ? 375 : device === "tablet" ? 768 : 1280;
  const deviceHeight = device === "mobile" ? 667 : device === "tablet" ? 1024 : 800;

  return (
    <div className="flex justify-center">
      <div
        className="relative overflow-hidden rounded-xl border-2 border-dash-border shadow-lg"
        style={{ width: deviceWidth > 800 ? "100%" : deviceWidth, maxWidth: "100%", height: deviceHeight > 600 ? 600 : deviceHeight, ...bgStyle }}
      >
        {config.background.image && (
          <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${config.background.overlayOpacity})` }} />
        )}
        <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 py-8" style={{ justifyContent: "center" }}>
          {config.logo.url && (
            <div className="mb-6 w-full flex" style={{ justifyContent: config.logo.align === "left" ? "flex-start" : config.logo.align === "right" ? "flex-end" : "center" }}>
              <img src={config.logo.url} alt="Logo" style={{ height: logoHeight, width: "auto" }} className="object-contain" />
            </div>
          )}
          {config.title.text && (
            <h1 className="mb-3" style={textStyle(config.title)}>{config.title.text}</h1>
          )}
          {config.subtitle.text && (
            <p className="mb-3" style={textStyle(config.subtitle)}>{config.subtitle.text}</p>
          )}
          {config.body.text && (
            <p className="mb-4 max-w-md" style={textStyle(config.body)}>{config.body.text}</p>
          )}
          {(event.event_date || event.venue) && (
            <div className="mb-6" style={textStyle(config.dateLocation)}>
              {event.event_date && <p>{formatDate(event.event_date)}</p>}
              {event.venue && <p>{event.venue}</p>}
            </div>
          )}
          {config.button.text && (
            <button
              className="rounded-lg px-6 py-3 font-semibold uppercase tracking-wide transition-all hover:opacity-90"
              style={{
                backgroundColor: theme.primary,
                color: config.button.color,
                fontSize: `${config.button.fontSize}px`,
                borderRadius: theme.radius,
              }}
            >
              {config.button.text}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// === Main Cover Editor ===
export default function CoverEditor() {
  const { event, eventId } = useOutletContext<{ event: UserEvent; eventId: string }>();
  const queryClient = useQueryClient();
  const theme = jsonToTheme(event.theme);

  const [config, setConfig] = useState<CoverConfig>(() => {
    const raw = event.draft_cover_config ?? event.cover_config;
    return parseCoverConfig(raw as Json | null, theme);
  });
  const [coverImage, setCoverImage] = useState<string | null>(event.draft_cover_image ?? event.cover_image);
  const [logoUrl, setLogoUrl] = useState<string | null>(((event.draft_logo_config ?? event.logo_config) as { url?: string } | null)?.url ?? null);
  const [device, setDevice] = useState<DevicePreview>("desktop");

  const update = <K extends keyof CoverConfig>(key: K, value: Partial<CoverConfig[K]>) => {
    setConfig((prev) => ({ ...prev, [key]: { ...prev[key], ...value } }));
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const logoConfig = { url: logoUrl, size: config.logo.size, align: config.logo.align };
      const coverConfig = { ...config, logo: { ...config.logo, url: logoUrl } };
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

  const handleLogoUpload = async (url: string | null) => {
    if (logoUrl) {
      const path = extractPathFromUrl(logoUrl);
      if (path) { try { await removeImage(path); } catch {} }
    }
    setLogoUrl(url);
    setConfig((prev) => ({ ...prev, logo: { ...prev.logo, url } }));
  };

  const handleBgUpload = async (url: string | null) => {
    if (coverImage) {
      const path = extractPathFromUrl(coverImage);
      if (path) { try { await removeImage(path); } catch {} }
    }
    setCoverImage(url);
    setConfig((prev) => ({ ...prev, background: { ...prev.background, image: url } }));
  };

  const previewEvent = useMemo(() => ({
    ...event,
    draft_cover_image: coverImage,
    draft_cover_config: config as unknown as Json,
    draft_logo_config: { url: logoUrl, size: config.logo.size, align: config.logo.align } as unknown as Json,
  }), [event, coverImage, config, logoUrl]);

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-dash-border bg-dash-surface px-4 py-3">
        <h1 className="text-lg font-bold text-dash-text">Cover Editor</h1>
        <div className="flex items-center gap-3">
          {/* Device toggle */}
          <div className="flex rounded-lg border border-dash-border p-0.5">
            {(["mobile", "tablet", "desktop"] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDevice(d)}
                className={cn("rounded px-2.5 py-1 text-xs font-medium capitalize transition-colors", device === d ? "bg-dash-primary text-dash-primary-fg" : "text-dash-muted hover:text-dash-text")}
              >
                {d}
              </button>
            ))}
          </div>
          <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending} size="sm">
            Save Changes
          </Button>
        </div>
      </div>

      {saveMutation.isError && (
        <div className="bg-red-50 px-4 py-2 text-sm text-red-600">Failed to save. Please try again.</div>
      )}
      {saveMutation.isSuccess && (
        <div className="bg-green-50 px-4 py-2 text-sm text-green-600">Saved successfully!</div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Editor panel */}
        <div className="w-[400px] shrink-0 overflow-y-auto border-r border-dash-border bg-dash-surface scrollbar-thin">
          <Section title="Logo" defaultOpen>
            <ImageUpload value={logoUrl} onChange={handleLogoUpload} eventId={eventId} label="Logo Image" />
            {logoUrl && (
              <>
                <div>
                  <label className="mb-1 block text-xs font-medium text-dash-muted">Size</label>
                  <div className="flex gap-2">
                    {(["sm", "md", "lg"] as const).map((s) => (
                      <button key={s} onClick={() => update("logo", { size: s })} className={cn("flex-1 rounded-lg border py-1.5 text-xs font-medium uppercase transition-colors", config.logo.size === s ? "border-dash-primary bg-dash-primary text-dash-primary-fg" : "border-dash-border text-dash-muted hover:border-dash-primary")}>
                        {s === "sm" ? "Small" : s === "md" ? "Medium" : "Large"}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-dash-muted">Alignment</label>
                  <AlignmentButtons value={config.logo.align} onChange={(align) => update("logo", { align })} />
                </div>
              </>
            )}
          </Section>

          <Section title="Background">
            <ImageUpload value={coverImage} onChange={handleBgUpload} eventId={eventId} label="Background Image" />
            <div>
              <label className="mb-1 block text-xs font-medium text-dash-muted">Background Colour (fallback)</label>
              <input type="color" value={config.background.color} onChange={(e) => update("background", { color: e.target.value })} className="h-9 w-full rounded-lg border border-dash-border" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-dash-muted">Overlay Opacity: {Math.round(config.background.overlayOpacity * 100)}%</label>
              <input type="range" min={0} max={0.8} step={0.05} value={config.background.overlayOpacity} onChange={(e) => update("background", { overlayOpacity: parseFloat(e.target.value) })} className="w-full accent-dash-primary" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-dash-muted">Position</label>
              <div className="flex gap-2">
                {(["top", "center", "bottom"] as const).map((p) => (
                  <button key={p} onClick={() => update("background", { position: p })} className={cn("flex-1 rounded-lg border py-1.5 text-xs font-medium capitalize transition-colors", config.background.position === p ? "border-dash-primary bg-dash-primary text-dash-primary-fg" : "border-dash-border text-dash-muted hover:border-dash-primary")}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-dash-muted">Fit</label>
              <div className="flex gap-2">
                {(["cover", "contain", "fill"] as const).map((f) => (
                  <button key={f} onClick={() => update("background", { fit: f })} className={cn("flex-1 rounded-lg border py-1.5 text-xs font-medium capitalize transition-colors", config.background.fit === f ? "border-dash-primary bg-dash-primary text-dash-primary-fg" : "border-dash-border text-dash-muted hover:border-dash-primary")}>
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </Section>

          <Section title="Title">
            <TextControls label="Title" value={config.title} onChange={(v) => update("title", v)} theme={theme} />
          </Section>

          <Section title="Subtitle">
            <TextControls label="Subtitle" value={config.subtitle} onChange={(v) => update("subtitle", v)} theme={theme} />
          </Section>

          <Section title="Body">
            <TextControls label="Body" value={config.body} onChange={(v) => update("body", v)} theme={theme} />
          </Section>

          <Section title="Date & Location">
            <p className="text-xs text-dash-muted">Date and location are pulled from your event settings. Customise their appearance below.</p>
            <div>
              <label className="mb-1 block text-xs font-medium text-dash-muted">Font</label>
              <select value={config.dateLocation.fontFamily} onChange={(e) => update("dateLocation", { fontFamily: e.target.value })} className="w-full rounded-lg border border-dash-border px-2 py-2 text-sm outline-none focus:border-dash-primary">
                <optgroup label="Heading Fonts">
                  {HEADING_FONT_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                </optgroup>
                <optgroup label="Body Fonts">
                  {RICH_FONT_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                </optgroup>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-dash-muted">Size: {config.dateLocation.fontSize}px</label>
                <input type="range" min={10} max={40} value={config.dateLocation.fontSize} onChange={(e) => update("dateLocation", { fontSize: parseInt(e.target.value) })} className="w-full accent-dash-primary" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-dash-muted">Colour</label>
                <input type="color" value={config.dateLocation.color} onChange={(e) => update("dateLocation", { color: e.target.value })} className="h-9 w-full rounded-lg border border-dash-border" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-dash-muted">Alignment</label>
              <AlignmentButtons value={config.dateLocation.align} onChange={(align) => update("dateLocation", { align })} />
            </div>
          </Section>

          <Section title="Button">
            <div>
              <label className="mb-1 block text-xs font-medium text-dash-muted">Button Text</label>
              <input type="text" value={config.button.text} onChange={(e) => update("button", { text: e.target.value })} className="w-full rounded-lg border border-dash-border px-3 py-2 text-sm outline-none focus:border-dash-primary" placeholder="Open Invitation" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-dash-muted">Size: {config.button.fontSize}px</label>
                <input type="range" min={10} max={24} value={config.button.fontSize} onChange={(e) => update("button", { fontSize: parseInt(e.target.value) })} className="w-full accent-dash-primary" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-dash-muted">Text Colour</label>
                <input type="color" value={config.button.color} onChange={(e) => update("button", { color: e.target.value })} className="h-9 w-full rounded-lg border border-dash-border" />
              </div>
            </div>
            <p className="text-xs text-dash-muted">Button background colour comes from the theme primary colour.</p>
          </Section>
        </div>

        {/* Preview panel */}
        <div className="flex-1 overflow-y-auto bg-dash-bg p-6 scrollbar-thin">
          <EventThemeProvider initialTheme={theme}>
            <CoverPreview config={config} event={previewEvent} device={device} />
          </EventThemeProvider>
        </div>
      </div>
    </div>
  );
}
