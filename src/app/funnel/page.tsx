"use client";

import * as React from "react";
import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import { useStore } from "@/lib/store";
import { FUNNEL_STAGES, type Campaign, type FunnelStage } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/** Top of funnel down to bottom. */
const STAGE_ORDER: FunnelStage[] = ["awareness", "consideration", "conversion", "retention"];

/** Each band narrows, so the stack reads as a funnel rather than a list. */
const WIDTHS = ["100%", "82%", "64%", "46%"];

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

  /** Cloud, platform, campaign, objective — the whole path in one line. */
  const label = React.useCallback(
    (c: Campaign) => {
      const product = lookup.products.get(c.productId);
      const cloud = product ? lookup.clouds.get(product.cloudId) : undefined;
      const platform = lookup.platforms.get(c.platformId);
      const parts = [cloud?.name, platform?.name, c.name, c.objective].filter(Boolean);
      return { parts, cloudSlug: cloud?.slug };
    },
    [lookup],
  );

  const bands = STAGE_ORDER.map((stage) => ({
    stage,
    meta: FUNNEL_STAGES.find((s) => s.value === stage)!,
    items: data.campaigns.filter((c) => c.stage === stage),
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
              <div className="flex items-baseline gap-2">
                <h2 className="text-sm font-semibold">{band.meta.label}</h2>
                <span className="text-muted-foreground font-mono text-[10px]">
                  {band.meta.short}
                </span>
                <span className="text-muted-foreground ml-auto text-xs tabular-nums">
                  {band.items.length}
                </span>
              </div>

              {band.items.length === 0 ? (
                <p className="text-muted-foreground mt-2 text-xs">Nothing at this stage</p>
              ) : (
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {band.items.map((c) => {
                    const { parts, cloudSlug } = label(c);
                    return (
                      <li key={c.id}>
                        <Link
                          href={cloudSlug ? `/cloud/${cloudSlug}` : "/"}
                          className={cn(
                            "bg-background hover:border-ring/60 inline-flex items-center rounded-md border px-2 py-1 text-xs whitespace-nowrap transition-colors",
                            c.status !== "active" && "text-muted-foreground",
                          )}
                        >
                          {parts.join(" · ")}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
