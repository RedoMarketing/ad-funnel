/**
 * FY26 paid nomenclature.
 *
 * Full format is FY_Channel_Cloud_Campaign_Objective, e.g.
 * FY26_PaidSocial_ReLo_Brand_Leads. The app stores those parts separately
 * rather than as one string — cloud and platform already exist as records —
 * so what lives here is the controlled vocabulary for the two free-text
 * fields that had none: campaign type and objective.
 */

export interface Token {
  token: string;
  definition: string;
}

/** Campaign types, which differ between the search and social families. */
export const CAMPAIGN_TYPES: { family: string; tokens: Token[] }[] = [
  {
    family: "Paid Search",
    tokens: [
      { token: "Brand", definition: "Branded terms" },
      { token: "Competitor", definition: "Competitor terms and conquesting" },
      {
        token: "NonBrand",
        definition: "Generic intent: returns management, exchange software, cross-border returns",
      },
      { token: "Dynamic", definition: "Auto-generated coverage (DSA)" },
      { token: "Retargeting", definition: "Search remarketing lists (RLSA)" },
      { token: "Event", definition: "Conference, trade show, or webinar-tied" },
      { token: "Promo", definition: "Time-boxed offers with a deadline or scarcity hook" },
      { token: "Launch", definition: "New product, feature, or update going to market" },
      {
        token: "MarketMoment",
        definition: "Reactive plays on external shifts where being early wins",
      },
    ],
  },
  {
    family: "Paid Social",
    tokens: [
      { token: "Prospecting", definition: "Cold audiences, interest and lookalike" },
      { token: "Retargeting", definition: "Site + engagement audiences" },
      { token: "ABM", definition: "Matched-audience and target-account lists (LinkedIn primary)" },
      { token: "Competitor", definition: "Competitor-focused targeting" },
      { token: "LeadGen", definition: "In-platform forms (LinkedIn Lead Gen, Meta Instant Forms)" },
      { token: "XSell", definition: "Existing-customer expansion" },
      {
        token: "ThoughtLeadership",
        definition: "LinkedIn Thought Leader Ads, content amplification",
      },
      { token: "Event", definition: "Conference, trade show, or webinar-tied" },
      { token: "Promo", definition: "Time-boxed offers with a deadline or scarcity hook" },
      { token: "Launch", definition: "New product, feature, or update going to market" },
      {
        token: "MarketMoment",
        definition: "Reactive plays on external shifts where being early wins",
      },
    ],
  },
];

export const OBJECTIVES: Token[] = [
  { token: "Awareness", definition: "Impressions, unique reach, brand lift" },
  { token: "Traffic", definition: "Link clicks, landing page views, site sessions" },
  { token: "Engagement", definition: "Post engagement, follows, event responses" },
  { token: "VideoViews", definition: "Views, thruplays, completion" },
  { token: "Leads", definition: "In-platform lead forms" },
  { token: "Conversions", definition: "On-site actions: demo booked, sign-up, form submit" },
  { token: "Sales", definition: "Purchases, catalog/dynamic sales, ROAS" },
  { token: "AppPromotion", definition: "Installs and in-app actions" },
];

const ALL_CAMPAIGN_TOKENS = new Set(CAMPAIGN_TYPES.flatMap((f) => f.tokens.map((t) => t.token)));
const ALL_OBJECTIVE_TOKENS = new Set(OBJECTIVES.map((t) => t.token));

export const isCampaignToken = (v: string) => ALL_CAMPAIGN_TOKENS.has(v);
export const isObjectiveToken = (v: string) => ALL_OBJECTIVE_TOKENS.has(v);
