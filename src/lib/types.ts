export type FunnelStage = "awareness" | "consideration" | "conversion" | "retention";

export type CampaignStatus = "active" | "paused" | "draft" | "ended";

export interface Cloud {
  id: string;
  name: string;
  slug: string;
  order: number;
}

export interface Product {
  id: string;
  cloudId: string;
  name: string;
  createdAt: string;
}

/** Global catalog. A platform can be used under any product. */
export interface Platform {
  id: string;
  name: string;
  createdAt: string;
}

export interface Campaign {
  id: string;
  productId: string;
  platformId: string;
  name: string;
  stage: FunnelStage;
  status: CampaignStatus;
  objective?: string;
  budget?: string;
  landingUrl?: string;
  notes?: string;
  createdAt: string;
}

export interface AdSet {
  id: string;
  campaignId: string;
  name: string;
  audience?: string;
  budget?: string;
  status: CampaignStatus;
  createdAt: string;
}

export interface AdSetInput {
  campaignId: string;
  name: string;
  audience?: string;
  budget?: string;
  status: CampaignStatus;
}

export interface FunnelData {
  clouds: Cloud[];
  products: Product[];
  platforms: Platform[];
  campaigns: Campaign[];
  adSets: AdSet[];
}

export const EMPTY_FUNNEL: FunnelData = {
  clouds: [],
  products: [],
  platforms: [],
  campaigns: [],
  adSets: [],
};

export interface CampaignInput {
  productId: string;
  platformId: string;
  name: string;
  stage: FunnelStage;
  status: CampaignStatus;
  objective?: string;
  budget?: string;
  landingUrl?: string;
  notes?: string;
}

export const FUNNEL_STAGES: { value: FunnelStage; label: string; short: string }[] = [
  { value: "awareness", label: "Awareness", short: "TOF" },
  { value: "consideration", label: "Consideration", short: "MOF" },
  { value: "conversion", label: "Conversion", short: "BOF" },
  { value: "retention", label: "Retention", short: "RET" },
];

export const CAMPAIGN_STATUSES: { value: CampaignStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "draft", label: "Draft" },
  { value: "ended", label: "Ended" },
];

type BadgeVariant = "default" | "secondary" | "outline";

/**
 * Weight, not hue. Solid reads as running, muted as holding, outline as inert,
 * so status stays legible on a monochrome theme.
 */
export const STATUS_VARIANT: Record<CampaignStatus, BadgeVariant> = {
  active: "default",
  paused: "secondary",
  draft: "outline",
  ended: "outline",
};

export const STATUS_CLASS: Record<CampaignStatus, string> = {
  active: "",
  paused: "",
  draft: "",
  ended: "text-muted-foreground",
};
