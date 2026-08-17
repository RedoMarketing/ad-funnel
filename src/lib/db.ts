import { createClient } from "@supabase/supabase-js";

// Publishable key: public by design (same model as the brand book app).
// RLS policies on the funnel_* tables define what it can do.
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://jjezreqahluvohgxpoma.supabase.co";
const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  "sb_publishable_rptD8XEPS6N1GWIDl6yJzg_QPoKTFzH";

// persistSession keeps you signed in per device; autoRefreshToken renews the
// access token in the background so a long-lived tab doesn't silently expire.
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    storageKey: "ad-funnel-auth",
  },
});

const supabaseAdmin = () => supabase;
import type {
  AdSet,
  AdSetInput,
  Campaign,
  CampaignInput,
  Cloud,
  FunnelData,
  Platform,
  Product,
  Todo,
} from "./types";

/* ---------------------------------------------------------------- */
/* row mapping                                                       */
/* ---------------------------------------------------------------- */

type CloudRow = { id: string; name: string; slug: string; sort_order: number };
type ProductRow = { id: string; cloud_id: string; name: string; created_at: string };
type PlatformRow = { id: string; name: string; created_at: string };
type CampaignRow = {
  id: string;
  product_id: string;
  platform_id: string;
  name: string;
  stage: Campaign["stage"];
  status: Campaign["status"];
  objective: string | null;
  budget: string | null;
  landing_url: string | null;
  notes: string | null;
  created_at: string;
};

const toCloud = (r: CloudRow): Cloud => ({
  id: r.id,
  name: r.name,
  slug: r.slug,
  order: r.sort_order,
});

const toProduct = (r: ProductRow): Product => ({
  id: r.id,
  cloudId: r.cloud_id,
  name: r.name,
  createdAt: r.created_at,
});

const toPlatform = (r: PlatformRow): Platform => ({
  id: r.id,
  name: r.name,
  createdAt: r.created_at,
});

type AdSetRow = {
  id: string;
  campaign_id: string;
  name: string;
  audience: string | null;
  budget: string | null;
  status: AdSet["status"];
  created_at: string;
};

const toAdSet = (r: AdSetRow): AdSet => ({
  id: r.id,
  campaignId: r.campaign_id,
  name: r.name,
  audience: r.audience ?? undefined,
  budget: r.budget ?? undefined,
  status: r.status,
  createdAt: r.created_at,
});

const toCampaign = (r: CampaignRow): Campaign => ({
  id: r.id,
  productId: r.product_id,
  platformId: r.platform_id,
  name: r.name,
  stage: r.stage,
  status: r.status,
  objective: r.objective ?? undefined,
  budget: r.budget ?? undefined,
  landingUrl: r.landing_url ?? undefined,
  notes: r.notes ?? undefined,
  createdAt: r.created_at,
});

/** Empty string and whitespace both mean "not set" for the optional fields. */
const orNull = (v?: string) => {
  const trimmed = v?.trim();
  return trimmed ? trimmed : null;
};

const campaignColumns = (input: CampaignInput) => ({
  product_id: input.productId,
  platform_id: input.platformId,
  name: input.name.trim(),
  stage: input.stage,
  status: input.status,
  objective: orNull(input.objective),
  budget: orNull(input.budget),
  landing_url: orNull(input.landingUrl),
  notes: orNull(input.notes),
});

/* ---------------------------------------------------------------- */
/* reads                                                             */
/* ---------------------------------------------------------------- */

export async function fetchFunnel(): Promise<FunnelData> {
  const db = supabaseAdmin();

  const [clouds, products, platforms, campaigns, adSets, todos] = await Promise.all([
    db.from("funnel_clouds").select("*").order("sort_order"),
    db.from("funnel_products").select("*").order("created_at"),
    db.from("funnel_platforms").select("*").order("name"),
    db.from("funnel_campaigns").select("*").order("created_at"),
    db.from("funnel_ad_sets").select("*").order("created_at"),
    // Open items first, newest last within each group.
    db.from("funnel_todos").select("*").order("done").order("created_at"),
  ]);

  const failed = [clouds, products, platforms, campaigns, adSets, todos].find((r) => r.error);
  if (failed?.error) throw new Error(failed.error.message);

  return {
    clouds: (clouds.data as CloudRow[]).map(toCloud),
    products: (products.data as ProductRow[]).map(toProduct),
    platforms: (platforms.data as PlatformRow[]).map(toPlatform),
    campaigns: (campaigns.data as CampaignRow[]).map(toCampaign),
    adSets: (adSets.data as AdSetRow[]).map(toAdSet),
    todos: (todos.data as TodoRow[]).map(toTodo),
  };
}

