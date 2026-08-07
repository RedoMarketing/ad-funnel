"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useStore } from "@/lib/store";
import type { Cloud } from "@/lib/types";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function CloudCard({ cloud }: { cloud: Cloud }) {
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
    <Link href={`/cloud/${cloud.slug}`} className="group">
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
  const { data, ready } = useStore();

  const active = data.campaigns.filter((c) => c.status === "active").length;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight">Paid ad funnel</h1>
        <p className="text-muted-foreground mt-2 text-base leading-relaxed">
          Every campaign you are running, organized by cloud, then product, then ad platform. Open a
          cloud to work through it as a thread.
        </p>
        {ready && data.campaigns.length > 0 && (
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

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {data.clouds.map((cloud) => (
          <CloudCard key={cloud.id} cloud={cloud} />
        ))}
      </div>
    </div>
  );
}
