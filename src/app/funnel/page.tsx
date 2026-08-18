"use client";

import * as React from "react";
import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import { useStore } from "@/lib/store";
import { FUNNEL_STAGES, type Campaign, type FunnelStage } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/** Top of funnel down to bottom. */
const STAGE_ORDER: FunnelStage[] = ["awareness", "consideration", "conversion", "retention"];

/** Each band narrows, so the stack reads as a funnel rather than a list. */
const WIDTHS = ["100%", "82%", "64%", "46%"];

/** Initials in place of a brand logo — no licensed marks are bundled. */
function PlatformMark({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <span
      aria-hidden
      className="bg-muted text-muted-foreground grid size-4 shrink-0 place-items-center rounded-sm text-[8px] font-semibold"
    >
      {initials}
    </span>
  );
}

export default function FunnelPage() {
  const { data, ready, error, refresh } = useStore();

  const lookup = React.useMemo(
    () => ({
      products: new Map(data.products.map((p) => [p.id, p])),
      clouds: new Map(data.clouds.map((c) => [c.id, c])),
      platforms: new Map(data.platforms.map((p) => [p.id, p])),
    }),
    [data],
  );

  /**
   * One card per ad set, since that is the level a creative actually runs at.
   * A campaign with no ad sets still gets a card, named after itself, so
   * nothing silently drops out of the funnel.
   */
  const cardsFor = React.useCallback(
    (c: Campaign) => {
      const product = lookup.products.get(c.productId);
      const cloud = product ? lookup.clouds.get(product.cloudId) : undefined;
      const platform = lookup.platforms.get(c.platformId);
      const adSets = data.adSets.filter((a) => a.campaignId === c.id);

      const base = {
        productName: product?.name ?? "Unknown product",
        platformName: platform?.name ?? "Unknown platform",
        objective: c.objective,
        cloudSlug: cloud?.slug,
        campaignName: c.name,
      };

      return adSets.length > 0
        ? adSets.map((a) => ({ ...base, key: a.id, detail: a.name }))
        : [{ ...base, key: c.id, detail: c.name }];
    },
    [lookup, data.adSets],
  );

  const bands = STAGE_ORDER.map((stage) => ({
    stage,
    meta: FUNNEL_STAGES.find((s) => s.value === stage)!,
    items: data.campaigns.filter((c) => c.stage === stage).flatMap(cardsFor),
  })).filter((b) => b.stage !== "retention" || b.items.length > 0);

  if (error) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
        <Card>
          <CardContent className="flex flex-col items-center px-6 py-12 text-center">
            <TriangleAlert className="text-muted-foreground size-5" />
            <CardTitle className="mt-3 text-sm">Could not reach Supabase</CardTitle>
            <CardDescription className="mt-1.5 max-w-md break-words">{error}</CardDescription>
            <Button className="mt-5" onClick={() => refresh()}>
              Try again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="border-b pb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Funnel</h1>
        <p className="text-muted-foreground mt-1.5 text-sm">
          Every campaign across all clouds, by the stage it works on.
        </p>
      </header>

      {!ready ? (
        <div className="mt-8 space-y-3">
          {WIDTHS.slice(0, 3).map((w, i) => (
            <Skeleton key={i} className="mx-auto h-24 rounded-xl" style={{ width: w }} />
          ))}
        </div>
      ) : (
        <div className="mt-8 space-y-3">
          {bands.map((band, i) => (
            <section
              key={band.stage}
              className="thread-in bg-muted/40 mx-auto rounded-xl border px-4 py-3"
              style={{ width: WIDTHS[i] ?? "40%", "--i": i } as React.CSSProperties}
            >
              <div className="flex items-baseline justify-center gap-2">
                <h2 className="text-sm font-semibold">{band.meta.label}</h2>
                <span className="text-muted-foreground font-mono text-[10px]">
                  {band.meta.short}
                </span>
                <span className="text-muted-foreground text-xs tabular-nums">
                  {band.items.length}
                </span>
              </div>

              {band.items.length === 0 ? (
                <p className="text-muted-foreground mt-2 text-center text-xs">Nothing at this stage</p>
              ) : (
                <ul className="mt-2 flex flex-wrap justify-center gap-1.5">
                  {band.items.map((item) => (
                    <li key={item.key}>
                      <Link
                        href={item.cloudSlug ? `/cloud/${item.cloudSlug}` : "/"}
                        className="bg-background hover:border-ring/60 block rounded-md border px-2.5 py-1.5 transition-colors"
                      >
                        <span className="block text-xs font-medium">{item.productName}</span>

                        <span className="mt-1 flex items-center gap-1.5">
                          <PlatformMark name={item.platformName} />
                          <span className="text-muted-foreground text-[11px]">
                            {item.platformName}
                          </span>
                        </span>

                        <span className="text-muted-foreground mt-0.5 block text-[11px]">
                          {[item.detail, item.objective].filter(Boolean).join(" · ")}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