/* ---------------------------------------------------------------- */
/* products                                                          */
/* ---------------------------------------------------------------- */

export async function createProduct(cloudId: string, name: string): Promise<Product> {
  const { data, error } = await supabaseAdmin()
    .from("funnel_products")
    .insert({ cloud_id: cloudId, name: name.trim() })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return toProduct(data as ProductRow);
}

export async function renameProduct(id: string, name: string): Promise<Product> {
  const { data, error } = await supabaseAdmin()
    .from("funnel_products")
    .update({ name: name.trim() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return toProduct(data as ProductRow);
}

/** Campaigns cascade via the foreign key. */
export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabaseAdmin().from("funnel_products").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/* ---------------------------------------------------------------- */
/* platforms                                                         */
/* ---------------------------------------------------------------- */

export async function createPlatform(name: string): Promise<Platform> {
  const trimmed = name.trim();
  const db = supabaseAdmin();

  const { data, error } = await db
    .from("funnel_platforms")
    .insert({ name: trimmed })
    .select()
    .single();

  // 23505 = unique violation on lower(name). Reuse the existing row instead of
  // failing, so "add a new platform" is idempotent on a name that already exists.
  if (error?.code === "23505") {
    const { data: existing, error: lookupError } = await db
      .from("funnel_platforms")
      .select("*")
      .ilike("name", trimmed)
      .single();
    if (lookupError) throw new Error(lookupError.message);
    return toPlatform(existing as PlatformRow);
  }
  if (error) throw new Error(error.message);
  return toPlatform(data as PlatformRow);
}

export async function deletePlatform(id: string): Promise<void> {
  const { error } = await supabaseAdmin().from("funnel_platforms").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/* ---------------------------------------------------------------- */
/* campaigns                                                         */
/* ---------------------------------------------------------------- */

export async function createCampaign(input: CampaignInput): Promise<Campaign> {
  const { data, error } = await supabaseAdmin()
    .from("funnel_campaigns")
    .insert(campaignColumns(input))
    .select()
    .single();
  if (error) throw new Error(error.message);
  return toCampaign(data as CampaignRow);
}

export async function editCampaign(id: string, input: CampaignInput): Promise<Campaign> {
  const { data, error } = await supabaseAdmin()
    .from("funnel_campaigns")
    .update(campaignColumns(input))
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return toCampaign(data as CampaignRow);
}

export async function deleteCampaign(id: string): Promise<void> {
  const { error } = await supabaseAdmin().from("funnel_campaigns").delete().eq("id", id);
  if (error) throw new Error(error.message);
}


/* ---------------------------------------------------------------- */
/* ad sets                                                           */
/* ---------------------------------------------------------------- */

const adSetColumns = (input: AdSetInput) => ({
  campaign_id: input.campaignId,
  name: input.name.trim(),
  audience: orNull(input.audience),
  budget: orNull(input.budget),
  status: input.status,
});

export async function createAdSet(input: AdSetInput): Promise<AdSet> {
  const { data, error } = await supabaseAdmin()
    .from("funnel_ad_sets")
    .insert(adSetColumns(input))
    .select()
    .single();
  if (error) throw new Error(error.message);
  return toAdSet(data as AdSetRow);
}

export async function editAdSet(id: string, input: AdSetInput): Promise<AdSet> {
  const { data, error } = await supabaseAdmin()
    .from("funnel_ad_sets")
    .update(adSetColumns(input))
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return toAdSet(data as AdSetRow);
}

export async function deleteAdSet(id: string): Promise<void> {
  const { error } = await supabaseAdmin().from("funnel_ad_sets").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/* ---------------------------------------------------------------- */
/* todos                                                             */
/* ---------------------------------------------------------------- */

type TodoRow = { id: string; text: string; done: boolean; created_at: string };

const toTodo = (r: TodoRow): Todo => ({
  id: r.id,
  text: r.text,
  done: r.done,
  createdAt: r.created_at,
});

export async function createTodo(text: string): Promise<Todo> {
  const { data, error } = await supabaseAdmin()
    .from("funnel_todos")
    .insert({ text: text.trim() })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return toTodo(data as TodoRow);
}

export async function setTodoDone(id: string, done: boolean): Promise<Todo> {
  const { data, error } = await supabaseAdmin()
    .from("funnel_todos")
    .update({ done, done_at: done ? new Date().toISOString() : null })
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return toTodo(data as TodoRow);
}

export async function deleteTodo(id: string): Promise<void> {
  const { error } = await supabaseAdmin().from("funnel_todos").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
