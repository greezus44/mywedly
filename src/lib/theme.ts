import type { ThemeConfig, CoverConfig, LogoConfig, LoginConfig, Wedding } from "./supabase";

export const DEFAULT_THEME: ThemeConfig = {
  primary: "#C9A961",
  secondary: "#F5E6D3",
  accent: "#8B6F47",
  bg: "#FFFBF5",
  surface: "#FFFFFF",
  text: "#2D2D2D",
  textMuted: "#8B8B8B",
  border: "#E5DDD5",
  buttonBg: "#C9A961",
  buttonText: "#FFFFFF",
  scriptFont: "Great Vibes",
  headingFont: "Playfair Display",
  bodyFont: "Montserrat",
  uiFont: "Inter",
  headingSize: "3rem",
  bodySize: "1rem",
  headingWeight: "600",
  bodyWeight: "400",
  letterSpacing: "0.02em",
};

export const DEFAULT_LOGO_CONFIG: LogoConfig = {
  url: null,
  visible: true,
  width: "120px",
  height: "auto",
  maintainAspectRatio: true,
  position: "top-center",
  offsetX: "0px",
  offsetY: "0px",
  margin: "0px",
  padding: "0px",
  responsive: {
    desktop: { width: "120px", height: "auto" },
    tablet: { width: "100px", height: "auto" },
    mobile: { width: "80px", height: "auto" },
  },
  opacity: 1,
  borderRadius: "0px",
  dropShadow: { enabled: false, blur: "4px", color: "rgba(0,0,0,0.15)", offsetX: "0px", offsetY: "2px" },
  glow: { enabled: false, color: "rgba(201,169,97,0.5)", blur: "8px" },
  rotation: 0,
  maxWidth: "300px",
  maxHeight: "200px",
  objectFit: "contain",
  showOnPages: "all-pages",
  customPages: [],
  showInNavbar: false,
};

export const DEFAULT_COVER_CONFIG: CoverConfig = {
  background: {
    type: "image",
    image_url: null,
    video_url: null,
    slideshow_urls: [],
    color: "#1a1a2e",
  },
  overlay: { enabled: true, color: "#000000", opacity: 0.4 },
  blur: "0px",
  brightness: 1,
  branding: {
    couple_name_one: "",
    couple_name_two: "",
    date: "",
    logo: { ...DEFAULT_LOGO_CONFIG },
  },
  typography: {
    heading_font: "Playfair Display",
    body_font: "Montserrat",
    heading_size: "3.5rem",
    body_size: "1.125rem",
    heading_color: "#FFFFFF",
    body_color: "#F5E6D3",
    heading_weight: "600",
    letter_spacing: "0.05em",
  },
  layout: {
    content_alignment: "center",
    vertical_position: "center",
    max_width: "800px",
    padding: "2rem",
  },
  button: {
    text: "Enter Website",
    bg_color: "#C9A961",
    text_color: "#FFFFFF",
    border_radius: "9999px",
    padding_x: "2.5rem",
    padding_y: "1rem",
  },
  corner_radius: "1rem",
  show_countdown: true,
  show_date: true,
  enter_button_text: "Enter Website",
};

