"use client";

import * as React from "react";
import type { Campaign, Cloud, FunnelData, Platform, Product } from "./types";
import { SEED } from "./seed";

const STORAGE_KEY = "ad-funnel-tracker:v1";

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

function load(): FunnelData {
  if (typeof window === "undefined") return SEED;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED;
    const parsed = JSON.parse(raw) as Partial<FunnelData>;
    return {
      version: 2,
      // Clouds are fixed for now; keep seed as the source of truth so renames
      // in code show up without wiping saved products/campaigns.
      clouds: SEED.clouds,
      products: parsed.products ?? [],
      platforms: parsed.platforms?.length ? parsed.platforms : SEED.platforms,
      campaigns: parsed.campaigns ?? [],
    };
  } catch {
    return SEED;
  }
}

interface StoreValue {
  data: FunnelData;
  ready: boolean;
  addProduct: (input: { cloudId: string; name: string }) => Product;
  updateProduct: (id: string, patch: Partial<Omit<Product, "id" | "createdAt">>) => void;
  removeProduct: (id: string) => void;
  addPlatform: (input: { name: string }) => Platform;
  removePlatform: (id: string) => void;
  addCampaign: (input: Omit<Campaign, "id" | "createdAt">) => Campaign;
  updateCampaign: (id: string, patch: Partial<Omit<Campaign, "id" | "createdAt">>) => void;
  removeCampaign: (id: string) => void;
  exportJson: () => string;
  importJson: (json: string) => void;
  resetAll: () => void;
}

const StoreContext = React.createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = React.useState<FunnelData>(SEED);
  const [ready, setReady] = React.useState(false);

  // Hydrate after mount so server and first client render match.
  React.useEffect(() => {
    setData(load());
    setReady(true);
  }, []);

  /**
   * Write only on real mutations, never from an effect watching `data`.
   * A change-watching effect will happily flush the empty starting state over
   * saved data any time the provider remounts with storage already populated,
   * which is exactly what a Fast Refresh does.
   */
  const update = React.useCallback((fn: (d: FunnelData) => FunnelData) => {
    setData((prev) => {
      const next = fn(prev);
      // Idempotent, so a StrictMode double-invoke is harmless.
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Quota or private-mode failure: keep the in-memory state usable.
      }
      return next;
    });
  }, []);

  const value = React.useMemo<StoreValue>(() => {
    return {
      data,
      ready,
      addProduct: ({ cloudId, name }) => {
        const product: Product = {
          id: uid("prod"),
          cloudId,
          name: name.trim(),
          createdAt: new Date().toISOString(),
        };
        update((d) => ({ ...d, products: [...d.products, product] }));
        return product;
      },
      updateProduct: (id, patch) =>
        update((d) => ({
          ...d,
          products: d.products.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        })),
      removeProduct: (id) =>
        update((d) => ({
          ...d,
          products: d.products.filter((p) => p.id !== id),
          campaigns: d.campaigns.filter((c) => c.productId !== id),
        })),
      addPlatform: ({ name }) => {
        const platform: Platform = {
          id: uid("plat"),
          name: name.trim(),
          createdAt: new Date().toISOString(),
        };
        update((d) => ({ ...d, platforms: [...d.platforms, platform] }));
        return platform;
      },
      removePlatform: (id) =>
        update((d) => ({
          ...d,
          platforms: d.platforms.filter((p) => p.id !== id),
          campaigns: d.campaigns.filter((c) => c.platformId !== id),
        })),
      addCampaign: (input) => {
        const campaign: Campaign = {
          ...input,
          id: uid("camp"),
          createdAt: new Date().toISOString(),
        };
        update((d) => ({ ...d, campaigns: [...d.campaigns, campaign] }));
        return campaign;
      },
      updateCampaign: (id, patch) =>
        update((d) => ({
          ...d,
          campaigns: d.campaigns.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        })),
      removeCampaign: (id) =>
        update((d) => ({ ...d, campaigns: d.campaigns.filter((c) => c.id !== id) })),
      exportJson: () => JSON.stringify(data, null, 2),
      importJson: (json) => {
        const parsed = JSON.parse(json) as Partial<FunnelData>;
        update(() => ({
          version: 2,
          clouds: SEED.clouds,
          products: parsed.products ?? [],
          platforms: parsed.platforms?.length ? parsed.platforms : SEED.platforms,
          campaigns: parsed.campaigns ?? [],
        }));
      },
      resetAll: () => update(() => ({ ...SEED })),
    };
  }, [data, ready, update]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = React.useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}

/* ---------- derived selectors ---------- */

export function useCloud(slug: string): Cloud | undefined {
  const { data } = useStore();
  return data.clouds.find((c) => c.slug === slug);
}

export function useCloudStats(cloudId: string) {
  const { data } = useStore();
  return React.useMemo(() => {
    const products = data.products.filter((p) => p.cloudId === cloudId);
    const productIds = new Set(products.map((p) => p.id));
    const campaigns = data.campaigns.filter((c) => productIds.has(c.productId));
    const platformIds = new Set(campaigns.map((c) => c.platformId));
    return {
      products: products.length,
      platforms: platformIds.size,
      campaigns: campaigns.length,
      active: campaigns.filter((c) => c.status === "active").length,
    };
  }, [data, cloudId]);
}

/** Products in a cloud, each with its campaigns grouped by platform. */
export function useCloudThread(cloudId: string) {
  const { data } = useStore();
  return React.useMemo(() => {
    return data.products
      .filter((p) => p.cloudId === cloudId)
      .map((product) => {
        const campaigns = data.campaigns.filter((c) => c.productId === product.id);
        const byPlatform = data.platforms
          .map((platform) => ({
            platform,
            campaigns: campaigns.filter((c) => c.platformId === platform.id),
          }))
          .filter((group) => group.campaigns.length > 0);
        return { product, campaigns, byPlatform };
      });
  }, [data, cloudId]);
}
