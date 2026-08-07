"use client";

import * as React from "react";
import {
  createCampaign,
  createPlatform,
  createProduct,
  deleteCampaign,
  deletePlatform,
  deleteProduct,
  editCampaign,
  fetchFunnel,
  renameProduct,
} from "./db";
import { EMPTY_FUNNEL, type Campaign, type CampaignInput, type Cloud, type FunnelData, type Platform, type Product } from "./types";

interface StoreValue {
  data: FunnelData;
  ready: boolean;
  /** Set when the last load or write failed, so the UI can say so. */
  error: string | null;
  refresh: () => Promise<void>;
  addProduct: (input: { cloudId: string; name: string }) => Promise<Product>;
  updateProduct: (id: string, name: string) => Promise<void>;
  removeProduct: (id: string) => Promise<void>;
  addPlatform: (input: { name: string }) => Promise<Platform>;
  removePlatform: (id: string) => Promise<void>;
  addCampaign: (input: CampaignInput) => Promise<Campaign>;
  updateCampaign: (id: string, input: CampaignInput) => Promise<void>;
  removeCampaign: (id: string) => Promise<void>;
  exportJson: () => string;
}

const StoreContext = React.createContext<StoreValue | null>(null);

function message(e: unknown) {
  return e instanceof Error ? e.message : "Something went wrong";
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = React.useState<FunnelData>(EMPTY_FUNNEL);
  const [ready, setReady] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    try {
      setData(await fetchFunnel());
      setError(null);
    } catch (e) {
      setError(message(e));
    } finally {
      setReady(true);
    }
  }, []);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  /**
   * Run a write, then apply the server's own row to local state. Reading the
   * result back rather than guessing keeps generated ids and defaults honest.
   * A failure re-throws so callers can leave their dialog open.
   */
  const write = React.useCallback(
    async <T,>(op: () => Promise<T>, apply: (result: T, d: FunnelData) => FunnelData) => {
      try {
        const result = await op();
        setData((d) => apply(result, d));
        setError(null);
        return result;
      } catch (e) {
        setError(message(e));
        throw e;
      }
    },
    [],
  );

  const value = React.useMemo<StoreValue>(
    () => ({
      data,
      ready,
      error,
      refresh,

      addProduct: ({ cloudId, name }) =>
        write(
          () => createProduct(cloudId, name),
          (product, d) => ({ ...d, products: [...d.products, product] }),
        ),

      updateProduct: async (id, name) => {
        await write(
          () => renameProduct(id, name),
          (product, d) => ({
            ...d,
            products: d.products.map((p) => (p.id === product.id ? product : p)),
          }),
        );
      },

      removeProduct: async (id) => {
        await write(
          () => deleteProduct(id),
          (_, d) => ({
            ...d,
            products: d.products.filter((p) => p.id !== id),
            campaigns: d.campaigns.filter((c) => c.productId !== id),
          }),
        );
      },

      addPlatform: ({ name }) =>
        write(
          () => createPlatform(name),
          (platform, d) => ({
            ...d,
            // createPlatform returns the existing row on a duplicate name.
            platforms: d.platforms.some((p) => p.id === platform.id)
              ? d.platforms
              : [...d.platforms, platform].sort((a, b) => a.name.localeCompare(b.name)),
          }),
        ),

      removePlatform: async (id) => {
        await write(
          () => deletePlatform(id),
          (_, d) => ({
            ...d,
            platforms: d.platforms.filter((p) => p.id !== id),
            campaigns: d.campaigns.filter((c) => c.platformId !== id),
          }),
        );
      },

      addCampaign: (input) =>
        write(
          () => createCampaign(input),
          (campaign, d) => ({ ...d, campaigns: [...d.campaigns, campaign] }),
        ),

      updateCampaign: async (id, input) => {
        await write(
          () => editCampaign(id, input),
          (campaign, d) => ({
            ...d,
            campaigns: d.campaigns.map((c) => (c.id === campaign.id ? campaign : c)),
          }),
        );
      },

      removeCampaign: async (id) => {
        await write(
          () => deleteCampaign(id),
          (_, d) => ({ ...d, campaigns: d.campaigns.filter((c) => c.id !== id) }),
        );
      },

      exportJson: () => JSON.stringify(data, null, 2),
    }),
    [data, ready, error, refresh, write],
  );

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