export const DEFAULT_LOGIN_CONFIG: LoginConfig = {
  branding: {
    logo: { ...DEFAULT_LOGO_CONFIG, position: "top-center", width: "100px" },
  },
  text: {
    title: "Welcome",
    subtitle: "Please sign in to view the invitation",
    welcome_message: "Enter your name to continue",
    username_placeholder: "Enter your name",
    button_text: "Sign In",
    helper_text: "Use the name from your invitation",
    footer_message: "We can't wait to celebrate with you",
  },
  language: {
    enabled: true,
    default_lang: "en",
    labels: { en: "English", ms: "Bahasa Melayu" },
    order: ["en", "ms"],
  },
  background: {
    type: "image",
    image_url: null,
    video_url: null,
    color: "#1a1a2e",
  },
  overlay: { enabled: true, color: "#000000", opacity: 0.5 },
  blur: "0px",
  brightness: 1,
  theme: {
    primary: "#C9A961",
    secondary: "#F5E6D3",
    accent: "#8B6F47",
    text: "#FFFFFF",
    button_bg: "#C9A961",
    button_text: "#FFFFFF",
    input_bg: "rgba(255,255,255,0.08)",
    border: "rgba(255,255,255,0.15)",
  },
  typography: {
    heading_font: "Playfair Display",
    body_font: "Montserrat",
    heading_size: "2.5rem",
    body_size: "1rem",
    heading_weight: "600",
    body_weight: "400",
    letter_spacing: "0.03em",
  },
  form: {
    input: {
      width: "100%",
      height: "56px",
      border_radius: "12px",
      border_color: "rgba(255,255,255,0.2)",
      background: "rgba(255,255,255,0.08)",
      placeholder_color: "rgba(255,255,255,0.5)",
      focus_border_color: "#C9A961",
      shadow: "0 4px 12px rgba(0,0,0,0.1)",
      text_color: "#FFFFFF",
      font_size: "1rem",
      padding: "0.875rem 1.25rem",
    },
    button: {
      width: "100%",
      height: "56px",
      border_radius: "12px",
      bg_color: "#C9A961",
      text_color: "#FFFFFF",
      hover_bg_color: "#B8964F",
      shadow: "0 4px 14px rgba(201,169,97,0.3)",
      font_size: "1rem",
      font_weight: "600",
      loading_text: "Signing in...",
    },
    username_field: {
      show_label: false,
      label_text: "Your Name",
    },
  },
  layout: {
    content_alignment: "center",
    vertical_position: "center",
    max_width: "440px",
    spacing: "1.5rem",
    padding: "2.5rem",
    margin: "0 auto",
  },
  language_selector: {
    style: "segmented",
    button_radius: "10px",
    button_padding_x: "1.5rem",
    button_padding_y: "0.625rem",
    active_bg: "#C9A961",
    active_text: "#FFFFFF",
    inactive_bg: "transparent",
    inactive_text: "rgba(255,255,255,0.7)",
    border_color: "rgba(255,255,255,0.15)",
    font_size: "0.875rem",
    font_weight: "500",
  },
};

export interface ThemePreset {
  name: string;
  config: Partial<ThemeConfig>;
}

export const THEME_PRESETS: ThemePreset[] = [
  { name: "Classic Gold", config: { primary: "#C9A961", secondary: "#F5E6D3", accent: "#8B6F47", bg: "#FFFBF5", text: "#2D2D2D", buttonBg: "#C9A961", buttonText: "#FFFFFF" } },
  { name: "Elegant White", config: { primary: "#B0B0B0", secondary: "#F8F8F8", accent: "#8C8C8C", bg: "#FFFFFF", text: "#333333", buttonBg: "#333333", buttonText: "#FFFFFF" } },
  { name: "Champagne", config: { primary: "#D4AF7A", secondary: "#F7EEDD", accent: "#A0826D", bg: "#FFFDF7", text: "#4A3B2A", buttonBg: "#D4AF7A", buttonText: "#FFFFFF" } },
  { name: "Sage Green", config: { primary: "#8A9A7B", secondary: "#E8EDE3", accent: "#6B7B5A", bg: "#F5F8F2", text: "#3A4A30", buttonBg: "#8A9A7B", buttonText: "#FFFFFF" } },
  { name: "Dusty Blue", config: { primary: "#9DB4C0", secondary: "#E5EDF1", accent: "#7A99A8", bg: "#F4F8FA", text: "#3A4B55", buttonBg: "#9DB4C0", buttonText: "#FFFFFF" } },
  { name: "Blush Pink", config: { primary: "#D4A5A5", secondary: "#F5E6E6", accent: "#B08585", bg: "#FFF7F7", text: "#5A3D3D", buttonBg: "#D4A5A5", buttonText: "#FFFFFF" } },
  { name: "Terracotta", config: { primary: "#C17B50", secondary: "#F0DDD0", accent: "#A0653E", bg: "#FBF3EE", text: "#4A3528", buttonBg: "#C17B50", buttonText: "#FFFFFF" } },
  { name: "Emerald", config: { primary: "#2D6A4F", secondary: "#D8E8DE", accent: "#1B4332", bg: "#F0F7F4", text: "#1B3328", buttonBg: "#2D6A4F", buttonText: "#FFFFFF" } },
  { name: "Midnight Black", config: { primary: "#1A1A1A", secondary: "#2A2A2A", accent: "#C9A961", bg: "#0A0A0A", text: "#F5F5F5", buttonBg: "#C9A961", buttonText: "#0A0A0A" } },
  { name: "Garden Wedding", config: { primary: "#6B8E23", secondary: "#F0F7E6", accent: "#556B2F", bg: "#F8FBF2", text: "#3A4A20", buttonBg: "#6B8E23", buttonText: "#FFFFFF" } },
  { name: "Modern Minimal", config: { primary: "#4A4A4A", secondary: "#EEEEEE", accent: "#2D2D2D", bg: "#FAFAFA", text: "#2D2D2D", buttonBg: "#2D2D2D", buttonText: "#FFFFFF" } },
];

