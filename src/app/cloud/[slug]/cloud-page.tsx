"use client";

import * as React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Plus, TriangleAlert } from "lucide-react";
import { useStore, useCloudThread } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductDialog } from "@/components/product-dialog";
import { ProductThread } from "@/components/thread";

export function CloudPageClient({ slug }: { slug: string }) {
  const { data, ready, error, refresh } = useStore();
  const [addingProduct, setAddingProduct] = React.useState(false);

  const cloud = data.clouds.find((c) => c.slug === slug);
  const thread = useCloudThread(cloud?.id ?? "");

  const allCampaigns = thread.flatMap((t) => t.campaigns);
  const platformCount = new Set(allCampaigns.map((c) => c.platformId)).size;

  const backLink = (
    <Button asChild variant="ghost" size="sm" className="text-muted-foreground -ml-2">
      <Link href="/">
        <ChevronLeft />
        All clouds
      </Link>
    </Button>
  );

  // Clouds arrive from Supabase, so an unknown slug is only really unknown
  // once the load has finished.
  if (ready && !error && !cloud) notFound();

  if (error) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        {backLink}
        <Card className="mt-4">
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

  if (!ready || !cloud) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        {backLink}
        <div className="mt-4 space-y-4">
          <Skeleton className="h-9 w-56" />
          <Skeleton className="h-4 w-72" />
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      {backLink}

      <header className="mt-4 border-b pb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <h1 className="min-w-0 text-2xl font-semibold tracking-tight">{cloud.name}</h1>
          <Button onClick={() => setAddingProduct(true)} className="shrink-0">
            <Plus />
            Add product
          </Button>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          <span className="text-muted-foreground">
            <span className="text-foreground font-medium tabular-nums">{thread.length}</span>{" "}
            product{thread.length === 1 ? "" : "s"}
          </span>
          <span className="text-muted-foreground">
            <span className="text-foreground font-medium tabular-nums">{platformCount}</span>{" "}
            platform{platformCount === 1 ? "" : "s"}
          </span>
          <span className="text-muted-foreground">
            <span className="text-foreground font-medium tabular-nums">{allCampaigns.length}</span>{" "}
            campaign{allCampaigns.length === 1 ? "" : "s"}
          </span>
        </div>
      </header>

      <div className="mt-6 space-y-4">
        {thread.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center px-6 py-10 text-center">
              <CardTitle className="text-sm">No products in {cloud.name} yet</CardTitle>
              <CardDescription className="mt-1.5 max-w-sm">
                Add a product, then hang each ad platform and campaign underneath it.
              </CardDescription>
              <Button className="mt-5" onClick={() => setAddingProduct(true)}>
                <Plus />
                Add the first product
              </Button>
            </CardContent>
          </Card>
        ) : (
          thread.map(({ product, campaigns, byPlatform }, i) => (
            <ProductThread
              key={product.id}
              index={i}
              cloud={cloud}
              product={product}
              campaigns={campaigns}
              byPlatform={byPlatform}
            />
          ))
        )}
      </div>

      <ProductDialog
        open={addingProduct}
        onOpenChange={setAddingProduct}
        cloudId={cloud.id}
        cloudName={cloud.name}
      />
    </div>
  );
}
