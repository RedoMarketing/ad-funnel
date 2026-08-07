/**
 * Slugs prerendered by the static export.
 *
 * The clouds themselves live in Supabase, but a static build has to know
 * every route at compile time, and RLS blocks an unauthenticated build-time
 * read. So this list is the one thing that must be kept in step with
 * `funnel_clouds.slug` by hand: add a cloud to the table, add its slug here,
 * or the page 404s.
 */
export const CLOUD_SLUGS = [
  "brand",
  "reverse-logistics",
  "shipping",
  "conversion",
  "marketing",
  "finance",
] as const;
