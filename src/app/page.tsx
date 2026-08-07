"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, TriangleAlert } from "lucide-react";
import { useStore } from "@/lib/store";
import type { Cloud } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function CloudCard({ cloud, index }: { cloud: Cloud; index: number }) {
  const { data } = useStore();

  const products = data.products.filter((p) => p.cloudId === cloud.id);
  const productIds = new Set(products.map((p) => p.id));
  const campaigns = data.campaigns.filter((c) => productIds.has(c.productId));
  const platforms = new Set(campaigns.map((c) => c.platformId));

  const stats = [
    { label: "Products", value: products.length },
    { label: "Platforms", value: platforms.size },
    { label: "Campaigns", value: campaigns.length },
    { label: "Active", value: campaigns.filter((c) => c.status === "active").length },
  ];

  return (
    <Link
      href={`/cloud/${cloud.slug}`}
      className="group thread-in block"
      style={{ "--i": index } as React.CSSProperties}
    >
      <Card className="hover:border-ring/60 h-full transition-colors">
        <CardHeader>
          <CardTitle>{cloud.name}</CardTitle>
          <CardAction>
            <ArrowRight className="text-muted-foreground group-hover:text-foreground size-4 transition-transform group-hover:translate-x-0.5" />
          </CardAction>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-4 gap-2">
            {stats.map((stat) => (
              <div key={stat.label}>
                <dd className="text-2xl leading-none font-semibold tabular-nums">{stat.value}</dd>
                <dt className="text-muted-foreground mt-1.5 text-xs">{stat.label}</dt>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function Home() {
  const { data, ready, error, refresh } = useStore();

  const active = data.campaigns.filter((c) => c.status === "active").length;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight">Paid ad funnel</h1>
        <p className="text-muted-foreground mt-2 text-base leading-relaxed">
          Every campaign you are running, organized by cloud, then product, then ad platform. Open a
          cloud to work through it as a thread.
        </p>
        {ready && !error && data.campaigns.length > 0 && (
          <p className="text-muted-foreground mt-3 text-sm">
            <span className="text-foreground font-medium tabular-nums">{data.products.length}</span>{" "}
            products ·{" "}
            <span className="text-foreground font-medium tabular-nums">
              {data.campaigns.length}
            </span>{" "}
            campaigns · <span className="text-foreground font-medium tabular-nums">{active}</span>{" "}
            active
          </p>
        )}
      </div>

      {error ? (
        <Card className="mt-8">
          <CardContent className="flex flex-col items-center px-6 py-12 text-center">
            <TriangleAlert className="text-muted-foreground size-5" />
            <CardTitle className="mt-3 text-sm">Could not reach Supabase</CardTitle>
            <CardDescription className="mt-1.5 max-w-md break-words">{error}</CardDescription>
            <Button className="mt-5" onClick={() => refresh()}>
              Try again
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {!ready
            ? [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-44 w-full rounded-xl" />)
            : data.clouds.map((cloud, i) => (
                <CloudCard key={cloud.id} cloud={cloud} index={i} />
              ))}
        </div>
      )}
    </div>
  );
}