export const FONT_OPTIONS = [
  "Playfair Display", "Cormorant Garamond", "Cormorant", "EB Garamond", "Cinzel",
  "Marcellus", "Great Vibes", "Dancing Script", "Tangerine", "Sacramento",
  "Parisienne", "Rozha One", "Montserrat", "Lato", "Inter", "Spectral",
  "Libre Baskerville", "Source Serif Pro", "Bodoni Moda", "EB Garamond", "Marcellus",
];

export function themeToCssVars(theme: ThemeConfig | null): React.CSSProperties {
  const t = theme || DEFAULT_THEME;
  return {
    "--color-primary": t.primary,
    "--color-secondary": t.secondary,
    "--color-accent": t.accent,
    "--color-bg": t.bg,
    "--color-surface": t.surface,
    "--color-text": t.text,
    "--color-text-muted": t.textMuted,
    "--color-border": t.border,
    "--color-button-bg": t.buttonBg,
    "--color-button-text": t.buttonText,
    "--font-script": t.scriptFont,
    "--font-heading": t.headingFont,
    "--font-body": t.bodyFont,
    "--font-ui": t.uiFont,
    "--font-heading-size": t.headingSize,
    "--font-body-size": t.bodySize,
    "--font-heading-weight": t.headingWeight,
    "--font-body-weight": t.bodyWeight,
    "--letter-spacing": t.letterSpacing,
  } as React.CSSProperties;
}

export function coverToCssVars(cover: CoverConfig | null): React.CSSProperties {
  const c = cover || DEFAULT_COVER_CONFIG;
  return {
    "--cover-text": c.typography.heading_color,
    "--cover-heading-font": c.typography.heading_font,
    "--cover-heading-size": c.typography.heading_size,
    "--cover-body-font": c.typography.body_font,
    "--cover-body-size": c.typography.body_size,
    "--cover-body-color": c.typography.body_color,
    "--cover-overlay": c.overlay.color,
    "--cover-overlay-opacity": String(c.overlay.opacity),
    "--cover-button": c.button.bg_color,
    "--cover-button-text": c.button.text_color,
    "--cover-radius": c.corner_radius,
    "--cover-blur": c.blur,
    "--cover-brightness": String(c.brightness),
  } as React.CSSProperties;
}

