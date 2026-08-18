"use client";

import * as React from "react";
import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import { useStore } from "@/lib/store";
import Image from "next/image";
import { platformIcon } from "@/lib/platform-icons";
import { platformLogo } from "@/lib/platform-logos";
import { FUNNEL_STAGES, type Campaign, type FunnelStage } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { CreativeGallery } from "@/components/creative-gallery";

/** Top of funnel down to bottom. */
const STAGE_ORDER: FunnelStage[] = ["awareness", "consideration", "conversion", "retention"];

/** Each band narrows, so the stack reads as a funnel rather than a list. */
const WIDTHS = ["100%", "82%", "64%", "46%"];

/**
 * The brand mark alone where one exists — it identifies the platform without
 * repeating the name beside it. Platforms with no mark (LinkedIn, Microsoft)
 * show their name instead, since initials alone would not read.
 */
function PlatformBadge({ name }: { name: string }) {
  // A supplied brand logo wins: simple-icons is single-colour, which misreads
  // for marks that are genuinely multi-colour.
  const logo = platformLogo(name);
  if (logo) {
    return <Image src={logo} alt={name} className="size-4 shrink-0" unoptimized />;
  }

  const icon = platformIcon(name);

  if (icon) {
    return (
      <svg
        viewBox="0 0 24 24"
        role="img"
        aria-label={name}
        className="size-4 shrink-0"
        fill={icon.color ?? "currentColor"}
      >
        <title>{name}</title>
        <path d={icon.path} />
      </svg>
    );
  }

  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <span
      title={name}
      className="bg-muted text-muted-foreground grid size-4 shrink-0 place-items-center rounded-sm text-[8px] font-semibold"
    >
      {initials}
    </span>
  );
}

type View = "campaigns" | "ads";

export default function FunnelPage() {
  const { data, ready, error, refresh } = useStore();
  const [view, setView] = React.useState<View>("campaigns");

  const lookup = React.useMemo(
    () => ({
      products: new Map(data.products.map((p) => [p.id, p])),
      clouds: new Map(data.clouds.map((c) => [c.id, c])),
      platforms: new Map(data.platforms.map((p) => [p.id, p])),
    }),
    [data],
  );

  /** One card per campaign. */
  const cardFor = React.useCallback(
    (c: Campaign) => {
      const product = lookup.products.get(c.productId);
      const cloud = product ? lookup.clouds.get(product.cloudId) : undefined;
      return {
        key: c.id,
        productName: product?.name ?? "Unknown product",
        platformName: lookup.platforms.get(c.platformId)?.name ?? "Unknown platform",
        detail: c.name,
        objective: c.objective,
        cloudSlug: cloud?.slug,
      };
    },
    [lookup],
  );

  /** Ads view: every creative running at this stage, via its ad set. */
  const adsFor = React.useCallback(
    (c: Campaign) => {
      const product = lookup.products.get(c.productId);
      const cloud = product ? lookup.clouds.get(product.cloudId) : undefined;
      const platformName = lookup.platforms.get(c.platformId)?.name ?? "Unknown platform";

      return data.adSets
        .filter((a) => a.campaignId === c.id)
        .flatMap((adSet) =>
          data.creatives
            .filter((cr) => cr.adSetId === adSet.id)
            .map((cr) => ({
              key: cr.id,
              url: cr.url,
              name: cr.name,
              productName: product?.name ?? "Unknown product",
              platformName,
              detail: `${c.name} · ${adSet.name}`,
              cloudSlug: cloud?.slug,
            })),
        );
    },
    [lookup, data.adSets, data.creatives],
  );

  const bands = STAGE_ORDER.map((stage) => {
    const campaigns = data.campaigns.filter((c) => c.stage === stage);
    return {
      stage,
      meta: FUNNEL_STAGES.find((s) => s.value === stage)!,
      items: campaigns.map(cardFor),
      ads: campaigns.flatMap(adsFor),
    };
  }).filter((b) => b.stage !== "retention" || b.items.length > 0);

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
      <header className="flex flex-wrap items-start justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Funnel</h1>
          <p className="text-muted-foreground mt-1.5 text-sm">
            {view === "campaigns"
              ? "Every campaign across all clouds, by the stage it works on."
              : "Every ad creative that is live, by the stage it runs at."}
          </p>
        </div>

        <ToggleGroup
          type="single"
          value={view}
          // A group with nothing selected would leave the page blank.
          onValueChange={(v) => v && setView(v as View)}
          variant="outline"
          size="sm"
          aria-label="Show the funnel by"
        >
          <ToggleGroupItem value="campaigns">Campaigns</ToggleGroupItem>
          <ToggleGroupItem value="ads">Ads</ToggleGroupItem>
        </ToggleGroup>
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
              style={
                {
                  width: view === "ads" ? "100%" : (WIDTHS[i] ?? "40%"),
                  "--i": i,
                } as React.CSSProperties
              }
            >
              <h2 className="text-center text-sm font-semibold">{band.meta.label}</h2>

              {view === "ads" ? (
                band.ads.length === 0 ? (
                  <p className="text-muted-foreground mt-2 text-center text-xs">
                    No ads uploaded at this stage
                  </p>
                ) : (
                  <CreativeGallery
                    items={band.ads}
                    renderMark={(platformName) => <PlatformBadge name={platformName} />}
                  />
                )
              ) : band.items.length === 0 ? (
                <p className="text-muted-foreground mt-2 text-center text-xs">
                  Nothing at this stage
                </p>
              ) : (
                <ul className="mt-2 flex flex-wrap justify-center gap-1.5">
                  {band.items.map((item) => (
                    <li key={item.key}>
                      <Link
                        href={item.cloudSlug ? `/cloud/${item.cloudSlug}` : "/"}
                        className="bg-background hover:border-ring/60 flex items-start gap-2 rounded-md border px-2.5 py-2 transition-colors"
                      >
                        <span className="mt-px">
                          <PlatformBadge name={item.platformName} />
                        </span>

                        <span className="min-w-0">
                          <span className="block text-xs leading-tight font-medium">
                            {item.productName}
                          </span>
                          <span className="text-muted-foreground mt-0.5 block text-[11px] leading-tight">
                            {[item.detail, item.objective].filter(Boolean).join(" · ")}
                          </span>
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
