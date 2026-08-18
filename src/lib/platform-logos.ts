import type { StaticImageData } from "next/image";
import googleAds from "@/assets/platforms/google-ads.png";

/**
 * Real, multi-colour brand logos, keyed by lowercased platform name.
 *
 * These take precedence over the simple-icons marks, which are single-colour
 * by design — Google Ads is blue, yellow and green, and the flat blue glyph
 * read as wrong. Add a file to src/assets/platforms and register it here.
 *
 * Imported rather than referenced by path so Next rewrites the URL for the
 * deployment's base path.
 */
export const PLATFORM_LOGOS: Record<string, StaticImageData> = {
  "google ads": googleAds,
};

export function platformLogo(name: string): StaticImageData | undefined {
  return PLATFORM_LOGOS[name.trim().toLowerCase()];
}