export function loginToCssVars(login: LoginConfig | null): React.CSSProperties {
  const l = login || DEFAULT_LOGIN_CONFIG;
  return {
    "--login-primary": l.theme.primary,
    "--login-secondary": l.theme.secondary,
    "--login-accent": l.theme.accent,
    "--login-text": l.theme.text,
    "--login-button-bg": l.theme.button_bg,
    "--login-button-text": l.theme.button_text,
    "--login-input-bg": l.theme.input_bg,
    "--login-border": l.theme.border,
    "--login-heading-font": l.typography.heading_font,
    "--login-body-font": l.typography.body_font,
    "--login-heading-size": l.typography.heading_size,
    "--login-body-size": l.typography.body_size,
    "--login-heading-weight": l.typography.heading_weight,
    "--login-body-weight": l.typography.body_weight,
    "--login-letter-spacing": l.typography.letter_spacing,
    "--login-overlay": l.overlay.color,
    "--login-overlay-opacity": String(l.overlay.opacity),
    "--login-blur": l.blur,
    "--login-brightness": String(l.brightness),
  } as React.CSSProperties;
}

export function getTheme(wedding: Wedding | null): ThemeConfig {
  if (!wedding) return DEFAULT_THEME;
  return wedding.theme_config || wedding.theme || DEFAULT_THEME;
}

export function getCoverConfig(wedding: Wedding | null): CoverConfig {
  if (!wedding) return DEFAULT_COVER_CONFIG;
  return wedding.draft_cover_config || wedding.cover_config || DEFAULT_COVER_CONFIG;
}

export function getLoginConfig(wedding: Wedding | null): LoginConfig {
  if (!wedding) return DEFAULT_LOGIN_CONFIG;
  return wedding.draft_login_config || wedding.login_config || DEFAULT_LOGIN_CONFIG;
}

export function getCoverContent(wedding: Wedding | null): CoverConfig {
  return getCoverConfig(wedding);
}

export function getLogoConfig(wedding: Wedding | null): LogoConfig {
  const cover = getCoverConfig(wedding);
  return cover.branding?.logo || DEFAULT_LOGO_CONFIG;
}

export function getLogoStyle(logo: LogoConfig, device: "desktop" | "tablet" | "mobile" = "desktop"): React.CSSProperties {
  const size = logo.responsive?.[device] || { width: logo.width, height: logo.height };
  const filters: string[] = [];
  if (logo.dropShadow?.enabled) {
    filters.push(`drop-shadow(${logo.dropShadow.offsetX} ${logo.dropShadow.offsetY} ${logo.dropShadow.blur} ${logo.dropShadow.color})`);
  }
  if (logo.glow?.enabled) {
    filters.push(`drop-shadow(0 0 ${logo.glow.blur} ${logo.glow.color})`);
  }
  return {
    width: size.width,
    height: size.height,
    opacity: logo.opacity,
    borderRadius: logo.borderRadius,
    objectFit: logo.objectFit,
    maxWidth: logo.maxWidth,
    maxHeight: logo.maxHeight,
    transform: logo.rotation ? `rotate(${logo.rotation}deg)` : undefined,
    filter: filters.length > 0 ? filters.join(" ") : undefined,
    margin: logo.margin,
    padding: logo.padding,
  } as React.CSSProperties;
}

export function getLogoPositionClasses(position: string): { container: string; item: string } {
  const map: Record<string, { container: string; item: string }> = {
    "top-left": { container: "items-start justify-start", item: "text-left" },
    "top-center": { container: "items-center justify-center", item: "text-center" },
    "top-right": { container: "items-start justify-end", item: "text-right" },
    "center": { container: "items-center justify-center", item: "text-center" },
    "bottom-left": { container: "items-end justify-start", item: "text-left" },
    "bottom-center": { container: "items-end justify-center", item: "text-center" },
    "bottom-right": { container: "items-end justify-end", item: "text-right" },
  };
  return map[position] || map["top-center"];
}

export function shouldShowLogo(logo: LogoConfig, page: string): boolean {
  if (!logo.visible) return false;
  if (logo.showOnPages === "all-pages") return true;
  if (logo.showOnPages === "cover-only") return page === "cover";
  if (logo.showOnPages === "custom") return logo.customPages?.includes(page) || false;
  return false;
}
