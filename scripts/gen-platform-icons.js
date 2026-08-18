// Regenerates src/lib/platform-icons.ts from simple-icons.
//   node scripts/gen-platform-icons.js > src/lib/platform-icons.ts
//
// Only the marks the app needs are inlined, so the full package (3,000+
// icons) never reaches the browser. simple-icons is a devDependency.
const si = require("simple-icons");

const byTitle = new Map();
for (const k of Object.keys(si)) {
  const i = si[k];
  if (i && i.title) byTitle.set(i.title.toLowerCase(), i);
}

// Platform names as stored in funnel_platforms, plus likely additions.
const WANT = [
  ["meta", "Meta"], ["facebook", "Facebook"], ["instagram", "Instagram"],
  ["google ads", "Google Ads"], ["google", "Google"],
  ["tiktok", "TikTok"], ["reddit", "Reddit"], ["x", "X"], ["twitter", "X"],
  ["youtube", "YouTube"], ["pinterest", "Pinterest"], ["snapchat", "Snapchat"],
  ["amazon", "Amazon"], ["spotify", "Spotify"],
];

const entries = [];
for (const [key, title] of WANT) {
  const icon = byTitle.get(title.toLowerCase());
  if (icon) entries.push([key, icon.path]);
  else console.error(`no icon for ${title}`);
}

console.log(`// Generated from simple-icons. Only the marks actually needed are
// inlined, so the 3,000-icon package is not shipped to the browser.
//
// LinkedIn and Microsoft are deliberately absent: both brands had their
// icons removed from simple-icons, so those platforms fall back to initials.
//
// Regenerate: node scripts/gen-platform-icons.js > src/lib/platform-icons.ts

/** Lowercased platform name -> SVG path data on a 24x24 viewBox. */
export const PLATFORM_ICON_PATHS: Record<string, string> = {`);
for (const [k, p] of entries) console.log(`  ${JSON.stringify(k)}: ${JSON.stringify(p)},`);
console.log(`};

/** Matches a platform name to a mark, tolerating case and stray spacing. */
export function platformIconPath(name: string): string | undefined {
  return PLATFORM_ICON_PATHS[name.trim().toLowerCase()];
}`);
