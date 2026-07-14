export interface TypographyStyle {
  fontFamily: string;
  fontSize: string;
  fontWeight: string;
  lineHeight: string;
  letterSpacing: string;
  textTransform: string;
  color: string;
  textAlign: string;
}

export function resolveTypography(
  config: Record<string, unknown> | null,
  defaults: TypographyStyle,
): TypographyStyle {
  if (!config) return defaults;
  return {
    fontFamily: (config.fontFamily as string) ?? defaults.fontFamily,
    fontSize: (config.fontSize as string) ?? defaults.fontSize,
    fontWeight: (config.fontWeight as string) ?? defaults.fontWeight,
    lineHeight: (config.lineHeight as string) ?? defaults.lineHeight,
    letterSpacing: (config.letterSpacing as string) ?? defaults.letterSpacing,
    textTransform: (config.textTransform as string) ?? defaults.textTransform,
    color: (config.color as string) ?? defaults.color,
    textAlign: (config.textAlign as string) ?? defaults.textAlign,
  };
}

export function getTypographyText(config: Record<string, unknown> | null, key: string, fallback: string): string {
  if (!config) return fallback;
  return (config[key] as string) ?? fallback;
}

export function getTypographyStyle(config: Record<string, unknown> | null): React.CSSProperties {
  if (!config) return {};
  return {
    fontFamily: (config.fontFamily as string) ?? undefined,
    fontSize: (config.fontSize as string) ?? undefined,
    fontWeight: (config.fontWeight as string) ?? undefined,
    lineHeight: (config.lineHeight as string) ?? undefined,
    letterSpacing: (config.letterSpacing as string) ?? undefined,
    textTransform: (config.textTransform as string) ?? undefined,
    color: (config.color as string) ?? undefined,
    textAlign: ((config.textAlign as string) ?? undefined) as React.CSSProperties["textAlign"],
  };
}
