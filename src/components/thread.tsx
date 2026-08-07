"use client";

import * as React from "react";
import {
  ChevronRight,
  ExternalLink,
  MessageSquarePlus,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import {
  FUNNEL_STAGES,
  STATUS_CLASS,
  STATUS_VARIANT,
  type Campaign,
  type Cloud,
  type Platform,
  type Product,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CampaignDialog } from "@/components/campaign-dialog";
import { ProductDialog } from "@/components/product-dialog";

function stageShort(stage: Campaign["stage"]) {
  return FUNNEL_STAGES.find((s) => s.value === stage)!.short;
}

/** Indent plus a left border: the connector that makes each level read as a reply. */
const RAIL = "ml-1 border-l pl-4";

const COLLAPSE_ANIM =
  "overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down";

/* ------------------------------------------------------------------ */
/* Campaign                                                            */
/* ------------------------------------------------------------------ */

function CampaignRow({
  campaign,
  productName,
  productId,
}: {
  campaign: Campaign;
  productName: string;
  productId: string;
}) {
  const { removeCampaign } = useStore();
  const [editing, setEditing] = React.useState(false);

  const meta = [
    campaign.objective && { label: "Objective", value: campaign.objective },
    campaign.budget && { label: "Budget", value: campaign.budget },
    campaign.audience && { label: "Audience", value: campaign.audience },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <>
      <Card className="group hover:border-ring/60 gap-0 px-3.5 py-3 transition-colors">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span
                className={cn("text-sm leading-snug font-medium", STATUS_CLASS[campaign.status])}
              >
                {campaign.name}
              </span>
              <Badge variant="outline" className="font-mono text-[10px]">
                {stageShort(campaign.stage)}
              </Badge>
              <Badge variant={STATUS_VARIANT[campaign.status]} className="capitalize">
                {campaign.status}
              </Badge>
            </div>

            {meta.length > 0 && (
              <dl className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                {meta.map((item) => (
                  <div key={item.label} className="flex gap-1.5 text-xs">
                    <dt className="text-muted-foreground">{item.label}</dt>
                    <dd>{item.value}</dd>
                  </div>
                ))}
              </dl>
            )}

            {campaign.notes && (
              <p className="text-muted-foreground mt-2 text-xs leading-relaxed">{campaign.notes}</p>
            )}

            {campaign.landingUrl && (
              <Button
                asChild
                variant="link"
                size="xs"
                className="text-muted-foreground hover:text-foreground mt-1 h-auto px-0"
              >
                <a href={campaign.landingUrl} target="_blank" rel="noreferrer">
                  <ExternalLink />
                  <span className="max-w-[22rem] truncate">{campaign.landingUrl}</span>
                </a>
              </Button>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground shrink-0 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100"
                aria-label={`Options for ${campaign.name}`}
              >
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setEditing(true)}>
                <Pencil />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => {
                  removeCampaign(campaign.id);
                  toast.success("Campaign deleted");
                }}
              >
                <Trash2 />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </Card>

      <CampaignDialog
        open={editing}
        onOpenChange={setEditing}
        productId={productId}
        productName={productName}
        campaign={campaign}
      />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Platform group                                                      */
/* ------------------------------------------------------------------ */

function PlatformGroup({
  platform,
  campaigns,
  product,
}: {
  platform: Platform;
  campaigns: Campaign[];
  product: Product;
}) {
  const [open, setOpen] = React.useState(true);
  const [adding, setAdding] = React.useState(false);
  const activeCount = campaigns.filter((c) => c.status === "active").length;

  return (
    <>
      <Collapsible open={open} onOpenChange={setOpen} className="pt-2">
        <div className="flex items-center gap-2">
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="-ml-2 min-w-0 flex-1 justify-start font-normal"
            >
              <ChevronRight
                className={cn("transition-transform", open && "rotate-90")}
                aria-hidden
              />
              <span className="truncate font-medium">{platform.name}</span>
              <span className="text-muted-foreground shrink-0 text-xs">
                {campaigns.length} campaign{campaigns.length === 1 ? "" : "s"}
                {activeCount > 0 && ` · ${activeCount} active`}
              </span>
            </Button>
          </CollapsibleTrigger>

          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground shrink-0"
            onClick={() => setAdding(true)}
          >
            <Plus />
            Campaign
          </Button>
        </div>

        <CollapsibleContent className={COLLAPSE_ANIM}>
          <div className={cn(RAIL, "mt-2 space-y-2")}>
            {campaigns.map((campaign) => (
              <CampaignRow
                key={campaign.id}
                campaign={campaign}
                productId={product.id}
                productName={product.name}
              />
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      <CampaignDialog
        open={adding}
        onOpenChange={setAdding}
        productId={product.id}
        productName={product.name}
        defaultPlatformId={platform.id}
      />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Product thread                                                      */
/* ------------------------------------------------------------------ */

export function ProductThread({
  cloud,
  product,
  campaigns,
  byPlatform,
}: {
  cloud: Cloud;
  product: Product;
  campaigns: Campaign[];
  byPlatform: { platform: Platform; campaigns: Campaign[] }[];
}) {
  const { removeProduct } = useStore();
  const [open, setOpen] = React.useState(true);
  const [adding, setAdding] = React.useState(false);
  const [editing, setEditing] = React.useState(false);

  const activeCount = campaigns.filter((c) => c.status === "active").length;

  return (
    <>
      <Card className="gap-0 px-4 py-4 sm:px-5">
        <Collapsible open={open} onOpenChange={setOpen}>
          <div className="flex items-start gap-2">
            <h3 className="min-w-0 flex-1 text-[15px] leading-tight font-semibold">
              {product.name}
            </h3>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground -mt-1 shrink-0"
                  aria-label={`Options for ${product.name}`}
                >
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setEditing(true)}>
                  <Pencil />
                  Edit product
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => {
                    removeProduct(product.id);
                    toast.success(`Deleted ${product.name}`);
                  }}
                >
                  <Trash2 />
                  Delete product
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-1">
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground -ml-2 font-normal"
              >
                <ChevronRight
                  className={cn("transition-transform", open && "rotate-90")}
                  aria-hidden
                />
                {byPlatform.length} platform{byPlatform.length === 1 ? "" : "s"} ·{" "}
                {campaigns.length} campaign{campaigns.length === 1 ? "" : "s"}
                {activeCount > 0 && ` · ${activeCount} active`}
              </Button>
            </CollapsibleTrigger>

            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => setAdding(true)}
            >
              <MessageSquarePlus />
              Add campaign
            </Button>
          </div>

          <CollapsibleContent className={COLLAPSE_ANIM}>
            {byPlatform.length > 0 ? (
              <div className={cn(RAIL, "mt-1 pb-1")}>
                {byPlatform.map((group) => (
                  <PlatformGroup
                    key={group.platform.id}
                    platform={group.platform}
                    campaigns={group.campaigns}
                    product={product}
                  />
                ))}
              </div>
            ) : (
              <Button
                variant="outline"
                className="text-muted-foreground hover:text-foreground mt-3 h-auto w-full justify-start border-dashed py-4 font-normal whitespace-normal"
                onClick={() => setAdding(true)}
              >
                <Plus />
                No platforms yet. Add the first campaign for {product.name}.
              </Button>
            )}
          </CollapsibleContent>
        </Collapsible>
      </Card>

      <CampaignDialog
        open={adding}
        onOpenChange={setAdding}
        productId={product.id}
        productName={product.name}
      />
      <ProductDialog
        open={editing}
        onOpenChange={setEditing}
        cloudId={cloud.id}
        cloudName={cloud.name}
        product={product}
      />
    </>
  );
}
