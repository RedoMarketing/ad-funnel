import type { FunnelData } from "./types";

/** Stable ids so seeded rows survive a schema bump without duplicating. */
export const SEED: FunnelData = {
  version: 2,
  clouds: [
    {
      id: "cloud_shipping",
      name: "Shipping",
      slug: "shipping",
      order: 0,
    },
    {
      id: "cloud_marketing",
      name: "Marketing",
      slug: "marketing",
      order: 1,
    },
    {
      id: "cloud_conversion",
      name: "Conversion",
      slug: "conversion",
      order: 2,
    },
    {
      id: "cloud_reverse_logistics",
      name: "Reverse Logistics",
      slug: "reverse-logistics",
      order: 3,
    },
  ],
  products: [],
  platforms: [
    { id: "plat_meta", name: "Meta", createdAt: "" },
    { id: "plat_google", name: "Google Ads", createdAt: "" },
    { id: "plat_linkedin", name: "LinkedIn", createdAt: "" },
    { id: "plat_tiktok", name: "TikTok", createdAt: "" },
    { id: "plat_reddit", name: "Reddit", createdAt: "" },
    { id: "plat_x", name: "X", createdAt: "" },
    { id: "plat_youtube", name: "YouTube", createdAt: "" },
    { id: "plat_bing", name: "Microsoft Ads", createdAt: "" },
  ],
  campaigns: [],
};
