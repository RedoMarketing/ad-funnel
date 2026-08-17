"use client";

import * as React from "react";
import {
  ChevronRight,
  Copy,
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
  type AdSet,
  type Campaign,
  type Cloud,
  type Platform,
  type Product,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { haptic } from "@/lib/haptics";
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
import { AdSetDialog } from "@/components/ad-set-dialog";
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
/* Ad set                                                              */
/* ------------------------------------------------------------------ */

function AdSetRow({ adSet, campaignName }: { adSet: AdSet; campaignName: string }) {
  const { removeAdSet, duplicateAdSet } = useStore();
  const [editing, setEditing] = React.useState(false);

  return (
    <>
      <div className="group/adset flex items-start gap-2 rounded-md px-2 py-1.5 hover:bg-muted/60">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className={cn("text-[13px] font-medium leading-snug", STATUS_CLASS[adSet.status])}>
              {adSet.name}
            </span>
            <Badge variant={STATUS_VARIANT[adSet.status]} className="h-4 px-1.5 text-[10px] capitalize">
              {adSet.status}
            </Badge>
            {adSet.budget && (
              <span className="text-muted-foreground text-xs tabular-nums">{adSet.budget}</span>
            )}
          </div>
          {adSet.audience && (
            <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed whitespace-pre-line">
              {adSet.audience}
            </p>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-xs"
              className="text-muted-foreground shrink-0 opacity-0 transition-opacity group-hover/adset:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100 row-action"
              aria-label={`Options for ${adSet.name}`}
            >
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => setEditing(true)}>
              <Pencil />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={async () => {
                try {
                  await duplicateAdSet(adSet.id);
                  toast.success("Ad set duplicated");
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Could not duplicate");
                }
              }}
            >
              <Copy />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onSelect={async () => {
                try {
                  await removeAdSet(adSet.id);
                  toast.success("Ad set deleted");
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Could not delete");
                }
              }}
            >
              <Trash2 />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AdSetDialog
        open={editing}
        onOpenChange={setEditing}
        campaignId={adSet.campaignId}
        campaignName={campaignName}
        adSet={adSet}
      />
    </>
  );
}

function AdSetSection({ campaign }: { campaign: Campaign }) {
  const { data } = useStore();
  const [adding, setAdding] = React.useState(false);
  // Collapsed by default: audiences are long, and a campaign card should stay
  // scannable until you actually want the breakdown.
  const [open, setOpen] = React.useState(false);
  const adSets = data.adSets.filter((a) => a.campaignId === campaign.id);

  return (
    <div className="mt-2.5 border-t pt-1">
      <Collapsible
        open={open}
        onOpenChange={(v) => {
          haptic();
          setOpen(v);
        }}
      >
        <div className="flex items-center justify-between gap-2">
          <CollapsibleTrigger asChild disabled={adSets.length === 0}>
            <Button
              variant="ghost"
              size="xs"
              className="text-muted-foreground hover:text-foreground -ml-1.5 min-w-0 flex-1 justify-start font-normal disabled:opacity-100"
            >
              {adSets.length > 0 && (
                <ChevronRight
                  className={cn("transition-transform", open && "rotate-90")}
                  aria-hidden
                />
              )}
              <span className="text-xs">
                {adSets.length === 0
                  ? "No ad sets"
                  : `${adSets.length} ad set${adSets.length === 1 ? "" : "s"}`}
              </span>
            </Button>
          </CollapsibleTrigger>

          <Button
            variant="ghost"
            size="xs"
            className="text-muted-foreground hover:text-foreground shrink-0"
            onClick={() => setAdding(true)}
          >
            <Plus />
            Ad set
          </Button>
        </div>

        <CollapsibleContent className={COLLAPSE_ANIM}>
          <div className="mt-1 space-y-0.5 pb-1">
            {adSets.map((adSet) => (
              <AdSetRow key={adSet.id} adSet={adSet} campaignName={campaign.name} />
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      <AdSetDialog
        open={adding}
        onOpenChange={setAdding}
        campaignId={campaign.id}
        campaignName={campaign.name}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Campaign                                                            */
/* ------------------------------------------------------------------ */

function CampaignRow({
  campaign,
  productName,
  productId,
  index = 0,
}: {
  campaign: Campaign;
  productName: string;
  productId: string;
  index?: number;
}) {
  const { removeCampaign, duplicateCampaign } = useStore();
  const [editing, setEditing] = React.useState(false);

  const meta = [
    campaign.objective && { label: "Objective", value: campaign.objective },
    campaign.budget && { label: "Budget", value: campaign.budget },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <>
      {/* No shadow: these sit inside a collapsible whose overflow-hidden (needed
          for the height animation) would clip it. The border carries the edge. */}
      <Card
        className="group hover:border-ring/60 gap-0 px-3.5 py-3 shadow-none transition-colors"
        style={{ "--i": index } as React.CSSProperties}
      >
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
              <p className="text-muted-foreground mt-2 text-xs leading-relaxed whitespace-pre-line">
                {campaign.notes}
              </p>
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

            <AdSetSection campaign={campaign} />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground shrink-0 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100 row-action"
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
              <DropdownMenuItem
                onSelect={async () => {
                  try {
                    await duplicateCampaign(campaign.id);
                    toast.success("Campaign duplicated");
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : "Could not duplicate");
                  }
                }}
              >
                <Copy />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onSelect={async () => {
                  try {
                    await removeCampaign(campaign.id);
                    toast.success("Campaign deleted");
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : "Could not delete");
                  }
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

  return (
    <>
      <Collapsible
        open={open}
        onOpenChange={(v) => {
          haptic();
          setOpen(v);
        }}
        className="pt-2"
      >
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
            {campaigns.map((campaign, i) => (
              <CampaignRow
                key={campaign.id}
                index={i}
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
  index = 0,
}: {
  cloud: Cloud;
  product: Product;
  campaigns: Campaign[];
  byPlatform: { platform: Platform; campaigns: Campaign[] }[];
  /** Position in the list, used to stagger the entrance. */
  index?: number;
}) {
  const { removeProduct } = useStore();
  // Collapsed by default: a cloud page should open as a scannable list of
  // products, not a wall of every campaign at once.
  const [open, setOpen] = React.useState(false);
  const [adding, setAdding] = React.useState(false);
  const [editing, setEditing] = React.useState(false);


  return (
    <>
      <Card className="thread-in gap-0 px-4 py-4 sm:px-5" style={{ "--i": index } as React.CSSProperties}>
        <Collapsible
          open={open}
          onOpenChange={(v) => {
            haptic();
            setOpen(v);
          }}
        >
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
                {campaigns.length} campaign{campaigns.length === 1 ? "" : "s"}
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
