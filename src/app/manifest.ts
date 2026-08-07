import type { MetadataRoute } from "next";

// Required for output: export — the manifest is a route, and static export
// needs it pinned to static.
export const dynamic = "force-static";

/**
 * Paths are relative to the manifest's own URL, so they resolve correctly
 * under the /ad-funnel base path without hardcoding it.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ad Funnel Tracker",
    short_name: "Ads",
    description: "Paid ad campaigns by cloud, product, platform, and ad set.",
    start_url: "./",
    scope: "./",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      { src: "icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
