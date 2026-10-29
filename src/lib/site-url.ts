export const PUBLIC_SITE_URL = "https://muizhanisah.com";

export function publicSiteUrl(path: string): string {
  return `${PUBLIC_SITE_URL}${path}`;
}
