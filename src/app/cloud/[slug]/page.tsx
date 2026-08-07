"use client";

import * as React from "react";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { ChevronLeft, Plus } from "lucide-react";
import { useStore, useCloudThread } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductDialog } from "@/components/product-dialog";
import { ProductThread } from "@/components/thread";

export default function CloudPage() {
  const params = useParams<{ slug: string }>();
  const { data, ready } = useStore();
  const [addingProduct, setAddingProduct] = React.useState(false);

  const cloud = data.clouds.find((c) => c.slug === params.slug);
  const thread = useCloudThread(cloud?.id ?? "");

  if (!cloud) notFound();

  const allCampaigns = thread.flatMap((t) => t.campaigns);
  const platformCount = new Set(allCampaigns.map((c) => c.platformId)).size;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <Button asChild variant="ghost" size="sm" className="text-muted-foreground -ml-2">
        <Link href="/">
          <ChevronLeft />
          All clouds
        </Link>
      </Button>

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
        {!ready ? (
          <div className="space-y-4">
            {[0, 1].map((i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
            ))}
          </div>
        ) : thread.length === 0 ? (
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
          thread.map(({ product, campaigns, byPlatform }) => (
            <ProductThread
              key={product.id}
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
